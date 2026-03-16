import { useEffect, useRef, useState, type CSSProperties } from "react"

import { AppLayout } from "~/components/AppLayout"
import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"
import type { SettingsTabId } from "~/features/BasicSettings/tabMetadata"
import { useMediaQuery } from "~/hooks/useMediaQuery"

import Header from "./components/Header"
import OptionsCommandPalette from "./components/OptionsCommandPalette"
import Sidebar from "./components/Sidebar"
import { menuItems } from "./constants"
import { useHashNavigation } from "./hooks/useHashNavigation"
import BasicSettings from "./pages/BasicSettings"

/**
 * Main Options page shell: renders header, sidebar, routed content, and the command palette.
 */
function OptionsPage() {
  const { activeMenuItem, routeParams, handleMenuItemChange, refreshKey } =
    useHashNavigation()
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false)
  const usesDesktopSidebar = useMediaQuery("(min-width: 1024px)")
  const mainScrollRef = useRef<HTMLDivElement>(null)

  const ActiveComponent =
    menuItems.find((item) => item.id === activeMenuItem)?.component ||
    BasicSettings

  const handleTitleClick = () => {
    handleMenuItemChange(MENU_ITEM_IDS.BASIC)
  }

  const handleMenuItemClick = (itemId: string) => {
    handleMenuItemChange(itemId)
    setIsMobileSidebarOpen(false)
  }

  const handleSettingsTabSelect = (tabId: SettingsTabId) => {
    handleMenuItemChange(MENU_ITEM_IDS.BASIC, { tab: tabId })
  }

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!(event.metaKey || event.ctrlKey)) return
      if (event.key.toLowerCase() !== "k") return

      event.preventDefault()
      setIsCommandPaletteOpen((prev) => !prev)
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  useEffect(() => {
    if (isCommandPaletteOpen) {
      setIsMobileSidebarOpen(false)
    }
  }, [isCommandPaletteOpen])

  useEffect(() => {
    if (usesDesktopSidebar) {
      setIsMobileSidebarOpen(false)
    }
  }, [usesDesktopSidebar])

  useEffect(() => {
    mainScrollRef.current?.scrollTo({ top: 0, behavior: "auto" })
  }, [activeMenuItem, refreshKey, routeParams.tab])

  const shellStyle = {
    "--options-sidebar-current-width": isSidebarCollapsed
      ? "var(--options-sidebar-collapsed-width)"
      : "var(--options-sidebar-width)",
  } as CSSProperties

  return (
    <div
      className="ambient-page min-h-screen lg:h-screen lg:overflow-hidden"
      style={shellStyle}
    >
      <div className="mx-auto flex min-h-screen w-full max-w-screen-2xl flex-col px-[var(--options-shell-gutter)] lg:h-screen">
        <Header
          onTitleClick={handleTitleClick}
          onMenuToggle={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          isMobileSidebarOpen={isMobileSidebarOpen}
          onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        />

        <div className="min-h-0 flex-1 pb-[var(--options-shell-gutter)]">
          <div className="lg:grid lg:h-full lg:min-h-0 lg:grid-cols-[var(--options-sidebar-current-width)_minmax(0,1fr)] lg:items-stretch lg:gap-[var(--options-shell-gap)]">
            <Sidebar
              activeMenuItem={activeMenuItem}
              onMenuItemClick={handleMenuItemClick}
              isMobileOpen={isMobileSidebarOpen}
              onMobileClose={() => setIsMobileSidebarOpen(false)}
              isCollapsed={isSidebarCollapsed}
              onCollapseToggle={() => setIsSidebarCollapsed((prev) => !prev)}
            />

            <main
              className="min-w-0 lg:min-h-0"
              data-testid="options-main-content"
            >
              <div className="elevated-surface min-h-[calc(100vh-var(--options-shell-top-offset)-var(--options-shell-gutter))] overflow-hidden rounded-[2rem] border border-white/45 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.45)] lg:flex lg:h-full lg:min-h-0 lg:flex-col dark:border-white/8 dark:shadow-[0_38px_90px_-54px_rgba(2,6,23,0.92)]">
                <div
                  ref={mainScrollRef}
                  className="min-h-0 flex-1 overflow-x-hidden overflow-y-visible lg:overflow-y-auto lg:overscroll-contain"
                  data-testid="options-main-scroll"
                >
                  <ActiveComponent
                    routeParams={routeParams}
                    refreshKey={refreshKey}
                  />
                </div>
              </div>
            </main>
          </div>
        </div>

        <OptionsCommandPalette
          open={isCommandPaletteOpen}
          onOpenChange={setIsCommandPaletteOpen}
          activeMenuItem={activeMenuItem}
          activeSettingsTab={routeParams.tab}
          onMenuSelect={handleMenuItemChange}
          onSettingsTabSelect={handleSettingsTabSelect}
        />
      </div>
    </div>
  )
}

/**
 * Wraps OptionsPage with shared AppLayout (theme/providers).
 */
function App() {
  return (
    <AppLayout>
      <OptionsPage />
    </AppLayout>
  )
}

export default App
