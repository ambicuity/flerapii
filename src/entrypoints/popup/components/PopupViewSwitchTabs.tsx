import { Tab } from "@headlessui/react"

import { ANIMATIONS, COLORS } from "~/constants/designTokens"
import { cn } from "~/lib/utils"

export type PopupViewType = "accounts" | "bookmarks" | "apiCredentialProfiles"

interface PopupViewSwitchTabsProps {
  value: PopupViewType
  onChange: (value: PopupViewType) => void
  accountsLabel: string
  bookmarksLabel: string
  apiCredentialProfilesLabel: string
  compact?: boolean
}

/**
 * Popup view switch styled as a responsive 3-column segmented control.
 */
export default function PopupViewSwitchTabs({
  value,
  onChange,
  accountsLabel,
  bookmarksLabel,
  apiCredentialProfilesLabel,
  compact = false,
}: PopupViewSwitchTabsProps) {
  const baseClassName = cn(
    "rounded-2xl font-semibold transition-all duration-150",
    ANIMATIONS.transition.base,
    compact
      ? "min-h-[3rem] px-2 py-2 text-[0.72rem] leading-tight"
      : "min-h-[2.75rem] px-3 py-2 text-sm",
  )
  const activeClassName =
    "bg-slate-900 text-white shadow-sm dark:bg-white dark:text-slate-900"
  const inactiveClassName =
    "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"

  const tabs = [
    { value: "accounts", label: accountsLabel },
    { value: "bookmarks", label: bookmarksLabel },
    { value: "apiCredentialProfiles", label: apiCredentialProfilesLabel },
  ] as const

  const selectedIndex = Math.max(
    0,
    tabs.findIndex((tab) => tab.value === value),
  )

  return (
    <Tab.Group
      className="w-full min-w-0"
      selectedIndex={selectedIndex}
      onChange={(index) => {
        const nextValue = tabs[index]?.value
        if (nextValue) {
          onChange(nextValue)
        }
      }}
    >
      <Tab.List
        data-testid="popup-view-tablist"
        className={cn(
          "subtle-surface grid w-full min-w-0 grid-cols-3 gap-1.5 rounded-[1.35rem] p-1.5",
          COLORS.background.tertiary,
        )}
      >
        {tabs.map((tab) => (
          <Tab
            key={tab.value}
            as="button"
            type="button"
            title={tab.label}
            className={({ selected }) =>
              cn(
                baseClassName,
                "flex w-full min-w-0 items-center justify-center text-center",
                "break-words whitespace-normal",
                selected ? activeClassName : inactiveClassName,
              )
            }
          >
            <span className="block">{tab.label}</span>
          </Tab>
        ))}
      </Tab.List>
    </Tab.Group>
  )
}
