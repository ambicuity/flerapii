/**
 *
 *
 *
 * 1.
 * 2.
 * 3.
 *
 *
 * - analyzeAutoDetectError:
 * - getLoginUrl: URL
 * - openLoginTab:
 *
 *
 * - AddAccountDialog  EditAccountDialog
 * - AutoDetectErrorAlert
 */
import { getErrorMessage } from "~/utils/core/error"
import { t } from "~/utils/i18n/core"
import { getDocsAutoDetectUrl } from "~/utils/navigation/docsLinks"

//
export enum AutoDetectErrorType {
  TIMEOUT = "timeout",
  UNAUTHORIZED = "unauthorized",
  INVALID_RESPONSE = "invalid_response",
  NETWORK_ERROR = "network_error",
  UNKNOWN = "unknown",
  FORBIDDEN = "forbidden",
  NOT_FOUND = "notFound",
  SERVER_ERROR = "serverError",
}

//
export interface AutoDetectError {
  type: AutoDetectErrorType
  message: string
  actionText?: string
  actionUrl?: string
  helpDocUrl?: string
}

const ERROR_KEYWORDS: Record<string, string[]> = {
  TIMEOUT: ["timeout", "request timeout", "timed out"],
  UNAUTHORIZED: ["401", "unauthorized", "login required"],
  INVALID_RESPONSE: [
    "json",
    "invalid response",
    "parse error",
    "malformed",
    "data unexpected",
    "cannot get",
    "format",
  ],
  NETWORK_ERROR: ["network", "connection lost", "offline", "connection failed"],
  FORBIDDEN: ["403", "forbidden"],
  NOT_FOUND: ["404", "not found"],
  SERVER_ERROR: ["500", "internal server error", "server crash"],
}

/**
 * Convert a raw error into a structured {@link AutoDetectError}.
 *
 * Scans known keyword buckets to infer the most likely failure type and
 * returns localized UI copy plus optional next-action metadata.
 * @param error Unknown error object thrown during auto-detection.
 * @returns Structured error info for UI display and guidance.
 */
export function analyzeAutoDetectError(error: any): AutoDetectError {
  const errorMessage = getErrorMessage(error) || ""

  const msg = errorMessage.toLowerCase()
  const docsUrl = getDocsAutoDetectUrl()

  // Iterate known keyword buckets and return the first matching structured error
  for (const [type, keywords] of Object.entries(ERROR_KEYWORDS)) {
    if (keywords.some((k) => msg.includes(k.toLowerCase()))) {
      switch (type) {
        case "TIMEOUT":
          return {
            type: AutoDetectErrorType.TIMEOUT,
            message: t("messages:autodetect.timeout"),
            helpDocUrl: docsUrl,
          }
        case "UNAUTHORIZED":
          return {
            type: AutoDetectErrorType.UNAUTHORIZED,
            message: t("messages:autodetect.notLoggedIn"),
            actionText: t("messages:autodetect.loginThisSite"),
            helpDocUrl: docsUrl,
          }
        case "INVALID_RESPONSE":
          return {
            type: AutoDetectErrorType.INVALID_RESPONSE,
            message: t("messages:autodetect.unexpectedData"),
            helpDocUrl: docsUrl,
          }
        case "NETWORK_ERROR":
          return {
            type: AutoDetectErrorType.NETWORK_ERROR,
            message: t("messages:autodetect.networkError"),
            helpDocUrl: docsUrl,
          }
        case "FORBIDDEN":
          return {
            type: AutoDetectErrorType.FORBIDDEN,
            message: t("messages:autodetect.forbidden"),
            helpDocUrl: docsUrl,
          }
        case "NOT_FOUND":
          return {
            type: AutoDetectErrorType.NOT_FOUND,
            message: t("messages:autodetect.notFound"),
            helpDocUrl: docsUrl,
          }
        case "SERVER_ERROR":
          return {
            type: AutoDetectErrorType.SERVER_ERROR,
            message: t("messages:autodetect.serverError"),
            helpDocUrl: docsUrl,
          }
      }
    }
  }

  //
  return {
    type: AutoDetectErrorType.UNKNOWN,
    message: t("messages:autodetect.failed") + errorMessage,
    helpDocUrl: docsUrl,
  }
}

// props
export interface AutoDetectErrorProps {
  error: AutoDetectError
  siteUrl?: string
  onHelpClick?: () => void
  onActionClick?: () => void
}

/**
 * Build a best-effort login URL for a given site.
 *
 * Tries to normalize to `{protocol}//{host}/login`; falls back to the
 * original URL if parsing fails.
 * @param siteUrl Base site URL provided by the caller.
 * @returns Login page URL to open in a new tab.
 */
export function getLoginUrl(siteUrl: string): string {
  try {
    const url = new URL(siteUrl)
    //  One API  New API /login
    return `${url.protocol}//${url.host}/login`
  } catch {
    // If parsing fails, fall back to the original URL (best-effort)
    return siteUrl
  }
}

/**
 * Open a new browser tab pointing to the site's login page.
 * @param siteUrl Base site URL used to derive the login page.
 */
export async function openLoginTab(siteUrl: string): Promise<void> {
  const loginUrl = getLoginUrl(siteUrl)
  await browser.tabs.create({ url: loginUrl, active: true })
}
