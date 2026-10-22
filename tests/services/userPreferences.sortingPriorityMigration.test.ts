import { beforeEach, describe, expect, it } from "vitest"

import { Storage } from "@plasmohq/storage"

import { USER_PREFERENCES_STORAGE_KEYS } from "~/services/core/storageKeys"
import {
  migrateSortingConfig,
  needsSortingConfigMigration,
} from "~/services/preferences/migrations/sortingConfigMigration"
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

describe("sorting priority config migration", () => {
  it("treats a config without criteria as needing migration", () => {
    expect(needsSortingConfigMigration({} as any)).toBe(true)
    expect(needsSortingConfigMigration({ criteria: null } as any)).toBe(true)
  })

  it("does not throw for a partially shaped config", () => {
    const migrated = migrateSortingConfig({} as any)

    expect(migrated.criteria.length).toBe(
      DEFAULT_SORTING_PRIORITY_CONFIG.criteria.length,
    )
  })

  it("does not throw when criteria is null", () => {
    const migrated = migrateSortingConfig({ criteria: null } as any)

    expect(migrated.criteria.length).toBe(
      DEFAULT_SORTING_PRIORITY_CONFIG.criteria.length,
    )
  })
})

describe("userPreferences with a malformed sorting config", () => {
  beforeEach(async () => {
    await storage.remove(USER_PREFERENCES_STORAGE_KEYS.USER_PREFERENCES)
  })

  it("keeps the stored settings when the sorting config is malformed", async () => {
    await storePreferences({
      sortingPriorityConfig: {},
      webdav: {
        ...DEFAULT_PREFERENCES.webdav,
        url: "https://dav.example.com/backups/flerapii.json",
        username: "backup-user",
        password: "super-secret",
      },
    })

    const prefs = await userPreferences.getPreferences()
    expect(prefs.webdav.password).toBe("super-secret")

    // Any later save must not replace the stored settings with defaults.
    await userPreferences.savePreferences({ themeMode: "dark" })

    const stored = await storage.get(
      USER_PREFERENCES_STORAGE_KEYS.USER_PREFERENCES,
    )
    expect((stored as any)?.webdav?.password).toBe("super-secret")
    expect((stored as any)?.themeMode).toBe("dark")
  })
})
