import { cva, type VariantProps } from "class-variance-authority"
import React from "react"

import { cn } from "~/lib/utils"

const toggleButtonVariants = cva(
  "relative inline-flex items-center justify-center border border-transparent text-sm font-medium transition-all duration-200 touch-manipulation tap-highlight-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/35",
  {
    variants: {
      variant: {
        default:
          "bg-transparent text-slate-600 hover:bg-slate-100/90 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white",
        active:
          "border-blue-500/20 bg-white text-slate-950 font-semibold shadow-[0_10px_24px_-18px_rgba(15,23,42,0.45)] dark:border-blue-400/30 dark:bg-slate-950/80 dark:text-white",
        ghost:
          "bg-transparent text-slate-500 hover:bg-slate-100/85 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.08] dark:hover:text-white",
      },
      size: {
        sm: "min-h-8 px-2.5 py-1 text-xs sm:min-h-9 sm:px-3 sm:text-sm",
        default: "min-h-10 px-3 py-1.5 sm:px-4 sm:py-2",
        lg: "min-h-11 px-4 py-2 text-base",
      },
      shape: {
        default: "rounded-xl",
        pill: "rounded-full",
        square: "rounded-lg",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      shape: "default",
    },
  },
)

export interface ToggleButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof toggleButtonVariants> {
  isActive?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  showActiveIndicator?: boolean
  activeIndicatorColor?: string
}

const ToggleButton = React.forwardRef<HTMLButtonElement, ToggleButtonProps>(
  (
    {
      className,
      variant,
      size,
      shape,
      isActive = false,
      leftIcon,
      rightIcon,
      showActiveIndicator = false,
      activeIndicatorColor = "bg-blue-500 dark:bg-blue-400",
      children,
      ...props
    },
    ref,
  ) => {
    const buttonVariant = isActive ? "active" : variant

    return (
      <button
        className={cn(
          toggleButtonVariants({
            variant: buttonVariant,
            size,
            shape,
            className,
          }),
        )}
        ref={ref}
        aria-pressed={isActive}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
        {isActive && showActiveIndicator && (
          <span
            className={`absolute inset-x-2 bottom-1 h-0.5 ${activeIndicatorColor} rounded-full`}
          />
        )}
      </button>
    )
  },
)
ToggleButton.displayName = "ToggleButton"

export { ToggleButton, toggleButtonVariants }
