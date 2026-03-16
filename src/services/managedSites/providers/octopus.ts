/**
 * Octopus Service
 *  ManagedSiteService  Octopus
 */
import toast from "react-hot-toast"

import { ChannelType } from "~/constants"
import { DEFAULT_OCTOPUS_CHANNEL_FIELDS } from "~/constants/octopus"
import { OCTOPUS } from "~/constants/siteType"
import { ensureAccountApiToken } from "~/services/accounts/accountOperations"
import { accountStorage } from "~/services/accounts/accountStorage"
import type { ApiResponse } from "~/services/apiService/common/type"
import * as octopusApi from "~/services/apiService/octopus"
import { fetchOpenAICompatibleModelIds } from "~/services/apiService/openaiCompatible"
import type {
  ManagedSiteConfig,
  ManagedSiteService,
} from "~/services/managedSites/managedSiteService"
import { findManagedSiteChannelByComparableInputs } from "~/services/managedSites/utils/channelMatching"
import type { ManagedSiteMessagesKey } from "~/services/managedSites/utils/managedSite"
import {
  userPreferences,
  type UserPreferences,
} from "~/services/preferences/userPreferences"
import type {
  AccountToken,
  ApiToken,
  DisplaySiteData,
  SiteAccount,
} from "~/types"
import type {
  ChannelFormData,
  ChannelMode,
  CreateChannelPayload,
  ManagedSiteChannel,
  ManagedSiteChannelListData,
  OctopusChannelWithData,
  UpdateChannelPayload,
} from "~/types/managedSite"
import { OctopusOutboundType } from "~/types/octopus"
import type {
  OctopusChannel,
  OctopusCreateChannelRequest,
} from "~/types/octopus"
import type { OctopusConfig } from "~/types/octopusConfig"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"
import { normalizeList, parseDelimitedList } from "~/utils/core/string"
import { t } from "~/utils/i18n/core"

const logger = createLogger("OctopusService")

/**
 *  ChannelType (New API  0-55)  OctopusOutboundType (0-5)
 * Octopus
 * @param channelType - New API  ChannelType  OctopusOutboundType
 * @param isOctopusType -  true channelType  OctopusOutboundType
 * @returns  OctopusOutboundType
 */
function mapChannelTypeToOctopusOutboundType(
  channelType: ChannelType | OctopusOutboundType | number | undefined,
  isOctopusType = false,
): OctopusOutboundType {
  //  Octopus
  if (isOctopusType && channelType !== undefined) {
    if (
      channelType >= OctopusOutboundType.OpenAIChat &&
      channelType <= OctopusOutboundType.OpenAIEmbedding
    ) {
      return channelType as OctopusOutboundType
    }
    //  Octopus
    return DEFAULT_OCTOPUS_CHANNEL_FIELDS.type
  }

  //  5  ChannelType
  //  0-5  isOctopusType ChannelType
  switch (channelType) {
    // Anthropic  (ChannelType.Anthropic = 14)
    case ChannelType.Anthropic:
      return OctopusOutboundType.Anthropic

    // Gemini  (ChannelType.Gemini = 24, ChannelType.VertexAi = 41)
    case ChannelType.Gemini:
    case ChannelType.VertexAi:
      return OctopusOutboundType.Gemini

    //  (ChannelType.VolcEngine = 45)
    case ChannelType.VolcEngine:
      return OctopusOutboundType.Volcengine

    //  OpenAI Chat
    // : OpenAI, Azure, Ollama, DeepSeek, Moonshot, OpenRouter, Mistral
    //  ChannelType 0-5 Unknown, OpenAI, Midjourney, Azure, Ollama, MidjourneyPlus
    default:
      return DEFAULT_OCTOPUS_CHANNEL_FIELDS.type
  }
}

/**
 *  Octopus  base URL
 * Octopus  URL  /v1
 */
function buildOctopusBaseUrl(baseUrl: string): string {
  let url = baseUrl.trim()
  //
  while (url.endsWith("/")) {
    url = url.slice(0, -1)
  }
  //  /v1
  if (url.endsWith("/v1")) {
    return url
  }
  //  /v1
  return `${url}/v1`
}

/**
 *  Octopus
 */
export function hasValidOctopusConfig(prefs: UserPreferences | null): boolean {
  if (!prefs?.octopus) return false
  const { baseUrl, username, password } = prefs.octopus
  return Boolean(baseUrl?.trim() && username?.trim() && password?.trim())
}

/**
 *  Octopus
 */
