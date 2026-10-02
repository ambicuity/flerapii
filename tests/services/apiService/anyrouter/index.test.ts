import { beforeEach, describe, expect, it, vi } from "vitest"

import { fetchCheckInStatus } from "~/services/apiService/anyrouter"
import { AuthTypeEnum } from "~/types"
import { CHECKIN_RESULT_STATUS } from "~/types/autoCheckin"

const { mockCheckIn } = vi.hoisted(() => ({ mockCheckIn: vi.fn() }))

vi.mock("~/services/checkin/autoCheckin/providers/anyrouter", () => ({
  anyrouterProvider: { checkIn: mockCheckIn },
}))

const request = {
  baseUrl: "https://anyrouter.example.com",
  auth: { authType: AuthTypeEnum.Cookie, userId: 42 },
} as any

describe("apiService anyrouter fetchCheckInStatus", () => {
  beforeEach(() => {
    mockCheckIn.mockReset()
  })

  it("reports already checked in (false) after the detection POST succeeds", async () => {
    mockCheckIn.mockResolvedValueOnce({
      status: CHECKIN_RESULT_STATUS.SUCCESS,
    })

    await expect(fetchCheckInStatus(request)).resolves.toBe(false)
    expect(mockCheckIn).toHaveBeenCalledWith({
      site_url: request.baseUrl,
      account_info: { id: 42 },
    })
  })

  it("reports already checked in (false) when the site says already checked", async () => {
    mockCheckIn.mockResolvedValueOnce({
      status: CHECKIN_RESULT_STATUS.ALREADY_CHECKED,
    })

    await expect(fetchCheckInStatus(request)).resolves.toBe(false)
  })

  it("reports can check in (true) when the check-in attempt failed", async () => {
    mockCheckIn.mockResolvedValueOnce({
      status: CHECKIN_RESULT_STATUS.FAILED,
    })

    await expect(fetchCheckInStatus(request)).resolves.toBe(true)
  })

  it("reports unknown (undefined) for a skipped result", async () => {
    mockCheckIn.mockResolvedValueOnce({
      status: CHECKIN_RESULT_STATUS.SKIPPED,
    })

    await expect(fetchCheckInStatus(request)).resolves.toBeUndefined()
  })

  it("reports unknown (undefined) when the user id is not numeric", async () => {
    await expect(
      fetchCheckInStatus({
        ...request,
        auth: { ...request.auth, userId: "abc" },
      }),
    ).resolves.toBeUndefined()
    expect(mockCheckIn).not.toHaveBeenCalled()
  })
})
