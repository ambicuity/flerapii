import { RuntimeActionIds } from "~/constants/runtimeActions"
import { usageHistoryScheduler } from "~/services/history/usageHistory/scheduler"
import { AccountAutoRefresh } from "~/types/accountAutoRefresh"
import {
  clearAlarm,
  createAlarm,
  getAlarm,
  hasAlarmsAPI,
  onAlarm,
  sendRuntimeMessage,
} from "~/utils/browser/browserApi"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"

import { userPreferences } from "../preferences/userPreferences"
import { accountStorage } from "./accountStorage"

const logger = createLogger("AutoRefresh")

export const ACCOUNT_AUTO_REFRESH_ALARM_NAME = "accountAutoRefresh"

/**
 * Convert the preference interval (seconds) into an alarm period in minutes.
 * Chrome enforces a 30s minimum period for packed extensions.
 */
const toAlarmPeriodMinutes = (intervalSeconds: number): number =>
  Math.max(0.5, intervalSeconds / 60)

/**
 * Manages account auto-refresh in the background.
 * Responsibilities:
 * - Reads user preferences to decide whether and how often to refresh.
 * - Schedules a single periodic alarm (MV3-safe: timers do not survive the
 *   service worker being suspended) and falls back to setInterval only when
 *   the alarms API is unavailable.
 * - Broadcasts status/results to any connected frontends (popup/options).
 */
class AutoRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null
  private isAlarmScheduled = false
  private isAlarmListenerRegistered = false
  private isInitialized = false

  /**
   * Initialize auto refresh (idempotent).
   * Loads preferences and starts the timer if enabled.
   *
   * Safe to call repeatedly; returns early when already initialized.
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug("")
      return
    }

    // Register before any await so an alarm that wakes the service worker is delivered.
    this.registerAlarmListener()

    try {
      await this.setupAutoRefresh({ preserveExisting: true })
      this.isInitialized = true
      logger.info("")
    } catch (error) {
      logger.error("", error)
    }
  }

  private registerAlarmListener() {
    if (this.isAlarmListenerRegistered || !hasAlarmsAPI()) {
      return
    }

    onAlarm(async (alarm) => {
      if (alarm.name !== ACCOUNT_AUTO_REFRESH_ALARM_NAME) {
        return
      }

      // Await to keep the MV3 service worker alive for the duration of the refresh.
      await this.performBackgroundRefresh()
    })
    this.isAlarmListenerRegistered = true
  }

  /**
   * Start or stop the schedule based on current user preferences.
   * Always replaces any existing schedule to prevent duplicates, unless
   * `preserveExisting` is set and an alarm with the same period already exists
   * (service-worker restarts must not push the next run further out).
   *
   * Respects accountAutoRefresh.enabled/interval from user preferences.
   */
  async setupAutoRefresh(options?: { preserveExisting?: boolean }) {
    try {
      this.clearIntervalTimer()

      const preferences = await userPreferences.getPreferences()

      if (!preferences.accountAutoRefresh?.enabled) {
        await this.clearRefreshAlarm()
        logger.info("")
        return
      }

      const intervalSeconds = preferences.accountAutoRefresh.interval

      if (!hasAlarmsAPI()) {
        this.refreshTimer = setInterval(async () => {
          await this.performBackgroundRefresh()
        }, intervalSeconds * 1000)
        logger.warn("Alarms API unavailable; using setInterval fallback")
        return
      }

      this.registerAlarmListener()

      const periodInMinutes = toAlarmPeriodMinutes(intervalSeconds)
      const existingAlarm = options?.preserveExisting
        ? await getAlarm(ACCOUNT_AUTO_REFRESH_ALARM_NAME)
        : undefined

      if (existingAlarm?.periodInMinutes !== periodInMinutes) {
        await createAlarm(ACCOUNT_AUTO_REFRESH_ALARM_NAME, {
          delayInMinutes: periodInMinutes,
          periodInMinutes,
        })
      }
      this.isAlarmScheduled = true

      logger.info("", { intervalSeconds })
    } catch (error) {
      logger.error("", error)
    }
  }

  private clearIntervalTimer() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  private async clearRefreshAlarm() {
    this.isAlarmScheduled = false
    if (hasAlarmsAPI()) {
      await clearAlarm(ACCOUNT_AUTO_REFRESH_ALARM_NAME)
    }
  }

  /**
   * Execute a background refresh cycle.
   * Catches errors and notifies frontend listeners.
   *
   * Uses accountStorage.refreshAllAccounts with silent mode (no toast).
   */
  private async performBackgroundRefresh() {
    try {
      logger.info("")

      // accountStorage
      const result = await accountStorage.refreshAllAccounts(false)
      logger.info("", {
        success: result.success,
        failed: result.failed,
      })

      // Opportunistically trigger usage-history sync after refresh cycles when enabled and due.
      void usageHistoryScheduler.runAfterRefreshSync().catch((error) => {
        logger.warn("Usage-history sync after refresh failed", error)
      })

      // popup
      this.notifyFrontend("refresh_completed", result)
    } catch (error) {
      logger.error("", error)
      this.notifyFrontend("refresh_error", { error: getErrorMessage(error) })
    }
  }

  /**
   * Trigger a one-off immediate refresh (bypasses interval scheduling).
   * @returns Counts of succeeded/failed account refreshes.
   */
  async refreshNow(): Promise<{ success: number; failed: number }> {
    try {
      logger.info("")
      const result = await accountStorage.refreshAllAccounts(true)
      logger.info("", {
        success: result.success,
        failed: result.failed,
      })
      return result
    } catch (error) {
      logger.error("", error)
      throw error
    }
  }

  /**
   * Stop the scheduled refresh (alarm or fallback timer) if running.
   *
   * Idempotent; safe to call when not running.
   */
  async stopAutoRefresh() {
    this.clearIntervalTimer()
    try {
      await this.clearRefreshAlarm()
    } catch (error) {
      logger.warn("Failed to clear auto-refresh alarm", error)
    }
  }

  /**
   * Persist new refresh settings and reconfigure the timer accordingly.
   * @param updates Settings payload containing preference updates.
   * @param updates.accountAutoRefresh Partial accountAutoRefresh config to merge.
   */
  async updateSettings(updates: {
    accountAutoRefresh: Partial<AccountAutoRefresh>
  }) {
    try {
      await userPreferences.savePreferences(updates)
      //
      await this.setupAutoRefresh()
      logger.info("", updates)
    } catch (error) {
      logger.error("", error)
    }
  }

  /**
   * Get current runtime status (used by UI to display state).
   * @returns Whether a refresh schedule is active and service initialized.
   */
  getStatus() {
    return {
      isRunning: this.isAlarmScheduled || this.refreshTimer !== null,
      isInitialized: this.isInitialized,
    }
  }

  /**
   * Notify any connected frontend about refresh state changes.
   * Swallows "receiving end does not exist" errors because popup may be closed.
   *
   * Best-effort; errors are logged without throwing to avoid breaking background flow.
   */
  private notifyFrontend(type: string, data: any) {
    try {
      //
      void sendRuntimeMessage(
        {
          type: "AUTO_REFRESH_UPDATE",
          payload: { type, data },
        },
        { maxAttempts: 1 },
      ).catch((error) => {
        const errorMessage = getErrorMessage(error)

        // ""popup
        if (
          /Receiving end does not exist/i.test(errorMessage) ||
          /Could not establish connection/i.test(errorMessage)
        ) {
          logger.debug("")
          return
        }

        logger.warn("", error)
      })
    } catch (error) {
      //
      logger.warn("", error)
    }
  }

  /**
   *
   */
  destroy() {
    this.clearIntervalTimer()
    this.isAlarmScheduled = false
    this.isInitialized = false
    logger.info("")
  }
}

