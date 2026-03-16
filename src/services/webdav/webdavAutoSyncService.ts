import { RuntimeActionIds } from "~/constants/runtimeActions"
import {
  apiCredentialProfilesStorage,
  mergeApiCredentialProfilesConfigs,
} from "~/services/apiCredentialProfiles/apiCredentialProfilesStorage"
import {
  BACKUP_VERSION,
  normalizeBackupForMerge,
  type BackupFullV2,
} from "~/services/importExport/importExportService"
import {
  getSharedPreferencesLastUpdated,
  restoreWebdavLocalOnlyPreferences,
} from "~/services/preferences/webdavSharedPreferences"
import { migrateAccountTagsData } from "~/services/tags/migrations/accountTagsDataMigration"
import { tagStorage } from "~/services/tags/tagStorage"
import {
  createDefaultTagStore,
  sanitizeTagStore,
} from "~/services/tags/tagStoreUtils"
import type { SiteAccount, SiteBookmark, TagStore } from "~/types"
import {
  API_CREDENTIAL_PROFILES_CONFIG_VERSION,
  type ApiCredentialProfilesConfig,
} from "~/types/apiCredentialProfiles"
import type { ChannelConfigMap } from "~/types/channelConfig"
import {
  isWebdavSyncDataSelectionEmpty,
  resolveWebdavSyncDataSelection,
  WEBDAV_SYNC_STRATEGIES,
  WebDAVSettings,
  type WebDAVSyncDataSelection,
} from "~/types/webdav"
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
import { t } from "~/utils/i18n/core"

import { accountStorage } from "../accounts/accountStorage"
import { STORAGE_LOCKS } from "../core/storageKeys"
import { withExtensionStorageWriteLock } from "../core/storageWriteLock"
import { channelConfigStorage } from "../managedSites/channelConfigStorage"
import {
  userPreferences,
  type UserPreferences,
} from "../preferences/userPreferences"
import {
  detectWebdavBackupPresence,
  mergeWebdavBackupPayloadBySelection,
  normalizeWebdavOrderedEntryIds,
} from "./webdavSelectiveSync"
import {
  downloadBackup,
  isWebdavFileNotFoundError,
  testWebdavConnection,
  uploadBackup,
} from "./webdavService"

const logger = createLogger("WebdavAutoSync")

/**
 * Convert the persisted WebDAV sync interval (seconds) to a safe alarms cadence (minutes).
 *
 * Notes:
 * - `browser.alarms` operates in minutes and generally requires >= 1 minute.
 * - The options UI constrains WebDAV interval to [60..86400] seconds in 60s steps, but we still clamp defensively.
 */
function clampWebdavSyncIntervalMinutes(value: unknown): number {
  const seconds = Number(value)
  const safeSeconds = Number.isFinite(seconds) ? seconds : 3600
  const minutes = Math.trunc(safeSeconds / 60)
  return Math.min(24 * 60, Math.max(1, minutes))
}

/**
 * Manages WebDAV auto-sync in the background.
 * Responsibilities:
 * - Reads WebDAV preferences to decide if/when to sync.
 * - Uses WebExtension alarms (MV3-safe) with an isSyncing guard to avoid overlap.
 * - Merges or uploads backups according to user-selected strategy.
 * - Notifies frontends about sync status/results.
 */
class WebdavAutoSyncService {
  static readonly ALARM_NAME = "webdavAutoSync"

  private removeAlarmListener: (() => void) | null = null
  private isInitialized = false
  private isSyncing = false
  private isScheduled = false
  private lastSyncTime = 0
  private lastSyncStatus: "success" | "error" | "idle" = "idle"
  private lastSyncError: string | null = null

  /**
   * Initialize auto-sync (idempotent).
   * Loads preferences and starts alarm schedule when enabled.
   *
   * Safe to call multiple times; returns early if already initialized.
   */
  async initialize() {
    if (this.isInitialized) {
      logger.debug("")
      return
    }

    try {
      // Register alarm listener early. In MV3 service workers, timers are unreliable; alarms are the stable scheduler.
      this.removeAlarmListener = onAlarm(async (alarm) => {
        if (alarm.name !== WebdavAutoSyncService.ALARM_NAME) {
          return
        }

        // Await to keep the MV3 service worker alive for the duration of the sync.
        await this.performBackgroundSync()
      })

      await this.setupAutoSync()
      this.isInitialized = true
      logger.info("")
    } catch (error) {
      logger.error("", error)
    }
  }

