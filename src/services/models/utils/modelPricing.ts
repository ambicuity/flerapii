/**
 *
 */

import type { ModelPricing } from "~/services/apiService/common/type"
import type { CurrencyType } from "~/types"
import { t } from "~/utils/i18n/core"

export interface CalculatedPrice {
  inputUSD: number // 1M token
  outputUSD: number // 1M token
  inputCNY: number // 1M token
  outputCNY: number // 1M token
  perCallPrice?: PerCallPrice //
}

export type PerCallPrice = number | { input: number; output: number }

/**
 *
 * @param model
 * @param groupRatio
 * @param exchangeRate CNY per USD
 * @param userGroup  groupRatio
 *  https://github.com/QuantumNous/new-api/blob/7437b671efb6b994eae3d8d721e3cbe215e5abc9/web/src/helpers/utils.jsx#L595
 */
export const calculateModelPrice = (
  model: ModelPricing,
  groupRatio: Record<string, number>,
  exchangeRate: number,
  userGroup: string = "default",
): CalculatedPrice => {
  // 1
  const groupMultiplier = groupRatio[userGroup] || 1

  if (isTokenBillingType(model.quota_type)) {
    //
    // inputUSD 1M token = model_ratio × 2 × groupRatio
    // complUSD 1M token = model_ratio × completion_ratio × 2 × groupRatio
    const inputUSD = model.model_ratio * 2 * groupMultiplier
    const outputUSD =
      model.model_ratio * model.completion_ratio * 2 * groupMultiplier

    return {
      inputUSD,
      outputUSD,
      inputCNY: inputUSD * exchangeRate,
      outputCNY: outputUSD * exchangeRate,
    }
  } else {
    //
    const perCallPrice = calculateModelPerCallPrice(
      model.model_price,
      groupMultiplier,
    )

    return {
      inputUSD: 0,
      outputUSD: 0,
      inputCNY: 0,
      outputCNY: 0,
      perCallPrice,
    }
  }
}
// todo:
// https://github.com/deanxv/done-hub/blob/6f332c162175de3333477c03faaa65d0d902f8ab/web/src/views/Pricing/component/util.js#L13
const DONE_HUB_TOKEN_TO_CALL_RATIO = 0.002

/**
 * Calculates per-call pricing for models that charge per request rather than per token.
 * @param cost Raw per-call definition from the API (number or separate input/output).
 * @param factor Group multiplier applied before converting to DONE HUB ratios.
 * @returns Normalized per-call price data aligned with the UI expectations.
 */
const calculateModelPerCallPrice = (
  cost: PerCallPrice,
  factor: number,
): PerCallPrice => {
  if (typeof cost === "number") {
    return cost * factor
  }
  return {
    input: cost.input * factor * DONE_HUB_TOKEN_TO_CALL_RATIO,
    output: cost.output * factor * DONE_HUB_TOKEN_TO_CALL_RATIO,
  }
}

/**
 *
 * @param price
 * @param currency
 * @param precision
 */
export const formatPrice = (
  price: number,
  currency: CurrencyType = "USD",
  precision: number = 4,
): string => {
  const symbol = currency === "USD" ? "$" : "¥"

  if (price === 0) return `${symbol}0`

  if (price < 0.0001) {
    return `${symbol}${price.toExponential(2)}`
  }

  return `${symbol}${price.toFixed(precision)}`
}

/**
 *  -
 * @param price
 * @param currency
 */
export const formatPriceCompact = (
  price: number,
  currency: CurrencyType = "USD",
): string => {
  const symbol = currency === "USD" ? "$" : "¥"

  if (price === 0) return `${symbol}0`

  if (price < 0.01) {
    return `${symbol}${price.toFixed(6)}`
  } else if (price < 1) {
    return `${symbol}${price.toFixed(4)}`
  } else {
    return `${symbol}${price.toFixed(2)}`
  }
}

/**
 * -
 * @param inputPrice
 * @param outputPrice
 * @param currency
 * @param precision
 */
export const formatPriceRange = (
  inputPrice: number,
  outputPrice: number,
  currency: CurrencyType = "USD",
  precision: number = 4,
): string => {
  const formattedInput = formatPrice(inputPrice, currency, precision)
  const formattedOutput = formatPrice(outputPrice, currency, precision)

  if (inputPrice === outputPrice) {
    return formattedInput
  }

  return `${formattedInput} ~ ${formattedOutput}`
}

/**
 *
 * @param quotaType
 */
export const getBillingModeText = (quotaType: number): string => {
  return isTokenBillingType(quotaType)
    ? t("ui:billing.tokenBased")
    : t("ui:billing.perCall")
}

/**
 *
 * @param quotaType
 */
export const getBillingModeStyle = (
  quotaType: number,
): { color: string; bgColor: string } => {
  return isTokenBillingType(quotaType)
    ? { color: "text-blue-600", bgColor: "bg-blue-50" }
    : { color: "text-purple-600", bgColor: "bg-purple-50" }
}

/**
 *
 * @param model
 * @param userGroup
 */
export const isModelAvailableForGroup = (
  model: ModelPricing,
  userGroup: string,
): boolean => {
  return model.enable_groups.includes(userGroup)
}

/**
 *
 * @param endpointTypes
 */
export const getEndpointTypesText = (
  endpointTypes: string[] | undefined,
): string => {
  if (!endpointTypes || !Array.isArray(endpointTypes)) {
    return t("ui:billing.notProvided")
  }
  return endpointTypes.join(", ")
}

/**
 * Determines whether a quota type represents token-based pricing.
 * @param quotaType Backend quota type enumerator.
 * @returns True for token-based billing, false for per-call plans.
 */
export const isTokenBillingType = (quotaType: number) => {
  return quotaType === 0
}
