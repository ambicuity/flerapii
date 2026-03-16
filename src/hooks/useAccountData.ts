import { useCallback, useEffect, useMemo, useState } from "react"

import { accountStorage } from "~/services/accounts/accountStorage"
import type {
  AccountStats,
  CurrencyAmount,
  CurrencyAmountMap,
  DisplaySiteData,
  SiteAccount,
} from "~/types"
import { createLogger } from "~/utils/core/logger"

/**
 * Unified logger scoped to account data loading and refresh hooks.
 */
const logger = createLogger("AccountDataHook")

/**
 * Snapshot of account-derived state and handlers returned by {@link useAccountData}.
 * Separates data buckets so the consuming UI can selectively render sections.
 */
interface UseAccountDataResult {
  //
  accounts: SiteAccount[]
  /**
   * Convenience slice of accounts that are not disabled.
   *
   * Backward-compatible: missing/undefined `disabled` is treated as enabled.
   */
  enabledAccounts: SiteAccount[]
  displayData: DisplaySiteData[]
  /**
   * Convenience slice of display data that is not disabled.
   *
   * Backward-compatible: missing/undefined `disabled` is treated as enabled.
   */
  enabledDisplayData: DisplaySiteData[]
  stats: AccountStats
  lastUpdateTime: Date

  //
  isInitialLoad: boolean
  isRefreshing: boolean

  //
  prevTotalConsumption: CurrencyAmount
  prevBalances: CurrencyAmountMap

  //
  loadAccountData: () => Promise<void>
  handleRefresh: () => Promise<{ success: number; failed: number }>
}

/**
 * Build an aggregated account data view sourced from {@link accountStorage}.
 * Exposes helper callbacks so UI layers can refresh or reload on demand.
 */
export const useAccountData = (): UseAccountDataResult => {
  //
  const [accounts, setAccounts] = useState<SiteAccount[]>([])
  const [displayData, setDisplayData] = useState<DisplaySiteData[]>([])
  const [stats, setStats] = useState<AccountStats>({
    total_quota: 0,
    today_total_consumption: 0,
    today_total_requests: 0,
    today_total_prompt_tokens: 0,
    today_total_completion_tokens: 0,
    today_total_income: 0,
  })
  const [lastUpdateTime, setLastUpdateTime] = useState<Date>(new Date())

  //
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)

  //
  const [prevTotalConsumption, setPrevTotalConsumption] = useState({
    USD: 0,
    CNY: 0,
  })
  const [prevBalances, setPrevBalances] = useState<{
    [id: string]: CurrencyAmount
  }>({})

  const enabledAccounts = useMemo(
    () => accounts.filter((account) => account.disabled !== true),
    [accounts],
  )

  const enabledDisplayData = useMemo(
    () => displayData.filter((account) => account.disabled !== true),
    [displayData],
  )

  /**
   * Load the persisted account payloads and recompute UI-ready aggregates.
   * Ensures animations have previous values to interpolate between renders.
   */
  const loadAccountData = useCallback(async () => {
    try {
      const allAccounts = await accountStorage.getAllAccounts()
      const accountStats = await accountStorage.getAccountStats()
      const displaySiteData = accountStorage.convertToDisplayData(allAccounts)

      //
      const newBalances: CurrencyAmountMap = {}
      displaySiteData.forEach((site) => {
        newBalances[site.id] = {
          USD: site.balance.USD,
          CNY: site.balance.CNY,
        }
      })

      //
      if (!isInitialLoad) {
        setPrevTotalConsumption(prevTotalConsumption)
        setPrevBalances(prevBalances)
      }

      //
      setAccounts(allAccounts)
      setStats(accountStats)
      setDisplayData(displaySiteData)

      //
      if (allAccounts.length > 0) {
        const latestSyncTime = Math.max(
          ...allAccounts.map((acc) => acc.last_sync_time),
        )
        if (latestSyncTime > 0) {
          setLastUpdateTime(new Date(latestSyncTime))
        }
      }

      //
      if (isInitialLoad) {
        setIsInitialLoad(false)
      }

      logger.debug("", {
        accountCount: allAccounts.length,
        stats: accountStats,
      })
    } catch (error) {
      logger.error("", error)
    }
  }, [isInitialLoad, prevTotalConsumption, prevBalances])

  /**
   * Trigger remote refresh followed by a local reload, bubbling the result
   * back to the caller so toast logic can reflect success/failure counts.
   */
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true)
    try {
      //
      const refreshResult = await accountStorage.refreshAllAccounts()
      logger.debug("", refreshResult)

      //
      await loadAccountData()
      setLastUpdateTime(new Date())

      //  UI
      return refreshResult
    } catch (error) {
      logger.error("", error)
      //
      await loadAccountData()
      throw error
    } finally {
      setIsRefreshing(false)
    }
  }, [loadAccountData])

  //
  useEffect(() => {
    loadAccountData()
  }, [loadAccountData])

  return {
    //
    accounts,
    enabledAccounts,
    displayData,
    enabledDisplayData,
    stats,
    lastUpdateTime,

    //
    isInitialLoad,
    isRefreshing,

    //
    prevTotalConsumption,
    prevBalances,

    //
    loadAccountData,
    handleRefresh,
  }
}
