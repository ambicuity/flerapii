import type {
  ModelPricing,
  PricingResponse,
} from "~/services/apiService/common/type"
import type {
  OneHubModelPricing,
  OneHubUserGroupMap,
  OneHubUserGroupsResponse,
} from "~/services/apiService/oneHub/type"

/**
 *  OneHub
 * @param modelPricing
 * @param userGroupMap
 * @returns
 */
export function transformModelPricing(
  modelPricing: OneHubModelPricing,
  userGroupMap: OneHubUserGroupMap = {},
): PricingResponse {
  const data: ModelPricing[] = Object.entries(modelPricing).map(
    ([modelName, model]) => {
      const enableGroups = model.groups.length > 0 ? model.groups : ["default"]

      return {
        model_name: modelName,
        quota_type: model.price.type === "tokens" ? 0 : 1,
        model_ratio: 1,
        model_price: {
          input: model.price.input,
          output: model.price.output,
        },
        owner_by: model.owned_by || "",
        completion_ratio: model.price.output / model.price.input || 1,
        enable_groups: enableGroups,
        supported_endpoint_types: [],
      }
    },
  )

  const group_ratio: Record<string, number> = {}
  for (const [key, group] of Object.entries(userGroupMap)) {
    group_ratio[key] = group.ratio || 1
  }

  const usable_group: Record<string, string> = {}
  for (const [key, group] of Object.entries(userGroupMap)) {
    usable_group[key] = group.name
  }

  return {
    data,
    group_ratio,
    success: true,
    usable_group,
  }
}

/**
 *  OneHub
 * @param input OneHub
 * @returns
 */
export function transformUserGroup(
  input: OneHubUserGroupsResponse["data"],
): OneHubUserGroupsResponse["data"] {
  const result: Record<string, any> = {}

  //
  for (const key in input) {
    const group = input[key]
    result[key] = {
      desc: group.name,
      ratio: group.ratio,
    }
  }
  return result
}
