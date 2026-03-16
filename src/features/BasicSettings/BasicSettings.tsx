import { Tab } from "@headlessui/react"
import { Settings } from "lucide-react"
import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ComponentType,
} from "react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "~/components/PageHeader"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui"
import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"
import { useUserPreferencesContext } from "~/contexts/UserPreferencesContext"
import { cn } from "~/lib/utils"
import { setLastSeenOptionalPermissions } from "~/services/permissions/optionalPermissionState"
import { OPTIONAL_PERMISSIONS } from "~/services/permissions/permissionManager"
import {
  navigateToAnchor,
  parseTabFromUrl,
  updateUrlWithTab,
} from "~/utils/core/url"

import { PermissionOnboardingDialog } from "./components/dialogs/PermissionOnboardingDialog"
import LoadingSkeleton from "./components/shared/LoadingSkeleton"
import AccountManagementTab from "./components/tabs/AccountManagement/AccountManagementTab"
import BalanceHistoryTab from "./components/tabs/BalanceHistory/BalanceHistoryTab"
import CheckinRedeemTab from "./components/tabs/CheckinRedeem/CheckinRedeemTab"
import ClaudeCodeRouterTab from "./components/tabs/ClaudeCodeRouter/ClaudeCodeRouterTab"
import CliProxyTab from "./components/tabs/CliProxy/CliProxyTab"
import DataBackupTab from "./components/tabs/DataBackup/DataBackupTab"
import GeneralTab from "./components/tabs/General/GeneralTab"
import ManagedSiteTab from "./components/tabs/ManagedSite/ManagedSiteTab"
import PermissionsTab from "./components/tabs/Permissions/PermissionsTab"
import AutoRefreshTab from "./components/tabs/Refresh/AutoRefreshTab"
import UsageHistorySyncTab from "./components/tabs/UsageHistorySync/UsageHistorySyncTab"
import WebAiApiCheckTab from "./components/tabs/WebAiApiCheck/WebAiApiCheckTab"
import {
  SETTINGS_TAB_METADATA,
  type SettingsTabId,
  type SettingsTabMeta,
} from "./tabMetadata"

const hasOptionalPermissions = OPTIONAL_PERMISSIONS.length > 0

const TAB_COMPONENTS: Record<SettingsTabId, ComponentType> = {
  general: GeneralTab,
  accountManagement: AccountManagementTab,
  refresh: AutoRefreshTab,
  checkinRedeem: CheckinRedeemTab,
  balanceHistory: BalanceHistoryTab,
  accountUsage: UsageHistorySyncTab,
  webAiApiCheck: WebAiApiCheckTab,
  managedSite: ManagedSiteTab,
  cliProxy: CliProxyTab,
  claudeCodeRouter: ClaudeCodeRouterTab,
  permissions: PermissionsTab,
  dataBackup: DataBackupTab,
}

const ANCHOR_TO_TAB: Record<string, SettingsTabId> = {
  "general-display": "general",
  display: "general",
  appearance: "general",
  theme: "general",
  "balance-history": "balanceHistory",
  "account-management": "accountManagement",
  "auto-provision-key-on-account-add": "accountManagement",
  "sorting-priority": "accountManagement",
  sorting: "accountManagement",
  "auto-refresh": "refresh",
  refresh: "refresh",
  "checkin-redeem": "checkinRedeem",
  checkin: "checkinRedeem",
  "web-ai-api-check": "webAiApiCheck",
  "usage-history-sync": "accountUsage",
  "usage-history-sync-state": "accountUsage",
  webdav: "dataBackup",
  "webdav-auto-sync": "dataBackup",
  "import-export-entry": "dataBackup",
  "new-api": "managedSite",
  "new-api-model-sync": "managedSite",
  "cli-proxy": "cliProxy",
  "claude-code-router": "claudeCodeRouter",
  "dangerous-zone": "general",
  ...(hasOptionalPermissions ? { permissions: "permissions" } : {}),
}

interface ResolvedSettingsTab extends SettingsTabMeta {
  label: string
  description: string
  component: ComponentType
}

/**
 *
 */
