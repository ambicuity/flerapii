import { useEffect, useState } from "react"

/**
 *  Hook
 * @param query - CSS
 * @returns boolean -
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false)

  useEffect(() => {
    const media = window.matchMedia(query)

    //
    setMatches(media.matches)

    //
    const listener = (e: MediaQueryListEvent) => {
      setMatches(e.matches)
    }

    //
    if (media.addEventListener) {
      media.addEventListener("change", listener)
    } else {
      media.addListener(listener)
    }

    return () => {
      if (media.removeEventListener) {
        media.removeEventListener("change", listener)
      } else {
        media.removeListener(listener)
      }
    }
  }, [query]) //  query

  return matches
}

/**
 *  Hooks
 */
export const useIsMobile = () => useMediaQuery("(max-width: 767px)")
export const useIsTablet = () =>
  useMediaQuery("(min-width: 768px) and (max-width: 1023px)")
export const useIsDesktop = () => useMediaQuery("(min-width: 1024px)")
export const useIsSmallScreen = () => useMediaQuery("(max-width: 639px)")
