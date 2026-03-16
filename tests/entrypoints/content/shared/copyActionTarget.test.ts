import { describe, expect, it } from "vitest"

import { isLikelyCopyActionTarget } from "~/entrypoints/content/shared/copyActionTarget"

describe("isLikelyCopyActionTarget", () => {
  it("matches explicit copy controls by text", () => {
    const button = document.createElement("button")
    button.textContent = "Copy"

    expect(isLikelyCopyActionTarget(button)).toBe(true)
  })

  it("matches localized copy controls", () => {
    const button = document.createElement("button")
    button.setAttribute("aria-label", "复制 API Key")

    expect(isLikelyCopyActionTarget(button)).toBe(true)
  })

  it("does not match generic interactive controls", () => {
    const button = document.createElement("button")
    button.textContent = "Search"

    expect(isLikelyCopyActionTarget(button)).toBe(false)
  })
})
