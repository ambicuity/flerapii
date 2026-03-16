/**
 * Octopus API
 *  Octopus  API
 */
import { userPreferences } from "~/services/preferences/userPreferences"
import type {
  OctopusApiResponse,
  OctopusChannel,
  OctopusCreateChannelRequest,
  OctopusFetchModelRequest,
  OctopusUpdateChannelRequest,
} from "~/types/octopus"
import type { OctopusConfig } from "~/types/octopusConfig"
import { createLogger } from "~/utils/core/logger"
import { normalizeBaseUrl } from "~/utils/core/url"

import type { ApiServiceRequest } from "../common/type"
import { octopusAuthManager } from "./auth"
import { buildOctopusAuthHeaders } from "./utils"

const logger = createLogger("OctopusAPI")

/**
 *  Octopus API
 */
async function fetchOctopusApi<T>(
  config: OctopusConfig,
  endpoint: string,
  options: RequestInit = {},
): Promise<OctopusApiResponse<T>> {
  const token = await octopusAuthManager.getValidToken(config)
  const baseUrl = normalizeBaseUrl(config.baseUrl)
  const url = `${baseUrl}${endpoint}`

  const response = await fetch(url, {
    ...options,
    headers: {
      ...buildOctopusAuthHeaders(token),
      ...(options.headers || {}),
    },
  })

  //  HTTP
  if (!response.ok) {
    const contentType = response.headers.get("Content-Type") || ""
    let errorMessage: string

    // Read body once as text, then try to parse as JSON
    const rawBody = await response.text()

    if (contentType.includes("application/json")) {
      //  JSON
      try {
        const errorData = JSON.parse(rawBody)
        errorMessage =
          errorData.message || errorData.error || JSON.stringify(errorData)
      } catch {
        errorMessage = rawBody
      }
    } else {
      //  JSON
      errorMessage = rawBody
    }

    throw new Error(
      `HTTP ${response.status} ${response.statusText}: ${errorMessage}`,
    )
  }

  //  Content-Type  JSON
  const contentType = response.headers.get("Content-Type") || ""
  if (!contentType.includes("application/json")) {
    const text = await response.text()
    throw new Error(
      `Expected JSON response but got ${contentType || "unknown content type"}: ${text.slice(0, 200)}`,
    )
  }

  let data: unknown
  try {
    data = await response.json()
  } catch {
    throw new Error(`Failed to parse JSON response from ${endpoint}`)
  }

  // Octopus : { success: boolean, data?: T, message?: string }
  //  { code: number, message: string, data?: T }
  const responseData = data as Record<string, unknown>
  if (
    responseData.success === false ||
    (responseData.code !== undefined && responseData.code !== 200)
  ) {
    throw new Error((responseData.message as string) || "API request failed")
  }

  return {
    success: true,
    data: (responseData.data as T | undefined) ?? null,
    message: (responseData.message as string) || "success",
  }
}

/**
 *
 */
export async function listChannels(
  config: OctopusConfig,
): Promise<OctopusChannel[]> {
  try {
    const result = await fetchOctopusApi<OctopusChannel[]>(
      config,
      "/api/v1/channel/list",
    )
    return result.data || []
  } catch (error) {
    logger.error("Failed to list channels", error)
    throw error
  }
}

/**
 *
 */
export async function searchChannels(
  config: OctopusConfig,
  keyword: string,
): Promise<OctopusChannel[]> {
  const channels = await listChannels(config)
  if (!keyword) return channels

  const lowerKeyword = keyword.toLowerCase()
  return channels.filter(
    (ch) =>
      ch.name.toLowerCase().includes(lowerKeyword) ||
      ch.base_urls?.some((u) => u.url?.toLowerCase().includes(lowerKeyword)),
  )
}

/**
 *
 */
