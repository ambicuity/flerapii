import {
  Bars3Icon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"

import iconImage from "~/assets/icon.png"
import CompactThemeToggle from "~/components/CompactThemeToggle"
import { BodySmall, Heading5, IconButton } from "~/components/ui"
import { VersionBadge } from "~/components/VersionBadge"
import { getRepository } from "~/utils/navigation/packageMeta"

interface HeaderProps {
  onTitleClick: () => void
  onMenuToggle?: () => void
  isMobileSidebarOpen?: boolean
  onOpenCommandPalette?: () => void
}

/**
 * Sticky options-page header with app identity and shared chrome actions.
 * @param props Component props bundle.
 * @param props.onTitleClick Callback triggered when the app icon is clicked.
 * @param props.onMenuToggle Optional handler for toggling the mobile sidebar.
 * @param props.isMobileSidebarOpen Whether the mobile sidebar is currently open.
 */
function Header({
  onTitleClick,
  onMenuToggle,
  isMobileSidebarOpen,
  onOpenCommandPalette,
}: HeaderProps) {
  const { t } = useTranslation("ui")
  const repositoryUrl = getRepository()
  const shortcutLabel =
    typeof navigator !== "undefined" &&
    /Mac|iPhone|iPad|iPod/i.test(navigator.platform)
      ? "⌘K"
      : "Ctrl+K"

  return (
    <header className="sticky top-0 z-50 pt-[var(--options-shell-gutter)] pb-[var(--options-shell-gap)]">
      <div className="elevated-surface h-(--options-header-height) rounded-[1.85rem] border border-white/45 px-3 shadow-[0_24px_70px_-44px_rgba(15,23,42,0.45)] backdrop-blur-xl sm:px-5 lg:px-6 dark:border-white/8 dark:shadow-[0_30px_90px_-55px_rgba(2,6,23,0.95)]">
        <div className="flex h-full items-center justify-between gap-3">
          <IconButton
            onClick={onMenuToggle}
            variant="ghost"
            size="default"
            className="tap-highlight-transparent subtle-surface touch-manipulation lg:hidden"
            aria-label="Toggle menu"
            data-testid="options-menu-toggle"
          >
            {isMobileSidebarOpen ? (
              <XMarkIcon className="h-6 w-6" />
            ) : (
              <Bars3Icon className="h-6 w-6" />
            )}
          </IconButton>

          <div className="tap-highlight-transparent flex min-w-0 flex-1 touch-manipulation items-center gap-3 sm:gap-4">
            <button
              type="button"
              onClick={onTitleClick}
              className="tap-highlight-transparent subtle-surface flex h-11 w-11 touch-manipulation items-center justify-center rounded-2xl focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:outline-none"
              aria-label={t("app.name")}
            >
              <img
                src={iconImage}
                alt={t("app.name")}
                className="h-7 w-7 rounded-xl shadow-sm sm:h-8 sm:w-8"
              />
            </button>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <Heading5 className="dark:text-dark-text-primary min-w-0 text-lg font-semibold tracking-[-0.04em] text-slate-900 sm:text-[1.65rem]">
                  <a
                    href={repositoryUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="tap-highlight-transparent block touch-manipulation truncate text-inherit no-underline transition-opacity hover:opacity-80"
                  >
                    {t("app.name")}
                  </a>
                </Heading5>
                <VersionBadge className="text-xs" />
              </div>
              <BodySmall className="dark:text-dark-text-tertiary hidden max-w-2xl truncate text-xs text-slate-500 sm:block sm:text-sm">
                {t("app.description")}
              </BodySmall>
            </div>
          </div>

          {onOpenCommandPalette && (
            <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
              <CompactThemeToggle
                className="subtle-surface"
                dataTestId="options-quick-theme-toggle"
              />

              <button
                type="button"
                onClick={onOpenCommandPalette}
                className="subtle-surface hidden min-w-[13rem] items-center justify-between gap-3 rounded-2xl px-4 py-2 text-sm font-medium text-slate-500 transition-all duration-150 hover:-translate-y-px hover:text-slate-700 xl:flex dark:text-slate-300 dark:hover:text-white"
                aria-label={t("commandPalette.open")}
                data-testid="options-command-palette-trigger"
              >
                <span className="flex items-center gap-2 truncate">
                  <MagnifyingGlassIcon className="h-4 w-4 shrink-0" />
                  {t("commandPalette.trigger")}
                </span>
                <span className="ui-kbd">{shortcutLabel}</span>
              </button>

              <IconButton
                onClick={onOpenCommandPalette}
                variant="ghost"
                size="default"
                className="subtle-surface xl:hidden"
                aria-label={t("commandPalette.open")}
                data-testid="options-command-palette-trigger"
              >
                <MagnifyingGlassIcon className="h-5 w-5" />
              </IconButton>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