export function DesktopSectionNavigator({
  tabs,
}: {
  tabs: ResolvedSettingsTab[]
}) {
  const { t } = useTranslation("settings")

  return (
    <div
      className="hidden xl:block"
      data-testid="settings-desktop-navigator-shell"
    >
      <div className="sticky top-4">
        <div
          className="elevated-surface flex min-h-[34rem] flex-col overflow-hidden rounded-[2rem] p-4"
          style={{
            maxHeight: "calc(100vh - var(--options-header-height) - 2.5rem)",
          }}
          data-testid="settings-desktop-navigator"
        >
          <div className="border-b border-slate-200/60 px-2 pb-4 dark:border-white/10">
            <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
              {t("navigation.title")}
            </p>
            <p className="mt-3 text-sm leading-6 text-slate-500 dark:text-slate-300">
              {t("navigation.description")}
            </p>
          </div>

          <Tab.List
            className="mt-4 min-h-0 flex-1 space-y-2 overflow-y-auto pr-1"
            data-testid="settings-desktop-nav-scroll"
          >
            {tabs.map((tab) => {
              const Icon = tab.icon

              return (
                <Tab key={tab.id} as={Fragment}>
                  {({ selected }) => (
                    <button
                      data-active={selected}
                      data-testid="settings-nav-card"
                      className={cn(
                        "group relative flex w-full items-start gap-3 overflow-hidden rounded-[1.35rem] px-4 py-3 text-left transition-all duration-150",
                        selected
                          ? "bg-slate-950/[0.08] text-slate-900 shadow-[0_14px_34px_-26px_rgba(15,23,42,0.45)] before:absolute before:inset-y-3 before:left-0 before:w-[3px] before:rounded-full before:bg-blue-500 dark:bg-white/[0.1] dark:text-white dark:before:bg-blue-300"
                          : "text-slate-500 hover:bg-slate-950/[0.04] hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white",
                      )}
                    >
                      <div
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl transition-all duration-150",
                          selected
                            ? "bg-white/85 shadow-sm dark:bg-white/[0.08]"
                            : "bg-transparent group-hover:bg-white/70 dark:group-hover:bg-white/[0.05]",
                        )}
                      >
                        <Icon
                          className={cn(
                            "h-[18px] w-[18px]",
                            selected
                              ? "text-blue-600 dark:text-blue-300"
                              : "text-slate-400 dark:text-slate-500",
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <p
                          className={cn(
                            "truncate text-sm",
                            selected ? "font-semibold" : "font-medium",
                          )}
                        >
                          {tab.label}
                        </p>
                        <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-400 dark:text-slate-500">
                          {tab.description}
                        </p>
                      </div>
                    </button>
                  )}
                </Tab>
              )
            })}
          </Tab.List>
        </div>
      </div>
    </div>
  )
}

/**
 * Basic Settings page: renders sections for all settings categories and keeps URL state in sync.
 */
