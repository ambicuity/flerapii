import React from "react"

import { CardItem } from "~/components/ui"
import { useDevice } from "~/contexts/DeviceContext"
import AccountActionButtons from "~/features/AccountManagement/components/AccountActionButtons"
import { useAccountListItem } from "~/features/AccountManagement/components/AccountList/hooks/useAccountListItem"
import type { SearchResultWithHighlight } from "~/features/AccountManagement/hooks/useAccountSearch"
import { cn } from "~/lib/utils"
import type { DisplaySiteData } from "~/types"

import BalanceDisplay from "./BalanceDisplay"
import SiteInfo from "./SiteInfo"

interface AccountListItemProps {
  site: DisplaySiteData
  highlights?: SearchResultWithHighlight["highlights"]
  onCopyKey: (site: DisplaySiteData) => void
  onDeleteWithDialog: (site: DisplaySiteData) => void
}

const AccountListItem: React.FC<AccountListItemProps> = React.memo(
  ({ site, highlights, onCopyKey, onDeleteWithDialog }) => {
    const { handleMouseEnter, handleMouseLeave } = useAccountListItem()
    const { isTouchDevice } = useDevice()

    // PChover
    const revealButtonsClass = isTouchDevice
      ? ""
      : "opacity-0 pointer-events-none group-hover:opacity-100 group-focus-within:opacity-100 group-hover:pointer-events-auto group-focus-within:pointer-events-auto"

    return (
      <CardItem
        padding="none"
        className={cn("group touch-manipulation transition-all duration-150", {
          "opacity-60": site.disabled,
        })}
        data-disabled={site.disabled ? "true" : undefined}
        onMouseEnter={() => handleMouseEnter(site.id)}
        onMouseLeave={handleMouseLeave}
      >
        <div className="grid w-full min-w-0 gap-3 md:grid-cols-[minmax(0,1.15fr)_auto_minmax(11rem,0.75fr)] md:items-center">
          <div className="min-w-[60px] overflow-x-hidden sm:min-w-[80px]">
            <SiteInfo site={site} highlights={highlights} />
          </div>

          <div
            className={`order-3 shrink-0 transition-opacity duration-200 md:order-2 md:justify-self-center ${revealButtonsClass}`}
          >
            <AccountActionButtons
              site={site}
              onDeleteAccount={onDeleteWithDialog}
              onCopyKey={onCopyKey}
            />
          </div>

          <div className="order-2 min-w-[60px] sm:min-w-[80px] md:order-3 md:justify-self-end">
            <BalanceDisplay site={site} />
          </div>
        </div>
      </CardItem>
    )
  },
)

AccountListItem.displayName = "AccountListItem"

export default AccountListItem
