/**
 * Octopus
 *  Octopus
 */
export interface OctopusConfig {
  /** Octopus  URL */
  baseUrl: string
  /**  */
  username: string
  /**  */
  password: string
}

export const DEFAULT_OCTOPUS_CONFIG: OctopusConfig = {
  baseUrl: "",
  username: "",
  password: "",
}
