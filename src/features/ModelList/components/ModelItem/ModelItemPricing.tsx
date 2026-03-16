import React from "react"
import { useTranslation } from "react-i18next"

import type { ModelPricing } from "~/services/apiService/common/type"
import {
  formatPriceCompact,
  isTokenBillingType,
  type CalculatedPrice,
} from "~/services/models/utils/modelPricing"

import { ModelItemPerCallPricingView } from "./ModelItemPerCallPricingView"
import { PriceView } from "./ModelItemPicingView"

interface ModelItemPricingProps {
  model: ModelPricing
  calculatedPrice: CalculatedPrice
  exchangeRate: number
  showRealPrice: boolean
  showPricing: boolean
  showRatioColumn: boolean
  isAvailableForUser: boolean
}

export const ModelItemPricing: React.FC<ModelItemPricingProps> = ({
  model,
  calculatedPrice,
  exchangeRate,
  showRealPrice,
  showPricing,
  showRatioColumn,
  isAvailableForUser,
}) => {
  const { t } = useTranslation("modelList")
  if (!showPricing) {
    return null
  }

  const tokenBillingType = isTokenBillingType(model.quota_type)
  const perCallPrice = calculatedPrice.perCallPrice
  return (
    <div className="mt-2">
      {tokenBillingType ? (
        //  -
        <div className="flex flex-wrap items-center gap-3 sm:gap-4 md:gap-6">
          {/*  */}
          <PriceView
            calculatedPrice={calculatedPrice}
            showRealPrice={showRealPrice}
            tokenBillingType={tokenBillingType}
            isAvailableForUser={isAvailableForUser}
            formatPriceCompact={formatPriceCompact}
          />

          {/*  */}
          {showRatioColumn && (
            <div className="flex items-center gap-1.5 sm:gap-2">
              <span className="dark:text-dark-text-tertiary text-xs whitespace-nowrap text-gray-500 sm:text-sm">
                {t("ratio")}
              </span>
              <span
                className={`text-xs font-medium sm:text-sm ${
                  isAvailableForUser
                    ? "dark:text-dark-text-primary text-gray-900"
                    : "dark:text-dark-text-tertiary text-gray-500"
                }`}
              >
                {model.model_ratio}x
              </span>
            </div>
          )}
        </div>
      ) : (
        perCallPrice && (
          //
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="dark:text-dark-text-secondary text-xs whitespace-nowrap text-gray-600 sm:text-sm">
              {t("perCall")}
            </span>
            <ModelItemPerCallPricingView
              perCallPrice={perCallPrice}
              isAvailableForUser={isAvailableForUser}
              exchangeRate={exchangeRate}
              showRealPrice={showRealPrice}
              tokenBillingType={tokenBillingType}
            />
          </div>
        )
      )}
    </div>
  )
}
