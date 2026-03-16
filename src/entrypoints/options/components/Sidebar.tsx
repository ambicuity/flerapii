import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { useEffect } from "react"
import { useTranslation } from "react-i18next"

import { IconButton } from "~/components/ui"
import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"
import { useUserPreferencesContext } from "~/contexts/UserPreferencesContext"
import { cn } from "~/lib/utils"
import { hasValidManagedSiteConfig } from "~/services/managedSites/managedSiteService"

import { menuItems } from "../constants"

interface SidebarProps {
  activeMenuItem: string
  onMenuItemClick: (itemId: string) => void
  isMobileOpen?: boolean
  onMobileClose?: () => void
  isCollapsed?: boolean
  onCollapseToggle?: () => void
}

const SIDEBAR_MENU_GROUPS = [
  {
    key: "workspace",
    itemIds: [
      MENU_ITEM_IDS.BASIC,
      MENU_ITEM_IDS.ACCOUNT,
      MENU_ITEM_IDS.BOOKMARK,
      MENU_ITEM_IDS.AUTO_CHECKIN,
    ],
  },
  {
    key: "resources",
    itemIds: [
      MENU_ITEM_IDS.MODELS,
      MENU_ITEM_IDS.KEYS,
      MENU_ITEM_IDS.API_CREDENTIAL_PROFILES,
    ],
  },
  {
    key: "insights",
    itemIds: [MENU_ITEM_IDS.BALANCE_HISTORY, MENU_ITEM_IDS.USAGE_ANALYTICS],
  },
  {
    key: "tools",
    itemIds: [
      MENU_ITEM_IDS.MANAGED_SITE_CHANNELS,
      MENU_ITEM_IDS.MANAGED_SITE_MODEL_SYNC,
      MENU_ITEM_IDS.IMPORT_EXPORT,
      MENU_ITEM_IDS.ABOUT,
    ],
  },
] as const

/**
 * Animated sidebar for the Options page, supporting collapse and mobile overlay.
 * Handles menu rendering, accessibility labels, and user preference filters.
 * @param props Component props container.
 * @param props.activeMenuItem Currently selected menu id.
 * @param props.onMenuItemClick Callback fired when user picks another menu item.
 * @param props.isMobileOpen Whether the drawer is visible on mobile screens.
 * @param props.onMobileClose Close handler for the mobile drawer mask.
 * @param props.isCollapsed Whether the sidebar is collapsed on desktop.
 * @param props.onCollapseToggle Collapse toggle rendered inside the sidebar chrome.
 */
