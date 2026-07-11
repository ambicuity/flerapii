import { render } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import CountUp from "~/lib/reactCountUp"

/**
 * Regression guard for the react-countup interop crash.
 *
 * react-countup 6.x is CJS-only and its default component export gets mangled
 * into a plain object by this project's bundler, which crashed the popup with
 * React error #130. This wrapper rebuilds the component on top of the working
 * `useCountUp` hook. The key invariant: the default export must be a renderable
 * component (a function), not an object — rendering it must not throw.
 */
describe("reactCountUp wrapper", () => {
  it("is a function component, not a mangled module object", () => {
    expect(typeof CountUp).toBe("function")
  })

  it("renders an element without throwing (React #130 guard)", () => {
    const { container } = render(<CountUp start={0} end={42} decimals={2} />)
    expect(container.querySelector("span")).not.toBeNull()
  })
})
