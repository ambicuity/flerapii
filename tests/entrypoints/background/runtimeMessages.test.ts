import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RuntimeActionIds } from "~/constants/runtimeActions"

type RuntimeMessageListener = (
  request: any,
  sender: any,
  sendResponse: (response: any) => void,
) => unknown

const mockState = vi.hoisted(() => ({
  runtimeMessageListener: undefined as RuntimeMessageListener | undefined,
}))

const mocks = vi.hoisted(() => ({
  applyActionClickBehavior: vi.fn(),
  handleAccountKeyRepairMessage: vi.fn(),
  handleAutoDetectSite: vi.fn(),
  handleCloseTempWindow: vi.fn(),
  handleDailyBalanceHistoryMessage: vi.fn(),
  handleLdohSiteLookupMessage: vi.fn(),
  handleManagedSiteModelSyncMessage: vi.fn(),
  handleOpenTempWindow: vi.fn(),
  handleTempWindowFetch: vi.fn(),
  handleTempWindowGetRenderedTitle: vi.fn(),
  handleTempWindowTurnstileFetch: vi.fn(),
  handleWebAiApiCheckMessage: vi.fn(),
  onRuntimeMessage: vi.fn((listener: RuntimeMessageListener) => {
    mockState.runtimeMessageListener = listener
  }),
  setupContextMenus: vi.fn(),
  trackCookieInterceptorUrl: vi.fn(),
}))

vi.mock("~/utils/browser/browserApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/utils/browser/browserApi")>()
  return {
    ...actual,
    onRuntimeMessage: mocks.onRuntimeMessage,
  }
})

vi.mock("~/entrypoints/background/actionClickBehavior", () => ({
  applyActionClickBehavior: mocks.applyActionClickBehavior,
}))

vi.mock("~/entrypoints/background/contextMenus", () => ({
  setupContextMenus: mocks.setupContextMenus,
}))

vi.mock("~/services/models/modelSync", () => ({
  handleManagedSiteModelSyncMessage: mocks.handleManagedSiteModelSyncMessage,
}))

vi.mock("~/services/accounts/accountKeyAutoProvisioning", () => ({
  handleAccountKeyRepairMessage: mocks.handleAccountKeyRepairMessage,
}))

vi.mock("~/services/history/dailyBalanceHistory/scheduler", () => ({
  handleDailyBalanceHistoryMessage: mocks.handleDailyBalanceHistoryMessage,
}))

vi.mock("~/services/integrations/ldohSiteLookup/background", () => ({
  handleLdohSiteLookupMessage: mocks.handleLdohSiteLookupMessage,
}))

vi.mock("~/services/verification/webAiApiCheck/background", () => ({
  handleWebAiApiCheckMessage: mocks.handleWebAiApiCheckMessage,
}))

vi.mock("~/entrypoints/background/cookieInterceptor", () => ({
  trackCookieInterceptorUrl: mocks.trackCookieInterceptorUrl,
}))

vi.mock("~/entrypoints/background/tempWindowPool", () => ({
  handleAutoDetectSite: mocks.handleAutoDetectSite,
  handleCloseTempWindow: mocks.handleCloseTempWindow,
  handleOpenTempWindow: mocks.handleOpenTempWindow,
  handleTempWindowFetch: mocks.handleTempWindowFetch,
  handleTempWindowGetRenderedTitle: mocks.handleTempWindowGetRenderedTitle,
  handleTempWindowTurnstileFetch: mocks.handleTempWindowTurnstileFetch,
}))

// runtimeMessages imports these modules; provide minimal stubs to avoid heavy side effects.
vi.mock("~/services/checkin/autoCheckin/scheduler", () => ({
  handleAutoCheckinMessage: vi.fn(),
}))

vi.mock("~/services/accounts/autoRefreshService", () => ({
  handleAutoRefreshMessage: vi.fn(),
}))

vi.mock("~/services/managedSites/channelConfigStorage", () => ({
  handleChannelConfigMessage: vi.fn(),
}))

vi.mock("~/services/checkin/externalCheckInService", () => ({
  handleExternalCheckInMessage: vi.fn(),
}))

vi.mock("~/services/redemption/redemptionAssist", () => ({
  handleRedemptionAssistMessage: vi.fn(),
}))

vi.mock("~/services/history/usageHistory/scheduler", () => ({
  handleUsageHistoryMessage: vi.fn(),
}))

