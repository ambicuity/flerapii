import { Tab } from "@headlessui/react"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SlidersHorizontal, UserRound } from "lucide-react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it } from "vitest"

import { DesktopSectionNavigator } from "~/features/BasicSettings/BasicSettings"
import { testI18n } from "~~/tests/test-utils/i18n"

const tabs = [
  {
    id: "general",
    label: "General",
    description: "Appearance, language, startup behavior, and diagnostics.",
    icon: SlidersHorizontal,
    component: () => null,
  },
  {
    id: "accountManagement",
    label: "Account Management",
    description: "Account sorting, provisioning, and shortcuts.",
    icon: UserRound,
    component: () => null,
  },
] as any

describe("BasicSettings desktop navigator", () => {
  it("renders a scrollable navigator rail and updates selected styling", async () => {
    const user = userEvent.setup()

    render(
      <I18nextProvider i18n={testI18n}>
        <Tab.Group>
          <DesktopSectionNavigator tabs={tabs} />
          <Tab.Panels>
            <Tab.Panel>General content</Tab.Panel>
            <Tab.Panel>Account content</Tab.Panel>
          </Tab.Panels>
        </Tab.Group>
      </I18nextProvider>,
    )

    expect(screen.getByTestId("settings-desktop-navigator-shell")).toHaveClass(
      "hidden",
      "xl:block",
    )
    expect(screen.getByTestId("settings-desktop-navigator")).toBeInTheDocument()
    expect(
      screen.getByTestId("settings-desktop-nav-scroll"),
    ).toBeInTheDocument()

    const generalButton = screen.getByRole("tab", { name: /General/i })
    const accountButton = screen.getByRole("tab", {
      name: /Account Management/i,
    })

    expect(generalButton).toHaveAttribute("data-active", "true")
    expect(accountButton).toHaveAttribute("data-active", "false")

    await user.click(accountButton)

    expect(accountButton).toHaveAttribute("data-active", "true")
  })
})
