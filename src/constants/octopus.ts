import { OctopusOutboundType } from "~/types/octopus"

/**
 * Octopus
 *  UI
 */
export const OctopusOutboundTypeOptions = [
  {
    value: OctopusOutboundType.OpenAIChat,
    label: "OpenAI Chat",
    description: "OpenAI  API",
  },
  {
    value: OctopusOutboundType.OpenAIResponse,
    label: "OpenAI Response",
    description: "OpenAI ",
  },
  {
    value: OctopusOutboundType.Anthropic,
    label: "Anthropic",
    description: "Claude API",
  },
  {
    value: OctopusOutboundType.Gemini,
    label: "Gemini",
    description: "Google Gemini API",
  },
  {
    value: OctopusOutboundType.Volcengine,
    label: "Volcengine",
    description: " API",
  },
  {
    value: OctopusOutboundType.OpenAIEmbedding,
    label: "OpenAI Embedding",
    description: "OpenAI  API",
  },
] as const

/**
 * Octopus
 */
export const OctopusOutboundTypeNames: Record<number, string> = {
  [OctopusOutboundType.OpenAIChat]: "OpenAI Chat",
  [OctopusOutboundType.OpenAIResponse]: "OpenAI Response",
  [OctopusOutboundType.Anthropic]: "Anthropic",
  [OctopusOutboundType.Gemini]: "Gemini",
  [OctopusOutboundType.Volcengine]: "Volcengine",
  [OctopusOutboundType.OpenAIEmbedding]: "OpenAI Embedding",
}

/**
 *
 */
export function getOctopusTypeName(type: OctopusOutboundType): string {
  return OctopusOutboundTypeNames[type] || `Unknown (${type})`
}

/**
 * Octopus
 */
export const DEFAULT_OCTOPUS_CHANNEL_FIELDS = {
  type: OctopusOutboundType.OpenAIChat,
  enabled: true,
  proxy: false,
  auto_sync: true, //
  auto_group: 0,
} as const
