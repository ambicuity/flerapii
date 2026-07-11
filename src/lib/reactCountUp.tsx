import { useEffect, useRef, type RefObject } from "react"
import { useCountUp } from "react-countup"

/**
 * Interop-safe drop-in for react-countup's default `<CountUp>` component.
 *
 * react-countup 6.x ships CommonJS only (no `module`/`exports` fields). Under
 * this project's Rollup build the default export's CJS→ESM interop is mangled
 * into a plain object, so rendering `<CountUp>` throws React error #130
 * ("Element type is invalid … got: object") and crashes the entire surrounding
 * subtree (previously the whole popup rendered nothing). The named `useCountUp`
 * hook, however, resolves correctly, so this wrapper reimplements the small
 * slice of the component API the app actually uses on top of the hook.
 */
interface CountUpProps {
  start?: number
  end: number
  duration?: number
  decimals?: number
  /**
   * Accepted for parity with react-countup's `<CountUp>` API. This wrapper is
   * always value-preserving: the effect below drives the hook's `update()`,
   * which animates from the currently displayed value to the new `end`.
   */
  preserveValue?: boolean
}

/**
 * Animated numeric counter. Mirrors the subset of react-countup's `<CountUp>`
 * props used across the extension.
 */
export default function CountUp({
  start = 0,
  end,
  duration,
  decimals,
}: CountUpProps) {
  const elementRef = useRef<HTMLSpanElement>(null)
  const { update } = useCountUp({
    // react-countup's ref type predates React 19's nullable RefObject.
    ref: elementRef as RefObject<HTMLElement>,
    start,
    end,
    duration,
    decimals,
  })

  useEffect(() => {
    update(end)
  }, [end, update])

  return <span ref={elementRef} />
}
