import { normalizeApiTokenKey } from "~/services/apiService/common/apiKey"
import type {
  ApiServiceRequest,
  PricingResponse,
} from "~/services/apiService/common/type"
import { fetchApiData } from "~/services/apiService/common/utils"
import {
  transformModelPricing,
  transformUserGroup,
} from "~/services/apiService/oneHub/transform"
import type {
  OneHubModelPricing,
  OneHubUserGroupInfo,
  OneHubUserGroupMap,
  OneHubUserGroupsResponse,
  PaginatedTokenDate,
} from "~/services/apiService/oneHub/type"
import type { ApiToken } from "~/types"
import { createLogger } from "~/utils/core/logger"

/**
 * Unified logger scoped to OneHub API helpers.
 */
const logger = createLogger("ApiService.OneHub")

export const fetchAvailableModel = async (request: ApiServiceRequest) => {
  return fetchApiData<OneHubModelPricing>(request, {
    endpoint: "/api/available_model",
  })
}

export const fetchUserGroupMap = async (request: ApiServiceRequest) => {
  return fetchApiData<OneHubUserGroupMap>(request, {
    endpoint: "/api/user_group_map",
  })
}
export const fetchModelPricing = async (
  request: ApiServiceRequest,
): Promise<PricingResponse> => {
  try {
    const [availableModel, userGroupMap] = await Promise.all([
      fetchAvailableModel(request),
      fetchUserGroupMap(request),
    ])

    const result = transformModelPricing(availableModel, userGroupMap)
    logger.debug("Fetched model pricing")

    return result
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 * Extract the token list from the response payload.
 *
 * OneHub/DoneHub relays answer with different envelopes depending on the
 * backend flavour: a bare array, a `{ data: [...] }` wrapper, or the
 * New-API-compatible `{ items: [...] }` pagination envelope. All of them must
 * be supported, otherwise the key list silently comes back empty.
 */
const extractTokenList = (payload: unknown): ApiToken[] | null => {
  if (Array.isArray(payload)) {
    return payload
  }

  if (payload && typeof payload === "object") {
    const record = payload as Record<string, unknown>
    if (Array.isArray(record.items)) {
      return record.items
    }
    if (Array.isArray(record.data)) {
      return record.data
    }
  }

  return null
}

/**
 *
 */
export const fetchAccountTokens = async (
  request: ApiServiceRequest,
  page: number = 0,
  size: number = 100,
): Promise<ApiToken[]> => {
  const searchParams = new URLSearchParams({
    p: page.toString(),
    size: size.toString(),
  })

  try {
    //
    const tokensData = await fetchApiData<PaginatedTokenDate>(request, {
      endpoint: `/api/token/?${searchParams.toString()}`,
    })

    //
    const tokenList = extractTokenList(tokensData)
    if (tokenList) {
      return tokenList.map(normalizeApiTokenKey)
    }

    logger.warn("Unexpected token response format", {
      responseType: tokensData === null ? "null" : typeof tokensData,
    })
    return []
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 *
 */
export const fetchUserGroups = async (
  request: ApiServiceRequest,
): Promise<Record<string, OneHubUserGroupInfo>> => {
  try {
    const response = await fetchApiData<OneHubUserGroupsResponse["data"]>(
      request,
      {
        endpoint: "/api/user_group_map",
      },
    )
    return transformUserGroup(response)
  } catch (error) {
    logger.error("", error)
    throw error
  }
}

/**
 *
 */
export const fetchAccountAvailableModels = async (
  request: ApiServiceRequest,
) => {
  const availableModel = await fetchAvailableModel(request)
  return Object.keys(availableModel)
}
