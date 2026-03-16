import {
  ArrowsPointingOutIcon,
  Cog6ToothIcon,
} from "@heroicons/react/24/outline"
import { AnimatePresence, motion } from "framer-motion"
import { useRef, useState, type ReactNode } from "react"
import { useTranslation } from "react-i18next"

import iconImage from "~/assets/icon.png"
import { AppLayout } from "~/components/AppLayout"
import { BodySmall, Button, Caption, IconButton } from "~/components/ui"
import { useUserPreferencesContext } from "~/contexts/UserPreferencesContext"
import AccountList from "~/features/AccountManagement/components/AccountList"
import { AccountManagementProvider } from "~/features/AccountManagement/hooks/AccountManagementProvider"
import ApiCredentialProfilesPopupView, {
  type ApiCredentialProfilesPopupViewHandle,
} from "~/features/ApiCredentialProfiles/components/ApiCredentialProfilesPopupView"
import BookmarksList from "~/features/SiteBookmarks/components/BookmarksList"
import { useBookmarkDialogContext } from "~/features/SiteBookmarks/hooks/BookmarkDialogStateContext"
import { useAddAccountHandler } from "~/hooks/useAddAccountHandler"
import { useMediaQuery } from "~/hooks/useMediaQuery"
import { cn } from "~/lib/utils"
import { isExtensionSidePanel } from "~/utils/browser"
import {
  openApiCredentialProfilesPage,
  openFullAccountManagerPage,
  openFullBookmarkManagerPage,
  openSettingsPage,
} from "~/utils/navigation"

import ActionButtons from "./components/ActionButtons"
import ApiCredentialProfilesStatsSection from "./components/ApiCredentialProfilesStatsSection"
import BalanceSection from "./components/BalanceSection"
import BookmarkStatsSection from "./components/BookmarkStatsSection"
import HeaderSection from "./components/HeaderSection"
import PopupViewSwitchTabs, {
  type PopupViewType,
} from "./components/PopupViewSwitchTabs"
import ShareOverviewSnapshotButton from "./components/ShareOverviewSnapshotButton"

/**
 *
 */
function SidePanelNarrowState({
  activeView,
  compact,
}: {
  activeView: PopupViewType
  compact: boolean
}) {
  const { t } = useTranslation(["ui", "common", "bookmark"])

  const openCurrentView = async () => {
    if (activeView === "bookmarks") {
      await openFullBookmarkManagerPage()
      return
    }

    if (activeView === "apiCredentialProfiles") {
      await openApiCredentialProfilesPage()
      return
    }

    await openFullAccountManagerPage()
  }

  const openSettings = async () => {
    await openSettingsPage()
  }

  const openCurrentViewLabel =
    activeView === "bookmarks"
      ? t("ui:sidepanelNarrow.openBookmarks")
      : activeView === "apiCredentialProfiles"
        ? t("ui:sidepanelNarrow.openApiCredentialProfiles")
        : t("ui:sidepanelNarrow.openAccounts")

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      data-testid="sidepanel-narrow-state"
      data-compact={compact ? "icons" : "message"}
      className="ambient-page flex min-h-screen w-full items-center justify-center overflow-hidden p-3"
    >
      <div
        className={cn(
          "elevated-surface flex w-full flex-col items-center justify-center rounded-[1.75rem] border border-white/10",
          compact ? "gap-3 p-2.5" : "max-w-sm gap-4 p-5 text-center",
        )}
      >
        <div className="subtle-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
          <img
            src={iconImage}
            alt={t("ui:app.name")}
            className="h-6 w-6 rounded-xl shadow-sm"
          />
        </div>

        {!compact && (
          <div className="space-y-2">
            <BodySmall className="text-sm font-semibold tracking-[-0.02em] text-slate-900 dark:text-white">
              {t("ui:sidepanelNarrow.title")}
            </BodySmall>
            <Caption className="text-sm leading-6 text-slate-500 dark:text-slate-300">
              {t("ui:sidepanelNarrow.description")}
            </Caption>
            <Caption className="text-xs leading-5 text-slate-400 dark:text-slate-500">
              {t("ui:sidepanelNarrow.hint")}
            </Caption>
          </div>
        )}

        <div
          className={cn(
            "w-full",
            compact ? "flex flex-col items-center gap-2" : "space-y-2",
          )}
        >
          {compact ? (
            <>
              <IconButton
                onClick={() => void openCurrentView()}
                variant="outline"
                size="default"
                className="subtle-surface h-11 w-11 rounded-2xl"
                aria-label={openCurrentViewLabel}
                data-testid="sidepanel-narrow-open-full"
              >
                <ArrowsPointingOutIcon className="h-4 w-4" />
              </IconButton>
              <IconButton
                onClick={() => void openSettings()}
                variant="outline"
                size="default"
                className="subtle-surface h-11 w-11 rounded-2xl"
                aria-label={t("common:labels.settings")}
                data-testid="sidepanel-narrow-open-settings"
              >
                <Cog6ToothIcon className="h-4 w-4" />
              </IconButton>
            </>
          ) : (
            <>
              <Button
                onClick={() => void openCurrentView()}
                bleed
                className="rounded-[1.1rem]"
                leftIcon={<ArrowsPointingOutIcon className="h-4 w-4" />}
                data-testid="sidepanel-narrow-open-full"
              >
                {openCurrentViewLabel}
              </Button>
              <Button
                onClick={() => void openSettings()}
                bleed
                variant="outline"
                className="rounded-[1.1rem]"
                leftIcon={<Cog6ToothIcon className="h-4 w-4" />}
                data-testid="sidepanel-narrow-open-settings"
              >
                {t("ui:sidepanelNarrow.openSettings")}
              </Button>
            </>
          )}
        </div>
      </div>
    </motion.div>
  )
}