vi.mock("~/services/webdav/webdavAutoSyncService", () => ({
  handleWebdavAutoSyncMessage: vi.fn(),
}))

describe("setupRuntimeMessageListeners routing", () => {
  beforeEach(() => {
    mockState.runtimeMessageListener = undefined

    mocks.applyActionClickBehavior.mockReset()
    mocks.handleAccountKeyRepairMessage.mockReset()
    mocks.handleAutoDetectSite.mockReset()
    mocks.handleCloseTempWindow.mockReset()
    mocks.handleDailyBalanceHistoryMessage.mockReset()
    mocks.handleLdohSiteLookupMessage.mockReset()
    mocks.handleManagedSiteModelSyncMessage.mockReset()
    mocks.handleOpenTempWindow.mockReset()
    mocks.handleTempWindowFetch.mockReset()
    mocks.handleTempWindowGetRenderedTitle.mockReset()
    mocks.handleTempWindowTurnstileFetch.mockReset()
    mocks.handleWebAiApiCheckMessage.mockReset()
    mocks.onRuntimeMessage.mockClear()
    mocks.setupContextMenus.mockReset()
    mocks.trackCookieInterceptorUrl.mockReset()

    mocks.setupContextMenus.mockResolvedValue(undefined)
    mocks.trackCookieInterceptorUrl.mockResolvedValue(undefined)

    vi.resetModules()
  })

  afterEach(() => {
    vi.resetModules()
    vi.restoreAllMocks()
  })

  it("routes exact-match actions and responds synchronously", async () => {
    const { setupRuntimeMessageListeners } =
      await import("~/entrypoints/background/runtimeMessages")

    setupRuntimeMessageListeners()
    expect(mockState.runtimeMessageListener).toBeTypeOf("function")

    const sendResponse = vi.fn()
    const result = mockState.runtimeMessageListener?.(
      {
        action: RuntimeActionIds.PreferencesUpdateActionClickBehavior,
        behavior: "openPopup",
      },
      {},
      sendResponse,
    )

    expect(mocks.applyActionClickBehavior).toHaveBeenCalledWith("openPopup")
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
    expect(result).toBe(true)
  })

  it("refreshes context menus when requested", async () => {
    const { setupRuntimeMessageListeners } =
      await import("~/entrypoints/background/runtimeMessages")

    setupRuntimeMessageListeners()
    expect(mockState.runtimeMessageListener).toBeTypeOf("function")

    const sendResponse = vi.fn()
    const result = mockState.runtimeMessageListener?.(
      {
        action: RuntimeActionIds.PreferencesRefreshContextMenus,
      },
      {},
      sendResponse,
    )

    expect(result).toBe(true)
    expect(mocks.setupContextMenus).toHaveBeenCalledTimes(1)

    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(sendResponse).toHaveBeenCalledWith({ success: true })
  })

  it("routes prefix actions to the feature handler and keeps the response channel open", async () => {
    const { setupRuntimeMessageListeners } =
      await import("~/entrypoints/background/runtimeMessages")

    setupRuntimeMessageListeners()
    expect(mockState.runtimeMessageListener).toBeTypeOf("function")

    const sendResponse = vi.fn()
    const request = { action: RuntimeActionIds.ModelSyncGetNextRun }

    const result = mockState.runtimeMessageListener?.(request, {}, sendResponse)

    expect(mocks.handleManagedSiteModelSyncMessage).toHaveBeenCalledWith(
      request,
      sendResponse,
    )
    expect(result).toBe(true)
  })

  it("returns undefined when action is missing", async () => {
    const { setupRuntimeMessageListeners } =
      await import("~/entrypoints/background/runtimeMessages")

    setupRuntimeMessageListeners()
    expect(mockState.runtimeMessageListener).toBeTypeOf("function")

    const sendResponse = vi.fn()
    const result = mockState.runtimeMessageListener?.({}, {}, sendResponse)

    expect(sendResponse).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })

  it("returns undefined when action is unknown", async () => {
    const { setupRuntimeMessageListeners } =
      await import("~/entrypoints/background/runtimeMessages")

    setupRuntimeMessageListeners()
    expect(mockState.runtimeMessageListener).toBeTypeOf("function")

    const sendResponse = vi.fn()
    const result = mockState.runtimeMessageListener?.(
      { action: "unknownAction" },
      {},
      sendResponse,
    )

    expect(sendResponse).not.toHaveBeenCalled()
    expect(result).toBeUndefined()
  })
})