export async function checkValidOctopusConfig(): Promise<boolean> {
  try {
    const prefs = await userPreferences.getPreferences()
    return hasValidOctopusConfig(prefs)
  } catch (error) {
    logger.error("Error checking config", error)
    return false
  }
}

/**
 *  Octopus
 */
export async function getOctopusConfig(): Promise<ManagedSiteConfig | null> {
  try {
    const prefs = await userPreferences.getPreferences()
    if (hasValidOctopusConfig(prefs) && prefs.octopus) {
      return {
        baseUrl: prefs.octopus.baseUrl,
        token: "", // Octopus  JWTtoken
        userId: prefs.octopus.username,
      }
    }
    return null
  } catch (error) {
    logger.error("Error getting config", error)
    return null
  }
}

/**
 *  Octopus
 */
async function getFullOctopusConfig(): Promise<OctopusConfig | null> {
  const prefs = await userPreferences.getPreferences()
  if (hasValidOctopusConfig(prefs) && prefs.octopus) {
    return prefs.octopus
  }
  return null
}

/**
 *  Octopus  ManagedSiteChannel
 */
export function octopusChannelToManagedSite(
  channel: OctopusChannel,
): OctopusChannelWithData {
  return {
    id: channel.id,
    name: channel.name,
    type: channel.type,
    base_url: channel.base_urls[0]?.url || "",
    key: channel.keys[0]?.channel_key || "",
    models: channel.model || "",
    status: channel.enabled ? 1 : 2, // 1=, 2=
    priority: 0,
    weight: 0,
    group: "",
    model_mapping: "",
    status_code_mapping: "",
    test_model: null,
    auto_ban: 0,
    created_time: 0,
    test_time: 0,
    response_time: 0,
    balance: 0,
    balance_updated_time: 0,
    used_quota: 0,
    tag: null,
    remark: null,
    setting: "",
    settings: "",
    // NewApiChannel
    openai_organization: null,
    other: "",
    other_info: "",
    param_override: null,
    header_override: null,
    channel_info: {
      is_multi_key: false,
      multi_key_size: 0,
      multi_key_status_list: null,
      multi_key_polling_index: 0,
      multi_key_mode: "",
    },
    //  Octopus
    _octopusData: channel,
  }
}

/**
 *
 */
export async function searchChannel(
  _baseUrl: string,
  _accessToken: string,
  _userId: number | string,
  keyword: string,
): Promise<ManagedSiteChannelListData | null> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) return null

    const channels = await octopusApi.searchChannels(config, keyword)
    return {
      items: channels.map(octopusChannelToManagedSite),
      total: channels.length,
      type_counts: {},
    }
  } catch (error) {
    logger.error("Failed to search channels", error)
    return null
  }
}

/**
 *
 */
export async function createChannel(
  _baseUrl: string,
  _adminToken: string,
  _userId: number | string,
  channelData: CreateChannelPayload,
): Promise<ApiResponse<unknown>> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) {
      return { success: false, data: null, message: "Octopus config not found" }
    }

    const channel = channelData.channel
    const request: OctopusCreateChannelRequest = {
      name: channel.name || "",
      // Octopus  OctopusTypeSelectortype  OctopusOutboundType
      type: mapChannelTypeToOctopusOutboundType(channel.type, true),
      enabled: channel.status === 1,
      base_urls: [{ url: channel.base_url || "" }],
      keys: [{ enabled: true, channel_key: channel.key || "" }],
      model: channel.models,
      auto_sync: true, //
      auto_group: 0,
    }

    const result = await octopusApi.createChannel(config, request)
    return {
      success: result.success,
      data: result.data,
      message: result.message || "success",
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) || "Failed to create channel",
    }
  }
}

/**
 *
 */
export async function updateChannel(
  _baseUrl: string,
  _adminToken: string,
  _userId: number | string,
  channelData: UpdateChannelPayload & { status?: number },
): Promise<ApiResponse<unknown>> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) {
      return { success: false, data: null, message: "Octopus config not found" }
    }

    const result = await octopusApi.updateChannel(config, {
      id: channelData.id,
      name: channelData.name,
      // Octopus  OctopusTypeSelectortype  OctopusOutboundType
      type:
        channelData.type !== undefined
          ? mapChannelTypeToOctopusOutboundType(channelData.type, true)
          : undefined,
      enabled: channelData.status === 1,
      base_urls: channelData.base_url
        ? [{ url: channelData.base_url }]
        : undefined,
      model: channelData.models,
    })

    return {
      success: result.success,
      data: result.data,
      message: result.message || "success",
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) || "Failed to update channel",
    }
  }
}

/**
 *
 */
