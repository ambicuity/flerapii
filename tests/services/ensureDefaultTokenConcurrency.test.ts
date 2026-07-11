import { beforeEach, describe, expect, it, vi } from "vitest"

import type { DisplaySiteData, SiteAccount } from "~/types"

const fetchAccountTokens = vi.fn()
const createApiToken = vi.fn()

vi.mock("~/services/apiService", () => ({
  getApiService: () => ({
    fetchAccountTokens: (...args: unknown[]) => fetchAccountTokens(...args),
    createApiToken: (...args: unknown[]) => createApiToken(...args),
  }),
}))

const { ensureDefaultApiTokenForAccount } =
  await import("~/services/accounts/accountKeyAutoProvisioning/ensureDefaultToken")

const account = {
  id: "acc-1",
  site_url: "https://example.com",
  account_info: { id: 1, access_token: "access-token" },
} as unknown as SiteAccount

const displaySiteData = {
  id: "acc-1",
  siteType: "test",
  baseUrl: "https://example.com",
  userId: 1,
  token: "access-token",
} as unknown as DisplaySiteData

/**
 * Regression guard for the TOCTOU that let two concurrent callers (e.g. a bulk
 * repair run and an interactive key dialog) each observe an empty token list
 * and both create a duplicate "user group (auto)" token. Provisioning is now
 * serialized per account, so only one token is created.
 */
describe("ensureDefaultApiTokenForAccount concurrency", () => {
  beforeEach(() => {
    fetchAccountTokens.mockReset()
    createApiToken.mockReset()
  })

  it("creates only one token when two callers race for the same account", async () => {
    const tokens: Array<{ id: number }> = []
    fetchAccountTokens.mockImplementation(async () => tokens.slice())
    createApiToken.mockImplementation(async () => {
      tokens.push({ id: tokens.length + 1 })
      return true
    })

    const results = await Promise.all([
      ensureDefaultApiTokenForAccount({ account, displaySiteData }),
      ensureDefaultApiTokenForAccount({ account, displaySiteData }),
    ])

    expect(createApiToken).toHaveBeenCalledTimes(1)
    expect(results.filter((r) => r.created)).toHaveLength(1)
  })

  it("does not create a token when one already exists", async () => {
    fetchAccountTokens.mockResolvedValue([{ id: 7 }])

    const result = await ensureDefaultApiTokenForAccount({
      account,
      displaySiteData,
    })

    expect(createApiToken).not.toHaveBeenCalled()
    expect(result.created).toBe(false)
  })
})