  /**
   * Start or stop auto-sync based on current preferences.
   * Always reconciles the alarms schedule to prevent duplicate schedules.
   *
   * Reads WebDAV creds and interval from user preferences; skips when config
   * is incomplete or disabled.
   */
  async setupAutoSync() {
    try {
      //
      const preferences = await userPreferences.getPreferences()

      if (!preferences.webdav.autoSync) {
        await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
        this.isScheduled = false
        logger.info("")
        return
      }

      // WebDAV
      if (
        !preferences.webdav.url ||
        !preferences.webdav.username ||
        !preferences.webdav.password
      ) {
        await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
        this.isScheduled = false
        logger.warn("WebDAV")
        return
      }

      const syncDataSelection = resolveWebdavSyncDataSelection(
        preferences.webdav.syncData,
      )

      if (isWebdavSyncDataSelectionEmpty(syncDataSelection)) {
        await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
        this.isScheduled = false
        logger.warn(
          "WebDAV sync selection is empty; auto-sync remains unscheduled",
        )
        return
      }

      if (!hasAlarmsAPI()) {
        await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
        this.isScheduled = false
        logger.warn("Alarms API not supported; WebDAV auto-sync is disabled")
        return
      }

      const intervalMinutes = clampWebdavSyncIntervalMinutes(
        preferences.webdav.syncInterval,
      )

      // Preserve a matching alarm when possible so background restarts do not shift the schedule.
      const existingAlarm = await getAlarm(WebdavAutoSyncService.ALARM_NAME)
      if (
        existingAlarm &&
        existingAlarm.periodInMinutes != null &&
        Math.abs(existingAlarm.periodInMinutes - intervalMinutes) < 0.001
      ) {
        this.isScheduled = true
        logger.debug(" WebDAV  alarm", {
          periodInMinutes: existingAlarm.periodInMinutes,
          scheduledTime: existingAlarm.scheduledTime
            ? new Date(existingAlarm.scheduledTime)
            : null,
        })
        return
      }

      await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
      await createAlarm(WebdavAutoSyncService.ALARM_NAME, {
        // Match previous setInterval semantics: first run happens after the full interval.
        delayInMinutes: intervalMinutes,
        periodInMinutes: intervalMinutes,
      })

      this.isScheduled = Boolean(
        await getAlarm(WebdavAutoSyncService.ALARM_NAME),
      )

      logger.info("", {
        schedule: "alarm",
        intervalSeconds: preferences.webdav.syncInterval || 3600,
        intervalMinutes,
      })
    } catch (error) {
      logger.error("", error)
    }
  }

  /**
   * Execute a background sync run.
   * Uses isSyncing flag to skip overlapping executions.
   *
   * Updates lastSyncTime/status and notifies frontend listeners.
   */
  private async performBackgroundSync() {
    if (this.isSyncing) {
      logger.debug("")
      return
    }

    this.isSyncing = true
    try {
      logger.info("")

      await this.syncWithWebdav()

      this.lastSyncTime = Date.now()
      this.lastSyncStatus = "success"
      this.lastSyncError = null

      logger.info("")

      // popup
      this.notifyFrontend("sync_completed", {
        timestamp: this.lastSyncTime,
      })
    } catch (error) {
      logger.error("", error)
      this.lastSyncStatus = "error"
      this.lastSyncError = getErrorMessage(error)
      this.notifyFrontend("sync_error", { error: getErrorMessage(error) })
    } finally {
      this.isSyncing = false
    }
  }

