import toast from "react-hot-toast"

import { DEFAULT_CHANNEL_FIELDS } from "~/constants/managedSite"
import { NEW_API } from "~/constants/siteType"
import { ensureAccountApiToken } from "~/services/accounts/accountOperations"
import { accountStorage } from "~/services/accounts/accountStorage"
import { getApiService } from "~/services/apiService"
import { fetchOpenAICompatibleModelIds } from "~/services/apiService/openaiCompatible"
import { findManagedSiteChannelByComparableInputs } from "~/services/managedSites/utils/channelMatching"
import { ApiToken, AuthTypeEnum, DisplaySiteData, SiteAccount } from "~/types"
import type { AccountToken } from "~/types"
import type {
  ChannelFormData,
  ChannelMode,
  CreateChannelPayload,
  ManagedSiteChannel,
  ManagedSiteChannelListData,
  UpdateChannelPayload,
} from "~/types/managedSite"
import type {
  AutoConfigToNewApiResponse,
  ServiceResponse,
} from "~/types/serviceResponse"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"
import { normalizeList, parseDelimitedList } from "~/utils/core/string"
import { t } from "~/utils/i18n/core"

import {
  UserPreferences,
  userPreferences,
} from "../../preferences/userPreferences"
import { resolveDefaultChannelGroups } from "./defaultChannelGroups"

/**
 * Unified logger scoped to the New API integration and auto-config flows.
 */
const logger = createLogger("NewApiService")

/**
 *
 * @param baseUrl New API  URL
 * @param accessToken
 * @param userId  ID
 * @param keyword
 */
export async function searchChannel(
  baseUrl: string,
  accessToken: string,
  userId: number | string,
  keyword: string,
): Promise<ManagedSiteChannelListData | null> {
  return await getApiService(NEW_API).searchChannel(
    {
      baseUrl,
      auth: {
        authType: AuthTypeEnum.AccessToken,
        accessToken,
        userId,
      },
    },
    keyword,
  )
}

/**
 *
 * @param baseUrl New API  URL
 * @param adminToken
 * @param userId  ID
 * @param channelData
 */
export async function createChannel(
  baseUrl: string,
  adminToken: string,
  userId: number | string,
  channelData: CreateChannelPayload,
) {
  return await getApiService(NEW_API).createChannel(
    {
      baseUrl,
      auth: {
        authType: AuthTypeEnum.AccessToken,
        accessToken: adminToken,
        userId,
      },
    },
    channelData,
  )
}

/**
 *
 * @param baseUrl New API  URL
 * @param adminToken
 * @param userId  ID
 * @param channelData
 */
export async function updateChannel(
  baseUrl: string,
  adminToken: string,
  userId: number | string,
  channelData: UpdateChannelPayload,
) {
  return await getApiService(NEW_API).updateChannel(
    {
      baseUrl,
      auth: {
        authType: AuthTypeEnum.AccessToken,
        accessToken: adminToken,
        userId,
      },
    },
    channelData,
  )
}

/**
 *
 */
export async function deleteChannel(
  baseUrl: string,
  adminToken: string,
  userId: number | string,
  channelId: number,
) {
  return await getApiService(NEW_API).deleteChannel(
    {
      baseUrl,
      auth: {
        authType: AuthTypeEnum.AccessToken,
        accessToken: adminToken,
        userId,
      },
    },
    channelId,
  )
}

/**
 * Checks whether the given user preferences contain a complete New API config.
 */
export function hasValidNewApiConfig(prefs: UserPreferences | null): boolean {
  if (!prefs) {
    return false
  }

  const { newApi } = prefs

  if (!newApi) {
    return false
  }

  return Boolean(newApi.baseUrl && newApi.adminToken && newApi.userId)
}

/**
 * Validate New API configuration
 */
export async function checkValidNewApiConfig(): Promise<boolean> {
  try {
    const prefs = await userPreferences.getPreferences()
    return hasValidNewApiConfig(prefs)
  } catch (error) {
    logger.error("Error checking config", error)
    return false
  }
}

/**
 * Get New API configuration from user preferences
 */
export async function getNewApiConfig(): Promise<{
  baseUrl: string
  token: string
  userId: string
} | null> {
  try {
    const prefs = await userPreferences.getPreferences()
    if (hasValidNewApiConfig(prefs)) {
      const { newApi } = prefs
      return {
        baseUrl: newApi.baseUrl,
        token: newApi.adminToken,
        userId: newApi.userId,
      }
    }
    return null
  } catch (error) {
    logger.error("Error getting config", error)
    return null
  }
}

