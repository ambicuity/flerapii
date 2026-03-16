import { hasCookieInterceptorPermissions } from "~/services/permissions/permissionManager"
import { mergeCookieHeaders } from "~/utils/browser/cookieString"
import { isProtectionBypassFirefoxEnv } from "~/utils/browser/protectionBypass"
import { createLogger } from "~/utils/core/logger"

/**
 * Unified logger scoped to the cookie helper utilities.
 */
const logger = createLogger("CookieHelper")

const normalizeHeaders = (
  headers: HeadersInit = {},
): Record<string, string> => {
  if (headers instanceof Headers) {
    return Object.fromEntries(headers.entries())
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers)
  }
  return { ...(headers as Record<string, string>) }
}

//
export const EXTENSION_HEADER_NAME = "Flerapii"
export const EXTENSION_HEADER_VALUE = "true"
export const COOKIE_AUTH_HEADER_NAME = "Flerapii-Cookie-Auth"
export const COOKIE_SESSION_OVERRIDE_HEADER_NAME = "Flerapii-Session-Cookie"

export const AUTH_MODE = {
  COOKIE_AUTH_MODE: "cookie",
  TOKEN_AUTH_MODE: "token",
} as const

export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE]

//
let isInterceptorRegistered = false

/**
 * Checks whether cookie interception should run (Firefox + permissions).
 * Logs helpful warnings when optional permissions were not granted.
 */
export async function checkCookieInterceptorRequirement(): Promise<boolean> {
  //  Firefox
  if (isProtectionBypassFirefoxEnv()) {
    //
    const granted = await hasCookieInterceptorPermissions()
    if (!granted) {
      logger.warn(
        "Required optional permissions (cookies/webRequest) are missing; skip cookie interception",
      )
    }
    return granted
  }

  //  Firefox
  return false
}

/**
 *  URL  Cookie
 */
export async function getCookieHeaderForUrl(
  url: string,
  options: { includeSession?: boolean } = {},
): Promise<string> {
  const includeSession = options.includeSession ?? true

  try {
    //  cookies
    const cookies = await browser.cookies.getAll({
      url,
      partitionKey: {},
    })

    //
    const validCookies = cookies.filter((cookie) => {
      //
      if (cookie.expirationDate && cookie.expirationDate < Date.now() / 1000) {
        return false
      }
      return true
    })

    const filteredCookies = includeSession
      ? validCookies
      : validCookies.filter((cookie) => cookie.name !== "session")

    //  Cookie name1=value1; name2=value2
    const cookieHeader = filteredCookies
      .map((c) => `${c.name}=${c.value}`)
      .join("; ")

    logger.debug(" Cookie", { url, cookieCount: validCookies.length })

    return cookieHeader
  } catch (error) {
    logger.warn(" Cookie ", error)
    return ""
  }
}

/**
 * WebRequest
 */
