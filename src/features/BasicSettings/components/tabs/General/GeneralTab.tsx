import { useTranslation } from "react-i18next"

import { BodySmall, Card, CardList, Heading3 } from "~/components/ui"
import ThemeToggle from "~/entrypoints/options/components/ThemeToggle"

import ActionClickBehaviorSettings from "./ActionClickBehaviorSettings"
import ChangelogOnUpdateSettings from "./ChangelogOnUpdateSettings"
import DisplaySettings from "./DisplaySettings"
import LoggingSettings from "./LoggingSettings"
import ResetSettingsSection from "./ResetSettingsSection"

/**
 * General Basic Settings tab for display preferences, theme/language, and dangerous zone.
 */
export default function GeneralTab() {
  const { t } = useTranslation("settings")

  return (
    <div className="space-y-6">
      <DisplaySettings />
      <ActionClickBehaviorSettings />
      <LoggingSettings />
      <ChangelogOnUpdateSettings />

      {/* Appearance & Language Section */}
      <section id="appearance" className="space-y-6">
        <div className="space-y-1.5">
          <Heading3>{t("theme.appearance")}</Heading3>
          <BodySmall>{t("display.description")}</BodySmall>
        </div>

        <Card padding="none">
          <CardList>
            <ThemeToggle />
          </CardList>
        </Card>
      </section>

      <section id="dangerous-zone">
        <ResetSettingsSection />
      </section>
    </div>
  )
}