/**
 *
 *  API
 */
export async function fetchAvailableModels(
  account: DisplaySiteData,
  token: ApiToken,
): Promise<string[]> {
  const candidateSources: string[][] = []

  const tokenModelList = parseDelimitedList(token.models)
  if (tokenModelList.length > 0) {
    candidateSources.push(tokenModelList)
  }

  try {
    const upstreamModels = await fetchOpenAICompatibleModelIds({
      baseUrl: account.baseUrl,
      apiKey: token.key,
    })
    if (upstreamModels && upstreamModels.length > 0) {
      candidateSources.push(upstreamModels)
    }
  } catch (error) {
    logger.warn("Failed to fetch upstream models", error)
  }

  try {
    const fallbackModels = await getApiService(
      account.siteType,
    ).fetchAccountAvailableModels({
      baseUrl: account.baseUrl,
      accountId: account.id,
      auth: {
        authType: account.authType,
        userId: account.userId,
        accessToken: account.token,
        cookie: account.cookieAuthSessionCookie,
      },
    })
    if (fallbackModels && fallbackModels.length > 0) {
      candidateSources.push(fallbackModels)
    }
  } catch (error) {
    logger.warn("Failed to fetch fallback models", error)
  }

  const merged = candidateSources.flat()
  return normalizeList(merged)
}

/**
 *
 */
export function buildChannelName(
  account: DisplaySiteData,
  token: ApiToken,
): string {
  let channelName = `${account.name} | ${token.name}`.trim()
  if (!channelName.endsWith("(auto)")) {
    channelName += " (auto)"
  }
  return channelName
}

/**
 *
 */
export async function prepareChannelFormData(
  account: DisplaySiteData,
  token: ApiToken | AccountToken,
): Promise<ChannelFormData> {
  const availableModels = await fetchOpenAICompatibleModelIds({
    baseUrl: account.baseUrl,
    apiKey: token.key,
  })

  if (!availableModels.length) {
    throw new Error(t("messages:newapi.noAnyModels"))
  }

  const resolvedGroups = await resolveDefaultChannelGroups({
    siteType: NEW_API,
    getConfig: getNewApiConfig,
    onError: (error) => {
      logger.warn("Failed to resolve New API default groups", error)
    },
  })

  return {
    name: buildChannelName(account, token),
    type: DEFAULT_CHANNEL_FIELDS.type,
    key: token.key,
    base_url: account.baseUrl,
    models: normalizeList(availableModels),
    groups: normalizeList(resolvedGroups),
    priority: DEFAULT_CHANNEL_FIELDS.priority,
    weight: DEFAULT_CHANNEL_FIELDS.weight,
    status: DEFAULT_CHANNEL_FIELDS.status,
  }
}

/**
 *  payload
 */
export function buildChannelPayload(
  formData: ChannelFormData,
  mode: ChannelMode = DEFAULT_CHANNEL_FIELDS.mode,
): CreateChannelPayload {
  const trimmedBaseUrl = formData.base_url.trim()
  const groups = normalizeList(
    formData.groups && formData.groups.length > 0
      ? [...formData.groups]
      : [...DEFAULT_CHANNEL_FIELDS.groups],
  )
  const models = normalizeList(formData.models ?? [])

  return {
    mode,
    channel: {
      name: formData.name.trim(),
      type: formData.type,
      key: formData.key.trim(),
      base_url: trimmedBaseUrl,
      models: models.join(","),
      groups,
      priority: formData.priority,
      weight: formData.weight,
      status: formData.status,
    },
  }
}

/**
 *
 *
 *  base_url + models key  key
 *  key
 */
export async function findMatchingChannel(
  baseUrl: string,
  adminToken: string,
  userId: number | string,
  accountBaseUrl: string,
  models: string[],
  key?: string,
): Promise<ManagedSiteChannel | null> {
  const searchResults = await searchChannel(
    baseUrl,
    adminToken,
    userId,
    accountBaseUrl,
  )

  if (!searchResults) {
    return null
  }

  return findManagedSiteChannelByComparableInputs({
    channels: searchResults.items,
    accountBaseUrl,
    models,
    key,
  })
}

