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
    if (Array.isArray(tokensData)) {
      //
      return tokensData.map(normalizeApiTokenKey)
    } else if (
      tokensData &&
      typeof tokensData === "object" &&
      "data" in tokensData
    ) {
      //  data
      return (tokensData.data || []).map(normalizeApiTokenKey)
    } else {
      //
      logger.warn("Unexpected token response format", {
        responseType: tokensData === null ? "null" : typeof tokensData,
      })
      return []
    }
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
