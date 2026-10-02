import { POPUP_PAGE_PATH } from "~/constants/extensionPages"
import {
  addActionClickListener,
  getSidePanelSupport,
  removeActionClickListener,
  setActionPopup,
} from "~/utils/browser/browserApi"
import { getErrorMessage } from "~/utils/core/error"
import { createLogger } from "~/utils/core/logger"
import { openSidePanelWithFallback } from "~/utils/navigation"

export type ActionClickBehavior = "popup" | "sidepanel"

/**
 * Unified logger scoped to toolbar action click behavior wiring.
 */
const logger = createLogger("ActionClickBehavior")

/**
 * Singleton click handler used when the action is configured to open the side panel.
 * Uses the shared open-or-fallback path so toolbar clicks never dead-end.
 */
const handleActionClick = async () => {
  await openSidePanelWithFallback()
}

/**
 * Register the side-panel click handler synchronously at service-worker startup.
 *
 * In "sidepanel" mode the popup is cleared, so a toolbar click that wakes an idle
 * MV3 worker is dispatched as `action.onClicked` before `applyActionClickBehavior`
 * (which awaits service init + preferences) has run. Registering here guarantees
 * that click is handled. In "popup" mode `onClicked` never fires while a popup is
 * set, so this registration is inert until `applyActionClickBehavior` reconciles it.
 */
export function registerActionClickListenerEarly(): void {
  try {
    addActionClickListener(handleActionClick)
  } catch (error) {
    logger.warn(
      `Failed to register early action click listener:\n${getErrorMessage(error)}`,
    )
  }
}

/**
 * Apply toolbar click behavior at runtime.
 * - "popup": restores the popup.html UI and removes side-panel click listeners.
 * - "sidepanel": disables the popup so onClicked fires and opens the shared
 *   side-panel-or-settings fallback path.
 */
export async function applyActionClickBehavior(
  behavior: ActionClickBehavior,
): Promise<void> {
  const sidePanelSupport = getSidePanelSupport()
  const effectiveBehavior: ActionClickBehavior =
    behavior === "sidepanel" && sidePanelSupport.supported
      ? "sidepanel"
      : "popup"
  const isSidePanel = effectiveBehavior === "sidepanel"

  //
  removeActionClickListener(handleActionClick)

  // Keep Chromium on the extension-managed click path so runtime fallback always runs.
  if (typeof (chrome as any)?.sidePanel?.setPanelBehavior === "function") {
    try {
      await chrome.sidePanel.setPanelBehavior({
        openPanelOnActionClick: false,
      })
    } catch (error) {
      logger.warn(
        `sidePanel.setPanelBehavior not available:\n${getErrorMessage(error)}`,
      )
    }
  }

  try {
    await setActionPopup(isSidePanel ? "" : POPUP_PAGE_PATH)
  } catch (error) {
    logger.warn(`action.setPopup not available:\n${getErrorMessage(error)}`)
  }

  if (isSidePanel) {
    addActionClickListener(handleActionClick)
  }
}
