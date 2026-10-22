import {
  COOKIE_AUTH_HEADER_NAME,
  EXTENSION_HEADER_NAME,
} from "~/utils/browser/cookieHelper"
import { createLogger } from "~/utils/core/logger"

/**
 * Unified logger scoped to DNR cookie header injection helpers.
 */
const logger = createLogger("DnrCookieInjector")

/**
 * DeclarativeNetRequest session-rule helpers.
 *
 * Chromium-based browsers can modify request headers using declarativeNetRequest.
 * We use a short-lived, per-tab session rule during temp-window fetch so that:
 * - token-auth requests can carry WAF-bypass cookies without leaking session cookies
 * - requests are isolated to the temp window tab (fixes multi-account confusion)
 */

export const TEMP_WINDOW_DNR_RULE_ID_BASE = 1_000_000 as const

/**
 * Size of the per-install rule-id sequence.
 *
 * Rule ids must be unique among the currently installed session rules, so ids
 * are allocated from a monotonic counter instead of being derived from the tab.
 */
const TEMP_WINDOW_DNR_RULE_ID_SEQUENCE_RANGE = 1_000_000

let ruleIdSequence = 0

/**
 * Allocate a rule id that is unique among all currently installed rules.
 *
 * Deriving the id from the tab alone would make it a single mutable slot
 * shared by every in-flight request that uses that tab: concurrent requests
 * would overwrite each other's Cookie override, and the first request to finish
 * would delete the rule while the others are still running.
 */
function allocateRuleId(): number {
  ruleIdSequence = (ruleIdSequence + 1) % TEMP_WINDOW_DNR_RULE_ID_SEQUENCE_RANGE
  return TEMP_WINDOW_DNR_RULE_ID_BASE + ruleIdSequence
}

export interface TempWindowCookieRuleParams {
  tabId: number
  url: string
  cookieHeader: string
  /**
   * Unique id of the rule being installed.
   *
   * Callers must not derive this from the tab id; use
   * {@link applyTempWindowCookieRule} so the id is allocated uniquely.
   */
  ruleId: number
}

/**
 * Checks whether the declarativeNetRequest session rules API is available.
 */
function hasDnrApi(): boolean {
  try {
    return Boolean(
      (globalThis as any).chrome?.declarativeNetRequest?.updateSessionRules,
    )
  } catch {
    return false
  }
}

/**
 * Build a session-scoped DNR rule that forces the Cookie header for a specific
 * tab and URL.
 */
export function buildTempWindowCookieRule(params: TempWindowCookieRuleParams) {
  const ruleId = params.ruleId

  return {
    id: ruleId,
    priority: 1,
    action: {
      type: "modifyHeaders",
      requestHeaders: [
        { header: EXTENSION_HEADER_NAME, operation: "remove" },
        { header: COOKIE_AUTH_HEADER_NAME, operation: "remove" },
        { header: "Cookie", operation: "set", value: params.cookieHeader },
      ],
    },
    condition: {
      tabIds: [params.tabId],
      urlFilter: `||${new URL(params.url).hostname}/`,
      isUrlFilterCaseSensitive: true,
      resourceTypes: ["xmlhttprequest"],
    },
  } as const
}

/**
 * Installs a temp-window Cookie override rule for the given tab.
 *
 * Each installation receives its own rule id, so concurrent requests that share
 * a tab cannot overwrite or delete each other's override. The returned id must
 * be handed to {@link removeTempWindowCookieRule} once the request completes.
 * @returns The installed ruleId, or null when rule install is not possible.
 */
export async function applyTempWindowCookieRule(
  params: Omit<TempWindowCookieRuleParams, "ruleId">,
): Promise<number | null> {
  if (!params.cookieHeader) {
    return null
  }

  if (!hasDnrApi()) {
    return null
  }

  const ruleId = allocateRuleId()

  try {
    const rule = buildTempWindowCookieRule({ ...params, ruleId })
    await (globalThis as any).chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
      addRules: [rule],
    })
    return ruleId
  } catch (error) {
    logger.warn("Failed to install temp-window cookie rule", error)
    return null
  }
}

/**
 * Best-effort removal of a previously installed temp-window cookie rule.
 */
export async function removeTempWindowCookieRule(
  ruleId: number,
): Promise<void> {
  if (!hasDnrApi()) {
    return
  }

  try {
    await (globalThis as any).chrome.declarativeNetRequest.updateSessionRules({
      removeRuleIds: [ruleId],
    })
  } catch (error) {
    logger.warn("Failed to remove temp-window cookie rule", error)
  }
}
