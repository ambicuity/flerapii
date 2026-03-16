import { CalendarCheck2, Search, UserRound } from "lucide-react"
import { useState, type MouseEvent } from "react"
import { useTranslation } from "react-i18next"

import { PageHeader } from "~/components/PageHeader"
import { Button } from "~/components/ui"
import AccountList from "~/features/AccountManagement/components/AccountList"
import DedupeAccountsDialog from "~/features/AccountManagement/components/DedupeAccountsDialog"
import { useAccountActionsContext } from "~/features/AccountManagement/hooks/AccountActionsContext"
import { useAccountDataContext } from "~/features/AccountManagement/hooks/AccountDataContext"
import { AccountManagementProvider } from "~/features/AccountManagement/hooks/AccountManagementProvider"
import { useDialogStateContext } from "~/features/AccountManagement/hooks/DialogStateContext"
import { getExternalCheckInOpenOptions } from "~/utils/core/shortcutKeys"

/**
 * Renders the Account Management page body: header with CTA and account list.
 */
function AccountManagementContent({ searchQuery }: { searchQuery?: string }) {
  const { t } = useTranslation(["account", "common"])
  const { openAddAccount } = useDialogStateContext()
  const { displayData } = useAccountDataContext()
  const { handleOpenExternalCheckIns } = useAccountActionsContext()
  const [isDedupeDialogOpen, setIsDedupeDialogOpen] = useState(false)

  const externalCheckInAccounts = displayData.filter((account) => {
    const customUrl = account.checkIn?.customCheckIn?.url
    return typeof customUrl === "string" && customUrl.trim() !== ""
  })

  const canOpenExternalCheckIns = externalCheckInAccounts.length > 0

  // Open all configured external check-in sites and sync the checked-in status.
  const handleOpenExternalCheckInsClick = async (
    event: MouseEvent<HTMLButtonElement>,
  ) => {
    const { openAll, openInNewWindow } = getExternalCheckInOpenOptions(event)
    await handleOpenExternalCheckIns(externalCheckInAccounts, {
      openAll,
      openInNewWindow,
    })
  }

  return (
    <div className="flex flex-col bg-transparent p-5 sm:p-6 md:p-8">
      <div className="mx-auto w-full max-w-6xl">
        <PageHeader
          icon={UserRound}
          title={t("account:title")}
          description={t("account:description")}
          actions={
            <div className="flex flex-wrap items-center gap-2">
              {canOpenExternalCheckIns && (
                <Button
                  onClick={handleOpenExternalCheckInsClick}
                  leftIcon={<CalendarCheck2 className="h-4 w-4" />}
                  title={t("account:actions.openAllExternalCheckInHint")}
                  variant="outline"
                  className="backdrop-blur-sm"
                >
                  {t("account:actions.openAllExternalCheckIn")}
                </Button>
              )}
              <Button
                onClick={() => setIsDedupeDialogOpen(true)}
                variant="secondary"
                leftIcon={<Search className="h-4 w-4" />}
                title={t("account:actions.scanDuplicatesHint")}
              >
                {t("account:actions.scanDuplicates")}
              </Button>
              <Button onClick={openAddAccount}>
                {t("account:addAccount")}
              </Button>
            </div>
          }
        />

        <AccountList initialSearchQuery={searchQuery} />
      </div>

      <DedupeAccountsDialog
        isOpen={isDedupeDialogOpen}
        onClose={() => setIsDedupeDialogOpen(false)}
      />
    </div>
  )
}

interface AccountManagementProps {
  refreshKey?: number
  routeParams?: Record<string, string>
}

/**
 * Wraps AccountManagementContent with provider and hash-driven params.
 */
function AccountManagement({
  refreshKey,
  routeParams,
}: AccountManagementProps) {
  return (
    <AccountManagementProvider refreshKey={refreshKey}>
      <AccountManagementContent searchQuery={routeParams?.search} />
    </AccountManagementProvider>
  )
}

export default AccountManagement