  /**
   * WebDAV
   *
   *
   * 1.  WebDAV
   * 2.  normalizeBackupForMerge
   *     V1  V2
   *    - envelopedownloadBackup
   *       WebDAV /
   * 3.  syncStrategy
   *    - "merge":  mergeData  /
   *    - "upload_only"
   *    -
   * 4.
   *    BACKUP_VERSION  channelConfigs
   *    - uploadBackup  WebDAV
   *
   * Throws when connection fails or merge/upload errors occur.
   */
  async syncWithWebdav() {
    const preferences = await userPreferences.getPreferences()
    const syncDataSelection = resolveWebdavSyncDataSelection(
      preferences.webdav.syncData,
    )

    if (isWebdavSyncDataSelectionEmpty(syncDataSelection)) {
      throw new Error(t("messages:webdav.syncDataSelectionRequired"))
    }

    //
    try {
      await testWebdavConnection()
    } catch (error) {
      logger.error("WebDAV", error)
      throw new Error(t("messages:webdav.connectionFailed", { status: "N/A" }))
    }

    //
    let remoteData: any | null = null

    try {
      const content = await downloadBackup()
      remoteData = JSON.parse(content)
      logger.info("", { timestamp: remoteData?.timestamp })
    } catch (error: any) {
      if (isWebdavFileNotFoundError(error)) {
        logger.info("")
        remoteData = null
      } else {
        throw error
      }
    }

    // `accountStorage.exportData()` will ensure legacy tags are migrated
    const [
      localAccountsConfig,
      localTagStore,
      localPreferences,
      localChannelConfigs,
      localApiCredentialProfiles,
    ] = await Promise.all([
      accountStorage.exportData(),
      tagStorage.exportTagStore(),
      userPreferences.exportPreferences(),
      channelConfigStorage.exportConfigs(),
      apiCredentialProfilesStorage.exportConfig(),
    ])

    const localPinnedAccountIds = localAccountsConfig.pinnedAccountIds || []
    const localOrderedAccountIds = localAccountsConfig.orderedAccountIds || []
    const localBookmarks = localAccountsConfig.bookmarks || []

    const remotePresence = detectWebdavBackupPresence(remoteData)
    const normalizedRemote = normalizeBackupForMerge(
      remoteData,
      localPreferences,
    )
    const remotePreferences =
      remotePresence.hasPreferences && normalizedRemote.preferences
        ? restoreWebdavLocalOnlyPreferences(
            normalizedRemote.preferences as UserPreferences,
            localPreferences,
          )
        : localPreferences

    //
    const strategy =
      preferences.webdav.syncStrategy || WEBDAV_SYNC_STRATEGIES.MERGE

    const emptyProfiles: ApiCredentialProfilesConfig = {
      version: API_CREDENTIAL_PROFILES_CONFIG_VERSION,
      profiles: [],
      lastUpdated: 0,
    }

    let accountsToSave: SiteAccount[] = localAccountsConfig.accounts
    let bookmarksToSave: SiteBookmark[] = localBookmarks
    let tagStoreToSave = localTagStore
    let preferencesToSave: UserPreferences = localPreferences
    let channelConfigsToSave: ChannelConfigMap = localChannelConfigs
    let apiCredentialProfilesToSave: ApiCredentialProfilesConfig =
      localApiCredentialProfiles
    let pinnedAccountIdsToSave: string[] = localPinnedAccountIds
    let orderedAccountIdsToSave: string[] = localOrderedAccountIds

    if (strategy === WEBDAV_SYNC_STRATEGIES.MERGE && remoteData) {
      //
      const remotePreferencesTimestamp = remotePresence.hasPreferences
        ? getSharedPreferencesLastUpdated(normalizedRemote.preferences as any)
        : 0

      const mergeResult = this.mergeData(
        {
          accounts: localAccountsConfig.accounts,
          bookmarks: localBookmarks,
          accountsTimestamp: localAccountsConfig.last_updated,
          tagStore: localTagStore,
          preferences: localPreferences,
          preferencesTimestamp:
            getSharedPreferencesLastUpdated(localPreferences),
          channelConfigs: localChannelConfigs,
          apiCredentialProfiles: localApiCredentialProfiles,
        },
        {
          accounts: normalizedRemote.accounts,
          bookmarks: normalizedRemote.bookmarks,
          accountsTimestamp: normalizedRemote.accountsTimestamp,
          tagStore: sanitizeTagStore(
            normalizedRemote.tagStore ?? createDefaultTagStore(),
          ),
          preferences: remotePreferences,
          preferencesTimestamp: remotePreferencesTimestamp,
          channelConfigs: normalizedRemote.channelConfigs,
          apiCredentialProfiles:
            (remotePresence.hasApiCredentialProfiles &&
              normalizedRemote.apiCredentialProfiles) ||
            emptyProfiles,
        },
        syncDataSelection,
      )

      accountsToSave = mergeResult.accounts
      bookmarksToSave = mergeResult.bookmarks
      tagStoreToSave = mergeResult.tagStore
      preferencesToSave = mergeResult.preferences
      channelConfigsToSave = mergeResult.channelConfigs
      apiCredentialProfilesToSave = mergeResult.apiCredentialProfiles

      const entryIdSet = new Set<string>([
        ...accountsToSave.map((account) => account.id),
        ...bookmarksToSave.map((bookmark) => bookmark.id),
      ])

      if (syncDataSelection.accounts || syncDataSelection.bookmarks) {
        const selectedIdSet = new Set<string>([
          ...(syncDataSelection.accounts
            ? accountsToSave.map((account) => account.id)
            : []),
          ...(syncDataSelection.bookmarks
            ? bookmarksToSave.map((bookmark) => bookmark.id)
            : []),
        ])

        const remotePinnedIds = remotePresence.hasPinnedAccountIds
          ? normalizedRemote.pinnedAccountIds
          : []

        const mergedPinnedIds = [
          ...remotePinnedIds.filter((id) => selectedIdSet.has(id)),
          ...localPinnedAccountIds.filter((id) => selectedIdSet.has(id)),
        ]
        const seenPinned = new Set<string>()
        const pinnedSelected: string[] = []
        for (const id of mergedPinnedIds) {
          if (seenPinned.has(id)) continue
          seenPinned.add(id)
          pinnedSelected.push(id)
        }

        const pinnedUnselected = localPinnedAccountIds.filter(
          (id) => !selectedIdSet.has(id),
        )

        pinnedAccountIdsToSave = [
          ...pinnedSelected,
          ...pinnedUnselected,
        ].filter((id) => entryIdSet.has(id))

        const selectedOrderSource =
          remotePresence.hasOrderedAccountIds &&
          normalizedRemote.accountsTimestamp > localAccountsConfig.last_updated
            ? normalizedRemote.orderedAccountIds
            : localOrderedAccountIds

        const baseOrderedIds = [
          ...selectedOrderSource.filter((id) => selectedIdSet.has(id)),
          ...localOrderedAccountIds.filter((id) => !selectedIdSet.has(id)),
        ]

        orderedAccountIdsToSave = normalizeWebdavOrderedEntryIds({
          baseOrderedIds,
          entryIdSet,
          accounts: accountsToSave,
          bookmarks: bookmarksToSave,
        })
      }
      logger.info("", { accountCount: accountsToSave.length })
    } else if (
      strategy === WEBDAV_SYNC_STRATEGIES.DOWNLOAD_ONLY &&
      remoteData
    ) {
      //  section
      const remoteStore = sanitizeTagStore(
        normalizedRemote.tagStore ?? createDefaultTagStore(),
      )
      const localStore = sanitizeTagStore(
        localTagStore ?? createDefaultTagStore(),
      )

      const migratedLocal = migrateAccountTagsData({
        accounts: localAccountsConfig.accounts,
        tagStore: localStore,
      })
      const migratedRemote = migrateAccountTagsData({
        accounts: normalizedRemote.accounts as SiteAccount[],
        tagStore: remoteStore,
      })

      const remoteApiCredentialProfilesForTags =
        normalizedRemote.apiCredentialProfiles ?? emptyProfiles

      const tagMerge = tagStorage.mergeTagStoresForSync({
        localTagStore: migratedLocal.tagStore,
        remoteTagStore: migratedRemote.tagStore,
        localAccounts: migratedLocal.accounts,
        remoteAccounts: migratedRemote.accounts,
        localBookmarks,
        remoteBookmarks: normalizedRemote.bookmarks as SiteBookmark[],
        localTaggables: localApiCredentialProfiles.profiles,
        remoteTaggables: remoteApiCredentialProfilesForTags.profiles,
      })

      const useRemoteAccounts =
        syncDataSelection.accounts && remotePresence.hasAccountsList
      const useRemoteBookmarks =
        syncDataSelection.bookmarks && remotePresence.hasBookmarksList

      accountsToSave = useRemoteAccounts
        ? tagMerge.remoteAccounts
        : tagMerge.localAccounts
      bookmarksToSave = useRemoteBookmarks
        ? tagMerge.remoteBookmarks
        : tagMerge.localBookmarks

      tagStoreToSave =
        syncDataSelection.accounts ||
        syncDataSelection.bookmarks ||
        syncDataSelection.apiCredentialProfiles
          ? tagMerge.tagStore
          : localTagStore

      preferencesToSave =
        syncDataSelection.preferences && remotePresence.hasPreferences
          ? remotePreferences
          : localPreferences

      channelConfigsToSave =
        normalizedRemote.channelConfigs || localChannelConfigs

      apiCredentialProfilesToSave =
        syncDataSelection.apiCredentialProfiles &&
        remotePresence.hasApiCredentialProfiles &&
        normalizedRemote.apiCredentialProfiles
          ? {
              ...normalizedRemote.apiCredentialProfiles,
              profiles: tagMerge.remoteTaggables,
            }
          : localApiCredentialProfiles

      {
        const entryIdSet = new Set<string>([
          ...accountsToSave.map((account) => account.id),
          ...bookmarksToSave.map((bookmark) => bookmark.id),
        ])

        const selectedIdSet = new Set<string>([
          ...(useRemoteAccounts
            ? accountsToSave.map((account) => account.id)
            : []),
          ...(useRemoteBookmarks
            ? bookmarksToSave.map((bookmark) => bookmark.id)
            : []),
        ])

        const remotePinnedIds = remotePresence.hasPinnedAccountIds
          ? normalizedRemote.pinnedAccountIds
          : []
        const remoteOrderedIds = remotePresence.hasOrderedAccountIds
          ? normalizedRemote.orderedAccountIds
          : []

        if (remotePresence.hasPinnedAccountIds) {
          const mergedPinnedIds = [
            ...remotePinnedIds.filter((id) => selectedIdSet.has(id)),
            ...localPinnedAccountIds.filter((id) => !selectedIdSet.has(id)),
          ]
          const seenPinned = new Set<string>()
          const uniquePinnedIds: string[] = []
          for (const id of mergedPinnedIds) {
            if (seenPinned.has(id)) continue
            seenPinned.add(id)
            uniquePinnedIds.push(id)
          }
          pinnedAccountIdsToSave = uniquePinnedIds.filter((id) =>
            entryIdSet.has(id),
          )
        } else {
          pinnedAccountIdsToSave = localPinnedAccountIds.filter((id) =>
            entryIdSet.has(id),
          )
        }

        const baseOrderedIds = remotePresence.hasOrderedAccountIds
          ? [
              ...remoteOrderedIds.filter((id) => selectedIdSet.has(id)),
              ...localOrderedAccountIds.filter((id) => !selectedIdSet.has(id)),
            ]
          : localOrderedAccountIds

        orderedAccountIdsToSave = normalizeWebdavOrderedEntryIds({
          baseOrderedIds,
          entryIdSet,
          accounts: accountsToSave,
          bookmarks: bookmarksToSave,
        })
      }

      logger.info("")
    } else if (strategy === WEBDAV_SYNC_STRATEGIES.UPLOAD_ONLY || !remoteData) {
      //
      accountsToSave = localAccountsConfig.accounts
      bookmarksToSave = localBookmarks
      tagStoreToSave = localTagStore
      preferencesToSave = localPreferences
      channelConfigsToSave = localChannelConfigs
      apiCredentialProfilesToSave = localApiCredentialProfiles
      {
        const entryIdSet = new Set<string>([
          ...accountsToSave.map((account) => account.id),
          ...bookmarksToSave.map((bookmark) => bookmark.id),
        ])
        pinnedAccountIdsToSave = localPinnedAccountIds.filter((id) =>
          entryIdSet.has(id),
        )
        orderedAccountIdsToSave = normalizeWebdavOrderedEntryIds({
          baseOrderedIds: localOrderedAccountIds,
          entryIdSet,
          accounts: accountsToSave,
          bookmarks: bookmarksToSave,
        })
      }
      logger.info("")
    } else {
      logger.error("", {
        strategy: String(strategy),
      })
      throw new Error(`Invalid WebDAV sync strategy: ${String(strategy)}`)
    }

    const shouldWriteLocal =
      Boolean(remoteData) && strategy !== WEBDAV_SYNC_STRATEGIES.UPLOAD_ONLY

    if (shouldWriteLocal) {
      await this.applyLocalSyncResult({
        syncDataSelection,
        accountsToSave,
        bookmarksToSave,
        pinnedAccountIdsToSave,
        orderedAccountIdsToSave,
        tagStoreToSave,
        preferencesToSave,
        channelConfigsToSave,
        apiCredentialProfilesToSave,
        localAccountsConfig,
        localTagStore,
        localPreferences,
        localChannelConfigs,
        localApiCredentialProfiles,
      })
    }

    // WebDAV
    const exportData: BackupFullV2 = {
      version: BACKUP_VERSION,
      timestamp: Date.now(),
      accounts: {
        accounts: accountsToSave,
        bookmarks: bookmarksToSave,
        pinnedAccountIds: pinnedAccountIdsToSave,
        orderedAccountIds: orderedAccountIdsToSave,
        last_updated: Date.now(),
      },
      tagStore: tagStoreToSave,
      preferences: preferencesToSave,
      channelConfigs: channelConfigsToSave,
      apiCredentialProfiles: apiCredentialProfilesToSave,
    }

    const payload = mergeWebdavBackupPayloadBySelection({
      backup: exportData,
      selection: syncDataSelection,
      remoteBackup: remoteData,
    })

    await uploadBackup(JSON.stringify(payload, null, 2))
    logger.info("WebDAV")
  }

