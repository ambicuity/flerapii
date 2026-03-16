//
import { UI_CONSTANTS } from "~/constants/ui"
import { t } from "~/utils/i18n/core"

//  token  UI  (accountId + tokenId) tokenId
export const buildTokenIdentityKey = (accountId: string, tokenId: number) =>
  `${accountId}:${tokenId}`

export const formatKey = (
  key: string,
  tokenIdentityKey: string,
  visibleKeys: Set<string>,
) => {
  if (visibleKeys.has(tokenIdentityKey)) {
    return key
  }
  if (key.length < 12) {
    return "******"
  }
  return `${key.substring(0, 8)}${"*".repeat(16)}${key.substring(
    key.length - 4,
  )}`
}

//
export const formatQuota = (quota: number, unlimited: boolean) => {
  if (unlimited || quota < 0) return t("keyManagement:dialog.unlimitedQuota")
  return `$${(quota / UI_CONSTANTS.EXCHANGE_RATE.CONVERSION_FACTOR).toFixed(2)}`
}
