import { useState } from "react"
import toast from "react-hot-toast"
import { useTranslation } from "react-i18next"

import { Card, CardContent } from "~/components/ui"
import type { ModelManagementItemSource } from "~/features/ModelList/modelManagementSources"
import type { ModelPricing } from "~/services/apiService/common/type"
import type { CalculatedPrice } from "~/services/models/utils/modelPricing"
import { createLogger } from "~/utils/core/logger"
import { tryParseUrl } from "~/utils/core/urlParsing"

import { ModelItemDescription } from "./ModelItemDescription"
import { ModelItemDetails } from "./ModelItemDetails"
import { ModelItemExpandButton } from "./ModelItemExpandButton"
import { ModelItemHeader } from "./ModelItemHeader"
import { ModelItemPricing } from "./ModelItemPricing"

/**
 * Unified logger scoped to model list item interactions.
 */
const logger = createLogger("ModelItem")

interface ModelItemProps {
  model: ModelPricing
  calculatedPrice: CalculatedPrice
  exchangeRate: number
  showRealPrice: boolean //
  showRatioColumn: boolean //
  showEndpointTypes: boolean //
  userGroup: string
  onGroupClick?: (group: string) => void //
  availableGroups?: string[] //
  isAllGroupsMode?: boolean // ""
  source: ModelManagementItemSource
  onVerifyModel?: (source: ModelManagementItemSource, modelId: string) => void
  onVerifyCliSupport?: (
    source: ModelManagementItemSource,
    modelId: string,
  ) => void
  onOpenModelKeyDialog?: (
    account: Extract<ModelManagementItemSource, { kind: "account" }>["account"],
    modelId: string,
    modelEnableGroups: string[],
  ) => void
}

/**
 * Detailed model card combining header, pricing, and expandable metadata.
 * @param props Component props describing the model card configuration.
 * @returns Rendered model card element.
 */
export default function ModelItem(props: ModelItemProps) {
  const {
    model,
    calculatedPrice,
    exchangeRate,
    showRealPrice,
    showRatioColumn,
    showEndpointTypes,
    userGroup,
    onGroupClick,
    availableGroups = [],
    isAllGroupsMode = false,
    source,
    onVerifyModel,
    onVerifyCliSupport,
    onOpenModelKeyDialog,
  } = props
  const { t } = useTranslation("modelList")
  const [isExpanded, setIsExpanded] = useState(false)
  const handleCopyModelName = async () => {
    try {
      await navigator.clipboard.writeText(model.model_name)
      toast.success(t("messages.modelNameCopied"))
    } catch (error) {
      toast.error(t("messages.copyFailed"))
      logger.warn("Failed to copy model name to clipboard", error)
    }
  }

  const sourceLabel =
    source.kind === "profile"
      ? t("sourceLabels.profileBadge", {
          name: source.profile.name,
          host:
            tryParseUrl(source.profile.baseUrl)?.hostname ??
            source.profile.baseUrl,
        })
      : source.account.name

  const showGroupDetails = source.capabilities.supportsGroupFiltering
  const showPricing = source.capabilities.supportsPricing
  const canExpand =
    source.kind !== "profile" &&
    (showEndpointTypes || showGroupDetails || showPricing)

  //
  const isAvailableForUser = showGroupDetails
    ? isAllGroupsMode
      ? availableGroups.some((group) => model.enable_groups.includes(group)) //
      : model.enable_groups.includes(userGroup) //
    : true

  return (
    <Card
      variant="interactive"
      className={
        isAvailableForUser
          ? "hover:border-blue-300 dark:hover:border-blue-500/50"
          : "bg-gray-50 opacity-75 dark:bg-gray-800/50"
      }
    >
      {/*  */}
      <CardContent padding="default">
        <div className="flex min-w-0 items-start gap-2">
          <ModelItemHeader
            model={model}
            isAvailableForUser={isAvailableForUser}
            handleCopyModelName={handleCopyModelName}
            sourceLabel={sourceLabel}
            showPricingMetadata={showPricing}
            showAvailabilityBadge={showGroupDetails}
            onOpenKeyDialog={
              source.kind === "account" &&
              source.capabilities.supportsTokenCompatibility &&
              onOpenModelKeyDialog
                ? () =>
                    onOpenModelKeyDialog(
                      source.account,
                      model.model_name,
                      model.enable_groups,
                    )
                : undefined
            }
            onVerifyApi={
              source.capabilities.supportsCredentialVerification &&
              onVerifyModel
                ? () => onVerifyModel(source, model.model_name)
                : undefined
            }
            onVerifyCliSupport={
              source.capabilities.supportsCliVerification && onVerifyCliSupport
                ? () => onVerifyCliSupport(source, model.model_name)
                : undefined
            }
          />
          {canExpand && (
            <ModelItemExpandButton
              isExpanded={isExpanded}
              onToggleExpand={() => setIsExpanded(!isExpanded)}
            />
          )}
        </div>
        <ModelItemDescription
          model={model}
          isAvailableForUser={isAvailableForUser}
        />
        <ModelItemPricing
          model={model}
          calculatedPrice={calculatedPrice}
          exchangeRate={exchangeRate}
          showRealPrice={showRealPrice}
          showPricing={showPricing}
          showRatioColumn={showRatioColumn}
          isAvailableForUser={isAvailableForUser}
        />

        {/*  */}
        {isExpanded && (
          <ModelItemDetails
            model={model}
            calculatedPrice={calculatedPrice}
            showEndpointTypes={showEndpointTypes}
            userGroup={userGroup}
            showGroupDetails={showGroupDetails}
            showPricingDetails={showPricing}
            onGroupClick={onGroupClick}
          />
        )}
      </CardContent>
    </Card>
  )
}
