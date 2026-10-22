import { beforeEach, describe, expect, it, vi } from "vitest"

import { accountStorage } from "~/services/accounts/accountStorage"
import { ACCOUNT_STORAGE_KEYS } from "~/services/core/storageKeys"
import { AuthTypeEnum, SiteHealthStatus, type SiteAccount } from "~/types"

const storageData = new Map<string, any>()

const storageHooks: {
  beforeGet: (key: string) => Promise<void>
  beforeSet: (key: string, value: any) => Promise<void>
} = {
  beforeGet: async () => {},
  beforeSet: async () => {},
}

vi.mock("@plasmohq/storage", () => {
  class Storage {
    async set(key: string, value: any) {
      await storageHooks.beforeSet(key, value)
      storageData.set(key, value)
    }

    async get(key: string) {
      await storageHooks.beforeGet(key)
      return storageData.get(key)
    }

    async remove(key: string) {
      storageData.delete(key)
    }
  }

  return { Storage }
})

vi.mock("~/services/apiService", () => ({
  getApiService: vi.fn(() => ({})),
}))

const createAccount = (
  id: string,
  overrides: Partial<SiteAccount> = {},
): SiteAccount =>
  ({
    id,
    site_name: `Site ${id}`,
    site_url: `https://${id}.example.com`,
    health: { status: SiteHealthStatus.Healthy },
    site_type: "new-api",
    exchange_rate: 7.2,
    account_info: {
      id: 1,
      access_token: "token",
      username: "tester",
      quota: 0,
      today_prompt_tokens: 0,
      today_completion_tokens: 0,
      today_quota_consumption: 0,
      today_requests_count: 0,
      today_income: 0,
    },
    last_sync_time: 0,
    updated_at: 0,
    created_at: 0,
    notes: "",
    tagIds: [],
    authType: AuthTypeEnum.AccessToken,
    ...overrides,
  }) as SiteAccount

describe("accountStorage concurrent migration write", () => {
  beforeEach(() => {
    storageData.clear()
    storageHooks.beforeGet = async () => {}
    storageHooks.beforeSet = async () => {}
  })

  it("keeps an account that was added while a migration was pending", async () => {
    const legacyAccount = createAccount("legacy", { configVersion: 1 })

    storageData.set(ACCOUNT_STORAGE_KEYS.ACCOUNTS, {
      accounts: [legacyAccount],
      bookmarks: [],
      pinnedAccountIds: [],
      orderedAccountIds: [],
      last_updated: Date.now(),
    })

    const concurrentAccount = createAccount("concurrent", { configVersion: 5 })

    let accountsReadCount = 0
    storageHooks.beforeGet = async (key: string) => {
      if (key !== ACCOUNT_STORAGE_KEYS.ACCOUNTS) return
      accountsReadCount += 1

      // The third read is the one that happens while the migration write is
      // about to be produced. Simulate an account that another extension
      // context added in the meantime.
      if (accountsReadCount === 3) {
        const current = storageData.get(key)
        storageData.set(key, {
          ...current,
          accounts: [...(current?.accounts ?? []), concurrentAccount],
        })
      }
    }

    const accounts = await accountStorage.getAllAccounts()

    expect(accounts.map((account) => account.id)).toContain("concurrent")
    expect(accounts.map((account) => account.id)).toContain("legacy")

    const stored = storageData.get(ACCOUNT_STORAGE_KEYS.ACCOUNTS)
    expect(
      (stored?.accounts ?? []).map((account: SiteAccount) => account.id),
    ).toContain("concurrent")
  })
})
