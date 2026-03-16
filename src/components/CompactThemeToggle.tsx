import {
  ComputerDesktopIcon,
  MoonIcon,
  SunIcon,
} from "@heroicons/react/24/outline"
import { useTranslation } from "react-i18next"

import { IconButton } from "~/components/ui"
import { useTheme } from "~/contexts/ThemeContext"
import { cn } from "~/lib/utils"
import type { ThemeMode } from "~/types/theme"

const getThemeOptions = (t: (key: string) => string) => {
  return [
    {
      mode: "light" as ThemeMode,
      label: t("settings:theme.light"),
      icon: SunIcon,
      description: t("settings:theme.useLightTheme"),
    },
    {
      mode: "dark" as ThemeMode,
      label: t("settings:theme.dark"),
      icon: MoonIcon,
      description: t("settings:theme.useDarkTheme"),
    },
    {
      mode: "system" as ThemeMode,
      label: t("settings:theme.followSystem"),
      icon: ComputerDesktopIcon,
      description: t("settings:theme.followSystemTheme"),
    },
  ]
}

interface CompactThemeToggleProps {
  className?: string
  dataTestId?: string
}

/**
 * Compact tri-state theme toggle shared by popup and options chrome.
 */
export default function CompactThemeToggle({
  className,
  dataTestId,
}: CompactThemeToggleProps) {
  const { themeMode, setThemeMode, resolvedTheme } = useTheme()
  const { t } = useTranslation("settings")
  const themeOptions = getThemeOptions(t)

  const currentIndex = themeOptions.findIndex(
    (option) => option.mode === themeMode,
  )
  const nextIndex = (currentIndex + 1) % themeOptions.length
  const nextTheme = themeOptions[nextIndex]
  const CurrentIcon = themeOptions[currentIndex]?.icon || ComputerDesktopIcon
  const currentTheme = themeOptions[currentIndex]

  const resolvedThemeLabel =
    themeMode === "system"
      ? resolvedTheme === "dark"
        ? t("theme.dark")
        : t("theme.light")
      : t(`theme.${currentTheme?.mode}`)

  const handleThemeToggle = () => {
    void setThemeMode(nextTheme.mode)
  }

  return (
    <IconButton
      onClick={handleThemeToggle}
      variant="outline"
      size="sm"
      className={cn(
        "rounded-2xl border-white/10 bg-white/5 dark:bg-white/[0.03]",
        className,
      )}
      title={
        t("theme.current", {
          theme: t(`theme.${currentTheme?.mode}`),
          resolvedTheme: resolvedThemeLabel,
        }) +
        "\n" +
        t("theme.clickSwitch", { nextMode: t(`theme.${nextTheme.mode}`) })
      }
      aria-label={t("theme.toggle", {
        currentMode: t(`theme.${currentTheme?.mode}`),
        nextMode: t(`theme.${nextTheme.mode}`),
      })}
      data-testid={dataTestId}
    >
      <CurrentIcon
        className={cn(
          "h-4 w-4 transition-colors",
          themeMode === "light"
            ? "text-amber-500 dark:text-amber-400"
            : themeMode === "dark"
              ? "text-blue-500 dark:text-blue-400"
              : "text-violet-500 dark:text-violet-400",
        )}
      />
    </IconButton>
  )
}
