import { RuntimeActionIds } from "~/constants/runtimeActions"
import { showShieldBypassPromptToast } from "~/entrypoints/content/shieldBypassAssist/utils/shieldBypassToasts"

type ShieldBypassUiMessage = {
  action: typeof RuntimeActionIds.ContentShowShieldBypassUi
  origin?: string
  requestId?: string
}

/**
 * Shows a small on-page prompt indicating this is the shield/protection bypass flow.
 * This is used for temporary tabs/windows opened by the background to pass
 * Cloudflare-like protection pages and obtain cookies/session.
 *
 * IMPORTANT: this must be a synchronous handler that returns the literal `true`
 * so the message port stays open until the deferred `sendResponse` fires. On
 * Chrome the extension uses the raw `chrome.*` API (no webextension-polyfill),
 * where returning a Promise does NOT keep the channel open, so an async handler
 * would have its response dropped ("message port closed before a response was
 * received"). The async work is fired via an inner IIFE, mirroring the other
 * content-script handlers (see waitUserInfo.ts).
 */
export function handleShowShieldBypassUi(
  _request: ShieldBypassUiMessage,
  sendResponse: (res: any) => void,
): boolean {
  void (async () => {
    try {
      await showShieldBypassPromptToast()
      sendResponse({ success: true })
    } catch (error) {
      sendResponse({ success: false, error: (error as Error)?.message })
    }
  })()

  return true
}
