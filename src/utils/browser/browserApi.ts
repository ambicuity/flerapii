/**
 * Browser API
 *  API  fallback
 */

import { APP_SHORT_NAME } from "~/constants/branding"
import {
  RuntimeActionIds,
  type RuntimeActionId,
} from "~/constants/runtimeActions"
import { isNotEmptyArray } from "~/utils"
import { getDeviceTypeInfo } from "~/utils/browser/device"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"

/**
 * Unified logger scoped to cross-browser WebExtension API helpers.
 */
const logger = createLogger("BrowserApi")

//  browser
if (typeof (globalThis as any).browser === "undefined") {
  // Prefer chrome if present; otherwise leave undefined to fail fast where appropriate
  if (typeof (globalThis as any).chrome !== "undefined") {
    ;(globalThis as any).browser = (globalThis as any).chrome
  } else {
    // Optional: provide a minimal stub or log for non-extension environments
    logger.warn("browser API unavailable: running outside extension context?")
  }
}

/**
 *
 *  Firefox Android  currentWindow
 */
export async function getActiveTabs(): Promise<browser.tabs.Tab[]> {
  try {
    //  currentWindow
    const tabs = await queryTabs({ active: true, currentWindow: true })
    if (tabs && tabs.length > 0) {
      return tabs
    }
  } catch (error) {
    // Firefox Android fallback
    logger.debug(
      "getActiveTabs: currentWindow not supported, falling back to active-only",
      error,
    )
  }

  // Fallback:  active
  try {
    return await queryTabs({ active: true })
  } catch (error) {
    logger.warn(
      "getActiveTabs: active query failed, returning empty array",
      error,
    )
    return []
  }
}

/**
 *
 */
export async function getActiveTab(): Promise<browser.tabs.Tab | null> {
  const tabs = await getActiveTabs()
  return tabs.length > 0 ? tabs[0] : null
}

/**
 *
 *
 *
 *
 */
export async function getActiveOrAllTabs() {
  let tabs
  tabs = await getActiveTabs()
  if (!isNotEmptyArray(tabs)) {
    tabs = await getAllTabs()
  }
  return tabs || []
}

/**
 * Retrieves all browser tabs and falls back to an empty array if the API returns nullish.
 */
export async function getAllTabs(): Promise<browser.tabs.Tab[]> {
  return (await queryTabs({})) || []
}

/**
 *
 *  active: true
 * @param url  URL
 * @param active
 */
export async function createTab(
  url: string,
  active = true,
  options?: { windowId?: number },
): Promise<browser.tabs.Tab | undefined> {
  return await browser.tabs.create({
    url,
    active,
    windowId: options?.windowId,
  })
}

/**
 *
 * @param tabId  ID
 * @param updateInfo
 */
export async function updateTab(
  tabId: number,
  updateInfo: browser.tabs._UpdateUpdateProperties,
): Promise<browser.tabs.Tab | undefined> {
  return await browser.tabs.update(tabId, updateInfo)
}

/**
 *
 * @param queryInfo
 */
export async function queryTabs(
  queryInfo: browser.tabs._QueryQueryInfo,
): Promise<browser.tabs.Tab[]> {
  return await browser.tabs.query(queryInfo)
}

/**
 *
 *  API
 * @param id  ID
 */
export async function removeTabOrWindow(id: number): Promise<void> {
  if (hasWindowsAPI()) {
    try {
      await browser.windows.remove(id)
      return
    } catch (error) {
      //  ID ID
      logger.debug(
        "removeTabOrWindow: Failed to remove as window, trying as tab",
        {
          id,
          error,
        },
      )
    }
  }

  // Firefox Android  API  API
  await browser.tabs.remove(id)
}

/**
 *
 *  null
 * @param createData
 */
export async function createWindow(
  createData: browser.windows._CreateCreateData,
): Promise<browser.windows.Window | null> {
  if (hasWindowsAPI()) {
    return await browser.windows.create(createData)
  }
  return null
}

