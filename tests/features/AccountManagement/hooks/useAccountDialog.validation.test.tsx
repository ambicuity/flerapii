import { waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { DIALOG_MODES } from "~/constants/dialogModes"
import { useAccountDialog } from "~/features/AccountManagement/components/AccountDialog/hooks/useAccountDialog"
import { accountStorage } from "~/services/accounts/accountStorage"
import { act, renderHook } from "~~/tests/test-utils/render"

const {
  loggerWarnMock,
  mockOpenWithAccount,
  toastErrorMock,
  toastLoadingMock,
  toastSuccessMock,
} = vi.hoisted(() => ({
  loggerWarnMock: vi.fn(),
  mockOpenWithAccount: vi.fn(),
  toastErrorMock: vi.fn(),
  toastLoadingMock: vi.fn(),
  toastSuccessMock: vi.fn(),
}))

vi.mock("react-hot-toast", () => ({
  default: {
    success: toastSuccessMock,
    error: toastErrorMock,
    loading: toastLoadingMock,
  },
}))

vi.mock("~/components/dialogs/ChannelDialog", () => ({
  ChannelDialogProvider: ({ children }: { children: ReactNode }) => children,
  useChannelDialog: () => ({ openWithAccount: mockOpenWithAccount }),
}))

vi.mock("~/utils/core/logger", async (importOriginal) => {
  const actual = await importOriginal<typeof import("~/utils/core/logger")>()

  return {
    ...actual,
    createLogger: vi.fn(() => ({
      debug: vi.fn(),
      info: vi.fn(),
      warn: loggerWarnMock,
      error: vi.fn(),
    })),
  }
})

vi.mock("~/utils/browser/browserApi", async (importOriginal) => {
  const actual =
    await importOriginal<typeof import("~/utils/browser/browserApi")>()
  return {
    ...actual,
    getActiveTabs: vi.fn(async () => []),
    getAllTabs: vi.fn(async () => []),
    onTabActivated: vi.fn(() => () => {}),
    onTabUpdated: vi.fn(() => () => {}),
    sendRuntimeMessage: vi.fn(),
  }
})

describe("useAccountDialog validation handling", () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await accountStorage.clearAllData()
  })

  it("does not warn while the user is still typing a partial URL", async () => {
    const { result } = renderHook(() =>
      useAccountDialog({
        mode: DIALOG_MODES.ADD,
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.state).toBeTruthy()
    })

    loggerWarnMock.mockClear()

    await act(async () => {
      result.current.handlers.handleUrlChange("https://")
    })

    expect(result.current.state.url).toBe("https://")
    expect(loggerWarnMock).not.toHaveBeenCalled()
  })

  it("returns null instead of throwing when account info is incomplete", async () => {
    const { result } = renderHook(() =>
      useAccountDialog({
        mode: DIALOG_MODES.ADD,
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
      }),
    )

    await waitFor(() => {
      expect(result.current.state).toBeTruthy()
    })

    let saveResult: Awaited<
      ReturnType<typeof result.current.handlers.handleSaveAccount>
    >

    await act(async () => {
      saveResult = await result.current.handlers.handleSaveAccount()
    })

    expect(saveResult!).toBeNull()
    expect(toastErrorMock).toHaveBeenCalledWith(
      expect.stringContaining("incompleteAccountInfo"),
    )
    await expect(accountStorage.getAllAccounts()).resolves.toHaveLength(0)
  })
})
