import { UI_CONSTANTS } from "~/constants/ui"
import { accountStorage } from "~/services/accounts/accountStorage"
import { normalizeApiTokenKey } from "~/services/apiService/common/apiKey"
import { REQUEST_CONFIG } from "~/services/apiService/common/constant"
import { API_ERROR_CODES, ApiError } from "~/services/apiService/common/errors"
import { fetchAllItems } from "~/services/apiService/common/pagination"
import {
  invalidateResolvedApiTokenKeyCache,
  syncResolvedApiTokenKeyCache,
} from "~/services/apiService/common/tokenKeyResolver"
import {
  AccessTokenInfo,
  AccountData,
  ApiServiceAccountRequest,
  ApiServiceRequest,
  CheckInStatus,
  CreateTokenRequest,
  HealthCheckResult,
  LogResponseData,
  LogType,
  PaginatedTokenResponse,
  PaymentResponse,
  PricingResponse,
  RedeemCodeRequest,
  RefreshAccountResult,
  SiteStatusInfo,
  TodayIncomeData,
  TodayUsageData,
  UserGroupInfo,
  UserInfo,
} from "~/services/apiService/common/type"
import {
  aggregateUsageData,
  extractAmount,
  fetchApi,
  fetchApiData,
  getTodayTimestampRange,
} from "~/services/apiService/common/utils"
import {
  AuthTypeEnum,
  CheckInConfig,
  SiteHealthStatus,
  TEMP_WINDOW_HEALTH_STATUS_CODES,
  type ApiToken,
} from "~/types"
import type {
  CreateChannelPayload,
  ManagedSiteChannel,
  ManagedSiteChannelListData,
  UpdateChannelPayload,
} from "~/types/managedSite"
import { createLogger } from "~/utils/core/logger"
import { t } from "~/utils/i18n/core"

const CHANNEL_API_BASE = "/api/channel/"

const logger = createLogger("ApiServiceCommon")

export {
  fetchTokenSecretKeyById,
  resolveApiTokenKey,
} from "~/services/apiService/common/tokenKeyResolver"

/**
 *
 * @param request ApiServiceRequest baseUrl +
 * @param keyword
 */
export async function searchChannel(
  request: ApiServiceRequest,
  keyword: string,
): Promise<ManagedSiteChannelListData | null> {
  try {
    return await fetchApiData<ManagedSiteChannelListData>(request, {
      endpoint: `${CHANNEL_API_BASE}search?keyword=${encodeURIComponent(keyword)}`,
    })
  } catch (error) {
    if (error instanceof ApiError) {
      logger.error("API ", error)
    } else {
      logger.error("", error)
    }
    return null
  }
}

/**
 *
 * @param request ApiServiceRequest baseUrl +
 * @param channelData
 */
export async function createChannel(
  request: ApiServiceRequest,
  channelData: CreateChannelPayload,
) {
  try {
    const payload = {
      ...channelData,
      channel: {
        ...channelData.channel,
        group: channelData?.channel?.groups?.join(","),
      },
    }

    return await fetchApi<void>(request, {
      endpoint: CHANNEL_API_BASE,
      options: {
        method: "POST",
        body: JSON.stringify(payload),
      },
    })
  } catch (error) {
    logger.error("", error)
    throw new Error("Failed to create channel, check network or API config.")
  }
}

/**
 *
 * @param request ApiServiceRequest baseUrl +
 * @param channelData
 */
export async function updateChannel(
  request: ApiServiceRequest,
  channelData: UpdateChannelPayload,
) {
  try {
    return await fetchApi<void>(request, {
      endpoint: CHANNEL_API_BASE,
      options: {
        method: "PUT",
        body: JSON.stringify(channelData),
      },
    })
  } catch (error) {
    logger.error("", error)
    throw new Error("Failed to update channel, check network or API config.")
  }
}

/**
 *
 * @param request ApiServiceRequest baseUrl +
 * @param channelId  ID
 */
