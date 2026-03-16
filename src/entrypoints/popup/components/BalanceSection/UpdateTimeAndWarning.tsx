import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import Tooltip from "~/components/Tooltip"
import { Badge, Caption } from "~/components/ui"
import { UI_CONSTANTS } from "~/constants/ui"
import { useAccountDataContext } from "~/features/AccountManagement/hooks/AccountDataContext"
import { formatFullTime, formatRelativeTime } from "~/utils/core/formatters"

export const UpdateTimeAndWarning = () => {
  const { t } = useTranslation("account")
  const { displayData, lastUpdateTime, detectedAccount, detectedSiteAccounts } =
    useAccountDataContext()
  const [, setTick] = useState(0)
  const accountNameById = useMemo(
    () =>
      new Map(
        displayData.map((account) => [account.id, account.name] as const),
      ),
    [displayData],
  )

  const detectedAccountName = detectedAccount
    ? accountNameById.get(detectedAccount.id) ?? detectedAccount.site_name
    : null
  const detectedSiteAccountName =
    detectedSiteAccounts.length > 0
      ? accountNameById.get(detectedSiteAccounts[0].id) ??
        detectedSiteAccounts[0].site_name
      : null
  const hasMultipleDetectedSiteAccounts =
    !detectedAccount && detectedSiteAccounts.length > 1

  useEffect(() => {
    //  tick
    //  " X "
    //
    const timer = setInterval(
      () => setTick((t) => t + 1),
      UI_CONSTANTS.UPDATE_INTERVAL,
    )
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="subtle-surface flex items-center justify-between gap-2 rounded-[1.35rem] px-3 py-2">
      <Tooltip content={formatFullTime(lastUpdateTime)}>
        <Caption className="cursor-help text-slate-500 dark:text-slate-400">
          {t("common:time.updatedAt", {
            time: formatRelativeTime(lastUpdateTime),
          })}
        </Caption>
      </Tooltip>
      {detectedSiteAccounts.length > 0 && (
        <Badge variant="warning" size="sm">
          {detectedAccount
            ? t("currentLoginAdded", { siteName: detectedAccountName })
            : hasMultipleDetectedSiteAccounts
              ? t("currentSiteAddedCount", {
                  count: detectedSiteAccounts.length,
                })
              : t("currentSiteAdded", {
                  siteName: detectedSiteAccountName,
                })}
        </Badge>
      )}
    </div>
  )
}
