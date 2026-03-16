/**
 * API  -  One API/New API
 */
import type { PerCallPrice } from "~/services/models/utils/modelPricing"
import {
  ApiToken,
  AuthTypeEnum,
  CheckInConfig,
  SiteHealthStatus,
  TempWindowHealthStatusCode,
  type Sub2ApiAuthConfig,
} from "~/types"
import type {
  TempWindowFallbackAllowlist,
  TempWindowResponseType,
} from "~/types/tempWindowFetch"

// =============  =============
export interface UserInfo {
  id: number
  username: string
  access_token: string | null
}

export interface AccessTokenInfo {
  username: string
  access_token: string
}

export interface TodayUsageData {
  today_quota_consumption: number
  today_prompt_tokens: number
  today_completion_tokens: number
  today_requests_count: number
}

export interface TodayIncomeData {
  today_income: number
}

export type TodayStatsData = TodayUsageData & TodayIncomeData

export interface AccountData extends TodayStatsData {
  quota: number
  /**
   * Legacy flag indicating whether the account can be checked in today.
   * @deprecated Use `checkIn.siteStatus.isCheckedInToday` instead.
   */
  can_check_in?: boolean
  checkIn: CheckInConfig
}

export interface RefreshAccountResult {
  success: boolean
  data?: AccountData
  healthStatus: HealthCheckResult
  /**
   * Optional auth/identity updates discovered during refresh.
   *
   * This is used by site implementations that can re-sync credentials from a
   * browser context (e.g., Sub2API JWT stored in localStorage) without
   * re-authenticating the user.
   */
  authUpdate?: {
    accessToken?: string
    userId?: number
    username?: string
    sub2apiAuth?: Sub2ApiAuthConfig
  }
}

export interface HealthCheckResult {
  status: SiteHealthStatus
  message: string
  /**
   * Optional machine-readable reason code for actionable UI.
   */
  code?: TempWindowHealthStatusCode
}

export interface SiteStatusInfo {
  price?: number
  stripe_unit_price?: number
  PaymentUSDRate?: number
  system_name?: string
  /**
   *
   */
  checkin_enabled?: boolean
}

//
export interface ModelsResponse {
  data: string[]
  message: string
  success: boolean
}

//
export interface UserGroupInfo {
  desc: string
  ratio: number
}

//
export interface UserGroupsResponse {
  data: Record<string, UserGroupInfo>
  message: string
  success: boolean
}

//
export interface CreateTokenRequest {
  name: string
  remain_quota: number
  expired_time: number
  unlimited_quota: boolean
  model_limits_enabled: boolean
  model_limits: string
  allow_ips: string
  group: string
}

//
export interface ModelPricing {
  model_name: string
  model_description?: string
  quota_type: number // 0 = 1 =
  model_ratio: number
  model_price: number | PerCallPrice
  owner_by?: string
  completion_ratio: number
  enable_groups: string[]
  supported_endpoint_types: string[]
}

//
export interface PricingResponse {
  data: ModelPricing[]
  group_ratio: Record<string, number>
  success: boolean
  usable_group: Record<string, string>
}

export interface PaginatedData<T> {
  page: number
  page_size: number
  total: number
  items: T[]
}

//
export type PaginatedTokenResponse = PaginatedData<ApiToken>

// API
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message: string
}

/**
 *
 * @see https://github.com/QuantumNous/new-api/blob/8ef99f472875ceeaf20aecb2bb0f2b33ff575feb/model/log.go#L43
 */
export enum LogType {
  /**  */
  All = 0,
  /**  */
  Topup = 1,
  /**  */
  Consume = 2,
  /**  */
  Manage = 3,
  /**  */
  System = 4,
  /**  */
  Error = 5,
  /** Refund */
  Refund = 6,
}

/**
 *
 * @see https://github.com/QuantumNous/new-api/blob/aa35d8db69b50d6401550bd34b6f37ef5863acd0/model/log.go#L20
 */
export interface LogItem {
  id: number
  user_id: number
  created_at: number
  /**
   *
   * @see LogType
   */
  type: LogType
  /**
   *
   * @example
   *  10.586246
   *  0.200000 ID 1
   */
  content: string
  username: string
  token_name: string
  model_name: string
  /**
   *
   */
  quota: number
  prompt_tokens: number
  completion_tokens: number
  use_time: number
  is_stream: boolean
  channel_id: number
  channel_name: string
  token_id: number
  group: string
  ip: string
  other: string // JSON
}

