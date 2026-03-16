import React from "react"
import { useToaster } from "react-hot-toast/headless"

/**
 * Headless Toaster rendered inside the Shadow DOM root.
 *
 *  `react-hot-toast/headless`  toast toast.custom
 *  Shadow DOM
 *
 *  react-hot-toast  Toaster  Shadow DOM
 * @see https://github.com/timolins/react-hot-toast/issues/139
 */
export const RedemptionToaster: React.FC = () => {
  const { toasts, handlers } = useToaster()
  const { startPause, endPause } = handlers

  const visibleToasts = toasts.filter((toast) => toast.visible)

  if (visibleToasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-2147483647 flex justify-center sm:justify-end"
      onMouseEnter={startPause}
      onMouseLeave={endPause}
    >
      <div className="flex max-h-[calc(100vh-3rem)] max-w-full flex-col gap-3 overflow-y-auto px-3 sm:px-4">
        {visibleToasts.map((toast) => {
          //  toasttoast.custom/
          if (toast.type === "custom") {
            return (
              <div
                key={toast.id}
                {...toast.ariaProps}
                className="pointer-events-auto w-full max-w-[96vw] sm:w-[360px]"
              >
                {typeof toast.message === "function"
                  ? toast.message(toast)
                  : toast.message}
              </div>
            )
          }

          const baseCardClasses =
            "pointer-events-auto w-full sm:w-[360px] max-w-[96vw] rounded-lg border border-border bg-background px-3 py-2 sm:px-4 sm:py-3 text-xs sm:text-sm flex items-start gap-2 text-foreground break-words"

          const typeClasses =
            toast.type === "success"
              ? "border-l-4 border-l-emerald-500 text-emerald-700 dark:border-l-emerald-400 dark:text-emerald-300"
              : toast.type === "error"
                ? "border-l-4 border-l-rose-500 text-rose-700 dark:border-l-rose-400 dark:text-rose-300"
                : ""

          const cardClassName = `${baseCardClasses} ${typeClasses}`

          return (
            <div key={toast.id} {...toast.ariaProps} className={cardClassName}>
              {typeof toast.message === "function"
                ? toast.message(toast)
                : toast.message}
            </div>
          )
        })}
      </div>
    </div>
  )
}