export async function createChannel(
  config: OctopusConfig,
  data: OctopusCreateChannelRequest,
): Promise<OctopusApiResponse<OctopusChannel>> {
  try {
    const result = await fetchOctopusApi<OctopusChannel>(
      config,
      "/api/v1/channel/create",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
    logger.info("Channel created", { name: data.name })
    return result
  } catch (error) {
    logger.error("Failed to create channel", error)
    throw error
  }
}

/**
 *
 */
export async function updateChannel(
  config: OctopusConfig,
  data: OctopusUpdateChannelRequest,
): Promise<OctopusApiResponse<OctopusChannel>> {
  try {
    const result = await fetchOctopusApi<OctopusChannel>(
      config,
      "/api/v1/channel/update",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    )
    logger.info("Channel updated", { id: data.id })
    return result
  } catch (error) {
    logger.error("Failed to update channel", error)
    throw error
  }
}

/**
 *
 */
export async function deleteChannel(
  config: OctopusConfig,
  channelId: number,
): Promise<OctopusApiResponse<null>> {
  try {
    const result = await fetchOctopusApi<null>(
      config,
      `/api/v1/channel/delete/${channelId}`,
      {
        method: "DELETE",
      },
    )
    logger.info("Channel deleted", { id: channelId })
    return result
  } catch (error) {
    logger.error("Failed to delete channel", error)
    throw error
  }
}

/**
 *
 */
export async function fetchRemoteModels(
  config: OctopusConfig,
  channelData: OctopusFetchModelRequest,
): Promise<string[]> {
  try {
    const result = await fetchOctopusApi<string[]>(
      config,
      "/api/v1/channel/fetch-model",
      {
        method: "POST",
        body: JSON.stringify(channelData),
      },
    )
    return result.data || []
  } catch (error) {
    logger.error("Failed to fetch remote models", error)
    throw error
  }
}

/**
 * Octopus LLMInfo
 */
interface OctopusLLMInfo {
  name: string
  input: number
  output: number
  cache_read: number
  cache_write: number
}

/**
 * Octopus Group
 */
interface OctopusGroup {
  id: number
  name: string
  mode: number
  match_regex: string
  first_token_time_out: number
  items: Array<{
    id: number
    group_id: number
    channel_id: number
    model_name: string
    priority: number
    weight: number
  }>
}

/**
 *
 *  Octopus  /api/v1/model/list
 */
export async function fetchAvailableModels(
  config: OctopusConfig,
): Promise<string[]> {
  try {
    const result = await fetchOctopusApi<OctopusLLMInfo[]>(
      config,
      "/api/v1/model/list",
    )
    return (result.data || []).map((model) => model.name)
  } catch (error) {
    logger.error("Failed to fetch available models", error)
    throw error
  }
}

/**
 *
 *  Octopus  /api/v1/group/list
 */
export async function fetchGroups(config: OctopusConfig): Promise<string[]> {
  try {
    const result = await fetchOctopusApi<OctopusGroup[]>(
      config,
      "/api/v1/group/list",
    )
    return (result.data || []).map((group) => group.name)
  } catch (error) {
    logger.error("Failed to fetch groups", error)
    throw error
  }
}

/**
 *  common API
 *  Octopus JWT  /api/v1/group/list
 *  request  auth  Octopus
 */
export async function fetchSiteUserGroups(
  _request: ApiServiceRequest,
): Promise<string[]> {
  try {
    const prefs = await userPreferences.getPreferences()
    const octopusConfig = prefs?.octopus
    if (
      !octopusConfig?.baseUrl ||
      !octopusConfig?.username ||
      !octopusConfig?.password
    ) {
      logger.warn("Octopus config not available, returning empty groups")
      return []
    }
    return await fetchGroups({
      baseUrl: octopusConfig.baseUrl,
      username: octopusConfig.username,
      password: octopusConfig.password,
    })
  } catch (error) {
    logger.error("Failed to fetch site user groups", error)
    return []
  }
}

/**
 *  common API
 *  Octopus JWT  /api/v1/model/list
 *  request  auth  Octopus
 */
export async function fetchAccountAvailableModels(
  _request: ApiServiceRequest,
): Promise<string[]> {
  try {
    const prefs = await userPreferences.getPreferences()
    const octopusConfig = prefs?.octopus
    if (
      !octopusConfig?.baseUrl ||
      !octopusConfig?.username ||
      !octopusConfig?.password
    ) {
      logger.warn("Octopus config not available, returning empty models")
      return []
    }
    return await fetchAvailableModels({
      baseUrl: octopusConfig.baseUrl,
      username: octopusConfig.username,
      password: octopusConfig.password,
    })
  } catch (error) {
    logger.error("Failed to fetch account available models", error)
    return []
  }
}

//
export { octopusAuthManager } from "./auth"
