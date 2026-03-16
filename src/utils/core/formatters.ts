import dayjs from "dayjs"
import relativeTime from "dayjs/plugin/relativeTime"

import { CURRENCY_SYMBOLS, UI_CONSTANTS } from "~/constants/ui"
import type {
  AccountStats,
  ApiToken,
  CurrencyType,
  DisplaySiteData,
  SortOrder,
} from "~/types"
import { formatMoneyFixed } from "~/utils/core/money"
import { t } from "~/utils/i18n/core"

//  dayjs
dayjs.extend(relativeTime)

/**
 *  Token
 */
export const formatTokenCount = (count: number): string => {
  if (count >= UI_CONSTANTS.TOKEN.MILLION_THRESHOLD) {
    return (count / UI_CONSTANTS.TOKEN.MILLION_THRESHOLD).toFixed(1) + "M"
  } else if (count >= UI_CONSTANTS.TOKEN.THOUSAND_THRESHOLD) {
    return (count / UI_CONSTANTS.TOKEN.THOUSAND_THRESHOLD).toFixed(1) + "K"
  }
  return count.toString()
}

export function normalizeToMs(input: number | string | Date): number | null
export function normalizeToMs(input: null | undefined): null
export function normalizeToMs(
  input: number | string | Date | null | undefined,
): number | null
/**
 *
 * /Date
 * @param input -  number | string | Date | null | undefined
 * @returns number | null   null
 */
export function normalizeToMs(
  input: string | number | Date | null | undefined,
) {
  if (input == null) return null

  if (input instanceof Date) {
    const time = input.getTime()
    return Number.isNaN(time) ? null : time
  }

  if (typeof input === "string") {
    const trimmed = input.trim()
    if (!trimmed) return null

    const ts = Number(trimmed)
    if (Number.isFinite(ts)) {
      if (ts < 1e12) {
        return ts * 1000
      }

      return Math.round(ts)
    }

    const date = new Date(trimmed)
    const time = date.getTime()
    return Number.isNaN(time) ? null : time
  }

  if (!Number.isFinite(input)) return null

  // 1e12  ≈ 2001
  if (input < 1e12) {
    return input * 1000
  }

  return Math.round(input)
}

export function normalizeToDate(input: number | string | Date): Date | null
export function normalizeToDate(input: null | undefined): null
export function normalizeToDate(
  input: number | string | Date | null | undefined,
): Date | null

/**
 *  Date
 * @param input -
 * @returns Date | null
 */
export function normalizeToDate(
  input: number | string | Date | null | undefined,
): Date | null {
  const ms = normalizeToMs(input)
  return ms == null ? null : new Date(ms)
}

/**
 * Best-effort locale datetime formatter for timestamps (seconds/ms), Date
 * objects, and ISO/date strings.
 */
export const formatLocaleDateTime = (
  input: number | string | Date | null | undefined,
  fallback: string = t("common:labels.notAvailable"),
): string => {
  const date = normalizeToDate(input)
  if (!date || Number.isNaN(date.getTime()) || date.getTime() <= 0) {
    return fallback
  }

  try {
    return date.toLocaleString()
  } catch {
    return fallback
  }
}

/**
 * Format a numeric timestamp for key expiration fields.
 * Falls back to localized "never expires" copy when timestamp is <= 0.
 */
export const formatKeyTime = (timestamp: number) => {
  if (timestamp <= 0) return t("keyManagement:keyDetails.neverExpires")

  const date = normalizeToDate(timestamp)
  if (!date) return t("common:labels.notAvailable")

  return date.toLocaleDateString()
}

/**
 *
 */
export const formatRelativeTime = (date: Date | undefined): string => {
  if (!date) {
    return ""
  }
  return dayjs(date).fromNow()
}

/**
 *
 */
export const formatFullTime = (date: Date | undefined): string => {
  if (!date) {
    return ""
  }
  return dayjs(date).format("YYYY/MM/DD HH:mm:ss")
}

/**
 *
 */
export const calculateTotalConsumption = (
  stats: AccountStats,
  accounts: any[],
) => {
  const usdAmount =
    stats.today_total_consumption / UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR
  const cnyAmount = accounts.reduce(
    (sum, acc) =>
      sum +
      (acc.account_info.today_quota_consumption /
        UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR) *
        acc.exchange_rate,
    0,
  )

  return {
    USD: usdAmount,
    CNY: cnyAmount,
  }
}

