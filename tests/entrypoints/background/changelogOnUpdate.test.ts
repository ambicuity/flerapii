import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

type InstalledListener = (details: { reason: string }) => void

const flushPromises = () => new Promise((resolve) => setTimeout(resolve, 0))

const mockState = vi.hoisted(() => ({
  onInstalledListener: undefined as InstalledListener | undefined,
  onStartupListener: undefined as (() => void | Promise<void>) | undefined,
}))

const mocks = vi.hoisted(() => ({
  applyActionClickBehavior: vi.fn(),
  applyDevActionBranding: vi.fn(),
  createTab: vi.fn(),
  ensureLegacyMigration: vi.fn(),
  exportData: vi.fn(),
  getAllAccounts: vi.fn(),
  getDocsChangelogUrl: vi.fn(),
  getManifest: vi.fn(),
  getPreferences: vi.fn(),
  hasNewOptionalPermissions: vi.fn(),
  hasPermissions: vi.fn(),
  importData: vi.fn(),
  initializeCookieInterceptors: vi.fn(),
  initializeServices: vi.fn(),
  migrateAccountsConfig: vi.fn(),
  onInstalled: vi.fn((listener: InstalledListener) => {
    mockState.onInstalledListener = listener
  }),
  onStartup: vi.fn((listener: () => void | Promise<void>) => {
    mockState.onStartupListener = listener
  }),
  openOrFocusOptionsMenuItem: vi.fn(),
  setLastSeenOptionalPermissions: vi.fn(),
  setPendingVersion: vi.fn(),
  setupContextMenus: vi.fn(),
  setupCookieInterceptorListeners: vi.fn(),
  setupRuntimeMessageListeners: vi.fn(),
  setupTempWindowListeners: vi.fn(),
}))

vi.mock("~/utils/browser/browserApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/utils/browser/browserApi")>()
  return {
    ...actual,
    createTab: mocks.createTab,
    getManifest: mocks.getManifest,
    onInstalled: mocks.onInstalled,
    onStartup: mocks.onStartup,
  }
})

vi.mock("~/utils/navigation/docsLinks", () => ({
  getDocsChangelogUrl: mocks.getDocsChangelogUrl,
}))

vi.mock("~/services/preferences/userPreferences", () => ({
  userPreferences: { getPreferences: mocks.getPreferences },
}))

vi.mock("~/services/updates/changelogOnUpdateState", () => ({
  changelogOnUpdateState: {
    setPendingVersion: mocks.setPendingVersion,
  },
}))

vi.mock("~/entrypoints/background/runtimeMessages", () => ({
  setupRuntimeMessageListeners: mocks.setupRuntimeMessageListeners,
}))

vi.mock("~/entrypoints/background/tempWindowPool", () => ({
  setupTempWindowListeners: mocks.setupTempWindowListeners,
}))

vi.mock("~/entrypoints/background/contextMenus", () => ({
  setupContextMenus: mocks.setupContextMenus,
}))

vi.mock("~/entrypoints/background/cookieInterceptor", () => ({
  initializeCookieInterceptors: mocks.initializeCookieInterceptors,
  setupCookieInterceptorListeners: mocks.setupCookieInterceptorListeners,
}))

vi.mock("~/entrypoints/background/devActionBranding", () => ({
  applyDevActionBranding: mocks.applyDevActionBranding,
}))

vi.mock("~/entrypoints/background/servicesInit", () => ({
  initializeServices: mocks.initializeServices,
}))

vi.mock("~/entrypoints/background/actionClickBehavior", () => ({
  applyActionClickBehavior: mocks.applyActionClickBehavior,
}))

vi.mock("~/services/tags/tagStorage", () => ({
  tagStorage: {
    ensureLegacyMigration: mocks.ensureLegacyMigration,
  },
}))

vi.mock("~/services/accounts/accountStorage", () => ({
  accountStorage: {
    exportData: mocks.exportData,
    getAllAccounts: mocks.getAllAccounts,
    importData: mocks.importData,
  },
}))

vi.mock("~/services/accounts/migrations/accountDataMigration", () => ({
  migrateAccountsConfig: mocks.migrateAccountsConfig,
}))

vi.mock("~/services/permissions/permissionManager", () => ({
  OPTIONAL_PERMISSIONS: [],
  hasPermissions: mocks.hasPermissions,
}))

vi.mock("~/services/permissions/optionalPermissionState", () => ({
  hasNewOptionalPermissions: mocks.hasNewOptionalPermissions,
  setLastSeenOptionalPermissions: mocks.setLastSeenOptionalPermissions,
}))

vi.mock("~/utils/navigation", () => ({
  openOrFocusOptionsMenuItem: mocks.openOrFocusOptionsMenuItem,
}))

