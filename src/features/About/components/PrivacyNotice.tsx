import { useTranslation } from "react-i18next"

import { Alert } from "~/components/ui"
import { PRIVACY_POLICY_URL } from "~/constants/about"

const PrivacyNotice = () => {
  const { t } = useTranslation("about")
  return (
    <Alert variant="success">
      <div>
        <p className="mb-1 font-medium">{t("privacyTitle")}</p>
        <p className="text-sm">{t("privacyText")}</p>
        <a
          className="mt-2 inline-block text-sm underline"
          href={PRIVACY_POLICY_URL}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t("privacyPolicyLinkText")}
        </a>
      </div>
    </Alert>
  )
}

export default PrivacyNotice
