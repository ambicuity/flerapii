/**
 *
 */

/**
 *
 * @param value -
 * @returns
 */
export function parseDelimitedList(value?: string | null): string[] {
  if (!value) return []
  return value
    .split(/[,]/)
    .map((item) => item.trim())
    .filter(Boolean)
}

/**
 * trim
 * @param values -
 * @returns
 */
export function normalizeList(values: string[] = []): string[] {
  return Array.from(new Set(values.map((item) => item.trim()).filter(Boolean)))
}
