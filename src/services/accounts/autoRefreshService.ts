import { RuntimeActionIds } from "~/constants/runtimeActions"
import { usageHistoryScheduler } from "~/services/history/usageHistory/scheduler"
import { AccountAutoRefresh } from "~/types/accountAutoRefresh"
import { sendRuntimeMessage } from "~/utils/browser/browserApi"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"

import { userPreferences } from "../preferences/userPreferences"
import { accountStorage } from "./accountStorage"

const logger = createLogger("AutoRefresh")

/**
 * Manages account auto-refresh in the background.
 * Responsibilities:
 * - Reads user preferences to decide whether and how often to refresh.
 * - Maintains a single interval timer to avoid duplicate refresh jobs.
 * - Broadcasts status/results to any connected frontends (popup/options).
 */
class AutoRefreshService {
  private refreshTimer: NodeJS.Timeout | null = null
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

    try {
      await this.setupAutoRefresh()
      this.isInitialized = true
      logger.info("")
    } catch (error) {
      logger.error("", error)
    }
  }

  /**
   * Start or stop the interval based on current user preferences.
   * Always clears any existing timer to prevent duplicate schedules.
   *
   * Respects accountAutoRefresh.enabled/interval from user preferences.
   */
  async setupAutoRefresh() {
    try {
      //
      if (this.refreshTimer) {
        clearInterval(this.refreshTimer)
        this.refreshTimer = null
        logger.debug("")
      }

      //
      const preferences = await userPreferences.getPreferences()

      if (!preferences.accountAutoRefresh?.enabled) {
        logger.info("")
        return
      }

      //  setInterval
      const intervalMs = preferences.accountAutoRefresh.interval * 1000
      this.refreshTimer = setInterval(async () => {
        await this.performBackgroundRefresh()
      }, intervalMs)

      logger.info("", {
        intervalSeconds: preferences.accountAutoRefresh.interval,
      })
    } catch (error) {
      logger.error("", error)
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
   * Stop the interval timer if running.
   *
   * Idempotent; safe to call when not running.
   */
  stopAutoRefresh() {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
      logger.info("")
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
   * @returns Whether timer is running and service initialized.
   */
  getStatus() {
    return {
      isRunning: this.refreshTimer !== null,
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
    this.stopAutoRefresh()
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
        autoRefreshService.stopAutoRefresh()
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
