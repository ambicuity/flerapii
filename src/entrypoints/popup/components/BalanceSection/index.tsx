import { useUserPreferencesContext } from "~/contexts/UserPreferencesContext"

import AccountBalanceSummary from "./AccountBalanceSummary"
import { TokenStats } from "./TokenStats"
import { UpdateTimeAndWarning } from "./UpdateTimeAndWarning"

/**
 * Account overview content for the popup.
 * Background and padding are owned by the parent container.
 */
const BalanceSection = () => {
  const { showTodayCashflow } = useUserPreferencesContext()

  return (
    <div className="space-y-3">
      <AccountBalanceSummary />
      {showTodayCashflow && <TokenStats />}
      <UpdateTimeAndWarning />
    </div>
  )
}

export default BalanceSection
