import { modelMetadataService } from "~/services/models/modelMetadata"
import { removeDateSuffix } from "~/services/models/utils/modelName"

/**
 * Normalizes a raw model identifier to its core name by stripping known
 * vendor prefixes, path segments, non-model suffixes and date components.
 */
export function extractActualModel(modelName: string) {
  let actualModel = modelName

  //  BigModel/GLM-4.5 → GLM-4.5
  const specialPrefix = "BigModel/"
  if (actualModel.startsWith(specialPrefix)) {
    actualModel = actualModel.slice(specialPrefix.length)
  }

  // /
  const lastSlashIndex = actualModel.lastIndexOf("/")
  if (lastSlashIndex !== -1) {
    actualModel = actualModel.slice(lastSlashIndex + 1)
  }

  // :free
  const colonIndex = actualModel.indexOf(":")
  if (colonIndex !== -1) {
    actualModel = actualModel.slice(0, colonIndex)
  }

  //
  return removeDateSuffix(actualModel)
}

export const renameModel = (
  model: string,
  includeVendor: boolean,
): string | undefined => {
  if (!model) return undefined

  const trimmedModelName = model.trim()
  if (!trimmedModelName) return undefined

  if (includeVendor) {
    // /
    const slashCount = (trimmedModelName.match(/\//g) || []).length
    // /:
    if (slashCount === 1 && !trimmedModelName.includes(":")) {
      const parts = trimmedModelName.split("/")

      if (
        parts.length === 2 &&
        parts[0].trim() !== "" &&
        parts[1].trim() !== "" &&
        parts[0] !== "BigModel" &&
        !trimmedModelName.startsWith("Pro/")
      ) {
        return trimmedModelName
      }
    }
  }

  const actualModel = extractActualModel(trimmedModelName)

  //
  const metadata = modelMetadataService.findStandardModelName(actualModel)

  if (metadata) {
    //
    //  '/' deepseek-ai/DeepSeek-V3.1 includeVendor
    const { standardName, vendorName } = metadata

    //
    if (standardName.includes("/")) {
      if (includeVendor) {
        //
        return standardName
      }
      //  /
      const slashIdx = standardName.lastIndexOf("/")
      if (slashIdx !== -1) {
        return standardName.slice(slashIdx + 1)
      }
      return standardName
    } else {
      //
      if (includeVendor && vendorName) {
        return `${vendorName}/${standardName}`
      }
      return standardName
    }
  }

  if (includeVendor) {
    //
    let vendor = ""
    const fallbackVendor = modelMetadataService.findVendorByPattern(actualModel)
    if (fallbackVendor) {
      vendor = fallbackVendor
    }

    if (vendor) {
      //
      return `${vendor}/${actualModel}`
    }
  }

  return actualModel
}
