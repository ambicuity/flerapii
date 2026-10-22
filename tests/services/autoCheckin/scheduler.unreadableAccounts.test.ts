import { beforeEach, describe, expect, it, vi } from "vitest"

import { accountStorage } from "~/services/accounts/accountStorage"
import { autoCheckinScheduler } from "~/services/checkin/autoCheckin/scheduler"
import { autoCheckinStorage } from "~/services/checkin/autoCheckin/storage"
import { userPreferences } from "~/services/preferences/userPreferences"
import { AUTO_CHECKIN_RUN_TYPE } from "~/types/autoCheckin"

vi.mock("~/services/preferences/userPreferences", () => ({
  DEFAULT_PREFERENCES: {
    autoCheckin: {
      globalEnabled: true,
      pretriggerDailyOnUiOpen: false,
      notifyUiOnCompletion: false,
      windowStart: "08:00",
      windowEnd: "10:00",
      scheduleMode: "random",
      deterministicTime: "08:00",
      retryStrategy: {
        enabled: false,
        intervalMinutes: 30,
        maxAttemptsPerDay: 3,
      },
    },
  },
  userPreferences: {
    getPreferences: vi.fn(),
    savePreferences: vi.fn(),
  },
}))

vi.mock("~/services/accounts/accountStorage", () => ({
  accountStorage: {
    getAllAccounts: vi.fn(),
    getAllAccountsWithStatus: vi.fn(),
    getEnabledAccounts: vi.fn(),
    updateAccount: vi.fn(),
    markAccountAsSiteCheckedIn: vi.fn(),
    refreshAccount: vi.fn(),
    getAccountById: vi.fn(),
    convertToDisplayData: vi.fn(),
  },
}))

vi.mock("~/services/checkin/autoCheckin/storage", () => ({
  AUTO_CHECKIN_STATUS_STORAGE_LOCK: "flerapii:auto-checkin-status",
  autoCheckinStorage: {
    getStatus: vi.fn(),
    saveStatus: vi.fn(),
  },
}))

vi.mock("~/services/checkin/autoCheckin/providers", () => ({
  resolveAutoCheckinProvider: vi.fn(),
}))

const mockedAccountStorage = accountStorage as unknown as {
  getAllAccountsWithStatus: ReturnType<typeof vi.fn>
}
const mockedAutoCheckinStorage = autoCheckinStorage as unknown as {
  getStatus: ReturnType<typeof vi.fn>
  saveStatus: ReturnType<typeof vi.fn>
}
const mockedUserPreferences = userPreferences as unknown as {
  getPreferences: ReturnType<typeof vi.fn>
}

let storedStatus: any = null

describe("autoCheckinScheduler.runCheckins with an unreadable account store", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    storedStatus = null

    mockedUserPreferences.getPreferences.mockResolvedValue({
      autoCheckin: {
        globalEnabled: true,
        notifyUiOnCompletion: false,
      },
    })

    mockedAutoCheckinStorage.getStatus.mockImplementation(
      async () => storedStatus,
    )
    mockedAutoCheckinStorage.saveStatus.mockImplementation(
      async (status: any) => {
        storedStatus = status
        return true
      },
    )

    // The account store cannot be read.
    mockedAccountStorage.getAllAccountsWithStatus.mockResolvedValue({
      accounts: [],
      readable: false,
    })
  })

  it("does not report a successful daily run when the accounts cannot be read", async () => {
    await autoCheckinScheduler.runCheckins({
      runType: AUTO_CHECKIN_RUN_TYPE.DAILY,
    })

    expect(mockedAutoCheckinStorage.saveStatus).toHaveBeenCalled()

    const status = mockedAutoCheckinStorage.saveStatus.mock.calls.at(-1)?.[0]
    expect(status?.lastRunResult).toBe("failed")
    // The day must not be stamped as done, otherwise the day's check-in is
    // silently skipped and never retried.
    expect(status?.lastDailyRunDay).toBeUndefined()
  })

  it("does not report success for a manual run either", async () => {
    await autoCheckinScheduler.runCheckins({
      runType: AUTO_CHECKIN_RUN_TYPE.MANUAL,
    })

    expect(mockedAutoCheckinStorage.saveStatus).toHaveBeenCalled()

    const status = mockedAutoCheckinStorage.saveStatus.mock.calls.at(-1)?.[0]
    expect(status?.lastRunResult).toBe("failed")
  })

  it("keeps the previous per-account history when the accounts cannot be read", async () => {
    storedStatus = {
      perAccount: {
        "account-1": { accountId: "account-1", status: "success" },
      },
    }

    await autoCheckinScheduler.runCheckins({
      runType: AUTO_CHECKIN_RUN_TYPE.DAILY,
    })

    const status = mockedAutoCheckinStorage.saveStatus.mock.calls.at(-1)?.[0]
    expect(status?.perAccount).toEqual(storedStatus.perAccount)
  })
})