export default function BasicSettings() {
  const { t } = useTranslation("settings")
  const { isLoading } = useUserPreferencesContext()

  const tabs = useMemo<ResolvedSettingsTab[]>(
    () =>
      SETTINGS_TAB_METADATA.filter(
        (tab) => hasOptionalPermissions || !tab.requiresOptionalPermissions,
      ).map((tab) => ({
        ...tab,
        label: t(`tabs.${tab.id}`),
        description: t(`tabDescriptions.${tab.id}`),
        component: TAB_COMPONENTS[tab.id],
      })),
    [t],
  )

  const [selectedTabIndex, setSelectedTabIndex] = useState(0)
  const selectedTab = tabs[selectedTabIndex]
  const selectedTabId = selectedTab?.id ?? "general"
  const [showPermissionsOnboarding, setShowPermissionsOnboarding] =
    useState(false)
  const [permissionsOnboardingReason, setPermissionsOnboardingReason] =
    useState<string | null>(null)

  const applyUrlState = useCallback(() => {
    const searchParams = new URLSearchParams(window.location.search)
    const pendingAnchor = searchParams.get("anchor")
    const { tab, anchor, isHeadingAnchor } = parseTabFromUrl({
      ignoreAnchors: [MENU_ITEM_IDS.BASIC],
      defaultHashPage: MENU_ITEM_IDS.BASIC,
    })

    if (tab) {
      const normalizedTab = tab === "sync" ? "accountUsage" : tab
      const index = tabs.findIndex((cfg) => cfg.id === normalizedTab)
      if (index >= 0) {
        setSelectedTabIndex(index)
      }

      if (pendingAnchor) {
        window.setTimeout(() => {
          navigateToAnchor(pendingAnchor)
        }, 150)
      }
      return
    }

    if (isHeadingAnchor && anchor) {
      const targetTab = ANCHOR_TO_TAB[anchor]
      if (targetTab) {
        const index = tabs.findIndex((cfg) => cfg.id === targetTab)
        if (index >= 0) {
          setSelectedTabIndex(index)
          window.setTimeout(() => {
            navigateToAnchor(anchor)
          }, 150)
        }
      }
    }
  }, [tabs])

  useEffect(() => {
    applyUrlState()
    window.addEventListener("popstate", applyUrlState)
    window.addEventListener("hashchange", applyUrlState)
    return () => {
      window.removeEventListener("popstate", applyUrlState)
      window.removeEventListener("hashchange", applyUrlState)
    }
  }, [applyUrlState])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get("onboarding") === "permissions" && hasOptionalPermissions) {
      setPermissionsOnboardingReason(params.get("reason"))
      setShowPermissionsOnboarding(true)
    }
  }, [])

  const handleCloseOnboarding = useCallback(() => {
    setShowPermissionsOnboarding(false)
    void setLastSeenOptionalPermissions()
    const url = new URL(window.location.href)
    url.searchParams.delete("onboarding")
    url.searchParams.delete("reason")
    window.history.replaceState(null, "", url.toString())
  }, [])

  const getTabIndexFromId = useCallback(
    (tabId: string) => tabs.findIndex((cfg) => cfg.id === tabId),
    [tabs],
  )

  const handleTabChange = useCallback(
    (index: number) => {
      if (index < 0 || index >= tabs.length) return
      setSelectedTabIndex(index)
      const tab = tabs[index]
      updateUrlWithTab(tab.id, { hashPage: MENU_ITEM_IDS.BASIC })
    },
    [tabs],
  )

  if (isLoading) {
    return <LoadingSkeleton />
  }

  const SelectedIcon = selectedTab?.icon ?? Settings

  return (
    <div className="mx-auto w-full max-w-[1260px] p-4 sm:p-6 md:p-8">
      <PageHeader
        icon={Settings}
        title={t("title")}
        description={t("description")}
        spacing="compact"
      />

      <Tab.Group selectedIndex={selectedTabIndex} onChange={handleTabChange}>
        <div className="mb-5 xl:hidden" data-testid="settings-mobile-selector">
          <label className="sr-only" htmlFor="settings-tab-select">
            {t("tabs.select")}
          </label>
          <Select
            value={selectedTabId}
            onValueChange={(tabId) => {
              const index = getTabIndexFromId(tabId)
              handleTabChange(index)
            }}
          >
            <SelectTrigger
              id="settings-tab-select"
              className="subtle-surface h-12 w-full rounded-[1.35rem] border-slate-200/60 bg-white/82 px-4 font-medium shadow-sm dark:border-white/10 dark:bg-white/[0.05]"
            >
              <SelectValue placeholder={t("tabs.select")} />
            </SelectTrigger>
            <SelectContent>
              {tabs.map((tab) => (
                <SelectItem key={tab.id} value={tab.id}>
                  {tab.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="xl:grid xl:grid-cols-[19rem_minmax(0,1fr)] xl:items-start xl:gap-5">
          <DesktopSectionNavigator tabs={tabs} />

          <div className="elevated-surface min-w-0 rounded-[2rem] p-4 sm:p-6 md:p-7">
            <div className="mb-7 flex items-start gap-4">
              <div className="subtle-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
                <SelectedIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-[0.16em] text-slate-400 uppercase dark:text-slate-500">
                  {t("navigation.currentSection")}
                </p>
                <h2 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-slate-900 dark:text-white">
                  {selectedTab?.label}
                </h2>
                <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-500 dark:text-slate-300">
                  {selectedTab?.description}
                </p>
              </div>
            </div>

            <Tab.Panels>
              {tabs.map((tab) => {
                const Component = tab.component
                return (
                  <Tab.Panel
                    key={tab.id}
                    unmount={false}
                    className="focus:outline-none"
                  >
                    <Component />
                  </Tab.Panel>
                )
              })}
            </Tab.Panels>
          </div>
        </div>
      </Tab.Group>

      {hasOptionalPermissions && (
        <PermissionOnboardingDialog
          open={showPermissionsOnboarding}
          onClose={handleCloseOnboarding}
          reason={permissionsOnboardingReason}
        />
      )}
    </div>
  )
}