export async function deleteChannel(
  request: ApiServiceRequest,
  channelId: number,
) {
  try {
    return await fetchApi<void>(request, {
      endpoint: `${CHANNEL_API_BASE}${channelId}`,
      options: {
        method: "DELETE",
      },
    })
  } catch (error) {
    logger.error("", error)
    throw new Error("Failed to delete channel, check network or API config.")
  }
}

type ChannelListAllOptions = {
  pageSize?: number
  beforeRequest?: () => Promise<void>
  endpoint?: string
  pageStart?: number
}

/**
 * Fetch all channels from New API with pagination aggregation.
 *
 * Notes:
 * - Aggregates `type_counts` across pages.
 * - Uses the first page's `total` as the authoritative total when later pages omit it.
 * - Optionally invokes a `beforeRequest` hook (e.g. rate limiter) before each page request.
 * @param request ApiServiceRequest baseUrl +
 * @param options Additional pagination options.
 */
export async function listAllChannels(
  request: ApiServiceRequest,
  options?: ChannelListAllOptions,
): Promise<ManagedSiteChannelListData> {
  const pageSize = options?.pageSize ?? REQUEST_CONFIG.DEFAULT_PAGE_SIZE
  const beforeRequest = options?.beforeRequest
  const endpoint = options?.endpoint ?? CHANNEL_API_BASE
  const pageStart = options?.pageStart ?? 1

  let total = 0
  const typeCounts: Record<string, number> = {}

  const items = await fetchAllItems<ManagedSiteChannel>(
    async (page) => {
      const params = new URLSearchParams({
        p: page.toString(),
        page_size: pageSize.toString(),
      })

      await beforeRequest?.()

      const response = await fetchApi<ManagedSiteChannelListData>(
        request,
        { endpoint: `${endpoint}?${params.toString()}` },
        false,
      )

      if (!response.success || !response.data) {
        throw new ApiError(
          response.message || "Failed to fetch channels",
          undefined,
          endpoint,
        )
      }

      const { data } = response
      if (page === pageStart) {
        total = data.total || data.items.length || 0
        Object.assign(typeCounts, data.type_counts || {})
      } else if (data.type_counts) {
        for (const [key, value] of Object.entries(data.type_counts)) {
          typeCounts[key] = (typeCounts[key] || 0) + value
        }
      }

      return {
        items: data.items || [],
        total: total || 0,
      }
    },
    { pageSize, startPage: pageStart },
  )

  return {
    items,
    total,
    type_counts: typeCounts,
  } as ManagedSiteChannelListData
}

/**
 * Fetch raw model list for a given channel.
 * @param request ApiServiceRequest baseUrl +
 * @param channelId Target channel id.
 */
export async function fetchChannelModels(
  request: ApiServiceRequest,
  channelId: number,
): Promise<string[]> {
  const response = await fetchApi<string[]>(
    request,
    { endpoint: `${CHANNEL_API_BASE}fetch_models/${channelId}` },
    false,
  )

  if (!response.success || !Array.isArray(response.data)) {
    throw new ApiError(
      response.message || "Failed to fetch models",
      undefined,
      `${CHANNEL_API_BASE}fetch_models/${channelId}`,
    )
  }

  return response.data
}

/**
 * Update the `models` field for a channel.
 * @param request ApiServiceRequest baseUrl +
 * @param channelId Channel id.
 * @param models Comma-separated model list.
 */
