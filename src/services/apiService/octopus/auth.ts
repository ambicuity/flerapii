/**
 * Octopus
 *  JWT Token
 */
import type { OctopusLoginResponse } from "~/types/octopus"
import type { OctopusConfig } from "~/types/octopusConfig"
import { createLogger } from "~/utils/core/logger"
import { t } from "~/utils/i18n/core"

const logger = createLogger("OctopusAuth")

/**
 * Octopus
 */
export interface OctopusLoginRequest {
  username: string
  password: string
  expire?: number
}

/**
 * Token
 */
interface TokenCacheEntry {
  token: string
  expireAt: number
}

/**
 * Octopus
 *  Token
 */
class OctopusAuthManager {
  private tokenCache: Map<string, TokenCacheEntry> = new Map()

  /**
   *
   */
  private getCacheKey(baseUrl: string, username: string): string {
    return `${baseUrl}:${username}`
  }

  /**
   *  Octopus  JWT Token
   */
  async login(
    baseUrl: string,
    credentials: OctopusLoginRequest,
  ): Promise<OctopusLoginResponse> {
    const url = `${baseUrl.replace(/\/$/, "")}/api/v1/user/login`

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    })

    if (!response.ok) {
      // Read body once as text, then try to parse as JSON
      const bodyText = await response.text()
      let serverMessage: string | undefined
      try {
        const errorJson = JSON.parse(bodyText)
        serverMessage = errorJson.message || undefined
      } catch {
        // not JSON, ignore
      }

      //  403  CORS
      if (response.status === 403) {
        const corsHint = t("messages:octopus.corsError")
        const detail = serverMessage || "Forbidden"
        throw new Error(`${detail}\n${corsHint}`)
      }

      throw new Error(
        serverMessage ||
          `HTTP ${response.status} - ${bodyText || "Unknown error"}`,
      )
    }

    const data = await response.json()

    if (data.code !== 200 || !data.data?.token) {
      throw new Error(data.message || "Login failed")
    }

    return data.data as OctopusLoginResponse
  }

  /**
   *  JWT Token
   * -  Token
   * -  Token
   *
   * Token
   * Octopus  token  15  expire
   */
  async getValidToken(config: OctopusConfig): Promise<string> {
    if (!config.baseUrl || !config.username || !config.password) {
      throw new Error("Octopus config is incomplete")
    }

    const cacheKey = this.getCacheKey(config.baseUrl, config.username)
    const cached = this.tokenCache.get(cacheKey)

    //  1
    const bufferTime = 1 * 60 * 1000
    if (cached && cached.expireAt > Date.now() + bufferTime) {
      return cached.token
    }

    //  Token
    logger.info("Auto-login to Octopus", { baseUrl: config.baseUrl })
    const response = await this.login(config.baseUrl, {
      username: config.username,
      password: config.password,
    })

    //
    const parsedExpireAt = new Date(response.expire_at).getTime()
    const defaultTTL = 15 * 60 * 1000 // 15 minutes fallback (Octopus default)
    let expireAt: number
    if (Number.isFinite(parsedExpireAt)) {
      expireAt = parsedExpireAt
    } else {
      logger.warn("Invalid expire_at from server, using default TTL", {
        expire_at: response.expire_at,
      })
      expireAt = Date.now() + defaultTTL
    }

    //
    this.tokenCache.set(cacheKey, {
      token: response.token,
      expireAt,
    })

    return response.token
  }

  /**
   *
   *  UI
   */
  async validateConfig(
    config: OctopusConfig,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await this.getValidToken(config)
      return { success: true }
    } catch (error) {
      logger.error("Config validation failed", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : undefined,
      }
    }
  }

  /**
   *
   */
  clearCache(baseUrl: string, username: string): void {
    const cacheKey = this.getCacheKey(baseUrl, username)
    this.tokenCache.delete(cacheKey)
  }

  /**
   *
   */
  clearAllCache(): void {
    this.tokenCache.clear()
  }
}

export const octopusAuthManager = new OctopusAuthManager()
