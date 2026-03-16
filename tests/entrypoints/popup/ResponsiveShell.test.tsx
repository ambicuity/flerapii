import { forwardRef, type ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { render, screen } from "~~/tests/test-utils/render"

const { isExtensionSidePanelMock, openAddBookmarkMock, useMediaQueryMock } =
  vi.hoisted(() => ({
    isExtensionSidePanelMock: vi.fn(() => false),
    openAddBookmarkMock: vi.fn(),
    useMediaQueryMock: vi.fn((_query: string) => false),
  }))

vi.mock("~/assets/icon.png", () => ({
  default: "icon.png",
}))

vi.mock("~/components/AppLayout", () => ({
  AppLayout: ({ children }: { children: ReactNode }) => <>{children}</>,
}))

vi.mock("~/features/AccountManagement/hooks/AccountManagementProvider", () => ({
  AccountManagementProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
}))

vi.mock("~/hooks/useAddAccountHandler", () => ({
  useAddAccountHandler: () => ({
    handleAddAccountClick: vi.fn(),
  }),
}))

vi.mock("~/hooks/useMediaQuery", () => ({
  useMediaQuery: useMediaQueryMock,
}))

vi.mock("~/features/SiteBookmarks/hooks/BookmarkDialogStateContext", () => ({
  useBookmarkDialogContext: () => ({
    openAddBookmark: openAddBookmarkMock,
  }),
}))

vi.mock("~/utils/browser", () => ({
  isExtensionSidePanel: isExtensionSidePanelMock,
  isMobileDevice: () => {
    throw new Error("popup App should not rely on isMobileDevice")
  },
}))

vi.mock("~/utils/navigation", () => ({
  openApiCredentialProfilesPage: vi.fn(),
  openFullAccountManagerPage: vi.fn(),
  openFullBookmarkManagerPage: vi.fn(),
  openSettingsPage: vi.fn(),
}))

vi.mock("~/entrypoints/popup/components/HeaderSection", () => ({
  default: () => <div>HeaderSection</div>,
}))

vi.mock("~/entrypoints/popup/components/BalanceSection", () => ({
  default: () => <div>BalanceSection</div>,
}))

vi.mock("~/entrypoints/popup/components/ShareOverviewSnapshotButton", () => ({
  default: () => (
    <button aria-label="Share overview snapshot">
      Share overview snapshot
    </button>
  ),
}))

vi.mock("~/entrypoints/popup/components/BookmarkStatsSection", () => ({
  default: () => <div>BookmarkStatsSection</div>,
}))

vi.mock(
  "~/entrypoints/popup/components/ApiCredentialProfilesStatsSection",
  () => ({
    default: () => <div>ApiCredentialProfilesStatsSection</div>,
  }),
)

vi.mock("~/entrypoints/popup/components/ActionButtons", () => ({
  default: () => <div>ActionButtons</div>,
}))

vi.mock("~/features/AccountManagement/components/AccountList", () => ({
  default: () => <div>AccountList</div>,
}))

vi.mock("~/features/SiteBookmarks/components/BookmarksList", () => ({
  default: () => <div>BookmarksList</div>,
}))

vi.mock(
  "~/features/ApiCredentialProfiles/components/ApiCredentialProfilesPopupView",
  () => ({
    default: forwardRef(() => <div>ApiCredentialProfilesPopupView</div>),
  }),
)

describe("popup responsive shell", () => {
  beforeEach(() => {
    isExtensionSidePanelMock.mockReturnValue(false)
    useMediaQueryMock.mockImplementation((_query: string) => false)
  })

  it("uses the popup surface layout without calling isMobileDevice", async () => {
    const { default: App } = await import("~/entrypoints/popup/App")

    render(<App />)

    const shell = await screen.findByTestId("popup-shell")
    expect(shell).toHaveAttribute("data-surface", "popup")
    expect(shell.className).toContain("max-w-[410px]")
    expect(screen.getByTestId("popup-top-rail")).toHaveAttribute(
      "data-stacked",
      "false",
    )
    expect(
      screen.getByRole("button", { name: "Share overview snapshot" }),
    ).toBeInTheDocument()
    expect(screen.getAllByRole("tab")).toHaveLength(3)
  })

  it("stacks the companion action under the tabs on narrow surfaces", async () => {
    useMediaQueryMock.mockImplementation(
      (query: string) => query === "(max-width: 380px)",
    )
    const { default: App } = await import("~/entrypoints/popup/App")

    render(<App />)

    expect(await screen.findByTestId("popup-top-rail")).toHaveAttribute(
      "data-stacked",
      "true",
    )
    expect(screen.getByTestId("popup-top-rail-action")).toBeInTheDocument()
    expect(screen.getAllByRole("tab")).toHaveLength(3)
  })

  it("switches to the full-width sidepanel surface when embedded in the sidepanel", async () => {
    isExtensionSidePanelMock.mockReturnValue(true)
    const { default: App } = await import("~/entrypoints/popup/App")

    render(<App />)

    const shell = await screen.findByTestId("popup-shell")
    expect(shell).toHaveAttribute("data-surface", "sidepanel")
    expect(shell.className).toContain("min-h-full")
    expect(shell.className).not.toContain("max-w-[410px]")
  })

  it("shows a rescue state instead of a clipped dashboard when the sidepanel is too narrow", async () => {
    isExtensionSidePanelMock.mockReturnValue(true)
    useMediaQueryMock.mockImplementation(
      (query: string) => query === "(max-width: 320px)",
    )
    const { default: App } = await import("~/entrypoints/popup/App")

    render(<App />)

    expect(await screen.findByTestId("sidepanel-narrow-state")).toHaveAttribute(
      "data-compact",
      "message",
    )
    expect(screen.queryByTestId("popup-shell")).not.toBeInTheDocument()
    expect(screen.getByTestId("sidepanel-narrow-open-full")).toBeInTheDocument()
    expect(
      screen.getByTestId("sidepanel-narrow-open-settings"),
    ).toBeInTheDocument()
  })
})