export async function updateChannelModels(
  request: ApiServiceRequest,
  channelId: number,
  models: string,
): Promise<void> {
  const payload: UpdateChannelPayload = {
    id: channelId,
    models,
  }

  const response = await fetchApi<void>(
    request,
    {
      endpoint: CHANNEL_API_BASE,
      options: {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    },
    false,
  )

  if (!response.success) {
    throw new ApiError(
      response.message || "Failed to update channel",
      undefined,
    )
  }
}

/**
 * Update the `models` and `model_mapping` fields for a channel.
 * @param request ApiServiceRequest baseUrl +
 * @param channelId Channel id.
 * @param models Comma-separated model list.
 * @param modelMappingJson Stringified mapping JSON.
 */
export async function updateChannelModelMapping(
  request: ApiServiceRequest,
  channelId: number,
  models: string,
  modelMappingJson: string,
): Promise<void> {
  const payload: UpdateChannelPayload = {
    id: channelId,
    models,
    model_mapping: modelMappingJson,
  }

  const response = await fetchApi<void>(
    request,
    {
      endpoint: CHANNEL_API_BASE,
      options: {
        method: "PUT",
        body: JSON.stringify(payload),
      },
    },
    false,
  )

  if (!response.success) {
    throw new ApiError(
      response.message || "Failed to update channel mapping",
      undefined,
    )
  }
}

/**
 * Fetch basic user info for account detection using cookie auth.
 * @param request ApiServiceRequest (cookie-auth).
 * @returns Minimal user profile plus access token if present.
 */
export async function fetchUserInfo(request: ApiServiceRequest): Promise<{
  id: number
  username: string
  access_token: string
  user: UserInfo
}> {
  const userData = await fetchApiData<UserInfo>(request, {
    endpoint: "/api/user/self",
  })

  return {
    id: userData.id,
    username: userData.username,
    access_token: userData.access_token || "",
    user: userData,
  }
}

/**
 * Create an access token using cookie auth for the given user.
 * @param request ApiServiceRequest (cookie-auth).
 * @returns Newly created access token string.
 */
export async function createAccessToken(
  request: ApiServiceRequest,
): Promise<string> {
  return await fetchApiData<string>(request, {
    endpoint: "/api/user/token",
  })
}

/**
 * Fetch site status (includes pricing/exchange data).
 * Always treated as a public endpoint (authType forced to `None`).
 * @returns Site status info or null when unavailable.
 */
export async function fetchSiteStatus(
  request: ApiServiceRequest,
): Promise<SiteStatusInfo | null> {
  const publicRequest: ApiServiceRequest = {
    ...request,
    auth: { authType: AuthTypeEnum.None },
  }

  try {
    return await fetchApiData<SiteStatusInfo>(publicRequest, {
      endpoint: "/api/status",
    })
  } catch (error) {
    logger.warn("", error)
    return null
  }
}

/**
 * Extract default exchange rate (USD) from status info with fallback order.
 * @param statusInfo Site status response.
 * @returns Preferred numeric rate or null if absent.
 */
export const extractDefaultExchangeRate = (
  statusInfo: SiteStatusInfo | null,
): number | null => {
  if (!statusInfo) {
    return null
  }

  //  price
  if (statusInfo.price && statusInfo.price > 0) {
    return statusInfo.price
  }

  //  stripe_unit_price
  if (statusInfo.stripe_unit_price && statusInfo.stripe_unit_price > 0) {
    return statusInfo.stripe_unit_price
  }

  //  done-hub  one-hub
  if (statusInfo.PaymentUSDRate && statusInfo.PaymentUSDRate > 0) {
    return statusInfo.PaymentUSDRate
  }

  return null
}

/**
 * Fetch payment info (RIX_API specific; kept in common for fallback).
 * @param request ApiServiceRequest.
 * @returns Payment summary from backend.
 */
export async function fetchPaymentInfo(
  request: ApiServiceRequest,
): Promise<PaymentResponse> {
  try {
    return await fetchApi<PaymentResponse>(
      request,
      { endpoint: "/api/user/payment" },
      true,
    )
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Get existing access token or create one via cookie-auth fallback.
 * @param request ApiServiceRequest (cookie-auth).
 * @returns Username + access token (newly created if missing).
 */
export async function getOrCreateAccessToken(
  request: ApiServiceRequest,
): Promise<AccessTokenInfo> {
  //
  const userInfo = await fetchUserInfo(request)

  let accessToken = userInfo.access_token

  //
  if (!accessToken) {
    logger.info("")
    accessToken = await createAccessToken(request)
    logger.info("")
  }

  return {
    username: userInfo.username,
    access_token: accessToken,
  }
}

/**
 * Fetch account quota/balance.
 * @param request ApiServiceRequest.
 * @returns Remaining quota (0 if missing).
 */
export async function fetchAccountQuota(
  request: ApiServiceRequest,
): Promise<number> {
  const userData = await fetchApiData<{ quota?: number }>(request, {
    endpoint: "/api/user/self",
  })

  return userData.quota || 0
}

/**
 * Fetch check-in capability for the user.
 * @param request ApiServiceRequest.
 * @returns True/false when available; undefined if unsupported or errors.
 */
export async function fetchCheckInStatus(
  request: ApiServiceRequest,
): Promise<boolean | undefined> {
  const currentMonth = new Date().toISOString().slice(0, 7)
  try {
    const checkInData = await fetchApiData<CheckInStatus>(request, {
      endpoint: `/api/user/checkin?month=${currentMonth}`,
    })
    //
    return !checkInData.stats.checked_in_today
  } catch (error) {
    //  404 Not Found
    if (
      error instanceof ApiError &&
      (error.statusCode === 404 || error.statusCode === 500)
    ) {
      return undefined
    }
    logger.warn("", error)
    return undefined //
  }
}

/**
 * Check if site supports check-in based on status info.
 * @param request ApiServiceRequest.
 * @returns Whether check-in is enabled (undefined when unknown).
 */
export async function fetchSupportCheckIn(
  request: ApiServiceRequest,
): Promise<boolean | undefined> {
  const siteStatus = await fetchSiteStatus(request)
  return siteStatus?.checkin_enabled
}

/**
 * Fetch paginated logs and aggregate results.
 * @param request ApiServiceRequest.
 * @param logTypes Log categories to fetch.
 * @param dataAggregator Reducer to merge items into accumulator.
 * @param initialValue Initial accumulator value.
 * @param errorHandler Optional handler per log type error.
 * @returns Aggregated value after pagination.
 */
const fetchPaginatedLogs = async <T>(
  request: ApiServiceRequest,
  logTypes: LogType[],
  dataAggregator: (accumulator: T, items: LogResponseData["items"]) => T,
  initialValue: T,
  errorHandler?: (error: unknown, logType: LogType) => void,
): Promise<T> => {
  const { start: startTimestamp, end: endTimestamp } = getTodayTimestampRange()
  let aggregatedData = initialValue
  let maxPageReached = false

  for (const logType of logTypes) {
    try {
      let currentPage = 1
      while (currentPage <= REQUEST_CONFIG.MAX_PAGES) {
        const params = new URLSearchParams({
          p: currentPage.toString(),
          page_size: REQUEST_CONFIG.DEFAULT_PAGE_SIZE.toString(),
          type: String(logType),
          token_name: "",
          model_name: "",
          start_timestamp: startTimestamp.toString(),
          end_timestamp: endTimestamp.toString(),
          group: "",
        })

        const logData = await fetchApiData<LogResponseData>(request, {
          endpoint: `/api/log/self?${params.toString()}`,
        })

        const items = logData.items || []
        aggregatedData = dataAggregator(aggregatedData, items)

        const totalPages = Math.ceil(
          (logData.total || 0) / REQUEST_CONFIG.DEFAULT_PAGE_SIZE,
        )
        if (currentPage >= totalPages) {
          break
        }
        currentPage++
      }

      if (currentPage > REQUEST_CONFIG.MAX_PAGES) {
        maxPageReached = true
      }
    } catch (error) {
      if (errorHandler) {
        errorHandler(error, logType)
      } else {
        logger.warn("", { logType, error })
      }
    }
  }

  if (maxPageReached) {
    logger.warn("", {
      maxPages: REQUEST_CONFIG.MAX_PAGES,
    })
  }

  return aggregatedData
}

/**
 * Fetch today's usage (quota + token counts + request count).
 * @param request ApiServiceAccountRequest (uses `includeTodayCashflow` to gate expensive log fetches).
 * @returns Usage totals for the current day.
 */
export async function fetchTodayUsage(
  request: ApiServiceAccountRequest,
): Promise<TodayUsageData> {
  const initialState = {
    today_quota_consumption: 0,
    today_prompt_tokens: 0,
    today_completion_tokens: 0,
    today_requests_count: 0,
  }

  if (request.includeTodayCashflow === false) {
    return initialState
  }

  const usageAggregator = (
    accumulator: typeof initialState,
    items: LogResponseData["items"],
  ) => {
    const pageData = aggregateUsageData(items)
    accumulator.today_quota_consumption += pageData.today_quota_consumption
    accumulator.today_prompt_tokens += pageData.today_prompt_tokens
    accumulator.today_completion_tokens += pageData.today_completion_tokens
    accumulator.today_requests_count += items?.length || 0
    return accumulator
  }

  return fetchPaginatedLogs(
    request,
    [LogType.Consume],
    usageAggregator,
    initialState,
  )
}

/**
 * Fetch today's income (recharge/system logs).
 * @param request ApiServiceAccountRequest (uses `includeTodayCashflow` to gate expensive log fetches).
 * @returns Total income amount for today.
 */
export async function fetchTodayIncome(
  request: ApiServiceAccountRequest,
): Promise<TodayIncomeData> {
  if (request.includeTodayCashflow === false) {
    return { today_income: 0 }
  }

  const { baseUrl } = request
  const { userId } = request.auth
  let exchangeRate: number = UI_CONSTANTS.EXCHANGE_RATE.DEFAULT

  const account = request.accountId
    ? await accountStorage.getAccountById(request.accountId)
    : userId === undefined
      ? null
      : await accountStorage.getAccountByBaseUrlAndUserId(baseUrl, userId)

  if (account?.exchange_rate) {
    exchangeRate = account.exchange_rate
  }
  const incomeAggregator = (
    accumulator: number,
    items: LogResponseData["items"],
  ) => {
    return (
      accumulator +
      (items?.reduce(
        (sum, item) =>
          sum +
          (item.quota ||
            UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR *
              (extractAmount(item.content, exchangeRate)?.amount ?? 0)),
        0,
      ) || 0)
    )
  }

  const totalIncome = await fetchPaginatedLogs(
    request,
    [LogType.Topup, LogType.System],
    incomeAggregator,
    0,
    (error, logType) => {
      const typeName = logType === LogType.Topup ? "" : ""
      logger.warn("", { typeName, error })
    },
  )

  return { today_income: totalIncome }
}

/**
 * Fetch full account snapshot (quota, usage, income, check-in).
 * @param request ApiServiceRequest (use `request.checkIn` for check-in config).
 * @returns Aggregated account data with check-in state.
 */
export async function fetchAccountData(
  request: ApiServiceAccountRequest,
): Promise<AccountData> {
  const resolvedCheckIn: CheckInConfig = request.checkIn

  const quotaPromise = fetchAccountQuota(request)
  const todayUsagePromise = fetchTodayUsage(request)
  const todayIncomePromise = fetchTodayIncome(request)
  const checkInPromise = resolvedCheckIn?.enableDetection
    ? fetchCheckInStatus(request)
    : Promise.resolve<boolean | undefined>(undefined)

  const [quota, todayUsage, todayIncome, canCheckIn] = await Promise.all([
    quotaPromise,
    todayUsagePromise,
    todayIncomePromise,
    checkInPromise,
  ])

  const didDetectCheckInStatus = resolvedCheckIn?.enableDetection === true
  const checkInDetectedAt = didDetectCheckInStatus
    ? Date.now()
    : resolvedCheckIn.siteStatus?.lastDetectedAt

  return {
    quota,
    ...todayUsage,
    ...todayIncome,
    checkIn: {
      ...resolvedCheckIn,
      siteStatus: {
        ...(resolvedCheckIn.siteStatus ?? {}),
        // `canCheckIn` means "can check in today" (i.e. NOT checked-in yet).
        // Map it into the UI-facing `isCheckedInToday` flag and keep `undefined`
        // when upstream does not provide a reliable status.
        isCheckedInToday: didDetectCheckInStatus
          ? canCheckIn === undefined
            ? undefined
            : !canCheckIn
          : resolvedCheckIn.siteStatus?.isCheckedInToday,
        lastDetectedAt: checkInDetectedAt,
      },
    },
  }
}

/**
 * Refresh a single account's data and return health status.
 * @param request ApiServiceRequest (use `request.checkIn` for check-in config).
 * @returns Success flag, data (when success), and health status.
 */
export async function refreshAccountData(
  request: ApiServiceAccountRequest,
): Promise<RefreshAccountResult> {
  try {
    const data = await fetchAccountData(request)
    return {
      success: true,
      data,
      healthStatus: {
        status: SiteHealthStatus.Healthy,
        message: t("account:healthStatus.normal"),
      },
    }
  } catch (error) {
    logger.error("", error)
    return {
      success: false,
      healthStatus: determineHealthStatus(error),
    }
  }
}

/**
 * Validate account connectivity by fetching quota.
 * @param request ApiServiceRequest.
 * @returns True if quota fetch succeeds, else false.
 */
export async function validateAccountConnection(
  request: ApiServiceRequest,
): Promise<boolean> {
  try {
    await fetchAccountQuota(request)
    return true
  } catch (error) {
    logger.error("", error)
    return false
  }
}

/**
 * Fetch the API token list for a user and normalize multiple response shapes.
 *
 * Some upstreams return a simple array, while others wrap the data in a
 * paginated envelope. This helper hides those differences and always returns
 * a flat array so the UI can treat both responses identically.
 * @param request ApiServiceRequest.
 * @param page Pagination index (defaults to first page).
 * @param size Page size in records (defaults to 100, matching upstream default).
 * @returns Normalized list of API tokens.
 */
export async function fetchAccountTokens(
  request: ApiServiceRequest,
  page: number = 0,
  size: number = 100,
): Promise<ApiToken[]> {
  const searchParams = new URLSearchParams({
    p: page.toString(),
    size: size.toString(),
  })

  try {
    //
    const tokensData = await fetchApiData<ApiToken[] | PaginatedTokenResponse>(
      request,
      {
        endpoint: `/api/token/?${searchParams.toString()}`,
      },
    )

    //
    if (Array.isArray(tokensData)) {
      //
      const normalizedTokens = tokensData.map(normalizeApiTokenKey)
      syncResolvedApiTokenKeyCache(request, normalizedTokens)
      return normalizedTokens
    } else if (
      tokensData &&
      typeof tokensData === "object" &&
      "items" in tokensData
    ) {
      //  items
      const normalizedTokens = (tokensData.items || []).map(
        normalizeApiTokenKey,
      )
      syncResolvedApiTokenKeyCache(request, normalizedTokens)
      return normalizedTokens
    } else {
      //
      syncResolvedApiTokenKeyCache(request, [])
      logger.warn("Unexpected token response format", {
        receivedType: Array.isArray(tokensData) ? "array" : typeof tokensData,
        keys:
          tokensData && typeof tokensData === "object"
            ? Object.keys(tokensData as any)
            : null,
      })
      return []
    }
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Fetch the list of downstream model identifiers that an account can access.
 *
 * This hits `/api/user/models`, which typically returns a flat array of model
 * IDs that should be displayed to the user when configuring per-account model
 * visibility.
 * @param request ApiServiceRequest.
 * @returns Array of model identifiers allowed for the account.
 */
export async function fetchAccountAvailableModels(
  request: ApiServiceRequest,
): Promise<string[]> {
  try {
    return await fetchApiData<string[]>(request, {
      endpoint: "/api/user/models",
    })
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Fetch user-group assignments for the authenticated account.
 *
 * The upstream returns a record keyed by group name with metadata describing
 * entitlements. Consumers use this to render per-account permissions.
 * @param request ApiServiceRequest.
 * @returns Mapping of group names to metadata.
 */
export async function fetchUserGroups(
  request: ApiServiceRequest,
): Promise<Record<string, UserGroupInfo>> {
  try {
    return await fetchApiData<Record<string, UserGroupInfo>>(request, {
      endpoint: "/api/user/self/groups",
    })
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Fetch the complete list of user groups defined on the site.
 *
 * Unlike {@link fetchUserGroups}, this endpoint returns every group identifier
 * (not just those tied to the current user) and is primarily used for admin
 * UI when editing assignments.
 * @param request ApiServiceRequest.
 * @returns Array of group IDs available on the site.
 * @throws {ApiError} when the upstream response fails.
 */
export async function fetchSiteUserGroups(
  request: ApiServiceRequest,
): Promise<Array<string>> {
  try {
    return await fetchApiData<Array<string>>(request, {
      endpoint: "/api/group",
    })
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Create a new API token for the specified account.
 * @param request ApiServiceRequest.
 * @param tokenData Form payload describing the token (scopes, name, etc.).
 * @returns True when the upstream confirms `success === true`.
 * @throws {ApiError} if the server reports a failure.
 */
export async function createApiToken(
  request: ApiServiceRequest,
  tokenData: CreateTokenRequest,
): Promise<boolean> {
  try {
    const response = await fetchApi<any>(request, {
      endpoint: "/api/token/",
      options: {
        method: "POST",
        body: JSON.stringify(tokenData),
      },
    })

    // successdata
    if (!response.success) {
      throw new ApiError(response.message || "", undefined, "/api/token")
    }

    invalidateResolvedApiTokenKeyCache(request)
    return true
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Fetch a single API token by its identifier.
 * @param request ApiServiceRequest.
 * @param tokenId Token identifier to retrieve.
 * @returns Detailed token representation from upstream.
 * @throws {ApiError} when the backend reports a failure.
 */
export async function fetchTokenById(
  request: ApiServiceRequest,
  tokenId: number,
): Promise<ApiToken> {
  try {
    const token = await fetchApiData<ApiToken>(request, {
      endpoint: `/api/token/${tokenId}`,
    })
    return normalizeApiTokenKey(token)
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Update an existing API token in place.
 * @param request ApiServiceRequest.
 * @param tokenId Identifier of the token being updated.
 * @param tokenData Updated fields (name/scopes/etc.).
 * @returns True when upstream returns `success === true`.
 * @throws {ApiError} if the update fails upstream.
 */
export async function updateApiToken(
  request: ApiServiceRequest,
  tokenId: number,
  tokenData: CreateTokenRequest,
): Promise<boolean> {
  try {
    const response = await fetchApi<any>(request, {
      endpoint: "/api/token/",
      options: {
        method: "PUT",
        body: JSON.stringify({ ...tokenData, id: tokenId }),
      },
    })

    if (!response.success) {
      throw new ApiError(response.message || "", undefined, "/api/token")
    }

    invalidateResolvedApiTokenKeyCache(request)
    return true
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Delete an API token permanently.
 * @param request ApiServiceRequest.
 * @param tokenId Identifier of the token to delete.
 * @returns True when the deletion succeeds upstream.
 * @throws {ApiError} when the backend reports failure.
 */
export async function deleteApiToken(
  request: ApiServiceRequest,
  tokenId: number,
): Promise<boolean> {
  try {
    const response = await fetchApi<any>(request, {
      endpoint: `/api/token/${tokenId}`,
      options: {
        method: "DELETE",
      },
    })

    if (!response.success) {
      throw new ApiError(
        response.message || "",
        undefined,
        `/api/token/${tokenId}`,
      )
    }

    invalidateResolvedApiTokenKeyCache(request)
    return true
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Fetch model pricing metadata for the authenticated account.
 *
 * The `/api/pricing` endpoint returns a rich `PricingResponse` payload; unlike
 * other helpers we use `fetchApi` directly because the upstream is already in
 * the desired shape and may include additional metadata beyond `data`.
 * @param request ApiServiceRequest.
 * @returns Pricing response as provided by upstream.
 */
export async function fetchModelPricing(
  request: ApiServiceRequest,
): Promise<PricingResponse> {
  try {
    // /api/pricing  PricingResponse  apiRequestData
    return await fetchApi<PricingResponse>(
      request,
      { endpoint: "/api/pricing" },
      true,
    )
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Redeem a code to top up account quota.
 * @param request ApiServiceRequest.
 * @param redemptionCode Redemption code string.
 * @returns Amount of quota redeemed.
 * @throws {ApiError} when redemption fails upstream.
 */
export async function redeemCode(
  request: ApiServiceRequest,
  redemptionCode: string,
): Promise<number> {
  try {
    const requestData: RedeemCodeRequest = {
      key: redemptionCode,
    }

    return await fetchApiData<number>(request, {
      endpoint: "/api/user/topup",
      options: {
        method: "POST",
        body: JSON.stringify(requestData),
      },
    })
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

// =============  =============

/**
 * Map runtime errors to the user-facing health status shown in the dashboard.
 *
 * - API errors with HTTP response codes become `Warning` with rich messaging.
 * - API errors without HTTP codes (schema issues, etc.) render as `Unknown`.
 * - Network-level `TypeError`s become `Error` to highlight connectivity issues.
 * - Any other error falls back to `Unknown` to avoid misleading the user.
 * @param error Arbitrary runtime error thrown during refresh.
 * @returns Health status object suitable for persistence + UI display.
 */
export const determineHealthStatus = (error: any): HealthCheckResult => {
  if (error instanceof ApiError) {
    // Temp-window fallback was eligible, but blocked by user config or permissions.
    // Surface a direct reminder so the health tooltip can guide the user.
    if (error.code === API_ERROR_CODES.TEMP_WINDOW_DISABLED) {
      return {
        status: SiteHealthStatus.Warning,
        message: t("account:healthStatus.tempWindowDisabled"),
        code: TEMP_WINDOW_HEALTH_STATUS_CODES.DISABLED,
      }
    }
    if (error.code === API_ERROR_CODES.TEMP_WINDOW_PERMISSION_REQUIRED) {
      return {
        status: SiteHealthStatus.Warning,
        message: t("account:healthStatus.tempWindowPermissionRequired"),
        code: TEMP_WINDOW_HEALTH_STATUS_CODES.PERMISSION_REQUIRED,
      }
    }

    // HTTP200
    if (error.statusCode) {
      return {
        status: SiteHealthStatus.Warning,
        message: t("account:healthStatus.httpError", {
          statusCode: error.statusCode,
          message: error.message,
        }),
      }
    }
    // API
    return {
      status: SiteHealthStatus.Unknown,
      message: error.message || t("account:healthStatus.apiError"),
    }
  }

  // HTTP
  if (error instanceof TypeError && error.message.includes("fetch")) {
    return {
      status: SiteHealthStatus.Error,
      message: t("account:healthStatus.networkFailed"),
    }
  }

  //
  return {
    status: SiteHealthStatus.Unknown,
    message: error.message || t("account:healthStatus.unknownError"),
  }
}