//
export const autoRefreshService = new AutoRefreshService()

/**
 * Message handler for auto-refresh related actions.
 * Keeps background-only logic centralized; responds with success/error payloads.
 * @param request Incoming message with action and payload.
 * @param sendResponse Callback to reply to sender.
 */
export const handleAutoRefreshMessage = async (
  request: any,
  sendResponse: (response: any) => void,
) => {
  try {
    switch (request.action) {
      case RuntimeActionIds.AutoRefreshSetup:
        await autoRefreshService.setupAutoRefresh()
        sendResponse({ success: true })
        break

      case RuntimeActionIds.AutoRefreshRefreshNow: {
        const result = await autoRefreshService.refreshNow()
        sendResponse({ success: true, data: result })
        break
      }

      case RuntimeActionIds.AutoRefreshStop:
        await autoRefreshService.stopAutoRefresh()
        sendResponse({ success: true })
        break

      case RuntimeActionIds.AutoRefreshUpdateSettings:
        await autoRefreshService.updateSettings(request.settings)
        sendResponse({ success: true })
        break

      case RuntimeActionIds.AutoRefreshGetStatus: {
        const status = autoRefreshService.getStatus()
        sendResponse({ success: true, data: status })
        break
      }

      default:
        sendResponse({ success: false, error: "Unknown action" })
    }
  } catch (error) {
    logger.error("", error)
    sendResponse({ success: false, error: getErrorMessage(error) })
  }
}