export async function deleteChannel(
  _baseUrl: string,
  _adminToken: string,
  _userId: number | string,
  channelId: number,
): Promise<ApiResponse<unknown>> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) {
      return { success: false, data: null, message: "Octopus config not found" }
    }

    const result = await octopusApi.deleteChannel(config, channelId)
    return {
      success: result.success,
      data: result.data,
      message: result.message || "success",
    }
  } catch (error) {
    return {
      success: false,
      data: null,
      message: getErrorMessage(error) || "Failed to delete channel",
    }
  }
}

/**
 *
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
    if (upstreamModels?.length > 0) {
      candidateSources.push(upstreamModels)
    }
  } catch (error) {
    logger.warn("Failed to fetch upstream models", error)
  }

  return normalizeList(candidateSources.flat())
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
    throw new Error(t("messages:octopus.noAnyModels"))
  }

  return {
    name: buildChannelName(account, token),
    type: DEFAULT_OCTOPUS_CHANNEL_FIELDS.type,
    key: token.key,
    base_url: buildOctopusBaseUrl(account.baseUrl), // Octopus  /v1
    models: normalizeList(availableModels),
    groups: ["default"],
    priority: 0,
    weight: 0,
    status: 1,
  }
}

/**
 *  payload
 */
export function buildChannelPayload(
  formData: ChannelFormData,
  mode: ChannelMode = "single",
): CreateChannelPayload {
  return {
    mode,
    channel: {
      name: formData.name.trim(),
      type: formData.type,
      key: formData.key.trim(),
      base_url: formData.base_url.trim(),
      models: normalizeList(formData.models ?? []).join(","),
      groups: formData.groups || ["default"],
      priority: formData.priority,
      weight: formData.weight,
      status: formData.status,
    },
  }
}

/**
 *
 */
export async function findMatchingChannel(
  _baseUrl: string,
  _adminToken: string,
  _userId: number | string,
  accountBaseUrl: string,
  models: string[],
  key?: string,
): Promise<ManagedSiteChannel | null> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) return null

    const channels = await octopusApi.listChannels(config)

    //  accountBaseUrl prepareChannelFormData
    const normalizedBase = buildOctopusBaseUrl(accountBaseUrl)

    return findManagedSiteChannelByComparableInputs({
      channels: channels.map(octopusChannelToManagedSite),
      accountBaseUrl: normalizedBase,
      models,
      key,
    })
  } catch (error) {
    logger.error("Failed to find matching channel", error)
    return null
  }
}

/**
 *  Octopus
 */
export async function autoConfigToOctopus(
  account: SiteAccount,
  toastId?: string,
): Promise<{ success: boolean; message: string }> {
  try {
    const config = await getFullOctopusConfig()
    if (!config) {
      return { success: false, message: t("messages:octopus.configMissing") }
    }

    const displaySiteData = accountStorage.convertToDisplayData(account)

    const apiToken = await ensureAccountApiToken(
      account,
      displaySiteData,
      toastId,
    )

    toast.loading(t("messages:accountOperations.importingToOctopus"), {
      id: toastId,
    })

    const formData = await prepareChannelFormData(displaySiteData, apiToken)

    //
    const existingChannel = await findMatchingChannel(
      config.baseUrl,
      "",
      "",
      displaySiteData.baseUrl,
      formData.models,
      formData.key,
    )

    if (existingChannel) {
      return {
        success: false,
        message: t("messages:octopus.channelExists", {
          channelName: existingChannel.name,
        }),
      }
    }

    const payload = buildChannelPayload(formData)
    const result = await createChannel(config.baseUrl, "", "", payload)

    if (result.success) {
      toast.success(
        t("messages:octopus.importSuccess", { channelName: formData.name }),
        {
          id: toastId,
        },
      )
      return {
        success: true,
        message: t("messages:octopus.importSuccess", {
          channelName: formData.name,
        }),
      }
    }

    throw new Error(result.message)
  } catch (error) {
    const message = getErrorMessage(error) || t("messages:octopus.importFailed")
    toast.error(message, { id: toastId })
    return { success: false, message }
  }
}

/**
 * Octopus ManagedSiteService
 */
export const octopus: ManagedSiteService = {
  siteType: OCTOPUS,
  messagesKey: "octopus" as ManagedSiteMessagesKey,

  searchChannel,
  createChannel,
  updateChannel,
  deleteChannel,
  checkValidConfig: checkValidOctopusConfig,
  getConfig: getOctopusConfig,
  fetchAvailableModels,
  buildChannelName,
  prepareChannelFormData,
  buildChannelPayload,
  findMatchingChannel,
  autoConfigToManagedSite: autoConfigToOctopus,
}
