import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"
import Header from "~/entrypoints/options/components/Header"
import Sidebar from "~/entrypoints/options/components/Sidebar"
import { render, screen, within } from "~~/tests/test-utils/render"

const { updateThemeModeMock, hasValidManagedSiteConfigMock, preferencesState } =
  vi.hoisted(() => ({
    updateThemeModeMock: vi.fn().mockResolvedValue(true),
    hasValidManagedSiteConfigMock: vi.fn().mockReturnValue(false),
    preferencesState: {
      autoCheckin: {
        globalEnabled: false,
      },
    },
  }))

vi.mock("~/assets/icon.png", () => ({
  default: "icon.png",
}))

vi.mock("~/contexts/UserPreferencesContext", () => ({
  UserPreferencesProvider: ({ children }: { children: ReactNode }) => (
    <>{children}</>
  ),
  useUserPreferencesContext: () => ({
    preferences: preferencesState,
    themeMode: "system",
    updateThemeMode: updateThemeModeMock,
    isLoading: false,
  }),
}))

vi.mock("~/services/managedSites/managedSiteService", () => ({
  hasValidManagedSiteConfig: hasValidManagedSiteConfigMock,
}))

describe("options shell", () => {
  beforeEach(() => {
    updateThemeModeMock.mockClear()
    hasValidManagedSiteConfigMock.mockReturnValue(false)
  })

  it("renders the quick theme control alongside the command palette trigger without a collapse control in the header", () => {
    render(
      <Header
        onTitleClick={vi.fn()}
        onMenuToggle={vi.fn()}
        onOpenCommandPalette={vi.fn()}
      />,
    )

    expect(screen.getByTestId("options-quick-theme-toggle")).toBeInTheDocument()
    expect(
      screen.getAllByTestId("options-command-palette-trigger")[0],
    ).toBeInTheDocument()
    expect(
      screen.queryByTestId("options-collapse-toggle"),
    ).not.toBeInTheDocument()
  })

  it("renders only visible sidebar groups, highlights the active entry, and owns the collapse control", () => {
    render(
      <Sidebar
        activeMenuItem={MENU_ITEM_IDS.KEYS}
        onMenuItemClick={vi.fn()}
        isCollapsed={false}
        onCollapseToggle={vi.fn()}
      />,
    )

    expect(screen.getByTestId("options-sidebar-desktop")).toBeInTheDocument()
    expect(screen.getByTestId("options-collapse-toggle")).toBeInTheDocument()
    expect(screen.getByTestId("options-sidebar-scroll")).toBeInTheDocument()

    const desktopSidebar = screen.getByTestId("options-sidebar-desktop")
    const groups = within(desktopSidebar).getAllByTestId(
      "options-sidebar-group",
    )
    expect(groups.length).toBeGreaterThan(0)
    groups.forEach((group) => {
      expect(group.querySelectorAll("button").length).toBeGreaterThan(0)
    })

    expect(
      screen.queryByText("ui:navigation.autoCheckin"),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText("ui:navigation.managedSiteChannels"),
    ).not.toBeInTheDocument()
    expect(
      within(desktopSidebar).getAllByText("ui:navigation.settings"),
    ).toHaveLength(1)
    expect(
      within(desktopSidebar).getByTestId("options-sidebar-current-label"),
    ).toHaveTextContent("ui:navigation.keys")

    expect(
      screen.getByRole("button", { name: "ui:navigation.keys" }),
    ).toHaveAttribute("data-active", "true")
  })
})
