/**
 * Octopus
 *  Octopus  OutboundType
 */
export enum OctopusOutboundType {
  /** OpenAI  API */
  OpenAIChat = 0,
  /** OpenAI  */
  OpenAIResponse = 1,
  /** Anthropic (Claude) API */
  Anthropic = 2,
  /** Google Gemini API */
  Gemini = 3,
  /**  API */
  Volcengine = 4,
  /** OpenAI  API */
  OpenAIEmbedding = 5,
}

/**
 * Octopus
 */
export enum OctopusAutoGroupType {
  /**  */
  None = 0,
  /**  */
  Fuzzy = 1,
  /**  */
  Exact = 2,
  /**  */
  Regex = 3,
}

/**
 * Octopus
 */
export interface OctopusChannelKey {
  /**  */
  id?: number
  /**  ID */
  channel_id?: number
  /**  */
  enabled: boolean
  /** API  */
  channel_key: string
  /**  */
  remark?: string
  /**  */
  status_code?: number
  /**  (Unix ) */
  last_use_time_stamp?: number
  /**  */
  total_cost?: number
}

/**
 * Octopus Base URL
 */
export interface OctopusBaseUrl {
  /** API  */
  url: string
  /**  () */
  delay?: number
}

/**
 * Octopus
 */
export interface OctopusCustomHeader {
  /**  */
  header_key: string
  /**  */
  header_value: string
}

/**
 * Octopus
 */
export interface OctopusChannelStats {
  /**  ID */
  channel_id: number
  /**  token  */
  input_token: number
  /**  token  */
  output_token: number
  /**  */
  input_cost: number
  /**  */
  output_cost: number
  /**  */
  wait_time: number
  /**  */
  request_success: number
  /**  */
  request_failed: number
}

/**
 * Octopus
 */
export interface OctopusChannel {
  /**  */
  id: number
  /**  */
  name: string
  /**  */
  type: OctopusOutboundType
  /**  */
  enabled: boolean
  /**  URL  */
  base_urls: OctopusBaseUrl[]
  /** API  */
  keys: OctopusChannelKey[]
  /**  () */
  model: string
  /**  () */
  custom_model?: string
  /**  */
  proxy: boolean
  /**  */
  auto_sync: boolean
  /**  */
  auto_group: OctopusAutoGroupType
  /**  */
  custom_header?: OctopusCustomHeader[]
  /**  */
  param_override?: string
  /**  */
  channel_proxy?: string
  /**  */
  match_regex?: string
  /**  */
  stats?: OctopusChannelStats
}

/**
 *
 */
export interface OctopusCreateChannelRequest {
  /**  () */
  name: string
  /**  */
  type: OctopusOutboundType
  /**  ( true) */
  enabled?: boolean
  /**  URL  */
  base_urls: OctopusBaseUrl[]
  /** API  */
  keys: OctopusChannelKey[]
  /**  */
  model?: string
  /**  */
  custom_model?: string
  /**  */
  proxy?: boolean
  /**  */
  auto_sync?: boolean
  /**  */
  auto_group?: OctopusAutoGroupType
  /**  */
  custom_header?: OctopusCustomHeader[]
  /**  */
  param_override?: string
  /**  */
  channel_proxy?: string
  /**  */
  match_regex?: string
}

/**
 *
 */
export interface OctopusKeyAddRequest {
  /**  */
  enabled?: boolean
  /** API  */
  channel_key: string
  /**  */
  remark?: string
}

/**
 *
 */
export interface OctopusKeyUpdateRequest {
  /**  ID */
  id: number
  /**  */
  enabled?: boolean
  /**  API  */
  channel_key?: string
  /**  */
  remark?: string
}

/**
 *
 */
export interface OctopusUpdateChannelRequest {
  /**  ID () */
  id: number
  /**  */
  name?: string
  /**  */
  type?: OctopusOutboundType
  /**  */
  enabled?: boolean
  /**  URL  */
  base_urls?: OctopusBaseUrl[]
  /**  */
  model?: string
  /**  */
  custom_model?: string
  /**  */
  proxy?: boolean
  /**  */
  auto_sync?: boolean
  /**  */
  auto_group?: OctopusAutoGroupType
  /**  */
  custom_header?: OctopusCustomHeader[]
  /**  */
  channel_proxy?: string
  /**  */
  param_override?: string
  /**  */
  match_regex?: string
  /**  */
  keys_to_add?: OctopusKeyAddRequest[]
  /**  */
  keys_to_update?: OctopusKeyUpdateRequest[]
  /**  ID  */
  keys_to_delete?: number[]
}

/**
 *
 */
export interface OctopusFetchModelRequest {
  /**  */
  type: OctopusOutboundType
  /**  URL  */
  base_urls: OctopusBaseUrl[]
  /** API  */
  keys: OctopusChannelKey[]
  /**  */
  proxy?: boolean
}

/**
 * Octopus API
 */
export interface OctopusApiResponse<T = unknown> {
  /**  */
  success: boolean
  /**  null */
  data?: T | null
  /**  */
  message?: string
}

/**
 * Octopus
 */
export interface OctopusLoginResponse {
  /** JWT Token */
  token: string
  /** Token  */
  expire_at: string
}
