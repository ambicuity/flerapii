import { describe, expect, it } from "vitest"

import {
  holdTempContext,
  isTempContextPoolIdle,
  releaseTempContextHold,
  selectReusableTempContext,
} from "~/entrypoints/background/tempWindowPool"

const createContext = () => ({ holders: new Set<string>() })

describe("temp window context pool reuse policy", () => {
  it("does not reuse a context that is still held by another request", () => {
    const busy = createContext()
    const idle = createContext()
    holdTempContext(busy, "req-1")

    const selected = selectReusableTempContext([busy, idle])

    expect(selected).toBe(idle)
    expect(selected).not.toBe(busy)
  })

  it("returns null when every pooled context is held", () => {
    const first = createContext()
    const second = createContext()
    holdTempContext(first, "req-1")
    holdTempContext(second, "req-2")

    expect(selectReusableTempContext([first, second])).toBeNull()
  })

  it("reuses an idle context", () => {
    const idle = createContext()

    expect(selectReusableTempContext([idle])).toBe(idle)
  })

  it("keeps the origin pool alive while any context is still held", () => {
    const first = createContext()
    const second = createContext()
    holdTempContext(first, "req-1")
    holdTempContext(second, "req-2")

    expect(isTempContextPoolIdle([first, second])).toBe(false)

    // Releasing one request must not release another request's hold.
    releaseTempContextHold(first, "req-1")

    expect(first.holders.size).toBe(0)
    expect(second.holders.has("req-2")).toBe(true)
    expect(isTempContextPoolIdle([first, second])).toBe(false)
  })

  it("reports the pool idle once every request released its hold", () => {
    const first = createContext()
    const second = createContext()
    holdTempContext(first, "req-1")
    holdTempContext(second, "req-2")

    releaseTempContextHold(first, "req-1")
    releaseTempContextHold(second, "req-2")

    expect(isTempContextPoolIdle([first, second])).toBe(true)
  })
})
