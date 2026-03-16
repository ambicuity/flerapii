import { render, screen, within } from "@testing-library/react"
import { I18nextProvider } from "react-i18next"
import { describe, expect, it, vi } from "vitest"

import { Header } from "~/features/KeyManagement/components/Header"
import { testI18n } from "~~/tests/test-utils/i18n"

describe("KeyManagement header layout", () => {
  it("renders the responsive action cluster alongside the title block", () => {
    render(
      <I18nextProvider i18n={testI18n}>
        <Header
          selectedAccount="acc-1"
          onAddToken={vi.fn()}
          onRepairMissingKeys={vi.fn()}
          onRefresh={vi.fn()}
          onRefreshManagedSiteStatus={vi.fn()}
          isLoading={false}
          isManagedSiteStatusRefreshing={false}
          isAddTokenDisabled={false}
          isRepairDisabled={false}
          isManagedSiteStatusRefreshDisabled={false}
        />
      </I18nextProvider>,
    )

    const actionCluster = screen.getByTestId("key-management-header-actions")
    expect(actionCluster).toBeInTheDocument()

    expect(
      within(actionCluster).getByRole("button", {
        name: "keyManagement:dialog.addToken",
      }),
    ).toBeInTheDocument()
    expect(
      within(actionCluster).getByRole("button", {
        name: "keyManagement:repairMissingKeys.action",
      }),
    ).toBeInTheDocument()
    expect(
      within(actionCluster).getByRole("button", {
        name: "keyManagement:managedSiteStatus.actions.refresh",
      }),
    ).toBeInTheDocument()
    expect(
      within(actionCluster).getByRole("button", {
        name: "keyManagement:refreshTokenList",
      }),
    ).toBeInTheDocument()
  })
})
