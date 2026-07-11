import { describe, expect, it } from "vitest"

import { isInvalidAccessTokenMessage } from "~/features/AutoCheckin/utils/autoCheckin"

/**
 * Unit tests for the invalid/expired access-token message heuristic.
 *
 * Regression guard: the hint-keyword list previously contained empty strings,
 * which made `.some((k) => message.includes(k))` always true (because
 * `"".includes("")` is `true`). That collapsed the filter down to just
 * "access token" and produced false-positive troubleshooting hints for
 * unrelated failures.
 */
describe("isInvalidAccessTokenMessage", () => {
  it("matches an explicit invalid access token failure", () => {
    expect(
      isInvalidAccessTokenMessage("Unauthorized, invalid access token"),
    ).toBe(true)
  })

  it("matches an expired access token failure", () => {
    expect(isInvalidAccessTokenMessage("The access token has expired")).toBe(
      true,
    )
  })

  it("does not flag an unrelated 'access token' message as invalid/expired", () => {
    expect(isInvalidAccessTokenMessage("Please provide an access token")).toBe(
      false,
    )
  })

  it("ignores messages without any access-token keyword", () => {
    expect(isInvalidAccessTokenMessage("Check-in failed")).toBe(false)
  })

  it("returns false for empty input", () => {
    expect(isInvalidAccessTokenMessage("")).toBe(false)
  })
})
