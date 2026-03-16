/**
 * Octopus API
 */

/**
 *  Octopus
 */
export function buildOctopusAuthHeaders(
  jwtToken: string,
): Record<string, string> {
  return {
    Authorization: `Bearer ${jwtToken}`,
    "Content-Type": "application/json",
  }
}
