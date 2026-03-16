import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { Bars3Icon } from "@heroicons/react/24/outline"

import { IconButton } from "~/components/ui"
import type { SearchResultWithHighlight } from "~/features/AccountManagement/hooks/useAccountSearch"
import { cn } from "~/lib/utils"
import type { DisplaySiteData } from "~/types"

import AccountListItem from "./AccountListItem"

interface SortableAccountListItemProps {
  site: DisplaySiteData
  highlights?: SearchResultWithHighlight["highlights"]
  onCopyKey: (site: DisplaySiteData) => void
  onDeleteWithDialog: (site: DisplaySiteData) => void
  isDragDisabled: boolean
  handleLabel: string
  showHandle: boolean
  className?: string
}

/**
 * Sortable wrapper around AccountListItem that adds drag handle controls and DnDKit bindings.
 */
function SortableAccountListItem({
  site,
  highlights,
  onCopyKey,
  onDeleteWithDialog,
  isDragDisabled,
  handleLabel,
  showHandle,
  className,
}: SortableAccountListItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: site.id,
    disabled: isDragDisabled,
  })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={isDragging ? "relative z-10" : undefined}
    >
      <div
        className={cn(
          "group flex items-center gap-3 rounded-[1.5rem] border border-slate-200/70 bg-white/78 px-3 py-3 shadow-sm transition-all duration-150 hover:-translate-y-px hover:bg-white/90 sm:px-4 dark:border-white/10 dark:bg-white/[0.04] dark:hover:bg-white/[0.06]",
          className,
        )}
      >
        {showHandle && (
          <IconButton
            ref={setActivatorNodeRef}
            variant="ghost"
            size="xs"
            aria-label={handleLabel}
            disabled={isDragDisabled}
            className="shrink-0 text-slate-400 hover:text-slate-700 focus-visible:ring-2 focus-visible:ring-offset-2 dark:text-slate-500 dark:hover:text-white"
            {...listeners}
            {...attributes}
          >
            <Bars3Icon className="h-4 w-4" />
          </IconButton>
        )}
        <div className="min-w-0 flex-1">
          <AccountListItem
            site={site}
            highlights={highlights}
            onDeleteWithDialog={onDeleteWithDialog}
            onCopyKey={onCopyKey}
          />
        </div>
      </div>
    </div>
  )
}

export default SortableAccountListItem
