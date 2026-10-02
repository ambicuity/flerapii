import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { POPUP_PAGE_PATH } from "~/constants/extensionPages"

const addActionClickListener = vi.fn()
const removeActionClickListener = vi.fn()
const setActionPopup = vi.fn().mockResolvedValue(undefined)
const getSidePanelSupport = vi.fn()
const openSidePanelWithFallback = vi.fn().mockResolvedValue(undefined)
const setPanelBehavior = vi.fn().mockResolvedValue(undefined)

vi.mock("~/utils/browser/browserApi", () => ({
  addActionClickListener,
  getSidePanelSupport,
  removeActionClickListener,
  setActionPopup,
}))

vi.mock("~/utils/navigation", () => ({
  openSidePanelWithFallback,
}))

describe("background applyActionClickBehavior", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setActionPopup.mockResolvedValue(undefined)
    openSidePanelWithFallback.mockResolvedValue(undefined)
    setPanelBehavior.mockResolvedValue(undefined)
    ;(globalThis as any).chrome = {
      sidePanel: {
        setPanelBehavior,
      },
    }
  })

  afterEach(() => {
    ;(globalThis as any).chrome = undefined
  })

  it("falls back to popup wiring when sidepanel is requested but unsupported", async () => {
    getSidePanelSupport.mockReturnValue({
      supported: false,
      kind: "unsupported",
      reason: "missing",
    })

    const { applyActionClickBehavior } =
      await import("~/entrypoints/background/actionClickBehavior")

    await applyActionClickBehavior("sidepanel")

    expect(removeActionClickListener).toHaveBeenCalledTimes(1)
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    })
    expect(setActionPopup).toHaveBeenCalledWith(POPUP_PAGE_PATH)
    expect(addActionClickListener).not.toHaveBeenCalled()
  })

  it("installs sidepanel wiring when side panel is supported", async () => {
    getSidePanelSupport.mockReturnValue({
      supported: true,
      kind: "chromium-side-panel",
    })

    const { applyActionClickBehavior } =
      await import("~/entrypoints/background/actionClickBehavior")

    await applyActionClickBehavior("sidepanel")

    expect(removeActionClickListener).toHaveBeenCalledTimes(1)
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    })
    expect(setActionPopup).toHaveBeenCalledWith("")
    expect(addActionClickListener).toHaveBeenCalledTimes(1)
  })

  it("installs sidepanel wiring when Firefox sidebarAction is supported", async () => {
    getSidePanelSupport.mockReturnValue({
      supported: true,
      kind: "firefox-sidebar-action",
    })

    const { applyActionClickBehavior } =
      await import("~/entrypoints/background/actionClickBehavior")

    await applyActionClickBehavior("sidepanel")

    expect(removeActionClickListener).toHaveBeenCalledTimes(1)
    expect(setPanelBehavior).toHaveBeenCalledWith({
      openPanelOnActionClick: false,
    })
    expect(setActionPopup).toHaveBeenCalledWith("")
    expect(addActionClickListener).toHaveBeenCalledTimes(1)
  })

  it("routes action clicks through the shared side-panel fallback helper", async () => {
    getSidePanelSupport.mockReturnValue({
      supported: true,
      kind: "chromium-side-panel",
    })

    const { applyActionClickBehavior } =
      await import("~/entrypoints/background/actionClickBehavior")

    await applyActionClickBehavior("sidepanel")

    const clickHandler = addActionClickListener.mock.calls[0]?.[0]
    expect(typeof clickHandler).toBe("function")

    await clickHandler?.()

    expect(openSidePanelWithFallback).toHaveBeenCalledTimes(1)
  })

  it("registers the side-panel click handler synchronously for early startup", async () => {
    getSidePanelSupport.mockReturnValue({
      supported: true,
      kind: "chromium-side-panel",
    })

    const { applyActionClickBehavior, registerActionClickListenerEarly } =
      await import("~/entrypoints/background/actionClickBehavior")

    registerActionClickListenerEarly()

    expect(addActionClickListener).toHaveBeenCalledTimes(1)
    const earlyHandler = addActionClickListener.mock.calls[0]?.[0]

    await earlyHandler?.()
    expect(openSidePanelWithFallback).toHaveBeenCalledTimes(1)

    // The later preference-driven wiring must reuse the same handler so it can
    // remove/dedupe the early registration.
    await applyActionClickBehavior("sidepanel")
    expect(addActionClickListener.mock.calls[1]?.[0]).toBe(earlyHandler)
    expect(removeActionClickListener.mock.calls[0]?.[0]).toBe(earlyHandler)
  })

  it("does not throw when the action API is unavailable during early registration", async () => {
    addActionClickListener.mockImplementationOnce(() => {
      throw new Error("Action API is not available in this environment")
    })

    const { registerActionClickListenerEarly } =
      await import("~/entrypoints/background/actionClickBehavior")

    expect(() => registerActionClickListenerEarly()).not.toThrow()
  })
})
