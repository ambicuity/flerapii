import { useCallback, useEffect, useRef, useState } from "react"

/**
 *  AccountList  hover
 * @returns
 *
 *
 *
 *  hover
 */
export const useAccountListItem = () => {
  const [hoveredSiteId, setHoveredSiteId] = useState<string | null>(null)
  const hoverTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  //  hover
  const handleMouseEnter = useCallback((siteId: string) => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setHoveredSiteId(siteId)
    }, 50) // 50ms
  }, [])

  const handleMouseLeave = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current)
    }
    setHoveredSiteId(null)
  }, [])

  //
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current)
      }
    }
  }, [])

  return {
    hoveredSiteId,
    handleMouseEnter,
    handleMouseLeave,
  }
}