/**
 *
 *
 * Total Balance excludes:
 * - disabled accounts ({@link DisplaySiteData.disabled})
 * - enabled but explicitly excluded accounts ({@link DisplaySiteData.excludeFromTotalBalance})
 */
export const calculateTotalBalance = (displayData: DisplaySiteData[]) => {
  const enabledSites = displayData.filter(
    (site) => !site.disabled && site.excludeFromTotalBalance !== true,
  )
  return {
    USD: enabledSites.reduce((sum, site) => sum + site.balance.USD, 0),
    CNY: enabledSites.reduce((sum, site) => sum + site.balance.CNY, 0),
  }
}

/**
 * Convenience wrapper to derive aggregate balances from a subset of sites.
 * Delegates to {@link calculateTotalBalance} for the actual sum logic.
 */
export const calculateTotalBalanceForSites = (sites: DisplaySiteData[]) =>
  calculateTotalBalance(sites)

/**
 * Sum per-site consumption metrics into global USD/CNY totals.
 * @param sites Display-ready site collection containing `todayConsumption`.
 */
export const calculateTotalConsumptionForSites = (sites: DisplaySiteData[]) => {
  const enabledSites = sites.filter((site) => !site.disabled)
  const usd = enabledSites.reduce(
    (sum, site) => sum + site.todayConsumption.USD,
    0,
  )
  const cny = enabledSites.reduce(
    (sum, site) => sum + site.todayConsumption.CNY,
    0,
  )

  return {
    USD: usd,
    CNY: cny,
  }
}

/**
 *
 */
export const getCurrencySymbol = (currencyType: CurrencyType): string => {
  return CURRENCY_SYMBOLS[currencyType]
}

/**
 *
 */
export const getCurrencyDisplayName = (currencyType: CurrencyType): string => {
  return currencyType === "USD"
    ? t("common:currency.usd")
    : t("common:currency.cny")
}

/**
 *
 */
export const getOppositeCurrency = (
  currencyType: CurrencyType,
): CurrencyType => {
  return currencyType === "USD" ? "CNY" : "USD"
}

/**
 *
 */
export const createSortComparator = <T>(field: keyof T, order: SortOrder) => {
  return (a: T, b: T): number => {
    const aValue = a[field]
    const bValue = b[field]

    if (order === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  }
}

/**
 *
 */
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number,
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout | null = null

  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout)
    }
    timeout = setTimeout(() => func(...args), wait)
  }
}

/**
 *
 */
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number,
): ((...args: Parameters<T>) => void) => {
  let inThrottle = false

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 *
 */
export const formatQuota = (token: ApiToken) => {
  if (token.unlimited_quota || token.remain_quota < 0) {
    return t("common:quota.unlimited")
  }

  // CONVERSION_FACTOR
  const realQuota =
    token.remain_quota / UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR
  return `$${formatMoneyFixed(realQuota)}`
}

/**
 *
 */
export const formatUsedQuota = (token: ApiToken) => {
  const realUsedQuota =
    token.used_quota / UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR
  return `$${formatMoneyFixed(realUsedQuota)}`
}

/**
 *
 */
export const formatTimestamp = (timestamp: number) => {
  if (timestamp <= 0) {
    return t("common:time.neverExpires")
  }

  const date = normalizeToDate(timestamp)
  if (!date) return t("common:labels.notAvailable")

  return date.toLocaleDateString()
}

/**
 *
 */
export const getGroupBadgeStyle = (group: string) => {
  //  group
  const groupName = group || "default"

  //
  const hash = groupName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0)
    return a & a
  }, 0)

  const colors = [
    "bg-blue-100 text-blue-800 border-blue-200",
    "bg-green-100 text-green-800 border-green-200",
    "bg-purple-100 text-purple-800 border-purple-200",
    "bg-orange-100 text-orange-800 border-orange-200",
    "bg-pink-100 text-pink-800 border-pink-200",
    "bg-indigo-100 text-indigo-800 border-indigo-200",
    "bg-teal-100 text-teal-800 border-teal-200",
    "bg-yellow-100 text-yellow-800 border-yellow-200",
  ]

  return colors[Math.abs(hash) % colors.length]
}

/**
 *
 */
export const getStatusBadgeStyle = (status: number) => {
  return status === 1
    ? "bg-green-100 text-green-800 border-green-200"
    : "bg-red-100 text-red-800 border-red-200"
}
