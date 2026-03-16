import { useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
} from "~/components/ui/command"
import { MENU_ITEM_IDS } from "~/constants/optionsMenuIds"
import { menuItems } from "~/entrypoints/options/constants"
import {
  SETTINGS_TAB_METADATA,
  type SettingsTabId,
} from "~/features/BasicSettings/tabMetadata"
import { OPTIONAL_PERMISSIONS } from "~/services/permissions/permissionManager"

interface OptionsCommandPaletteProps {
  activeMenuItem: string
  activeSettingsTab?: string
  open: boolean
  onOpenChange: (open: boolean) => void
  onMenuSelect: (menuId: string) => void
  onSettingsTabSelect: (tabId: SettingsTabId) => void
}

const hasOptionalPermissions = OPTIONAL_PERMISSIONS.length > 0

/**
 * Searchable command palette for options-page navigation and deep linking.
 */
export function OptionsCommandPalette({
  activeMenuItem,
  activeSettingsTab,
  open,
  onOpenChange,
  onMenuSelect,
  onSettingsTabSelect,
}: OptionsCommandPaletteProps) {
  const { t } = useTranslation(["ui", "settings"])
  const [query, setQuery] = useState("")

  const settingsCommands = useMemo(
    () =>
      SETTINGS_TAB_METADATA.filter(
        (tab) => hasOptionalPermissions || !tab.requiresOptionalPermissions,
      ).map((tab) => ({
        ...tab,
        label: t(`settings:tabs.${tab.id}`),
        description: t(`settings:tabDescriptions.${tab.id}`),
      })),
    [t],
  )

  const handleClose = (nextOpen: boolean) => {
    onOpenChange(nextOpen)
    if (!nextOpen) {
      setQuery("")
    }
  }

  const handleMenuSelection = (menuId: string) => {
    onMenuSelect(menuId)
    handleClose(false)
  }

  const handleSettingsSelection = (tabId: SettingsTabId) => {
    onSettingsTabSelect(tabId)
    handleClose(false)
  }

  return (
    <CommandDialog
      open={open}
      onOpenChange={handleClose}
      className="elevated-surface overflow-hidden border-white/10 p-0 sm:max-w-[42rem]"
      showCloseButton={false}
      title={t("ui:commandPalette.title")}
      description={t("ui:commandPalette.description")}
    >
      <CommandInput
        value={query}
        onValueChange={setQuery}
        placeholder={t("ui:commandPalette.searchPlaceholder")}
        clearButtonLabel={t("ui:commandPalette.clear")}
      />
      <CommandList className="max-h-[26rem]">
        <CommandEmpty>{t("ui:commandPalette.empty")}</CommandEmpty>

        <CommandGroup heading={t("ui:commandPalette.groups.pages")}>
          {menuItems.map((item) => {
            const Icon = item.icon
            const isActive = activeMenuItem === item.id

            return (
              <CommandItem
                key={item.id}
                value={`${t(`ui:navigation.${item.id}`)} ${item.id}`}
                onSelect={() => handleMenuSelection(item.id)}
              >
                <Icon className="h-4 w-4" />
                <div className="min-w-0">
                  <p className="truncate font-medium">
                    {t(`ui:navigation.${item.id}`)}
                  </p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {item.id === MENU_ITEM_IDS.BASIC
                      ? t("ui:commandPalette.pageDescriptions.basic")
                      : t("ui:commandPalette.pageDescriptions.manager")}
                  </p>
                </div>
                {isActive && (
                  <CommandShortcut>
                    {t("ui:commandPalette.current")}
                  </CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>

        <CommandSeparator />

        <CommandGroup heading={t("ui:commandPalette.groups.settings")}>
          {settingsCommands.map((tab) => {
            const Icon = tab.icon
            const isActive =
              activeMenuItem === MENU_ITEM_IDS.BASIC &&
              activeSettingsTab === tab.id

            return (
              <CommandItem
                key={tab.id}
                value={`${tab.label} ${tab.description}`}
                onSelect={() => handleSettingsSelection(tab.id)}
              >
                <Icon className="h-4 w-4" />
                <div className="min-w-0">
                  <p className="truncate font-medium">{tab.label}</p>
                  <p className="truncate text-xs text-slate-400 dark:text-slate-500">
                    {tab.description}
                  </p>
                </div>
                {isActive && (
                  <CommandShortcut>
                    {t("ui:commandPalette.current")}
                  </CommandShortcut>
                )}
              </CommandItem>
            )
          })}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  )
}

export default OptionsCommandPalette