function Sidebar({
  activeMenuItem,
  onMenuItemClick,
  isMobileOpen,
  onMobileClose,
  isCollapsed = false,
  onCollapseToggle,
}: SidebarProps) {
  const { t } = useTranslation(["ui", "common"])
  const { preferences } = useUserPreferencesContext()
  const shouldShowCollapsedState = isCollapsed
  const navAriaLabel = shouldShowCollapsedState
    ? t("navigation.sidebarCollapsedHint")
    : t("navigation.settings")
  const collapseButtonLabel = t(
    `navigation.${shouldShowCollapsedState ? "expandSidebar" : "collapseSidebar"}`,
  )

  useEffect(() => {
    if (isMobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }

    return () => {
      document.body.style.overflow = ""
    }
  }, [isMobileOpen])

  const visibleMenuItems = menuItems.filter((item) => {
    if (
      item.id === MENU_ITEM_IDS.AUTO_CHECKIN &&
      !preferences?.autoCheckin?.globalEnabled
    ) {
      return false
    }

    if (
      !hasValidManagedSiteConfig(preferences ?? null) &&
      (item.id === MENU_ITEM_IDS.MANAGED_SITE_MODEL_SYNC ||
        item.id === MENU_ITEM_IDS.MANAGED_SITE_CHANNELS)
    ) {
      return false
    }

    return true
  })
  const activeItem = visibleMenuItems.find((item) => item.id === activeMenuItem)
  const activeItemLabel = activeItem
    ? t(`navigation.${activeItem.id}`)
    : t("navigation.settings")

  const groupedMenuItems: Array<{
    key: string
    items: Array<(typeof menuItems)[number]>
  }> = SIDEBAR_MENU_GROUPS.map((group) => ({
    key: group.key,
    items: group.itemIds
      .map((id) => visibleMenuItems.find((item) => item.id === id))
      .filter((item): item is (typeof menuItems)[number] => Boolean(item)),
  })).filter((group) => group.items.length > 0)

  const groupedIds = new Set(
    groupedMenuItems.flatMap((group) => group.items.map((item) => item.id)),
  )
  const ungroupedItems = visibleMenuItems.filter(
    (item) => !groupedIds.has(item.id),
  )

  if (ungroupedItems.length > 0) {
    groupedMenuItems.push({
      key: "other",
      items: ungroupedItems,
    })
  }

  const renderNavContent = ({ mobile = false }: { mobile?: boolean }) => (
    <div className="elevated-surface flex h-full min-h-0 flex-col overflow-hidden rounded-[1.85rem] border border-white/45 shadow-[0_26px_90px_-52px_rgba(15,23,42,0.5)] backdrop-blur-xl dark:border-white/8 dark:shadow-[0_36px_100px_-60px_rgba(2,6,23,0.95)]">
      <div
        className={cn(
          "sticky top-0 z-10 flex items-center border-b border-slate-200/65 bg-white/70 px-3 py-3 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/55",
          shouldShowCollapsedState && !mobile
            ? "justify-center px-2"
            : "justify-between",
        )}
      >
        {(!shouldShowCollapsedState || mobile) && (
          <div className="min-w-0 px-1">
            <p className="text-[0.68rem] font-semibold tracking-[0.22em] text-slate-400 uppercase dark:text-slate-500">
              {t("navigation.settings")}
            </p>
            <p
              className="mt-1 truncate text-sm font-medium text-slate-600 dark:text-slate-300"
              data-testid="options-sidebar-current-label"
            >
              {activeItemLabel}
            </p>
          </div>
        )}

        {mobile ? (
          <IconButton
            onClick={onMobileClose}
            variant="ghost"
            size="default"
            className="subtle-surface touch-manipulation"
            aria-label={t("common:actions.close")}
          >
            <XMarkIcon className="h-5 w-5" />
          </IconButton>
        ) : (
          onCollapseToggle && (
            <IconButton
              onClick={onCollapseToggle}
              variant="ghost"
              size="default"
              className="subtle-surface touch-manipulation"
              aria-label={collapseButtonLabel}
              data-testid="options-collapse-toggle"
            >
              {shouldShowCollapsedState ? (
                <ChevronDoubleRightIcon className="h-4 w-4" />
              ) : (
                <ChevronDoubleLeftIcon className="h-4 w-4" />
              )}
            </IconButton>
          )
        )}
      </div>

      <nav
        aria-label={navAriaLabel}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-3 py-4"
        data-testid={
          mobile ? "options-sidebar-scroll-mobile" : "options-sidebar-scroll"
        }
      >
        <div className="space-y-4">
          {groupedMenuItems.map((group, groupIndex) => (
            <div
              key={group.key}
              data-testid="options-sidebar-group"
              className={cn(
                groupIndex > 0 &&
                  "border-t border-slate-200/60 pt-4 dark:border-white/10",
                shouldShowCollapsedState && !mobile && groupIndex > 0 && "pt-3",
              )}
            >
              <ul className="space-y-1.5">
                {group.items.map((item) => {
                  const Icon = item.icon
                  const isActive = activeMenuItem === item.id
                  const label = t(`navigation.${item.id}`)

                  return (
                    <li key={item.id}>
                      <button
                        onClick={() => onMenuItemClick(item.id)}
                        title={
                          shouldShowCollapsedState && !mobile
                            ? label
                            : undefined
                        }
                        aria-label={label}
                        data-active={isActive}
                        className={cn(
                          "group relative flex min-h-[3.5rem] w-full items-center gap-3 overflow-hidden rounded-[1.35rem] px-3.5 py-3 text-left text-sm transition-all duration-200",
                          shouldShowCollapsedState &&
                            !mobile &&
                            "justify-center px-0",
                          isActive
                            ? "bg-slate-950/[0.08] text-slate-950 shadow-[0_18px_40px_-28px_rgba(15,23,42,0.52)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-blue-500 dark:bg-white/[0.1] dark:text-white dark:before:bg-blue-300"
                            : "text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white",
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-150",
                            isActive
                              ? "bg-white/88 shadow-sm dark:bg-white/[0.08]"
                              : "bg-transparent group-hover:bg-white/75 dark:group-hover:bg-white/[0.05]",
                            shouldShowCollapsedState && !mobile && "h-11 w-11",
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0 transition-colors",
                              isActive
                                ? "text-blue-600 dark:text-blue-300"
                                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-white",
                            )}
                          />
                        </div>

                        {(!shouldShowCollapsedState || mobile) && (
                          <div
                            className="min-w-0 flex-1 overflow-hidden"
                            aria-hidden={shouldShowCollapsedState && !mobile}
                          >
                            <span
                              className={cn(
                                "block truncate text-sm transition-all duration-200 sm:text-[0.97rem]",
                                isActive ? "font-semibold" : "font-medium",
                              )}
                            >
                              {label}
                            </span>
                          </div>
                        )}
                      </button>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )

  return (
    <>
      <aside
        className="hidden lg:block lg:min-h-0"
        data-testid="options-sidebar-desktop"
      >
        <div className="h-full min-h-0 transition-[width] duration-300 ease-out">
          {renderNavContent({ mobile: false })}
        </div>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-40 bg-slate-950/55 backdrop-blur-sm transition-opacity duration-200 lg:hidden",
          isMobileOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none opacity-0",
        )}
        onClick={onMobileClose}
      />

      <aside
        className={cn(
          "fixed inset-y-[var(--options-shell-gutter)] left-[var(--options-shell-gutter)] z-50 w-[min(20rem,calc(100vw-(var(--options-shell-gutter)*2)))] transition-transform duration-300 ease-out lg:hidden",
          isMobileOpen
            ? "translate-x-0"
            : "-translate-x-[calc(100%+var(--options-shell-gutter))]",
        )}
        data-testid="options-sidebar-mobile"
        aria-hidden={!isMobileOpen}
      >
        {renderNavContent({ mobile: true })}
      </aside>
    </>
  )
}

export default Sidebar
