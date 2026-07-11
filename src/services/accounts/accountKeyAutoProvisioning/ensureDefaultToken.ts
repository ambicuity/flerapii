import { getApiService } from "~/services/apiService"
import type { CreateTokenRequest } from "~/services/apiService/common/type"
import { withExtensionStorageWriteLock } from "~/services/core/storageWriteLock"
import type { ApiToken, DisplaySiteData, SiteAccount } from "~/types"

export const DEFAULT_AUTO_PROVISION_TOKEN_NAME = "user group (auto)"

const AUTO_PROVISION_TOKEN_LOCK_PREFIX = "auto-provision-token:"

/**
 * Generates the default token payload used by key auto-provisioning flows.
 *
 * Default token definition MUST remain stable (see OpenSpec requirements).
 */
export function generateDefaultTokenRequest(): CreateTokenRequest {
  return {
    name: DEFAULT_AUTO_PROVISION_TOKEN_NAME,
    unlimited_quota: true,
    expired_time: -1, // Never expires
    remain_quota: 0,
    allow_ips: "", // No IP restriction
    model_limits_enabled: false,
    model_limits: "", // All models allowed
    // Empty string follows the user's group
    group: "",
  }
}

/**
 * Ensures that an API token exists for the supplied account by checking the
 * remote token inventory and lazily issuing a default token when none exist.
 *
 * This helper is safe to run in background contexts (no UI dependencies).
 */
export async function ensureDefaultApiTokenForAccount(params: {
  account: SiteAccount
  displaySiteData: DisplaySiteData
}): Promise<{ token: ApiToken; created: boolean }> {
  const { account, displaySiteData } = params
  // Serialize provisioning per account so two concurrent callers (e.g. a bulk
  // repair run and an interactive key dialog) don't both observe an empty token
  // list and each create a duplicate "user group (auto)" token (TOCTOU). The
  // lock is cross-context via the Web Locks API where available.
  return withExtensionStorageWriteLock(
    `${AUTO_PROVISION_TOKEN_LOCK_PREFIX}${account.id}`,
    () => provisionDefaultApiTokenForAccount(account, displaySiteData),
  )
}

/**
 * Core token-provisioning logic. Must run under the per-account lock acquired
 * by {@link ensureDefaultApiTokenForAccount}; do not call directly.
 */
async function provisionDefaultApiTokenForAccount(
  account: SiteAccount,
  displaySiteData: DisplaySiteData,
): Promise<{ token: ApiToken; created: boolean }> {
  const service = getApiService(displaySiteData.siteType)

  const tokens = await service.fetchAccountTokens({
    baseUrl: displaySiteData.baseUrl,
    accountId: displaySiteData.id,
    auth: {
      authType: displaySiteData.authType,
      userId: displaySiteData.userId,
      accessToken: displaySiteData.token,
      cookie: displaySiteData.cookieAuthSessionCookie,
    },
  })

  let apiToken: ApiToken | undefined = tokens.at(-1)
  if (apiToken) {
    return { token: apiToken, created: false }
  }

  const newTokenData = generateDefaultTokenRequest()
  const createApiTokenResult = await service.createApiToken(
    {
      baseUrl: account.site_url,
      accountId: account.id,
      auth: {
        authType: account.authType,
        userId: account.account_info.id,
        accessToken: account.account_info.access_token,
        cookie: account.cookieAuth?.sessionCookie,
      },
    },
    newTokenData,
  )

  if (!createApiTokenResult) {
    throw new Error("create_token_failed")
  }

  const updatedTokens = await service.fetchAccountTokens({
    baseUrl: displaySiteData.baseUrl,
    accountId: displaySiteData.id,
    auth: {
      authType: displaySiteData.authType,
      userId: displaySiteData.userId,
      accessToken: displaySiteData.token,
      cookie: displaySiteData.cookieAuthSessionCookie,
    },
  })
  apiToken = updatedTokens.at(-1)

  if (!apiToken) {
    throw new Error("token_not_found")
  }

  return { token: apiToken, created: true }
}
