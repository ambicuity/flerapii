import { beforeEach, describe, expect, it } from "vitest"

import { Storage } from "@plasmohq/storage"

import { USER_PREFERENCES_STORAGE_KEYS } from "~/services/core/storageKeys"
import {
  DEFAULT_PREFERENCES,
  userPreferences,
} from "~/services/preferences/userPreferences"
import { DEFAULT_SORTING_PRIORITY_CONFIG } from "~/services/preferences/utils/sortingPriority"

const storage = new Storage({ area: "local" })

const storePreferences = async (overrides: Record<string, unknown>) => {
  await storage.set(USER_PREFERENCES_STORAGE_KEYS.USER_PREFERENCES, {
    ...DEFAULT_PREFERENCES,
    ...overrides,
  })
}

describe("userPreferences sorting priority reset", () => {
  beforeEach(async () => {
    await storage.remove(USER_PREFERENCES_STORAGE_KEYS.USER_PREFERENCES)
  })

  it("resetSortingPriorityConfig persists the default configuration", async () => {
    const customConfig = {
      ...DEFAULT_SORTING_PRIORITY_CONFIG,
      criteria: DEFAULT_SORTING_PRIORITY_CONFIG.criteria.map((c) => ({
        ...c,
        enabled: false,
      })),
    }

    await storePreferences({ sortingPriorityConfig: customConfig })

    await userPreferences.setSortingPriorityConfig(customConfig)

    const reset = await userPreferences.resetSortingPriorityConfig()
    expect(reset).toBe(true)

    const stored = await storage.get(
      USER_PREFERENCES_STORAGE_KEYS.USER_PREFERENCES,
    )
    const storedConfig = (stored as any)?.sortingPriorityConfig
    expect(storedConfig).toBeTruthy()
    expect(storedConfig.criteria.map((c: any) => c.enabled)).toEqual(
      DEFAULT_SORTING_PRIORITY_CONFIG.criteria.map((c) => c.enabled),
    )
  })
})
