import { ChannelType } from "~/constants"

import type { OctopusOutboundType } from "./octopus"

/**
 * Group data from New API
 */
export interface ChannelGroup {
  id: string
  name: string
}

/**
 * Model data from New API or model suggestion
 */
export interface ChannelModel {
  id: string
  name: string
  provider?: string
  description?: string
  tags?: string[]
}

/**
 * Channel status constants
 * @see https://github.com/QuantumNous/new-api/blob/7156bf238276d2089435eacc3efb266403f27c8e/common/constants.go#L192
 */
export const CHANNEL_STATUS = {
  Unknown: 0,
  Enable: 1,
  ManuallyDisabled: 2,
  AutoDisabled: 3,
} as const

export type ChannelStatus = (typeof CHANNEL_STATUS)[keyof typeof CHANNEL_STATUS]

/**
 * Channel mode constants
 */
export const CHANNEL_MODE = {
  SINGLE: "single",
  BATCH: "batch",
} as const

export type ChannelMode = (typeof CHANNEL_MODE)[keyof typeof CHANNEL_MODE]

/**
 * Channel default field values
 */
export interface ChannelDefaults {
  mode: ChannelMode
  status: ChannelStatus
  priority: number
  weight: number
  groups: string[]
  models: string[]
  type: ChannelType
}

/**
 * Channel creation/edit form data
 */
export interface ChannelFormData {
  name: string
  type: ChannelType | OctopusOutboundType
  key: string
  base_url: string
  models: string[]
  groups: string[]
  priority: number
  weight: number
  status: ChannelStatus
}

/**
 * Channel creation payload for New API
 */
export interface CreateChannelPayload {
  mode: ChannelMode
  channel: Omit<UpdateChannelPayload, "id"> & {
    status: ChannelStatus
  }
}

/**
 * Channel edition payload for New API
 */
export interface UpdateChannelPayload {
  /**
   * ID
   */
  id: number
  type?: ChannelType | OctopusOutboundType
  max_input_tokens?: number
  other?: string
  models?: string
  auto_ban?: number
  /**
   *
   * groups.join(",")APIgroups
   */
  group?: string
  groups?: string[]
  priority?: number
  weight?: number
  settings?: string
  name?: string
  base_url?: string
  model_mapping?: string
  status_code_mapping?: string
  setting?: string
  openai_organization?: string | null
  test_model?: string | null
  tag?: string | null
  param_override?: any | null
  header_override?: any | null
  remark?: string | null
  key?: string
  /**
   *
   * @see https://github.com/QuantumNous/new-api/blob/7156bf238276d2089435eacc3efb266403f27c8e/controller/channel.go#L769
   */
  key_mode?: string
  multi_key_mode?: string
}

export interface ChannelInfo {
  is_multi_key: boolean
  multi_key_size: number
  multi_key_status_list: any[] | null
  multi_key_polling_index: number
  multi_key_mode: string
}

/**
 * New API Channel data
 *  Channel  info
 */
export interface NewApiChannel {
  id: number
  type: ChannelType
  /**
   * key
   *
   */
  key: string
  name: string
  /**
   * API
   */
  base_url: string
  /**
   *
   * @example "gpt-3.5-turbo,gpt-4"
   */
  models: string
  status: ChannelStatus
  /**
   *
   */
  weight: number
  /**
   *
   */
  priority: number
  openai_organization: string | null
  /**
   *
   */
  test_model: string | null
  /**
   *
   *  Unix
   */
  created_time: number
  test_time: number
  response_time: number
  other: string
  balance: number
  balance_updated_time: number
  /**
   *
   * @example  "default,group1"
   */
  group: string
  used_quota: number
  //  JSON  parse Record<string,string>
  model_mapping: string
  //  JSON  parse Record<string,string>
  status_code_mapping: string
  auto_ban: number
  //  JSON  ( status_reason ) parse
  other_info: string
  tag: string | null
  param_override: any | null
  header_override: any | null
  remark: string | null
  channel_info: ChannelInfo
  //  JSON  parse
  setting: string
  //  JSON  parse
  settings: string
}

/**
 * All New API Channel data
 */
export interface NewApiChannelListData {
  items: NewApiChannel[]
  total: number
  type_counts: Record<string, number>
}