  private async importPreferencesOrThrow(preferences: UserPreferences) {
    const imported = await userPreferences.importPreferences(preferences, {
      preserveWebdav: true,
    })

    if (!imported) {
      throw new Error("Failed to import WebDAV preferences")
    }
  }

  private async applyLocalSyncResult(input: {
    syncDataSelection: WebDAVSyncDataSelection
    accountsToSave: SiteAccount[]
    bookmarksToSave: SiteBookmark[]
    pinnedAccountIdsToSave: string[]
    orderedAccountIdsToSave: string[]
    tagStoreToSave: TagStore
    preferencesToSave: UserPreferences
    channelConfigsToSave: ChannelConfigMap
    apiCredentialProfilesToSave: ApiCredentialProfilesConfig
    localAccountsConfig: {
      accounts: SiteAccount[]
      bookmarks?: SiteBookmark[]
      pinnedAccountIds?: string[]
      orderedAccountIds?: string[]
    }
    localTagStore: TagStore
    localPreferences: UserPreferences
    localChannelConfigs: ChannelConfigMap
    localApiCredentialProfiles: ApiCredentialProfilesConfig
  }) {
    const rollbackSteps: Array<() => Promise<void>> = []

    await withExtensionStorageWriteLock(
      STORAGE_LOCKS.WEBDAV_SYNC_APPLY,
      async () => {
        try {
          if (
            input.syncDataSelection.accounts ||
            input.syncDataSelection.bookmarks
          ) {
            await accountStorage.importData({
              accounts: input.accountsToSave,
              pinnedAccountIds: input.pinnedAccountIdsToSave,
              orderedAccountIds: input.orderedAccountIdsToSave,
              bookmarks: input.bookmarksToSave,
            })

            rollbackSteps.push(async () => {
              await accountStorage.importData({
                accounts: input.localAccountsConfig.accounts,
                bookmarks: input.localAccountsConfig.bookmarks || [],
                pinnedAccountIds:
                  input.localAccountsConfig.pinnedAccountIds || [],
                orderedAccountIds:
                  input.localAccountsConfig.orderedAccountIds || [],
              })
            })
          }

          if (
            input.syncDataSelection.accounts ||
            input.syncDataSelection.bookmarks ||
            input.syncDataSelection.apiCredentialProfiles
          ) {
            await tagStorage.importTagStore(input.tagStoreToSave)

            rollbackSteps.push(async () => {
              await tagStorage.importTagStore(input.localTagStore)
            })
          }

          if (input.syncDataSelection.preferences) {
            await this.importPreferencesOrThrow(input.preferencesToSave)

            rollbackSteps.push(async () => {
              await this.importPreferencesOrThrow(input.localPreferences)
            })
          }

          await channelConfigStorage.importConfigs(input.channelConfigsToSave)
          rollbackSteps.push(async () => {
            await channelConfigStorage.importConfigs(input.localChannelConfigs)
          })

          if (input.syncDataSelection.apiCredentialProfiles) {
            await apiCredentialProfilesStorage.importConfig(
              input.apiCredentialProfilesToSave,
            )

            rollbackSteps.push(async () => {
              await apiCredentialProfilesStorage.importConfig(
                input.localApiCredentialProfiles,
              )
            })
          }
        } catch (error) {
          for (const rollback of rollbackSteps.reverse()) {
            try {
              await rollback()
            } catch (rollbackError) {
              logger.error(
                "Failed to rollback partially applied WebDAV sync writes",
                rollbackError,
              )
            }
          }

          throw error
        }
      },
    )
  }