/**
 *  windows API
 */
export function hasWindowsAPI(): boolean {
  return !!browser.windows
}

/**
 *
 *
 * @param tab
 */
export async function focusTab(tab: browser.tabs.Tab): Promise<void> {
  //
  if (hasWindowsAPI() && tab.windowId != null) {
    try {
      await browser.windows.update(tab.windowId, { focused: true })
    } catch (error) {
      // Firefox Android
      logger.debug("focusTab: browser.windows.update failed", error)
    }
  }

  //
  if (tab.id != null) {
    await browser.tabs.update(tab.id, { active: true })
  }
}

/**
 *  runtime
 * @param message  runtime
 * @param options
 */
export async function sendRuntimeMessage(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<any>
export async function sendRuntimeMessage<TResponse>(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse>
export async function sendRuntimeMessage<TResponse>(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse> {
  return await sendMessageWithRetry<TResponse>(message, options)
}

/**
 * Sends a runtime message whose `action` is a canonical {@link RuntimeActionId}.
 *
 * This is a thin wrapper over {@link sendRuntimeMessage} that preserves payload
 * and options unchanged while providing better type-safety for runtime action IDs.
 */
export async function sendRuntimeActionMessage(
  message: { action: RuntimeActionId } & Record<string, unknown>,
  options?: SendMessageRetryOptions,
): Promise<any>
export async function sendRuntimeActionMessage<TResponse>(
  message: { action: RuntimeActionId } & Record<string, unknown>,
  options?: SendMessageRetryOptions,
): Promise<TResponse>
export async function sendRuntimeActionMessage<TResponse>(
  message: { action: RuntimeActionId } & Record<string, unknown>,
  options?: SendMessageRetryOptions,
): Promise<TResponse> {
  return await sendRuntimeMessage<TResponse>(message, options)
}

export interface SendMessageRetryOptions {
  maxAttempts?: number
  delayMs?: number
}

const RUNTIME_MESSAGE_CONNECTION_ERROR_SNIPPETS = [
  "Receiving end does not exist",
  "Could not establish connection",
]

/**
 * Identifies runtime messaging failures caused by a missing extension endpoint.
 *
 * This commonly happens when a content script outlives an extension reload or
 * when the receiving context has not been registered yet.
 */
export function isRuntimeMessageConnectionError(error: unknown): boolean {
  const messageValue =
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as { message?: unknown }).message === "string"
      ? (error as { message?: unknown }).message
      : null

  const message = String(messageValue ?? error ?? "").toLowerCase()
  return RUNTIME_MESSAGE_CONNECTION_ERROR_SNIPPETS.some((snippet) =>
    message.includes(snippet.toLowerCase()),
  )
}

type MessageRetryDefaults = {
  maxAttempts: number
  delayMs: number
}

/**
 * Internal helper to retry WebExtension messaging work with exponential backoff.
 */
async function withMessageRetry<T>(
  work: () => Promise<T>,
  options: SendMessageRetryOptions | undefined,
  defaults: MessageRetryDefaults,
): Promise<T> {
  const maxAttempts = Math.max(1, options?.maxAttempts ?? defaults.maxAttempts)
  const delayMs = options?.delayMs ?? defaults.delayMs

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await work()
    } catch (error) {
      const shouldRetry =
        attempt < maxAttempts - 1 && isRuntimeMessageConnectionError(error)

      if (!shouldRetry) {
        throw error
      }

      await new Promise((resolve) =>
        setTimeout(resolve, delayMs * Math.pow(2, attempt)),
      )
    }
  }

  // `work()` either returns or throws; this is just to satisfy TypeScript.
  throw new Error("withMessageRetry: exhausted retries")
}

/**
 * Sends a runtime message with retry logic for recoverable failures.
 * Applies exponential backoff based on `maxAttempts` and `delayMs`.
 * @param message Payload forwarded to the background/page runtime.
 * @param options Optional retry configuration.
 */
