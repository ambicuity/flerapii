import { beforeEach, describe, expect, it, vi } from "vitest"

import { DEFAULT_ACCOUNT_AUTO_REFRESH } from "~/types/accountAutoRefresh"

const {
  alarmListeners,
  mockCreateAlarm,
  mockClearAlarm,
  mockGetAlarm,
  mockGetPreferences,
  mockRefreshAllAccounts,
} = vi.hoisted(() => ({
  alarmListeners: [] as Array<(alarm: { name: string }) => unknown>,
  mockCreateAlarm: vi.fn(),
  mockClearAlarm: vi.fn(),
  mockGetAlarm: vi.fn(),
  mockGetPreferences: vi.fn(),
  mockRefreshAllAccounts: vi.fn(),
}))

vi.mock("~/utils/browser/browserApi", () => ({
  hasAlarmsAPI: () => true,
  createAlarm: mockCreateAlarm,
  clearAlarm: mockClearAlarm,
  getAlarm: mockGetAlarm,
  onAlarm: (cb: (alarm: { name: string }) => unknown) => {
    alarmListeners.push(cb)
    return () => {}
  },
  sendRuntimeMessage: vi.fn().mockResolvedValue(undefined),
}))

vi.mock("~/services/preferences/userPreferences", () => ({
  userPreferences: {
    getPreferences: mockGetPreferences,
    savePreferences: vi.fn(),
  },
}))

vi.mock("~/services/accounts/accountStorage", () => ({
  accountStorage: { refreshAllAccounts: mockRefreshAllAccounts },
}))

vi.mock("~/services/history/usageHistory/scheduler", () => ({
  usageHistoryScheduler: {
    runAfterRefreshSync: vi.fn().mockResolvedValue(undefined),
  },
}))

const enabledPrefs = (interval: number) => ({
  accountAutoRefresh: {
    ...DEFAULT_ACCOUNT_AUTO_REFRESH,
    enabled: true,
    interval,
  },
})

describe("autoRefreshService alarm scheduling (MV3-safe)", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.clearAllMocks()
    alarmListeners.length = 0
    mockGetAlarm.mockResolvedValue(undefined)
    mockRefreshAllAccounts.mockResolvedValue({ success: 1, failed: 0 })
  })

  it("registers the alarm listener synchronously during initialize", async () => {
    mockGetPreferences.mockResolvedValue(enabledPrefs(900))
    const { autoRefreshService } =
      await import("~/services/accounts/autoRefreshService")

    const pending = autoRefreshService.initialize()
    expect(alarmListeners).toHaveLength(1)
    await pending
  })

  it("schedules a periodic alarm instead of a setInterval timer", async () => {
    const setIntervalSpy = vi.spyOn(globalThis, "setInterval")
    mockGetPreferences.mockResolvedValue(enabledPrefs(900))
    const { autoRefreshService } =
      await import("~/services/accounts/autoRefreshService")

    await autoRefreshService.initialize()

    expect(mockCreateAlarm).toHaveBeenCalledWith(
      "accountAutoRefresh",
      expect.objectContaining({ periodInMinutes: 15 }),
    )
    expect(setIntervalSpy).not.toHaveBeenCalled()
    expect(autoRefreshService.getStatus().isRunning).toBe(true)
    setIntervalSpy.mockRestore()
  })

  it("keeps an existing alarm with the same period on service-worker restart", async () => {
    mockGetPreferences.mockResolvedValue(enabledPrefs(900))
    mockGetAlarm.mockResolvedValue({
      name: "accountAutoRefresh",
      periodInMinutes: 15,
      scheduledTime: Date.now() + 5 * 60_000,
    })
    const { autoRefreshService } =
      await import("~/services/accounts/autoRefreshService")

    await autoRefreshService.initialize()

    expect(mockCreateAlarm).not.toHaveBeenCalled()
    expect(autoRefreshService.getStatus().isRunning).toBe(true)
  })

  it("runs a background refresh when its alarm fires and ignores other alarms", async () => {
    mockGetPreferences.mockResolvedValue(enabledPrefs(900))
    const { autoRefreshService } =
      await import("~/services/accounts/autoRefreshService")
    await autoRefreshService.initialize()

    await alarmListeners[0]({ name: "someOtherAlarm" })
    expect(mockRefreshAllAccounts).not.toHaveBeenCalled()

    await alarmListeners[0]({ name: "accountAutoRefresh" })
    expect(mockRefreshAllAccounts).toHaveBeenCalledWith(false)
  })

  it("clears the alarm when auto refresh is disabled", async () => {
    mockGetPreferences.mockResolvedValue({
      accountAutoRefresh: { ...DEFAULT_ACCOUNT_AUTO_REFRESH, enabled: false },
    })
    const { autoRefreshService } =
      await import("~/services/accounts/autoRefreshService")

    await autoRefreshService.initialize()

    expect(mockClearAlarm).toHaveBeenCalledWith("accountAutoRefresh")
    expect(mockCreateAlarm).not.toHaveBeenCalled()
    expect(autoRefreshService.getStatus().isRunning).toBe(false)
  })
})