  /**
   * Merge local and remote data based on timestamps (latest wins).
   * Also reconciles channel configs and deduplicates pinned ids.
   * @returns Merged accounts, preferences, and channel configs.
   */
  private mergeData(
    local: {
      accounts: SiteAccount[]
      bookmarks: SiteBookmark[]
      accountsTimestamp: number
      tagStore: TagStore
      preferences: UserPreferences
      preferencesTimestamp: number
      channelConfigs: ChannelConfigMap
      apiCredentialProfiles: ApiCredentialProfilesConfig
    },
    remote: {
      accounts: SiteAccount[]
      bookmarks: SiteBookmark[]
      accountsTimestamp: number
      tagStore: TagStore
      preferences: UserPreferences
      preferencesTimestamp: number
      channelConfigs: ChannelConfigMap | null
      apiCredentialProfiles: ApiCredentialProfilesConfig
    },
    selection: WebDAVSyncDataSelection = resolveWebdavSyncDataSelection(null),
  ): {
    accounts: SiteAccount[]
    bookmarks: SiteBookmark[]
    tagStore: TagStore
    preferences: UserPreferences
    channelConfigs: ChannelConfigMap
    apiCredentialProfiles: ApiCredentialProfilesConfig
  } {
    logger.debug("", {
      localAccountCount: local.accounts.length,
      remoteAccountCount: remote.accounts.length,
      localBookmarkCount: local.bookmarks.length,
      remoteBookmarkCount: remote.bookmarks.length,
    })

    // Migrate legacy string tags (if any) into tag ids on both sides.
    const localTagStore = sanitizeTagStore(
      local.tagStore ?? createDefaultTagStore(),
    )
    const remoteTagStore = sanitizeTagStore(
      remote.tagStore ?? createDefaultTagStore(),
    )
    const migratedLocal = migrateAccountTagsData({
      accounts: local.accounts,
      tagStore: localTagStore,
    })
    const migratedRemote = migrateAccountTagsData({
      accounts: remote.accounts,
      tagStore: remoteTagStore,
    })

    // Merge tag stores and remap accounts so tag ids always resolve.
    const tagMerge = tagStorage.mergeTagStoresForSync({
      localTagStore: migratedLocal.tagStore,
      remoteTagStore: migratedRemote.tagStore,
      localAccounts: migratedLocal.accounts,
      remoteAccounts: migratedRemote.accounts,
      localBookmarks: local.bookmarks,
      remoteBookmarks: remote.bookmarks,
      localTaggables: local.apiCredentialProfiles.profiles,
      remoteTaggables: remote.apiCredentialProfiles.profiles,
    })

    //
    const accountMap = new Map<string, SiteAccount>()

    //
    tagMerge.localAccounts.forEach((account) => {
      accountMap.set(account.id, account)
    })

    //  updated_at
    if (selection.accounts) {
      tagMerge.remoteAccounts.forEach((remoteAccount) => {
        const localAccount = accountMap.get(remoteAccount.id)

        if (!localAccount) {
          //
          accountMap.set(remoteAccount.id, remoteAccount)
          logger.debug("", {
            accountId: remoteAccount.id,
            siteName: remoteAccount.site_name,
          })
        } else {
          //
          const localUpdatedAt = localAccount.updated_at || 0
          const remoteUpdatedAt = remoteAccount.updated_at || 0

          if (remoteUpdatedAt > localUpdatedAt) {
            //
            accountMap.set(remoteAccount.id, remoteAccount)
            logger.debug("", {
              accountId: remoteAccount.id,
              siteName: remoteAccount.site_name,
            })
          } else {
            logger.debug("", {
              accountId: localAccount.id,
              siteName: localAccount.site_name,
            })
          }
        }
      })
    }

    const mergedAccounts = Array.from(accountMap.values())

    const bookmarkMap = new Map<string, SiteBookmark>()
    tagMerge.localBookmarks.forEach((bookmark) => {
      bookmarkMap.set(bookmark.id, bookmark)
    })

    if (selection.bookmarks) {
      tagMerge.remoteBookmarks.forEach((remoteBookmark) => {
        const localBookmark = bookmarkMap.get(remoteBookmark.id)
        if (!localBookmark) {
          bookmarkMap.set(remoteBookmark.id, remoteBookmark)
          return
        }

        const localUpdatedAt = localBookmark.updated_at || 0
        const remoteUpdatedAt = remoteBookmark.updated_at || 0
        if (remoteUpdatedAt > localUpdatedAt) {
          bookmarkMap.set(remoteBookmark.id, remoteBookmark)
        }
      })
    }

    const mergedBookmarks = Array.from(bookmarkMap.values())

    const apiCredentialProfiles = selection.apiCredentialProfiles
      ? mergeApiCredentialProfilesConfigs({
          local: {
            ...local.apiCredentialProfiles,
            profiles: tagMerge.localTaggables,
          },
          incoming: {
            ...remote.apiCredentialProfiles,
            profiles: tagMerge.remoteTaggables,
          },
        })
      : {
          ...local.apiCredentialProfiles,
          profiles: tagMerge.localTaggables,
        }

    // Compare shared-preference timestamps so device-local WebDAV/refresh edits do
    // not change merge arbitration.
    const preferences = selection.preferences
      ? remote.preferencesTimestamp > local.preferencesTimestamp
        ? remote.preferences
        : local.preferences
      : local.preferences

    //
    const localChannelConfigs = local.channelConfigs
    const remoteChannelConfigs = remote.channelConfigs
    const mergedChannelConfigs: ChannelConfigMap = { ...localChannelConfigs }

    if (remoteChannelConfigs && typeof remoteChannelConfigs === "object") {
      for (const [key, value] of Object.entries(remoteChannelConfigs)) {
        const channelId = Number(key)
        if (!Number.isFinite(channelId) || channelId <= 0) {
          continue
        }

        const localConfig = localChannelConfigs[channelId]
        const remoteConfig = value as ChannelConfigMap[number]

        if (!localConfig) {
          mergedChannelConfigs[channelId] = remoteConfig
        } else {
          const localUpdatedAt =
            typeof localConfig.updatedAt === "number"
              ? localConfig.updatedAt
              : 0
          const remoteUpdatedAt =
            typeof remoteConfig.updatedAt === "number"
              ? remoteConfig.updatedAt
              : 0

          mergedChannelConfigs[channelId] =
            remoteUpdatedAt > localUpdatedAt ? remoteConfig : localConfig
        }
      }
    }

    logger.info("", {
      accountCount: mergedAccounts.length,
      preferencesSource:
        selection.preferences &&
        remote.preferencesTimestamp > local.preferencesTimestamp
          ? "remote"
          : "local",
      channelConfigCount: Object.keys(mergedChannelConfigs).length,
    })

    return {
      accounts: mergedAccounts,
      bookmarks: mergedBookmarks,
      tagStore:
        selection.accounts ||
        selection.bookmarks ||
        selection.apiCredentialProfiles
          ? tagMerge.tagStore
          : localTagStore,
      preferences,
      channelConfigs: mergedChannelConfigs,
      apiCredentialProfiles,
    }
  }