/**
 * Additional options for importToNewApi to allow customization.
 */
export interface ImportToNewApiOptions {
  formOverrides?: Partial<ChannelFormData>
  mode?: ChannelMode
  skipExistingCheck?: boolean
}

/**
 *  New API
 * @param account
 * @param token API
 */
export async function importToNewApi(
  account: DisplaySiteData,
  token: ApiToken,
): Promise<ServiceResponse<void>> {
  try {
    const prefs = await userPreferences.getPreferences()

    if (!hasValidNewApiConfig(prefs)) {
      return {
        success: false,
        message: t("messages:newapi.configMissing"),
      }
    }

    const { newApi } = prefs
    const {
      baseUrl: newApiBaseUrl,
      adminToken: newApiAdminToken,
      userId: newApiUserId,
    } = newApi

    const formData = await prepareChannelFormData(account, token)

    const existingChannel = await findMatchingChannel(
      newApiBaseUrl!,
      newApiAdminToken!,
      newApiUserId!,
      account.baseUrl,
      formData.models,
      formData.key,
    )

    if (existingChannel) {
      return {
        success: false,
        message: t("messages:newapi.channelExists", {
          channelName: existingChannel.name,
        }),
      }
    }

    const payload = buildChannelPayload(formData)

    const createdChannelResponse = await createChannel(
      newApiBaseUrl!,
      newApiAdminToken!,
      newApiUserId!,
      payload,
    )

    if (createdChannelResponse.success) {
      return {
        success: true,
        message: t("messages:newapi.importSuccess", {
          channelName: formData.name,
        }),
      }
    }

    return {
      success: false,
      message: createdChannelResponse.message,
    }
  } catch (error) {
    return {
      success: false,
      message: getErrorMessage(error) || t("messages:newapi.importFailed"),
    }
  }
}

// Helper function to validate New API configuration
/**
 * Validates New API configuration from user preferences and collects error messages.
 */
async function validateNewApiConfig(): Promise<{
  valid: boolean
  errors: string[]
}> {
  const prefs = await userPreferences.getPreferences()
  const errors = []

  const baseUrl = prefs.newApi?.baseUrl || prefs.newApiBaseUrl
  const adminToken = prefs.newApi?.adminToken || prefs.newApiAdminToken
  const userId = prefs.newApi?.userId || prefs.newApiUserId

  if (!baseUrl) {
    errors.push(t("messages:errors.validation.newApiBaseUrlRequired"))
  }
  if (!adminToken) {
    errors.push(t("messages:errors.validation.newApiAdminTokenRequired"))
  }
  if (!userId) {
    errors.push(t("messages:errors.validation.newApiUserIdRequired"))
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 *  New API  toast
 * @param account  API
 * @param toastId  toast
 */
export async function autoConfigToNewApi(
  account: SiteAccount,
  toastId?: string,
): Promise<AutoConfigToNewApiResponse<{ token?: ApiToken }>> {
  const configValidation = await validateNewApiConfig()
  if (!configValidation.valid) {
    return { success: false, message: configValidation.errors.join(", ") }
  }

  const displaySiteData = accountStorage.convertToDisplayData(account)

  let lastError: any
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const apiToken = await ensureAccountApiToken(
        account,
        displaySiteData,
        toastId,
      )

      // 3. Import to New API as a channel
      toast.loading(t("messages:accountOperations.importingToNewApi"), {
        id: toastId,
      })
      const importResult = await importToNewApi(displaySiteData, apiToken)

      if (importResult.success) {
        toast.success(importResult.message, { id: toastId })
      } else {
        throw new Error(importResult.message)
      }

      return {
        success: importResult.success,
        message: importResult.message,
        data: { token: apiToken },
      }
    } catch (error) {
      lastError = error
      if (
        error instanceof Error &&
        (error.message.includes("network") ||
          error.message.includes("Failed to fetch")) &&
        attempt < 3
      ) {
        toast.error(getErrorMessage(lastError), { id: toastId })
        toast.loading(
          t("messages:accountOperations.retrying", { attempt: attempt + 1 }),
          { id: toastId },
        )
        await new Promise((resolve) => setTimeout(resolve, 1000 * attempt))
        continue
      }
      break
    }
  }
  toast.error(getErrorMessage(lastError), { id: toastId })
  return {
    success: false,
    message: lastError?.message || t("messages:errors.unknown"),
  }
}