export async function handleWebRequest(
  details: browser.webRequest._OnBeforeSendHeadersDetails,
) {
  const headers = details.requestHeaders || []

  //
  let hasExtensionHeader = false
  let includeSessionCookie = true
  let sessionCookieOverride: string | null = null
  const normalizedExtensionName = EXTENSION_HEADER_NAME.toLowerCase()
  const normalizedCookieAuthName = COOKIE_AUTH_HEADER_NAME.toLowerCase()
  const normalizedSessionOverrideName =
    COOKIE_SESSION_OVERRIDE_HEADER_NAME.toLowerCase()

  headers.forEach((h: any) => {
    const lower = h.name.toLowerCase()
    if (
      lower === normalizedExtensionName &&
      h.value === EXTENSION_HEADER_VALUE
    ) {
      hasExtensionHeader = true
    }
    if (lower === normalizedCookieAuthName) {
      includeSessionCookie = h.value === AUTH_MODE.COOKIE_AUTH_MODE
    }
    if (lower === normalizedSessionOverrideName) {
      sessionCookieOverride = typeof h.value === "string" ? h.value : null
    }
  })

  if (!hasExtensionHeader) {
    return {}
  }

  logger.debug("", { url: details.url })

  //  Cookie
  let cookieHeader = await getCookieHeaderForUrl(details.url, {
    includeSession: includeSessionCookie,
  })

  const sessionCookieOverrideValue =
    typeof sessionCookieOverride === "string" ? sessionCookieOverride : ""

  // Multi-account cookie auth: merge WAF cookies + per-account session cookie
  if (includeSessionCookie && sessionCookieOverrideValue.trim().length > 0) {
    const wafCookieHeader = await getCookieHeaderForUrl(details.url, {
      includeSession: false,
    })
    cookieHeader = mergeCookieHeaders(
      wafCookieHeader,
      sessionCookieOverrideValue,
    )
  }

  if (!cookieHeader) {
    logger.warn(" Cookie", { url: details.url })
    return {}
  }

  //  Cookie
  const newHeaders = headers
    .map((h: any) => {
      //
      const lower = h.name.toLowerCase()
      if (
        lower === normalizedExtensionName ||
        lower === normalizedCookieAuthName ||
        lower === normalizedSessionOverrideName
      ) {
        return null
      }
      //  Cookie
      if (lower === "cookie") {
        logger.debug(" Cookie ")
        return { name: h.name, value: cookieHeader }
      }
      return h
    })
    .filter(Boolean) as any[]

  //  Cookie
  if (!headers.some((h: any) => h.name.toLowerCase() === "cookie")) {
    newHeaders.push({ name: "Cookie", value: cookieHeader })
    logger.debug(" Cookie ")
  }

  return { requestHeaders: newHeaders }
}

/**
 *  WebRequest
 * @param urlPatterns URL
 */
export function registerWebRequestInterceptor(urlPatterns: string[]): void {
  if (!isProtectionBypassFirefoxEnv()) {
    logger.debug(" Firefox ")
    return
  }

  try {
    //
    if (isInterceptorRegistered) {
      browser.webRequest.onBeforeSendHeaders.removeListener(handleWebRequest)
      isInterceptorRegistered = false
      logger.debug("")
    }

    //  URL
    if (!urlPatterns || urlPatterns.length === 0) {
      logger.debug(" URL ")
      return
    }

    //
    browser.webRequest.onBeforeSendHeaders.addListener(
      handleWebRequest,
      { urls: urlPatterns },
      ["blocking", "requestHeaders"],
    )

    isInterceptorRegistered = true
    logger.info("", {
      urlPatternCount: urlPatterns.length,
      urlPatterns,
    })
  } catch (error) {
    logger.error("", error)
    isInterceptorRegistered = false
  }
}

/**
 *  WebRequest
 * @param urlPatterns  URL
 */
export function setupWebRequestInterceptor(urlPatterns: string[] = []): void {
  if (!isProtectionBypassFirefoxEnv()) {
    logger.debug(" Firefox ")
    return
  }

  registerWebRequestInterceptor(urlPatterns)
}

/**
 *
 */
export function addExtensionHeader(
  headers: HeadersInit = {},
): Record<string, string> {
  if (!isProtectionBypassFirefoxEnv()) {
    return headers as Record<string, string>
  }

  const headersObj = normalizeHeaders(headers)
  headersObj[EXTENSION_HEADER_NAME] = EXTENSION_HEADER_VALUE
  return headersObj
}

/**
 * Adds the authentication mode header when the cookie interceptor is available.
 * Normalizes the headers object before mutating it.
 */
export async function addAuthMethodHeader(
  headers: HeadersInit = {},
  mode: AuthMode,
): Promise<Record<string, string>> {
  const headersObj = normalizeHeaders(headers)
  const canCookieInterceptor = await checkCookieInterceptorRequirement()
  if (canCookieInterceptor) {
    headersObj[COOKIE_AUTH_HEADER_NAME] = mode
  }
  return headersObj
}
