import { KeyRound, Plus, RefreshCw, Wrench } from "lucide-react"
import type { ReactNode } from "react"
import { useTranslation } from "react-i18next"

import { Button } from "~/components/ui"

interface HeaderProps {
  selectedAccount: string
  onAddToken: () => void
  onRepairMissingKeys: () => void
  onRefresh: () => void
  onRefreshManagedSiteStatus?: () => void
  managedSiteStatusHint?: string
  isLoading: boolean
  isManagedSiteStatusRefreshing?: boolean
  isAddTokenDisabled: boolean
  isRepairDisabled: boolean
  isManagedSiteStatusRefreshDisabled?: boolean
}

/**
 * Page header summarizing the key management section with actions.
 */
export function Header({
  onAddToken,
  onRepairMissingKeys,
  onRefresh,
  onRefreshManagedSiteStatus,
  managedSiteStatusHint,
  isLoading,
  isManagedSiteStatusRefreshing = false,
  selectedAccount,
  isAddTokenDisabled,
  isRepairDisabled,
  isManagedSiteStatusRefreshDisabled = false,
}: HeaderProps) {
  const { t } = useTranslation("keyManagement")
  let description: ReactNode = t("description")

  if (managedSiteStatusHint) {
    description = (
      <>
        <span className="block">{t("description")}</span>
        <span className="mt-1 block font-medium text-amber-700 dark:text-amber-300">
          {managedSiteStatusHint}
        </span>
      </>
    )
  }

  const actionButtons = (
    <>
      <Button
        onClick={onAddToken}
        disabled={isAddTokenDisabled}
        size="sm"
        variant="success"
        leftIcon={<Plus className="h-4 w-4" />}
      >
        {t("dialog.addToken")}
      </Button>
      <Button
        onClick={onRepairMissingKeys}
        disabled={isRepairDisabled}
        size="sm"
        variant="outline"
        leftIcon={<Wrench className="h-4 w-4" />}
      >
        {t("repairMissingKeys.action")}
      </Button>
      {onRefreshManagedSiteStatus ? (
        <Button
          onClick={onRefreshManagedSiteStatus}
          disabled={isManagedSiteStatusRefreshDisabled}
          size="sm"
          variant="outline"
          loading={isManagedSiteStatusRefreshing}
          leftIcon={<RefreshCw className="h-4 w-4" />}
        >
          {isManagedSiteStatusRefreshing
            ? t("managedSiteStatus.actions.refreshing")
            : t("managedSiteStatus.actions.refresh")}
        </Button>
      ) : null}
      <Button onClick={onRefresh} disabled={isLoading} size="sm">
        {isLoading && selectedAccount
          ? t("common:status.refreshing")
          : t("refreshTokenList")}
      </Button>
    </>
  )

  return (
    <section
      className="elevated-surface mb-6 rounded-[2rem] px-5 py-5 sm:px-6 sm:py-6"
      data-testid="key-management-header"
    >
      <div className="flex flex-col gap-5 xl:grid xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start xl:gap-6">
        <div className="min-w-0">
          <div className="flex items-center gap-4">
            <div className="subtle-surface flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl">
              <KeyRound className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <h1 className="min-w-0 text-[1.95rem] font-semibold tracking-[-0.04em] text-slate-900 sm:text-[2.3rem] dark:text-white">
              {t("title")}
            </h1>
          </div>
          <div className="mt-4 max-w-3xl text-base leading-8 text-slate-500 dark:text-slate-300">
            {description}
          </div>
        </div>

        <div
          className="flex min-w-0 flex-wrap items-center gap-2 xl:max-w-[44rem] xl:justify-end"
          data-testid="key-management-header-actions"
        >
          {actionButtons}
        </div>
      </div>
    </section>
  )
}