/**
 * Background entrypoint tests for the "open changelog after update" preference.
 *
 * The background entrypoint registers an onInstalled listener and then runs a
 * migration + update flow. These tests mock the WebExtension wrappers and
 * dependent services so we can assert that updates mark a pending version
 * (consumed by the first UI open) instead of opening a tab directly.
 */
describe("background onInstalled changelog opening", () => {
  beforeEach(() => {
    mockState.onInstalledListener = undefined
    mockState.onStartupListener = undefined

    mocks.applyActionClickBehavior.mockReset()
    mocks.applyDevActionBranding.mockReset()
    mocks.createTab.mockReset()
    mocks.ensureLegacyMigration.mockReset()
    mocks.exportData.mockReset()
    mocks.getAllAccounts.mockReset()
    mocks.getDocsChangelogUrl.mockReset()
    mocks.getManifest.mockReset()
    mocks.getPreferences.mockReset()
    mocks.hasNewOptionalPermissions.mockReset()
    mocks.hasPermissions.mockReset()
    mocks.importData.mockReset()
    mocks.initializeCookieInterceptors.mockReset()
    mocks.initializeServices.mockReset()
    mocks.migrateAccountsConfig.mockReset()
    mocks.onInstalled.mockClear()
    mocks.onStartup.mockClear()
    mocks.openOrFocusOptionsMenuItem.mockReset()
    mocks.setLastSeenOptionalPermissions.mockReset()
    mocks.setPendingVersion.mockReset()
    mocks.setupContextMenus.mockReset()
    mocks.setupCookieInterceptorListeners.mockReset()
    mocks.setupRuntimeMessageListeners.mockReset()
    mocks.setupTempWindowListeners.mockReset()

    mocks.applyActionClickBehavior.mockResolvedValue(undefined)
    mocks.applyDevActionBranding.mockResolvedValue(undefined)
    mocks.createTab.mockResolvedValue(undefined)
    mocks.ensureLegacyMigration.mockResolvedValue(undefined)
    mocks.exportData.mockResolvedValue({ accounts: [] })
    mocks.getAllAccounts.mockResolvedValue([])
    mocks.getDocsChangelogUrl.mockImplementation((version?: string) =>
      version
        ? "https://docs.example.test/changelog.html#_2-39-0"
        : "https://docs.example.test/changelog.html",
    )
    mocks.getManifest.mockReturnValue({ version: "2.39.0" })
    mocks.getPreferences.mockResolvedValue({
      actionClickBehavior: "popup",
      openChangelogOnUpdate: true,
    })
    mocks.hasNewOptionalPermissions.mockResolvedValue(false)
    mocks.hasPermissions.mockResolvedValue(true)
    mocks.importData.mockResolvedValue(undefined)
    mocks.initializeCookieInterceptors.mockResolvedValue(undefined)
    mocks.initializeServices.mockResolvedValue(undefined)
    mocks.migrateAccountsConfig.mockImplementation((accounts: any[]) => ({
      accounts,
      migratedCount: 0,
    }))
    mocks.setLastSeenOptionalPermissions.mockResolvedValue(undefined)
    mocks.setPendingVersion.mockResolvedValue(undefined)

    vi.resetModules()
    ;(globalThis as any).defineBackground = (factory: () => unknown) =>
      factory()
  })

  afterEach(() => {
    delete (globalThis as any).defineBackground

    vi.resetModules()
    vi.restoreAllMocks()
  })

  it("does not open any changelog tab on update and marks the pending version instead", async () => {
    await import("~/entrypoints/background/index")

    expect(mockState.onInstalledListener).toBeTypeOf("function")
    expect(mockState.onStartupListener).toBeTypeOf("function")
    await mockState.onInstalledListener?.({ reason: "update" })
    await flushPromises()

    expect(mocks.getPreferences).toHaveBeenCalled()
    expect(mocks.getManifest).toHaveBeenCalled()
    expect(mocks.setPendingVersion).toHaveBeenCalledWith("2.39.0")
    expect(mocks.getDocsChangelogUrl).not.toHaveBeenCalled()
    expect(mocks.createTab).not.toHaveBeenCalled()
  })

  it("marks pending version even when openChangelogOnUpdate is disabled", async () => {
    mocks.getPreferences.mockResolvedValue({
      actionClickBehavior: "popup",
      openChangelogOnUpdate: false,
    })

    await import("~/entrypoints/background/index")

    expect(mockState.onInstalledListener).toBeTypeOf("function")
    expect(mockState.onStartupListener).toBeTypeOf("function")
    await mockState.onInstalledListener?.({ reason: "update" })
    await flushPromises()

    expect(mocks.setPendingVersion).toHaveBeenCalledWith("2.39.0")
    expect(mocks.getDocsChangelogUrl).not.toHaveBeenCalled()
    expect(mocks.createTab).not.toHaveBeenCalled()
  })
})