//
export interface LogResponseData {
  items: LogItem[]
  total: number
}

export interface Payment {
  id: number
  type: string
  uuid: string
  name: string
  icon: string
  notify_domain: string
  fixed_fee: number
  min_amount: number
  max_amount: number
  percent_fee: number
  currency: string
  currency_discount: number
  config: string
  sort: number
  enable: boolean | null
  enable_invoice: boolean
  created_at: number
}

export interface PaymentResponse {
  background: string
  banner: string
  message: string
  payments: Payment[]
  success: boolean
}

/**
 *
 */
export interface BaseFetchParams {
  baseUrl: string
  userId: number | string
}

/**
 *  token
 */
export interface AuthFetchParams extends BaseFetchParams {
  token: string
}

/**
 *
 */
export interface AuthTypeFetchParams extends AuthFetchParams {
  authType?: AuthTypeEnum
}

/**
 * Unified authentication config for ApiServiceRequest.
 */
export interface AuthConfig {
  /** : cookie | access_token | none */
  authType: AuthTypeEnum
  /**
   * Cookie
   * cookie,DNR
   * DNRcookie,cookiecookie
   */
  cookie?: string
  /**  token/access_token  */
  accessToken?: string
  /**  ID cookie  */
  userId?: number | string
  /**
   * Sub2API refresh token (optional; used for extension-managed sessions).
   */
  refreshToken?: string
  /**
   * Sub2API access-token expiry timestamp in milliseconds since epoch (optional).
   */
  tokenExpiresAt?: number
}

/**
 * API
 *
 *  apiService  baseUrl
 *  `auth.cookie` / `accountId`  cookie
 */
export interface ApiServiceRequest {
  /**
   *
   */
  auth: AuthConfig
  /**
   * API  URL
   */
  baseUrl: string
  /**
   *
   */
  data?: Record<string, any>
  /**
   *  ID
   */
  accountId?: string
}

/**
 * Account-data related requests must include check-in config.
 *
 * Note: we keep `ApiServiceRequest` as the minimal/common request DTO, and only
 * extend it for flows that actually need extra fields (like check-in).
 */
export type ApiServiceAccountRequest = ApiServiceRequest & {
  checkIn: CheckInConfig
  /**
   * Whether account refresh should include fetching "today cashflow" statistics
   * (today consumption/income plus token/request counts).
   *
   * When false, API services MUST skip the log pagination requests used solely
   * for today stats and return zeroed today fields instead.
   *
   * Default: true (when undefined).
   */
  includeTodayCashflow?: boolean
}

/**
 * fetchApi / fetchApiData  auth/baseUrl
 *
 *  `FetchApiParams`  DTO
 */
export interface FetchApiOptions {
  endpoint: string
  options?: RequestInit
  responseType?: TempWindowResponseType
  tempWindowFallback?: TempWindowFallbackAllowlist
}

/**
 * OpenAI
 */
export interface OpenAIAuthParams {
  // API
  baseUrl: string
  /** API Key */
  apiKey: string
  /**
   * Optional account/profile ID used for request tracking and logging.
   */
  accountId?: string
}

// OpenAI
export type UpstreamModelItem = {
  id: string
  object: "model"
  created: number
  owned_by: string
}

export type UpstreamModelList = UpstreamModelItem[]

//
export interface RedeemCodeRequest {
  key: string
}

export interface RedeemCodeResponse {
  success: boolean
  message: string
  /**
   *
   */
  data: number
}

export interface CheckinRecord {
  /**
   *  YYYY-MM-DD
   * @example "2026-01-03"
   */
  checkin_date: string
  quota_awarded: number
}

export interface CheckInStatus {
  /**
   *
   */
  enabled: boolean
  max_quota: number
  min_quota: number
  stats: {
    /**
     *
     * @example true
     * @example false
     */
    checked_in_today: boolean
    checkin_count: number
    records: CheckinRecord[]
    total_checkins: number
    total_quota: number
  }
}

export interface CheckInStatusResponse {
  data: CheckInStatus
  success: boolean
}

/**
 * New-API
 */
export type NewApiCheckinResponse = {
  data: CheckinRecord
  success: boolean
  /**
   * Response message from the API.
   * @example ""
   * @example ""
   * @example ""
   * @example ""
   */
  message: string
}