  /**
   *
   * @returns Result with success flag and optional message.
   */
  async syncNow(): Promise<{ success: boolean; message?: string }> {
    if (this.isSyncing) {
      return {
        success: false,
        message: "",
      }
    }

    try {
      logger.info("")
      await this.syncWithWebdav()
      this.lastSyncTime = Date.now()
      this.lastSyncStatus = "success"
      this.lastSyncError = null
      logger.info("")
      return {
        success: true,
        message: "",
      }
    } catch (error) {
      logger.error("", error)
      this.lastSyncStatus = "error"
      this.lastSyncError = getErrorMessage(error)
      return {
        success: false,
        message: getErrorMessage(error),
      }
    }
  }

  /**
   *
   *
   * Clears the scheduled alarm; idempotent.
   */
  async stopAutoSync() {
    const cleared = await clearAlarm(WebdavAutoSyncService.ALARM_NAME)
    this.isScheduled = false

    if (cleared) {
      logger.info("")
    } else {
      logger.info("")
    }
  }

  /**
   *
   *
   * Persists partial webdav settings and reconfigures scheduler.
   */
  async updateSettings(settings: {
    autoSync?: boolean
    syncInterval?: number
    syncStrategy?: WebDAVSettings["syncStrategy"]
  }) {
    try {
      // Update the nested webdav object
      await userPreferences.savePreferences({
        webdav: settings,
      })
      await this.setupAutoSync() // alarm
      logger.info("", settings)
    } catch (error) {
      logger.error("", error)
    }
  }

