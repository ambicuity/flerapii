import type { Page } from "@playwright/test"

import { OPTIONS_PAGE_PATH, POPUP_PAGE_PATH } from "~/constants/extensionPages"
import { expect, test } from "~~/e2e/fixtures/extensionTest"
import { getSidePanelPagePath } from "~~/e2e/utils/extension"

test.beforeEach(({ page }) => {
  page.on("pageerror", (error) => {
    throw error
  })

  page.on("console", (msg) => {
    if (msg.type() === "error") {
      throw new Error(msg.text())
    }
  })
})

/**
 *
 */
async function expectNoHorizontalOverflow(page: Page) {
  const metrics = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(metrics.scrollWidth).toBe(metrics.clientWidth)
}

/**
 *
 */
async function expectDesktopOptionsScrollOwnership(page: Page) {
  const metrics = await page.evaluate(() => {
    const mainScroll = document.querySelector<HTMLElement>(
      "[data-testid='options-main-scroll']",
    )
    const sidebarScroll = document.querySelector<HTMLElement>(
      "[data-testid='options-sidebar-scroll']",
    )

    return {
      documentClientHeight: document.documentElement.clientHeight,
      documentScrollHeight: document.documentElement.scrollHeight,
      mainClientHeight: mainScroll?.clientHeight ?? 0,
      mainScrollHeight: mainScroll?.scrollHeight ?? 0,
      sidebarClientHeight: sidebarScroll?.clientHeight ?? 0,
      sidebarScrollHeight: sidebarScroll?.scrollHeight ?? 0,
    }
  })

  expect(metrics.documentScrollHeight).toBe(metrics.documentClientHeight)
  expect(metrics.mainScrollHeight).toBeGreaterThan(metrics.mainClientHeight)
  expect(metrics.sidebarScrollHeight).toBeGreaterThan(
    metrics.sidebarClientHeight,
  )
}

test("popup page boots and stays aligned across popup widths", async ({
  page,
  extensionId,
}) => {
  await page.setViewportSize({ width: 420, height: 900 })
  await page.goto(`chrome-extension://${extensionId}/${POPUP_PAGE_PATH}`)
  await expect(page).toHaveTitle(/Flerapii/i)
  await expect(page.locator("#root > *")).not.toHaveCount(0)
  await expect(page.getByTestId("popup-shell")).toHaveAttribute(
    "data-surface",
    "popup",
  )
  await expect(page.getByTestId("popup-top-rail")).toHaveAttribute(
    "data-stacked",
    "false",
  )
  await expectNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 360, height: 820 })
  await expect(page.getByTestId("popup-top-rail")).toHaveAttribute(
    "data-stacked",
    "true",
  )
  await expect(
    page.getByRole("button", { name: /Share overview snapshot/i }),
  ).toBeVisible()
  await expect(page.getByTestId("popup-view-tablist")).toBeVisible()
  await expectNoHorizontalOverflow(page)
})

test("options page boots and swaps between desktop rail and drawer layouts", async ({
  page,
  extensionId,
}) => {
  await page.setViewportSize({ width: 1440, height: 980 })
  await page.goto(`chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}`)
  await expect(page).toHaveTitle(/Flerapii/i)
  await expect(page.locator("#root > *")).not.toHaveCount(0)

  await page.goto(
    `chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}#basic`,
  )
  await expect(page.getByTestId("options-quick-theme-toggle")).toBeVisible()
  await expect(page.getByTestId("settings-desktop-navigator")).toBeVisible()
  await expect(page.getByTestId("settings-mobile-selector")).toBeHidden()
  await expect(page.getByTestId("options-sidebar-desktop")).toBeVisible()
  await expect(
    page.locator("header [data-testid='options-collapse-toggle']"),
  ).toHaveCount(0)
  await expect(page.getByTestId("options-collapse-toggle")).toBeVisible()

  const desktopSidebarBox = await page
    .getByTestId("options-sidebar-desktop")
    .boundingBox()
  expect(desktopSidebarBox?.x ?? 0).toBeGreaterThan(0)

  await page.goto(`chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}#keys`)
  await expect(page.getByTestId("key-management-header-actions")).toBeVisible()
  await expect(
    page.getByTestId("key-management-account-selector"),
  ).toBeVisible()

  await page.goto(
    `chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}#about`,
  )
  await expect(page.getByRole("heading", { name: /About/i })).toBeVisible()
  await expectDesktopOptionsScrollOwnership(page)

  await page.goto(
    `chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}#account`,
  )
  await expect(
    page.getByRole("heading", { name: /Account Management/i }),
  ).toBeVisible()

  await page.goto(
    `chrome-extension://${extensionId}/${OPTIONS_PAGE_PATH}#basic`,
  )

  for (const width of [900, 760, 480]) {
    await page.setViewportSize({ width, height: 840 })
    await expect(page.getByTestId("options-menu-toggle")).toBeVisible()
    await expect(page.getByTestId("options-sidebar-desktop")).toBeHidden()
    await expect(
      page.getByTestId("settings-desktop-navigator-shell"),
    ).toBeHidden()
    await expect(page.getByTestId("settings-mobile-selector")).toBeVisible()
  }

  await page.setViewportSize({ width: 760, height: 840 })
  await page.getByTestId("options-menu-toggle").click()
  await expect(page.getByTestId("options-sidebar-mobile")).toBeVisible()
})

test("sidepanel page boots and keeps the narrow shell overflow-free", async ({
  page,
  extensionDir,
  extensionId,
}) => {
  const sidePanelPath = await getSidePanelPagePath(extensionDir)
  test.skip(!sidePanelPath, "No sidepanel entrypoint found in manifest.json")

  await page.setViewportSize({ width: 420, height: 900 })
  await page.goto(`chrome-extension://${extensionId}/${sidePanelPath}`)
  await expect(page).toHaveTitle(/Flerapii/i)
  await expect(page.locator("#root > *")).not.toHaveCount(0)
  await expect(page.getByTestId("popup-shell")).toHaveAttribute(
    "data-surface",
    "sidepanel",
  )
  await expect(page.getByTestId("popup-top-rail")).toHaveAttribute(
    "data-stacked",
    "false",
  )
  await expectNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 360, height: 820 })
  await expect(page.getByTestId("popup-top-rail")).toHaveAttribute(
    "data-stacked",
    "true",
  )
  await expect(page.getByTestId("popup-view-tablist")).toBeVisible()
  await expectNoHorizontalOverflow(page)

  await page.setViewportSize({ width: 180, height: 820 })
  await expect(page.getByTestId("sidepanel-narrow-state")).toBeVisible()
  await expect(page.getByTestId("sidepanel-narrow-open-full")).toBeVisible()
  await expect(page.getByTestId("sidepanel-narrow-open-settings")).toBeVisible()
  await expectNoHorizontalOverflow(page)
})