/**
 * Popup body content for the extension popup and side panel.
 * Handles width-aware layout sizing, header/actions, and account list rendering.
 */
function PopupContent() {
  const { t } = useTranslation([
    "account",
    "bookmark",
    "common",
    "apiCredentialProfiles",
  ])
  const { isLoading } = useUserPreferencesContext()
  const { handleAddAccountClick } = useAddAccountHandler()
  const inSidePanel = isExtensionSidePanel()
  const isNarrowRail = useMediaQuery("(max-width: 380px)")
  const isNarrowQuery = useMediaQuery("(max-width: 320px)")
  const isUltraCompactQuery = useMediaQuery("(max-width: 220px)")

  const isNarrowSidePanel = inSidePanel && isNarrowQuery
  const isUltraCompactSidePanel = inSidePanel && isUltraCompactQuery

  const [activeView, setActiveView] = useState<PopupViewType>("accounts")

  const { openAddBookmark } = useBookmarkDialogContext()

  const apiCredentialProfilesViewRef =
    useRef<ApiCredentialProfilesPopupViewHandle>(null)

  const viewConfig: Record<
    PopupViewType,
    {
      showRefresh: boolean
      headerAction?: ReactNode
      statsSection?: ReactNode
      primaryActionLabel: string
      onPrimaryAction: () => void
      content: ReactNode
    }
  > = {
    accounts: {
      showRefresh: true,
      headerAction: <ShareOverviewSnapshotButton />,
      statsSection: <BalanceSection />,
      primaryActionLabel: t("account:addAccount"),
      onPrimaryAction: handleAddAccountClick,
      content: <AccountList />,
    },
    bookmarks: {
      showRefresh: false,
      statsSection: <BookmarkStatsSection />,
      primaryActionLabel: t("bookmark:actions.add"),
      onPrimaryAction: openAddBookmark,
      content: <BookmarksList />,
    },
    apiCredentialProfiles: {
      showRefresh: false,
      statsSection: <ApiCredentialProfilesStatsSection />,
      primaryActionLabel: t("apiCredentialProfiles:actions.add"),
      onPrimaryAction: () =>
        apiCredentialProfilesViewRef.current?.openAddDialog(),
      content: (
        <ApiCredentialProfilesPopupView ref={apiCredentialProfilesViewRef} />
      ),
    },
  }

  const activeViewConfig = viewConfig[activeView]
  const hasHeaderAction = Boolean(activeViewConfig.headerAction)

  if (isNarrowSidePanel) {
    return (
      <SidePanelNarrowState
        activeView={activeView}
        compact={isUltraCompactSidePanel}
      />
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 10 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      data-testid="popup-shell"
      data-surface={inSidePanel ? "sidepanel" : "popup"}
      className={cn(
        "ambient-page flex min-w-0 flex-col gap-3 overflow-x-hidden overflow-y-auto p-3",
        inSidePanel
          ? "min-h-full w-full"
          : "mx-auto min-h-[600px] w-full max-w-[410px]",
      )}
    >
      <HeaderSection
        showRefresh={activeViewConfig.showRefresh}
        activeView={activeView}
      />

      <section className="shrink-0">
        <div className="elevated-surface space-y-3 rounded-[1.75rem] p-3">
          <div
            data-testid="popup-top-rail"
            data-stacked={hasHeaderAction && isNarrowRail ? "true" : "false"}
            className={cn(
              "min-w-0 gap-2.5",
              hasHeaderAction
                ? isNarrowRail
                  ? "grid grid-cols-1"
                  : "grid grid-cols-[minmax(0,1fr)_auto] items-center"
                : "block",
            )}
          >
            <PopupViewSwitchTabs
              value={activeView}
              onChange={setActiveView}
              accountsLabel={t("bookmark:switch.accounts")}
              bookmarksLabel={t("bookmark:switch.bookmarks")}
              apiCredentialProfilesLabel={t(
                "apiCredentialProfiles:popup.tabLabel",
              )}
              compact={isNarrowRail}
            />
            {activeViewConfig.headerAction && (
              <div
                data-testid="popup-top-rail-action"
                className={cn(
                  "flex",
                  isNarrowRail ? "justify-end" : "justify-end self-center",
                )}
              >
                {activeViewConfig.headerAction}
              </div>
            )}
          </div>

          <AnimatePresence mode="wait">
            {!isLoading && activeViewConfig.statsSection && (
              <motion.div
                key={activeView}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeViewConfig.statsSection}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </section>

      <div className="relative flex-1">
        <ActionButtons
          primaryActionLabel={activeViewConfig.primaryActionLabel}
          onPrimaryAction={activeViewConfig.onPrimaryAction}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            {activeViewConfig.content}
          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

/**
 * Root popup application with providers/layout wrappers.
 * @returns Popup component tree rendered inside AppLayout.
 */
function App() {
  return (
    <AppLayout>
      <AccountManagementProvider>
        <PopupContent />
      </AccountManagementProvider>
    </AppLayout>
  )
}

export default App
