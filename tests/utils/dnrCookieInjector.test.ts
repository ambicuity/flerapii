import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import {
  applyTempWindowCookieRule,
  buildTempWindowCookieRule,
  removeTempWindowCookieRule,
  TEMP_WINDOW_DNR_RULE_ID_BASE,
} from "~/utils/browser/dnrCookieInjector"

describe("dnrCookieInjector", () => {
  let originalChrome: unknown

  beforeEach(() => {
    originalChrome = (globalThis as any).chrome
    vi.restoreAllMocks()
  })

  afterEach(() => {
    ;(globalThis as any).chrome = originalChrome
  })

  it("buildTempWindowCookieRule should create a rule with the given id and cookie header override", () => {
    const rule = buildTempWindowCookieRule({
      tabId: 123,
      url: "https://example.com/api/user/self",
      cookieHeader: "cf_clearance=abc; __cf_bm=def",
      ruleId: TEMP_WINDOW_DNR_RULE_ID_BASE + 1,
    })

    expect(rule.id).toBe(TEMP_WINDOW_DNR_RULE_ID_BASE + 1)
    expect(rule.action.type).toBe("modifyHeaders")

    const cookieOp = rule.action.requestHeaders?.find(
      (h) => h.header.toLowerCase() === "cookie",
    )
    expect(cookieOp).toBeTruthy()
    expect(cookieOp?.operation).toBe("set")
    if (cookieOp && cookieOp.operation === "set" && "value" in cookieOp) {
      expect(cookieOp.value).toContain("cf_clearance")
    }

    expect(rule.condition.tabIds).toEqual([123])
    expect(rule.condition.urlFilter).toBe("||example.com/")
  })

  it("applyTempWindowCookieRule should call updateSessionRules with remove+add", async () => {
    const updateSessionRules = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).chrome = {
      declarativeNetRequest: { updateSessionRules },
    }

    const ruleId = await applyTempWindowCookieRule({
      tabId: 5,
      url: "https://example.com/api",
      cookieHeader: "cf_clearance=abc",
    })

    expect(ruleId).not.toBeNull()
    expect(updateSessionRules).toHaveBeenCalledTimes(1)

    const call = updateSessionRules.mock.calls[0]?.[0]
    expect(call.removeRuleIds).toEqual([ruleId])
    expect(call.addRules?.[0]?.id).toBe(ruleId)
  })

  it("should allocate a unique rule id per installation so concurrent requests cannot clobber each other", async () => {
    const updateSessionRules = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).chrome = {
      declarativeNetRequest: { updateSessionRules },
    }

    // Both requests target the same tab (same origin, pooled temp context).
    const firstRuleId = await applyTempWindowCookieRule({
      tabId: 5,
      url: "https://example.com/api",
      cookieHeader: "cf_clearance=first; session=account-one",
    })
    const secondRuleId = await applyTempWindowCookieRule({
      tabId: 5,
      url: "https://example.com/api",
      cookieHeader: "cf_clearance=second; session=account-two",
    })

    expect(firstRuleId).not.toBeNull()
    expect(secondRuleId).not.toBeNull()
    expect(secondRuleId).not.toBe(firstRuleId)

    // Each install must target only its own rule id, so neither install
    // removes the other's override.
    const firstCall = updateSessionRules.mock.calls[0]?.[0]
    const secondCall = updateSessionRules.mock.calls[1]?.[0]
    expect(firstCall.removeRuleIds).toEqual([firstRuleId])
    expect(firstCall.addRules?.[0]?.id).toBe(firstRuleId)
    expect(secondCall.removeRuleIds).toEqual([secondRuleId])
    expect(secondCall.addRules?.[0]?.id).toBe(secondRuleId)
  })

  it("should not install a rule when the target url is malformed", async () => {
    const updateSessionRules = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).chrome = {
      declarativeNetRequest: { updateSessionRules },
    }

    const ruleId = await applyTempWindowCookieRule({
      tabId: 5,
      url: "not-a-url",
      cookieHeader: "cf_clearance=abc",
    })

    expect(ruleId).toBeNull()
    expect(updateSessionRules).not.toHaveBeenCalled()
  })

  it("removeTempWindowCookieRule should call updateSessionRules with remove only", async () => {
    const updateSessionRules = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).chrome = {
      declarativeNetRequest: { updateSessionRules },
    }

    await removeTempWindowCookieRule(42)

    expect(updateSessionRules).toHaveBeenCalledTimes(1)
    expect(updateSessionRules).toHaveBeenCalledWith({ removeRuleIds: [42] })
  })
})
