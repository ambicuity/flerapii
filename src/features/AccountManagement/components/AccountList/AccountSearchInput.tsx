import { MagnifyingGlassIcon, XMarkIcon } from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"

import { Input } from "~/components/ui"

interface AccountSearchInputProps {
  value: string
  onChange: (value: string) => void
  onClear: () => void
}

/**
 * Compact search field used to filter account list entries.
 * @param props Component props containing search value and handlers.
 * @param props.value Current search string.
 * @param props.onChange Handler invoked when user types in the field.
 * @param props.onClear Handler clearing the current search string.
 */
export default function AccountSearchInput({
  value,
  onChange,
  onClear,
}: AccountSearchInputProps) {
  const { t } = useTranslation("account")
  const shortcutLabel =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
      ? "⌘K"
      : "Ctrl K"

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      e.preventDefault()
      e.stopPropagation()
      onClear()
    }
  }

  return (
    <div className="relative">
      <Input
        autoFocus={true}
        type="text"
        size="sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={t("search.placeholder")}
        className="h-12 rounded-2xl border-slate-200/60 bg-white/80 pr-24 pl-11 text-sm shadow-none dark:border-white/10 dark:bg-white/[0.04]"
        leftIcon={<MagnifyingGlassIcon className="h-4 w-4" />}
      />
      <div className="pointer-events-none absolute inset-y-0 right-3 flex items-center gap-2">
        {!value && (
          <span className="ui-kbd hidden sm:inline-flex">{shortcutLabel}</span>
        )}
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="pointer-events-auto flex h-8 w-8 items-center justify-center rounded-full text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
            aria-label={t("common:actions.clear")}
          >
            <XMarkIcon className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
