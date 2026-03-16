import {
  CommandLineIcon,
  DocumentDuplicateIcon,
  KeyIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline"
import React from "react"
import { useTranslation } from "react-i18next"

import { Badge, IconButton } from "~/components/ui"
import type { ModelPricing } from "~/services/apiService/common/type"
import { getBillingModeText } from "~/services/models/utils/modelPricing"
import { getProviderConfig } from "~/services/models/utils/modelProviders"

interface ModelItemHeaderProps {
  model: ModelPricing
  isAvailableForUser: boolean
  handleCopyModelName: () => void
  sourceLabel?: string
  showPricingMetadata: boolean
  showAvailabilityBadge: boolean
  onOpenKeyDialog?: () => void
  onVerifyApi?: () => void
  onVerifyCliSupport?: () => void
}

export const ModelItemHeader: React.FC<ModelItemHeaderProps> = ({
  model,
  isAvailableForUser,
  handleCopyModelName,
  sourceLabel,
  showPricingMetadata,
  showAvailabilityBadge,
  onOpenKeyDialog,
  onVerifyApi,
  onVerifyCliSupport,
}) => {
  const { t } = useTranslation("modelList")
  const providerConfig = getProviderConfig(model.model_name)
  const IconComponent = providerConfig.icon

  //  Badge
  const getBillingVariant = (quotaType: number) => {
    if (quotaType === 2) return "default" //
    return "secondary" //
  }

  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-2 sm:gap-3">
        {/*  */}
        <div className={`shrink-0 rounded-lg p-1.5 ${providerConfig.bgColor}`}>
          <IconComponent
            className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${providerConfig.color}`}
          />
        </div>

        {/*  */}
        <h3
          className={`truncate text-sm font-semibold sm:text-base md:text-lg ${
            isAvailableForUser
              ? "dark:text-dark-text-primary text-gray-900"
              : "dark:text-dark-text-tertiary text-gray-500"
          }`}
        >
          {model.model_name}
        </h3>

        <div className="flex items-center gap-1">
          {/*  */}
          <IconButton
            variant="ghost"
            size="sm"
            onClick={handleCopyModelName}
            title={t("actions.copyModelName")}
            aria-label={t("actions.copyModelName")}
            className="shrink-0"
          >
            <DocumentDuplicateIcon className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </IconButton>

          {onOpenKeyDialog && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onOpenKeyDialog}
              title={t("actions.keyForModel")}
              aria-label={t("actions.keyForModel")}
              className="shrink-0"
            >
              <KeyIcon className="h-3 w-3 text-violet-600 sm:h-3.5 sm:w-3.5 dark:text-violet-400" />
            </IconButton>
          )}

          {onVerifyApi && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onVerifyApi}
              title={t("actions.verifyApi")}
              aria-label={t("actions.verifyApi")}
              className="shrink-0"
            >
              <WrenchScrewdriverIcon className="h-3 w-3 text-emerald-600 sm:h-3.5 sm:w-3.5 dark:text-emerald-400" />
            </IconButton>
          )}

          {onVerifyCliSupport && (
            <IconButton
              variant="ghost"
              size="sm"
              onClick={onVerifyCliSupport}
              title={t("actions.verifyCliSupport")}
              aria-label={t("actions.verifyCliSupport")}
              className="shrink-0"
            >
              <CommandLineIcon className="h-3 w-3 text-sky-600 sm:h-3.5 sm:w-3.5 dark:text-sky-400" />
            </IconButton>
          )}
        </div>

        {/*  */}
        <div className="flex shrink-0 flex-wrap items-center gap-1.5 sm:gap-2">
          {/*  */}
          {showPricingMetadata && (
            <Badge
              variant={getBillingVariant(model.quota_type)}
              size="sm"
              className="text-[10px] sm:text-xs"
            >
              {getBillingModeText(model.quota_type)}
            </Badge>
          )}

          {/*  */}
          {showAvailabilityBadge && (
            <Badge
              variant={isAvailableForUser ? "success" : "secondary"}
              size="sm"
              className="text-[10px] sm:text-xs"
            >
              {isAvailableForUser ? t("available") : t("unavailable")}
            </Badge>
          )}

          {/*  */}
          {sourceLabel && (
            <Badge variant="outline" size="default">
              {sourceLabel}
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
