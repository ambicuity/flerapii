import { afterEach, describe, expect, it } from "vitest"

import { detectCloudflareChallengePage } from "~/entrypoints/content/messageHandlers/utils/cloudflareGuard"

describe("detectCloudflareChallengePage", () => {
  afterEach(() => {
    document.title = ""
    document.body.innerHTML = ""
  })

  it("does not treat an ordinary page title as an interstitial title", () => {
    document.title = "Dashboard"

    const result = detectCloudflareChallengePage()

    expect(result.reasons).not.toContain("title")
    expect(result.isChallenge).toBe(false)
  })

  it.each(["Just a moment...", "请稍候…"])(
    "recognises the interstitial title %s",
    (title) => {
      document.title = title

      const result = detectCloudflareChallengePage()

      expect(result.reasons).toContain("title")
    },
  )
})
