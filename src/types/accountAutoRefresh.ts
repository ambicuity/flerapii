export interface AccountAutoRefresh {
  //
  enabled: boolean
  //
  interval: number
  //
  minInterval: number
  //
  refreshOnOpen: boolean
}

/**
 * Lower bounds for user-configurable refresh cadences (seconds).
 *
 * - `interval`: background auto-refresh timer cadence.
 * - `minInterval`: per-account guard interval used when refresh isn't forced.
 */
export const ACCOUNT_AUTO_REFRESH_INTERVAL_MIN_SECONDS = 60
export const ACCOUNT_AUTO_REFRESH_MIN_INTERVAL_MIN_SECONDS = 30

export const DEFAULT_ACCOUNT_AUTO_REFRESH: AccountAutoRefresh = {
  enabled: false,
  interval: 900,
  minInterval: 120,
  refreshOnOpen: false,
}
