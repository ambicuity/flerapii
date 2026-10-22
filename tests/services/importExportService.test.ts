import { Storage } from "@plasmohq/storage"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { API_CREDENTIAL_PROFILES_STORAGE_KEYS } from "~/services/core/storageKeys"
import { importFromBackupObject } from "~/services/importExport/importExportService"

const {
  mockAccountImportData,
  mockMergeCredentialProfiles,
  mockImportTagStore,
  mockEnsureLegacyMigration,
} = vi.hoisted(() => ({
  mockAccountImportData: vi.fn(),
  mockMergeCredentialProfiles: vi.fn(),
  mockImportTagStore: vi.fn(),
  mockEnsureLegacyMigration: vi.fn(),
}))

mockAccountImportData.mockResolvedValue({ migratedCount: 0 })
mockMergeCredentialProfiles.mockResolvedValue(undefined)
mockImportTagStore.mockResolvedValue(undefined)
mockEnsureLegacyMigration.mockResolvedValue(undefined)

vi.mock("~/services/accounts/accountStorage", () => ({
  accountStorage: {
    importData: mockAccountImportData,
  },
}))

vi.mock("~/services/apiCredentialProfiles/apiCredentialProfilesStorage", () => ({
  apiCredentialProfilesStorage: {
    mergeConfig: mockMergeCredentialProfiles,
  },
  coerceApiCredentialProfilesConfig: (raw: any) => ({
    version: 1,
    lastUpdated: 0,
    profiles: Array.isArray(raw?.profiles) ? raw.profiles : [],
  }),
}))

vi.mock("~/services/tags/tagStorage", () => ({
  tagStorage: {
    importTagStore: mockImportTagStore,
    ensureLegacyMigration: mockEnsureLegacyMigration,
    exportTagStore: vi.fn().mockResolvedValue({ version: 1, tagsById: {} }),
    mergeTagStoresForSync: vi.fn().mockReturnValue({
      tagStore: { version: 1, tagsById: {} },
      remoteTaggables: [],
    }),
  },
}))

vi.mock("~/services/managedSites/channelConfigStorage", () => ({
  channelConfigStorage: {
    importConfigs: vi.fn().mockResolvedValue(undefined),
  },
}))

vi.mock("~/services/preferences/userPreferences", () => ({
  userPreferences: {
    importPreferences: vi.fn().mockResolvedValue(true),
  },
}))

describe("importFromBackupObject — non-2.0 payloads", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    new Storage({ area: "local" })
  })

  it("imports api credential profiles from a non-2.0 payload", async () => {
    const result = await importFromBackupObject({
      version: "3.0",
      timestamp: 1_700_000_000_000,
      apiCredentialProfiles: {
        profiles: [{ id: "profile-1", name: "Primary" }],
      },
    } as any)

    expect(mockMergeCredentialProfiles).toHaveBeenCalledTimes(1)
    expect(mockMergeCredentialProfiles.mock.calls[0][0].profiles).toHaveLength(1)
    expect(result.sections.apiCredentialProfiles).toBe(true)
    expect(result.allImported).toBe(true)
  })

  it("preserves bookmarks and pin/order ids when the payload carries a full accounts config", async () => {
    await importFromBackupObject({
      version: "3.0",
      timestamp: 1_700_000_000_000,
      accounts: {
        accounts: [{ id: "account-1" }],
        bookmarks: [{ id: "bookmark-1" }],
        pinnedAccountIds: ["account-1"],
        orderedAccountIds: ["account-1"],
      },
    } as any)

    expect(mockAccountImportData).toHaveBeenCalledTimes(1)
    const payload = mockAccountImportData.mock.calls[0][0]
    expect(payload.accounts).toHaveLength(1)
    expect(payload.bookmarks).toHaveLength(1)
    expect(payload.pinnedAccountIds).toEqual(["account-1"])
    expect(payload.orderedAccountIds).toEqual(["account-1"])
  })

  it("still imports a bare accounts array without companion collections", async () => {
    await importFromBackupObject({
      version: "3.0",
      timestamp: 1_700_000_000_000,
      accounts: [{ id: "account-1" }],
    } as any)

    expect(mockAccountImportData).toHaveBeenCalledTimes(1)
    const payload = mockAccountImportData.mock.calls[0][0]
    expect(payload.accounts).toHaveLength(1)
    expect(payload.bookmarks).toBeUndefined()
  })

  it("reports allImported as false when a requested section is missing", async () => {
    const result = await importFromBackupObject({
      version: "3.0",
      timestamp: 1_700_000_000_000,
      accounts: [{ id: "account-1" }],
      preferences: { themeMode: "dark" },
    } as any)

    expect(result.sections.accounts).toBe(true)
    expect(result.sections.preferences).toBe(true)
    expect(result.allImported).toBe(true)
  })

  it("throws NO_IMPORTABLE_DATA when the payload carries nothing importable", async () => {
    await expect(
      importFromBackupObject({
        version: "3.0",
        timestamp: 1_700_000_000_000,
      } as any),
    ).rejects.toThrow("NO_IMPORTABLE_DATA")
  })
})
