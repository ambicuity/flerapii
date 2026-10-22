import { afterAll, beforeEach, describe, expect, it, vi } from "vitest"

import { removeTabOrWindow } from "~/utils/browser/browserApi"

const originalBrowser = (globalThis as any).browser

describe("removeTabOrWindow", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  afterAll(() => {
    ;(globalThis as any).browser = originalBrowser
  })

  it("removes a tab without touching the windows API when the id is a tab id", async () => {
    const tabsRemove = vi.fn().mockResolvedValue(undefined)
    const windowsRemove = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).browser = {
      tabs: { remove: tabsRemove },
      windows: { remove: windowsRemove },
    }

    await removeTabOrWindow(42, "tab")

    expect(tabsRemove).toHaveBeenCalledWith(42)
    // A tab id must never be probed against the windows API: Chrome allocates
    // window ids and tab ids from separate counters, so `windows.remove(tabId)`
    // can succeed by closing an unrelated user window.
    expect(windowsRemove).not.toHaveBeenCalled()
  })

  it("removes a window through the windows API when the id is a window id", async () => {
    const tabsRemove = vi.fn().mockResolvedValue(undefined)
    const windowsRemove = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).browser = {
      tabs: { remove: tabsRemove },
      windows: { remove: windowsRemove },
    }

    await removeTabOrWindow(7, "window")

    expect(windowsRemove).toHaveBeenCalledWith(7)
    expect(tabsRemove).not.toHaveBeenCalled()
  })

  it("falls back to tabs.remove for windows when the windows API is unavailable", async () => {
    const tabsRemove = vi.fn().mockResolvedValue(undefined)

    ;(globalThis as any).browser = {
      tabs: { remove: tabsRemove },
    }

    await removeTabOrWindow(9, "window")

    expect(tabsRemove).toHaveBeenCalledWith(9)
  })

  it("surfaces window removal failures instead of silently removing a tab with the same id", async () => {
    const tabsRemove = vi.fn().mockResolvedValue(undefined)
    const windowsRemove = vi.fn().mockRejectedValue(new Error("No window with id"))

    ;(globalThis as any).browser = {
      tabs: { remove: tabsRemove },
      windows: { remove: windowsRemove },
    }

    await expect(removeTabOrWindow(3, "window")).rejects.toThrow(
      "No window with id",
    )
    expect(tabsRemove).not.toHaveBeenCalled()
  })
})