export async function sendMessageWithRetry(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<any>
export async function sendMessageWithRetry<TResponse>(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse>
export async function sendMessageWithRetry<TResponse>(
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse> {
  return await withMessageRetry(
    () => browser.runtime.sendMessage(message) as Promise<TResponse>,
    options,
    { maxAttempts: 3, delayMs: 500 },
  )
}

/**
 * Sends a message to a tab content script with retry logic for recoverable failures.
 *
 * This is useful when a tab has just been created and the content script might
 * not be ready to receive messages yet.
 *
 * Applies exponential backoff based on `maxAttempts` and `delayMs`.
 */
export async function sendTabMessageWithRetry(
  tabId: number,
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<any>
export async function sendTabMessageWithRetry<TResponse>(
  tabId: number,
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse>
export async function sendTabMessageWithRetry<TResponse>(
  tabId: number,
  message: unknown,
  options?: SendMessageRetryOptions,
): Promise<TResponse> {
  return await withMessageRetry(
    () => browser.tabs.sendMessage(tabId, message) as Promise<TResponse>,
    options,
    { maxAttempts: 5, delayMs: 400 },
  )
}

/**
 *  URL
 * @param path
 */
export function getExtensionURL(path: string): string {
  return browser.runtime.getURL(path)
}

/**
 *  runtime
 *
 *
 * callback  true
 * @param callback
 */
export function onRuntimeMessage(
  callback: (
    message: any,
    sender: browser.runtime.MessageSender,
    sendResponse: (response?: any) => void,
  ) => void,
): () => void {
  browser.runtime.onMessage.addListener(callback)
  return () => {
    browser.runtime.onMessage.removeListener(callback)
  }
}

/**
 *
 *
 * @param callback
 */
export function onTabActivated(
  callback: (activeInfo: browser.tabs._OnActivatedActiveInfo) => void,
): () => void {
  browser.tabs.onActivated.addListener(callback)
  return () => {
    browser.tabs.onActivated.removeListener(callback)
  }
}

/**
 *
 *
 * @param callback
 */
export function onTabUpdated(
  callback: (
    tabId: number,
    changeInfo: browser.tabs._OnUpdatedChangeInfo,
    tab: browser.tabs.Tab,
  ) => void,
): () => void {
  browser.tabs.onUpdated.addListener(callback)
  return () => {
    browser.tabs.onUpdated.removeListener(callback)
  }
}

/**
 *
 *
 * @param callback
 */
export function onTabRemoved(
  callback: (
    tabId: number,
    removeInfo: browser.tabs._OnRemovedRemoveInfo,
  ) => void,
): () => void {
  browser.tabs.onRemoved.addListener(callback)
  return () => {
    browser.tabs.onRemoved.removeListener(callback)
  }
}

/**
 *
 *
 * @param callback
 */
export function onWindowRemoved(
  callback: (windowId: number) => void,
): () => void {
  if (hasWindowsAPI()) {
    browser.windows.onRemoved.addListener(callback)
    return () => {
      browser.windows.onRemoved.removeListener(callback)
    }
  }
  return () => {} //
}

/**
 *
 * @param callback
 */
export function onStartup(callback: () => void | Promise<void>): () => void {
  browser.runtime.onStartup.addListener(callback)
  return () => {
    browser.runtime.onStartup.removeListener(callback)
  }
}

/**
 * /
 * @param callback
 */
export function onInstalled(
  callback: (
    details: browser.runtime._OnInstalledDetails,
  ) => void | Promise<void>,
): () => void {
  browser.runtime.onInstalled.addListener(callback)
  return () => {
    browser.runtime.onInstalled.removeListener(callback)
  }
}

export type SidePanelSupport =
  | { supported: true; kind: "firefox-sidebar-action" }
  | { supported: true; kind: "chromium-side-panel" }
  | { supported: false; kind: "unsupported"; reason: string }

const OBSERVED_SIDE_PANEL_FAILURE_REASON =
  "Side panel open failed on this runtime"
let observedSidePanelFailure = false

/**
 * Mobile and touch-tablet extension shells may expose side panel APIs without
 * being able to render a usable panel surface.
 */
function isKnownUnsupportedMobileSidePanelRuntime(): boolean {
  const deviceType = getDeviceTypeInfo()
  return deviceType.isMobile || deviceType.isTablet
}

/**
 * Computes support from the currently exposed browser APIs and runtime form
 * factor, without considering any prior failed open attempts.
 */
function getBaseSidePanelSupport(): SidePanelSupport {
  const runtimeBrowser = (globalThis as any).browser
  const hasFirefoxSidebarAction =
    typeof runtimeBrowser?.sidebarAction?.open === "function"

  const runtimeChrome = (globalThis as any).chrome
  const hasChromiumSidePanel =
    typeof runtimeChrome?.sidePanel?.open === "function"

  if (
    (hasFirefoxSidebarAction || hasChromiumSidePanel) &&
    isKnownUnsupportedMobileSidePanelRuntime()
  ) {
    return {
      supported: false,
      kind: "unsupported",
      reason:
        "Side panel API exposed, but current mobile runtime cannot present a usable side panel",
    }
  }

  if (hasFirefoxSidebarAction) {
    return { supported: true, kind: "firefox-sidebar-action" }
  }

  if (hasChromiumSidePanel) {
    return { supported: true, kind: "chromium-side-panel" }
  }

  const reasons: string[] = []
  if (typeof runtimeBrowser?.sidebarAction?.open !== "function") {
    reasons.push("browser.sidebarAction.open missing")
  }
  if (typeof runtimeChrome?.sidePanel?.open !== "function") {
    reasons.push("chrome.sidePanel.open missing")
  }

  return {
    supported: false,
    kind: "unsupported",
    reason: reasons.join("; ") || "Side panel APIs not available",
  }
}

/**
 * Once a runtime has failed to open the side panel, keep reporting that failure
 * so the rest of the UI can consistently fall back.
 */
function getObservedFailureSupport(): SidePanelSupport | null {
  if (!observedSidePanelFailure) {
    return null
  }

  return {
    supported: false,
    kind: "unsupported",
    reason: OBSERVED_SIDE_PANEL_FAILURE_REASON,
  }
}

/**
 * Records a failed open attempt so later support checks stop advertising a side
 * panel entry point that already proved unusable.
 */
async function markObservedSidePanelFailure(): Promise<void> {
  observedSidePanelFailure = true
}

/**
 * Detects whether the current runtime can open a side panel/sidebar.
 */
export function getSidePanelSupport(): SidePanelSupport {
  return getObservedFailureSupport() ?? getBaseSidePanelSupport()
}

/**
 * Open the extension side panel using the host browser's native APIs.
 * Automatically chooses the appropriate Chromium or Firefox pathway.
 * Prefers Chromium's window-scoped open call before falling back to tab-scoped
 * open requests when a runtime rejects the first variant.
 * @throws {Error} When the current browser does not expose side panel support.
 */
export const openSidePanel = async () => {
  const support = getSidePanelSupport()

  if (!support.supported) {
    throw new Error(`Side panel is not supported: ${support.reason}`)
  }

  try {
    if (support.kind === "firefox-sidebar-action") {
      return await (browser as any).sidebarAction.open()
    }

    const tab = await getActiveTab()
    const windowId = tab?.windowId
    const tabId = tab?.id

    const sidePanel = (globalThis as any).chrome?.sidePanel

    if (typeof windowId === "number") {
      try {
        return await sidePanel.open({ windowId })
      } catch (error) {
        if (typeof tabId === "number") {
          return await sidePanel.open({ tabId })
        }
        throw error
      }
    }

    if (typeof tabId === "number") {
      return await sidePanel.open({ tabId })
    }

    throw new Error("Side panel open failed: active tab/window not found")
  } catch (error) {
    await markObservedSidePanelFailure()
    throw error
  }
}

/**
 *  alarms API
 */
export function hasAlarmsAPI(): boolean {
  return !!browser.alarms
}

/**
 *
 * @param name
 * @param alarmInfo
 * @param alarmInfo.periodInMinutes
 * @param alarmInfo.delayInMinutes
 * @param alarmInfo.when
 */
export async function createAlarm(
  name: string,
  alarmInfo: {
    periodInMinutes?: number
    delayInMinutes?: number
    when?: number
  },
): Promise<void> {
  if (!hasAlarmsAPI()) {
    logger.warn("Alarms API not supported")
    return
  }
  return browser.alarms.create(name, alarmInfo)
}

/**
 *
 * @param name
 */
export async function clearAlarm(name: string): Promise<boolean> {
  if (!hasAlarmsAPI()) {
    logger.warn("Alarms API not supported")
    return false
  }
  return (await browser.alarms.clear(name)) || false
}

/**
 *
 * @param name
 */
export async function getAlarm(
  name: string,
): Promise<browser.alarms.Alarm | undefined> {
  if (!hasAlarmsAPI()) {
    logger.warn("Alarms API not supported")
    return undefined
  }
  return await browser.alarms.get(name)
}

/**
 *
 */
export async function getAllAlarms(): Promise<browser.alarms.Alarm[]> {
  if (!hasAlarmsAPI()) {
    logger.warn("Alarms API not supported")
    return []
  }
  return (await browser.alarms.getAll()) || []
}

/**
 *
 *
 * @param callback
 */
export function onAlarm(
  callback: (alarm: browser.alarms.Alarm) => void | Promise<void>,
): () => void {
  if (!hasAlarmsAPI()) {
    logger.warn("Alarms API not supported")
    return () => {}
  }
  browser.alarms.onAlarm.addListener(callback)
  return () => {
    browser.alarms.onAlarm.removeListener(callback)
  }
}

/**
 *  manifest
 */
export function getManifest(): browser._manifest.WebExtensionManifest {
  try {
    return browser.runtime.getManifest()
  } catch (error) {
    logger.warn(
      "[browserApi] Failed to read manifest, falling back to minimal manifest",
      error,
    )

    return {
      manifest_version: 3,
      name: APP_SHORT_NAME,
      version: "0.0.0",
      optional_permissions: [],
    }
  }
}

/**
 * Convenience helper returning the manifest_version number from runtime manifest.
 * Falls back to {@link getManifest} when the runtime manifest cannot be read.
 */
export function getManifestVersion(): number {
  return getManifest().manifest_version
}

/**
 * Returns whether the extension is allowed to run in incognito/private windows.
 *
 * Chrome/Edge require the user to explicitly allow an extension to run in
 * Incognito mode. Firefox has a similar "Run in Private Windows" toggle.
 *
 * - `true`: allowed
 * - `false`: explicitly disallowed
 * - `null`: unknown/unsupported in the current environment
 */
export async function isAllowedIncognitoAccess(): Promise<boolean | null> {
  try {
    return browser.extension.isAllowedIncognitoAccess()
  } catch (error) {
    logger.debug(
      "extension.isAllowedIncognitoAccess failed",
      getErrorMessage(error),
    )
    return null
  }
}

type ActionClickListener = (tab: browser.tabs.Tab, info?: any) => void

type ActionAPI = {
  setPopup: (details: { popup?: string }) => Promise<void> | void
  onClicked: {
    addListener: (listener: ActionClickListener) => void
    removeListener: (listener: ActionClickListener) => void
    hasListener: (listener: ActionClickListener) => boolean
  }
}

/**
 *  MV2/MV3  action API
 *  browser.action (MV3) browser.browserAction (MV2)
 */
export function getActionApi(): ActionAPI {
  const action = (browser as any).action || (browser as any).browserAction
  if (!action) {
    throw new Error("Action API is not available in this environment")
  }
  return action as ActionAPI
}

/**
 *  popup MV2  MV3
 * @param popup  popup
 */
export async function setActionPopup(popup: string): Promise<void> {
  const action = getActionApi()
  await Promise.resolve(action.setPopup({ popup }))
}

/**
 *  MV2/MV3
 *
 */
export function addActionClickListener(
  listener: ActionClickListener,
): () => void {
  const action = getActionApi()
  if (!action.onClicked.hasListener(listener)) {
    action.onClicked.addListener(listener)
  }
  return () => {
    if (action.onClicked.hasListener(listener)) {
      action.onClicked.removeListener(listener)
    }
  }
}

/**
 *  MV2/MV3
 */
export function removeActionClickListener(
  listener: (tab: browser.tabs.Tab, info?: any) => void,
): void {
  const action = getActionApi()
  if (action.onClicked.hasListener(listener)) {
    action.onClicked.removeListener(listener)
  }
}

/**
 * Check permissions via background script message (for content scripts).
 * @param permissions Permission descriptor to check.
 * @returns Resolves true when the permission is granted, false otherwise.
 */
export async function checkPermissionViaMessage(
  permissions: browser.permissions.Permissions,
): Promise<boolean> {
  try {
    const response = await sendRuntimeActionMessage({
      action: RuntimeActionIds.PermissionsCheck,
      permissions,
    })
    return response?.hasPermission ?? false
  } catch (error) {
    if (isRuntimeMessageConnectionError(error)) {
      logger.debug(
        "checkPermissionViaMessage skipped because runtime endpoint is unavailable",
        { permissions, error },
      )
    } else {
      logger.error("checkPermissionViaMessage failed", { permissions, error })
    }
    return false
  }
}

// Permissions helpers
/**
 * Check whether the extension already holds the requested permissions.
 * @param permissions Permission descriptor passed directly to the browser API.
 * @returns Resolves true when the set is already granted, false otherwise.
 */
export async function containsPermissions(
  permissions: browser.permissions.Permissions,
): Promise<boolean> {
  try {
    return await browser.permissions.contains(permissions)
  } catch (error) {
    logger.error("permissions.contains failed", { permissions, error })
    return false
  }
}

/**
 * Request additional permissions from the user, logging failures for debugging.
 * @param permissions Permission descriptor to be requested from the browser.
 * @returns Resolves true when the user grants the request, false when denied.
 */
export async function requestPermissions(
  permissions: browser.permissions.Permissions,
): Promise<boolean> {
  try {
    return await browser.permissions.request(permissions)
  } catch (error) {
    logger.error("permissions.request failed", { permissions, error })
    return false
  }
}

/**
 * Remove previously granted permissions to minimize the extension's footprint.
 * @param permissions Permission descriptor indicating entries to revoke.
 * @returns Resolves true when the removal succeeds, false when it fails.
 */
export async function removePermissions(
  permissions: browser.permissions.Permissions,
): Promise<boolean> {
  try {
    return await browser.permissions.remove(permissions)
  } catch (error) {
    logger.error("permissions.remove failed", { permissions, error })
    return false
  }
}

/**
 * Subscribe to permission-added events and return an unsubscribe callback.
 * @param callback Handler receiving the granted permission set.
 */
export function onPermissionsAdded(
  callback: (permissions: browser.permissions.Permissions) => void,
): () => void {
  browser.permissions.onAdded.addListener(callback)
  return () => browser.permissions.onAdded.removeListener(callback)
}

/**
 * Subscribe to permission-removed events and return an unsubscribe callback.
 * @param callback Handler receiving the revoked permission set.
 */
export function onPermissionsRemoved(
  callback: (permissions: browser.permissions.Permissions) => void,
): () => void {
  browser.permissions.onRemoved.addListener(callback)
  return () => browser.permissions.onRemoved.removeListener(callback)
}