  /**
   *
   * @returns Snapshot of initialization, running, and last-sync info.
   */
  getStatus() {
    return {
      isRunning: this.isScheduled,
      isInitialized: this.isInitialized,
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      lastSyncStatus: this.lastSyncStatus,
      lastSyncError: this.lastSyncError,
    }
  }

  /**
   * Notify frontends about sync status updates.
   * Silently ignores missing receivers (popup/options may be closed).
   *
   * Best-effort; errors are logged and swallowed to avoid breaking sync loop.
   */
  private notifyFrontend(type: string, data: any) {
    try {
      //
      void sendRuntimeMessage(
        {
          type: "WEBDAV_AUTO_SYNC_UPDATE",
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
    void this.stopAutoSync()
    this.removeAlarmListener?.()
    this.removeAlarmListener = null
    this.isInitialized = false
    logger.info("")
  }
}

//
export const webdavAutoSyncService = new WebdavAutoSyncService()

/**
 * Message handler for WebDAV auto-sync actions (setup, syncNow, stop, update).
 * @param request Incoming message with action + payload.
 * @param sendResponse Callback to respond to sender.
 */
export const handleWebdavAutoSyncMessage = async (
  request: any,
  sendResponse: (response: any) => void,
) => {
  try {
    switch (request.action) {
      case RuntimeActionIds.WebdavAutoSyncSetup:
        await webdavAutoSyncService.setupAutoSync()
        sendResponse({ success: true })
        break

      case RuntimeActionIds.WebdavAutoSyncSyncNow: {
        const result = await webdavAutoSyncService.syncNow()
        sendResponse({ success: result.success, message: result.message })
        break
      }

      case RuntimeActionIds.WebdavAutoSyncStop:
        await webdavAutoSyncService.stopAutoSync()
        sendResponse({ success: true })
        break

      case RuntimeActionIds.WebdavAutoSyncUpdateSettings: {
        await webdavAutoSyncService.updateSettings(request.settings)
        sendResponse({ success: true })
        break
      }

      case RuntimeActionIds.WebdavAutoSyncGetStatus: {
        const status = webdavAutoSyncService.getStatus()
        sendResponse({ success: true, data: status })
        break
      }

      default:
        sendResponse({ success: false, error: "" })
    }
  } catch (error) {
    logger.error("", error)
    sendResponse({ success: false, error: getErrorMessage(error) })
  }
}
