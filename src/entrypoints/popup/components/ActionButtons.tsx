import {
  CalendarDaysIcon,
  CpuChipIcon,
  CurrencyYenIcon,
  KeyIcon,
  PlusIcon,
} from "@heroicons/react/24/outline"
import type { MouseEvent } from "react"
import { useTranslation } from "react-i18next"

import Tooltip from "~/components/Tooltip"
import { Button, IconButton } from "~/components/ui"
import { useAccountActionsContext } from "~/features/AccountManagement/hooks/AccountActionsContext"
import { useAccountDataContext } from "~/features/AccountManagement/hooks/AccountDataContext"
import { getExternalCheckInOpenOptions } from "~/utils/core/shortcutKeys"
import {
  openAutoCheckinPage,
  openKeysPage,
  openModelsPage,
} from "~/utils/navigation"

interface ActionButtonsProps {
  primaryActionLabel: string
  onPrimaryAction: () => void
}

/**
 * Renders quick action buttons in popup header for the active view and navigation.
 * Uses a shared button group where only the primary CTA label/handler varies by view.
 */
export default function ActionButtons({
  primaryActionLabel,
  onPrimaryAction,
}: ActionButtonsProps) {
  const { t } = useTranslation("ui")
  const { displayData } = useAccountDataContext()
  const { handleOpenExternalCheckIns } = useAccountActionsContext()

  // Only enable the external check-in shortcut when at least one account has a custom URL.
  const externalCheckInAccounts = displayData.filter((account) => {
    const customUrl = account.checkIn?.customCheckIn?.url
    return typeof customUrl === "string" && customUrl.trim() !== ""
  })
  const canOpenExternalCheckIns = externalCheckInAccounts.length > 0
  // Highlight red when any external check-in is still pending today.
  const hasUncheckedExternalCheckIns = externalCheckInAccounts.some(
    (account) => !account.checkIn?.customCheckIn?.isCheckedInToday,
  )

  const handleOpenKeysPageClick = () => {
    openKeysPage()
  }

  const handleOpenModelsPageClick = () => {
    openModelsPage()
  }

  const handleQuickCheckinClick = () => {
    openAutoCheckinPage({ runNow: "true" })
  }

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
    <section className="pb-3">
      <div className="flex gap-2">
        <Button
          onClick={onPrimaryAction}
          className="h-12 flex-1 touch-manipulation rounded-[1.35rem] text-base"
          size="default"
          leftIcon={<PlusIcon className="h-4 w-4" />}
        >
          {primaryActionLabel}
        </Button>

        <Tooltip content={t("navigation.keys")}>
          <IconButton
            onClick={handleOpenKeysPageClick}
            variant="outline"
            size="default"
            className="subtle-surface h-12 w-12 touch-manipulation rounded-[1.35rem]"
            aria-label={t("navigation.keys")}
          >
            <KeyIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        <Tooltip content={t("navigation.models")}>
          <IconButton
            onClick={handleOpenModelsPageClick}
            variant="outline"
            size="default"
            className="subtle-surface h-12 w-12 touch-manipulation rounded-[1.35rem]"
            aria-label={t("navigation.models")}
          >
            <CpuChipIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        <Tooltip content={t("navigation.autoCheckinRunNow")}>
          <IconButton
            onClick={handleQuickCheckinClick}
            variant="outline"
            size="default"
            className="subtle-surface h-12 w-12 touch-manipulation rounded-[1.35rem]"
            aria-label={t("navigation.autoCheckinRunNow")}
          >
            <CalendarDaysIcon className="h-4 w-4" />
          </IconButton>
        </Tooltip>

        {canOpenExternalCheckIns && (
          <Tooltip content={t("navigation.externalCheckinAllHint")}>
            <IconButton
              onClick={handleOpenExternalCheckInsClick}
              variant="outline"
              size="default"
              className="subtle-surface h-12 w-12 touch-manipulation rounded-[1.35rem]"
              aria-label={t("navigation.externalCheckinAll")}
            >
              {/* Match per-account indicator colors: red when not checked in today, green when done. */}
              <CurrencyYenIcon
                className={`h-4 w-4 ${
                  hasUncheckedExternalCheckIns
                    ? "text-red-500"
                    : "text-green-500"
                }`}
              />
            </IconButton>
          </Tooltip>
        )}
      </div>
    </section>
  )
}
