import { describe, expect, it, vi } from "vitest"

const showShieldBypassPromptToast = vi.fn()

vi.mock(
  "~/entrypoints/content/shieldBypassAssist/utils/shieldBypassToasts",
  () => ({
    showShieldBypassPromptToast: () => showShieldBypassPromptToast(),
  }),
)

const { RuntimeActionIds } = await import("~/constants/runtimeActions")
const { handleShowShieldBypassUi } =
  await import("~/entrypoints/content/messageHandlers/handlers/shieldBypassUi")

/**
 * Regression guard for the async-response contract on Chrome.
 *
 * The handler used to be an `async function`, so it returned a Promise instead
 * of the literal `true`. On Chrome (raw `chrome.*` API, no polyfill) returning
 * a Promise does not keep the message port open, so the deferred `sendResponse`
 * was dropped ("message port closed before a response was received"). The
 * handler must return the literal boolean `true` synchronously.
 */
describe("handleShowShieldBypassUi", () => {
  it("returns the literal boolean true synchronously", () => {
    showShieldBypassPromptToast.mockResolvedValueOnce(undefined)
    const sendResponse = vi.fn()

    const result = handleShowShieldBypassUi(
      { action: RuntimeActionIds.ContentShowShieldBypassUi },
      sendResponse,
    )

    expect(result).toBe(true)
    expect(result).not.toBeInstanceOf(Promise)
  })

  it("delivers a success response after the toast resolves", async () => {
    showShieldBypassPromptToast.mockResolvedValueOnce(undefined)
    const sendResponse = vi.fn()

    handleShowShieldBypassUi(
      { action: RuntimeActionIds.ContentShowShieldBypassUi },
      sendResponse,
    )

    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({ success: true }),
    )
  })

  it("reports the error when the toast rejects", async () => {
    showShieldBypassPromptToast.mockRejectedValueOnce(new Error("boom"))
    const sendResponse = vi.fn()

    handleShowShieldBypassUi(
      { action: RuntimeActionIds.ContentShowShieldBypassUi },
      sendResponse,
    )

    await vi.waitFor(() =>
      expect(sendResponse).toHaveBeenCalledWith({
        success: false,
        error: "boom",
      }),
    )
  })
})
