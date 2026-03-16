import { useState } from "react"

import type { ProviderType } from "~/services/models/utils/modelProviders"

/**
 * Manages view state for the model list page.
 * Keeps selected account, provider, group, search term, and display toggles.
 * @returns State values and setters for model list controls.
 */
export function useModelListState() {
  //
  const [selectedSourceValue, setSelectedSourceValue] = useState("") //
  const [searchTerm, setSearchTerm] = useState("") //
  const [selectedProvider, setSelectedProvider] = useState<
    ProviderType | "all"
  >("all") //
  const [selectedGroup, setSelectedGroup] = useState<string>("default") //
  const [allAccountsFilterAccountId, setAllAccountsFilterAccountId] = useState<
    string | null
  >(null) // ""

  //
  const [showRealPrice, setShowRealPrice] = useState(false) //
  const [showRatioColumn, setShowRatioColumn] = useState(true) //
  const [showEndpointTypes, setShowEndpointTypes] = useState(true) //

  return {
    selectedSourceValue,
    setSelectedSourceValue,
    searchTerm,
    setSearchTerm,
    selectedProvider,
    setSelectedProvider,
    selectedGroup,
    setSelectedGroup,
    allAccountsFilterAccountId,
    setAllAccountsFilterAccountId,
    showRealPrice,
    setShowRealPrice,
    showRatioColumn,
    setShowRatioColumn,
    showEndpointTypes,
    setShowEndpointTypes,
  }
}
