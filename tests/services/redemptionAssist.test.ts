import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { RuntimeActionIds } from "~/constants/runtimeActions"
import { DEFAULT_PREFERENCES } from "~/services/preferences/userPreferences"

const mocks = vi.hoisted(() => ({
  convertToDisplayData: vi.fn(),
  getAccountById: vi.fn(),
  getAllAccounts: vi.fn(),
  getPreferences: vi.fn(),
  redeemCodeForAccount: vi.fn(),
  refreshAccount: vi.fn(),
}))

vi.mock("~/services/preferences/userPreferences", async (importOriginal) => {
  const actual =
    await importOriginal<
      typeof import("~/services/preferences/userPreferences")
    >()
  return {
    ...actual,
    userPreferences: {
      getPreferences: mocks.getPreferences,
    },
  }
})

vi.mock("~/services/accounts/accountStorage", () => ({
  accountStorage: {
    convertToDisplayData: mocks.convertToDisplayData,
    getAccountById: mocks.getAccountById,
    getAllAccounts: mocks.getAllAccounts,
    refreshAccount: mocks.refreshAccount,
  },
}))

vi.mock("~/services/redemption/redeemService", () => ({
  redeemService: {
    redeemCodeForAccount: mocks.redeemCodeForAccount,
  },
}))

beforeEach(() => {
  vi.resetModules()

  mocks.convertToDisplayData.mockReset()
  mocks.getAccountById.mockReset()
  mocks.getAllAccounts.mockReset()
  mocks.getPreferences.mockReset()
  mocks.redeemCodeForAccount.mockReset()
  mocks.refreshAccount.mockReset()

  mocks.convertToDisplayData.mockReturnValue([])
  mocks.getAccountById.mockResolvedValue(null)
  mocks.getAllAccounts.mockResolvedValue([])
  mocks.getPreferences.mockResolvedValue(DEFAULT_PREFERENCES)
  mocks.redeemCodeForAccount.mockResolvedValue({
    success: true,
    message: "ok",
  })
  mocks.refreshAccount.mockResolvedValue({ refreshed: true })
})

afterEach(() => {
  vi.resetModules()
  vi.restoreAllMocks()
})

describe("redemptionAssist shouldPrompt batch filtering", () => {
  it("returns only prompt-eligible codes for a url", async () => {
    mocks.getPreferences.mockResolvedValue({
      ...DEFAULT_PREFERENCES,
      redemptionAssist: {
        enabled: true,
        contextMenu: {
          enabled: true,
        },
        urlWhitelist: {
          enabled: false,
          patterns: [""],
          includeAccountSiteUrls: true,
          includeCheckInAndRedeemUrls: true,
        },
        // Strict hex validation for this test case.
        relaxedCodeValidation: false,
      },
    })

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const validHex = "a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
    const invalidHex = "g1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6"
    const tooShort = "1234"

    const sendResponse = vi.fn()

    await handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistShouldPrompt,
        url: "https://example.com/redeem",
        codes: [validHex, invalidHex, tooShort],
      },
      { tab: { id: 99 } } as any,
      sendResponse,
    )

    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      promptableCodes: [validHex],
    })
  })
})

describe("redemptionAssist post-redeem refresh", () => {
  it("refreshes account after successful auto redeem (explicit account)", async () => {
    mocks.refreshAccount.mockResolvedValue({ refreshed: true })
    mocks.redeemCodeForAccount.mockResolvedValue({
      success: true,
      message: "ok",
    })

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const sendResponse = vi.fn()

    await handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistAutoRedeem,
        accountId: "acc_1",
        code: "CODE_1",
      },
      {} as any,
      sendResponse,
    )

    expect(mocks.redeemCodeForAccount).toHaveBeenCalledWith("acc_1", "CODE_1")
    await vi.waitFor(() => {
      expect(mocks.refreshAccount).toHaveBeenCalledWith("acc_1", true)
    })
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: { success: true, message: "ok" },
    })
  })

  it("refreshes account after successful auto redeem by url (inferred account)", async () => {
    mocks.getPreferences.mockResolvedValue(DEFAULT_PREFERENCES)
    mocks.refreshAccount.mockResolvedValue({ refreshed: true })
    mocks.redeemCodeForAccount.mockResolvedValue({
      success: true,
      message: "ok",
    })

    const displayAccount = {
      id: "acc_2",
      baseUrl: "https://example.com",
      checkIn: {
        customCheckIn: {
          url: "https://example.com/checkin",
        },
      },
    }

    mocks.getAllAccounts.mockResolvedValue([])
    mocks.convertToDisplayData.mockReturnValue([displayAccount])

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const sendResponse = vi.fn()

    await handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistAutoRedeemByUrl,
        url: "https://example.com/redeem",
        code: "CODE_2",
      },
      {} as any,
      sendResponse,
    )

    expect(mocks.redeemCodeForAccount).toHaveBeenCalledWith("acc_2", "CODE_2")
    await vi.waitFor(() => {
      expect(mocks.refreshAccount).toHaveBeenCalledWith("acc_2", true)
    })
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: {
        success: true,
        message: "ok",
        selectedAccount: displayAccount,
      },
    })
  })

  it("swallows refresh failures and still reports redemption success", async () => {
    mocks.refreshAccount.mockRejectedValue(new Error("refresh boom"))
    mocks.redeemCodeForAccount.mockResolvedValue({
      success: true,
      message: "ok",
    })

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const sendResponse = vi.fn()

    await handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistAutoRedeem,
        accountId: "acc_3",
        code: "CODE_3",
      },
      {} as any,
      sendResponse,
    )

    await vi.waitFor(() => {
      expect(mocks.refreshAccount).toHaveBeenCalledWith("acc_3", true)
    })
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: { success: true, message: "ok" },
    })
  })

  it("awaits refresh before responding", async () => {
    let markRefreshStarted: (() => void) | undefined
    const refreshStarted = new Promise<void>((resolve) => {
      markRefreshStarted = resolve
    })
    let resolveRefresh: ((value: { refreshed: true }) => void) | undefined
    mocks.refreshAccount.mockImplementation(
      () =>
        new Promise<{ refreshed: true }>((resolve) => {
          markRefreshStarted?.()
          resolveRefresh = resolve
        }),
    )
    mocks.redeemCodeForAccount.mockResolvedValue({
      success: true,
      message: "ok",
    })

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const sendResponse = vi.fn()

    const handlePromise = handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistAutoRedeem,
        accountId: "acc_await",
        code: "CODE_AWAIT",
      },
      {} as any,
      sendResponse,
    )

    await refreshStarted
    expect(mocks.refreshAccount).toHaveBeenCalledWith("acc_await", true)
    expect(sendResponse).not.toHaveBeenCalled()

    resolveRefresh?.({ refreshed: true })
    await handlePromise

    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: { success: true, message: "ok" },
    })
  })

  it("does not refresh when redemption fails", async () => {
    mocks.refreshAccount.mockResolvedValue({ refreshed: true })
    mocks.redeemCodeForAccount.mockResolvedValue({
      success: false,
      message: "nope",
    })

    const { handleRedemptionAssistMessage } =
      await import("~/services/redemption/redemptionAssist")

    const sendResponse = vi.fn()

    await handleRedemptionAssistMessage(
      {
        action: RuntimeActionIds.RedemptionAssistAutoRedeem,
        accountId: "acc_4",
        code: "CODE_4",
      },
      {} as any,
      sendResponse,
    )

    expect(mocks.refreshAccount).not.toHaveBeenCalled()
    expect(sendResponse).toHaveBeenCalledWith({
      success: true,
      data: { success: false, message: "nope" },
    })
  })
})
