import {
  ANYROUTER,
  DONE_HUB,
  NEW_API,
  OCTOPUS,
  ONE_HUB,
  SUB2API,
  VELOERA,
  WONG_GONGYI,
  type SiteType,
} from "~/constants/siteType"

import * as anyrouterAPI from "./anyrouter"
import * as commonAPI from "./common"
import * as doneHubAPI from "./doneHub"
import * as octopusAPI from "./octopus"
import * as oneHubAPI from "./oneHub"
import * as sub2apiAPI from "./sub2api"
import * as veloeraAPI from "./veloera"
import * as wongAPI from "./wong"

type ApiOverrideModule = Record<string, unknown>

// ,
const siteOverrideMap = {
  [ONE_HUB]: [oneHubAPI],
  [DONE_HUB]: [doneHubAPI, oneHubAPI],
  [VELOERA]: [veloeraAPI],
  [ANYROUTER]: [anyrouterAPI],
  [NEW_API]: [commonAPI],
  [WONG_GONGYI]: [wongAPI],
  [SUB2API]: [sub2apiAPI],
  [OCTOPUS]: [octopusAPI],
} as const

//
type SiteOverrideMap = typeof siteOverrideMap

export type ApiOverrideSite = keyof SiteOverrideMap

/**
 * Append an optional SiteType hint to a function signature.
 * This allows callers to explicitly request a site/version implementation
 * without changing the underlying common API function shapes.
 */
type WithSiteHint<F> = F extends (...args: infer A) => infer R
  ? (...args: [...A, ApiOverrideSite?]) => R
  : F

//  API
/**
 * Resolve an API implementation taking site overrides into account.
 * @param funcName Name of the API helper to retrieve.
 * @param currentSite Site identifier used to look up overrides.
 * @returns The concrete function reference sourced from overrides or common.
 */
function getApiFunc<T extends keyof typeof commonAPI>(
  funcName: T,
  currentSite: SiteType = "default",
): (typeof commonAPI)[T] {
  const overrideModules =
    currentSite in siteOverrideMap
      ? (siteOverrideMap[
          currentSite as keyof SiteOverrideMap
        ] as readonly ApiOverrideModule[])
      : null

  if (overrideModules) {
    for (const overrideModule of overrideModules) {
      if (overrideModule && funcName in overrideModule) {
        //
        return (overrideModule as any)[funcName] as (typeof commonAPI)[T]
      }
    }
  }
  // eslint-disable-next-line import/namespace
  return commonAPI[funcName] as (typeof commonAPI)[T]
}

//
/**
 * Factory that wraps public API helpers with automatic site detection.
 * @param funcName Name of the helper being wrapped.
 * @returns A proxy function that inspects arguments for site hints.
 */
function createWrappedFunction<T extends (...args: any[]) => any>(
  funcName: keyof typeof commonAPI,
): T {
  return ((...args: any[]) => {
    let currentSite: SiteType = "default"
    const lastArg = args[args.length - 1]

    if (typeof lastArg === "string" && lastArg in siteOverrideMap) {
      currentSite = lastArg as SiteType
      args.pop()
    } else {
      for (const arg of args) {
        if (arg && typeof arg === "object" && "siteType" in arg) {
          const candidate = arg.siteType
          if (typeof candidate === "string" && candidate in siteOverrideMap) {
            currentSite = candidate as SiteType
            break
          }
        }
      }
    }

    const targetFunc = getApiFunc(funcName, currentSite)
    //  spread
    return (targetFunc as any)(...args)
  }) as T
}

const createSiteScopedFunction = <T extends (...args: any[]) => any>(
  funcName: keyof typeof commonAPI,
  site: ApiOverrideSite,
): T => {
  return ((...args: any[]) => {
    const targetFunc = getApiFunc(funcName, site)
    return (targetFunc as any)(...args)
  }) as T
}

export const apiForSite = (site: ApiOverrideSite) => {
  const scopedAPI = {} as {
    [K in keyof typeof commonAPI]: (typeof commonAPI)[K]
  }

  for (const key in commonAPI) {
    // eslint-disable-next-line import/namespace
    const func = commonAPI[key as keyof typeof commonAPI]
    if (typeof func === "function") {
      ;(scopedAPI as any)[key] = createSiteScopedFunction(
        key as keyof typeof commonAPI,
        site,
      )
    } else {
      ;(scopedAPI as any)[key] = func
    }
  }

  return scopedAPI
}

export const isApiOverrideSite = (value: unknown): value is ApiOverrideSite =>
  typeof value === "string" && value in siteOverrideMap

export const getApiService = (site: unknown) =>
  (isApiOverrideSite(site)
    ? apiForSite(site)
    : exportedAPI) as typeof exportedAPI

//
const exportedAPI = {} as {
  [K in keyof typeof commonAPI]: WithSiteHint<(typeof commonAPI)[K]>
}

//  commonAPI
for (const key in commonAPI) {
  // eslint-disable-next-line import/namespace
  const func = commonAPI[key as keyof typeof commonAPI]
  if (typeof func === "function") {
    ;(exportedAPI as any)[key] = createWrappedFunction(
      key as keyof typeof commonAPI,
    )
  } else {
    ;(exportedAPI as any)[key] = func
  }
}

export type ApiService = typeof exportedAPI
