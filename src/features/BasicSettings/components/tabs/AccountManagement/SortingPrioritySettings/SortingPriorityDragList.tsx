import {
  closestCenter,
  DndContext,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  restrictToVerticalAxis,
  restrictToWindowEdges,
} from "@dnd-kit/modifiers"
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable"

import type { SortingFieldConfig } from "~/types/sorting"

import { SortingCriteriaItem } from "./SortingCriteriaItem"

export interface AugmentedSortingFieldConfig extends SortingFieldConfig {
  label: string
  description?: string
}

interface SortingPriorityDragListProps {
  items: AugmentedSortingFieldConfig[]
  onDragEnd: (event: DragEndEvent) => void
  onToggleEnabled?: (id: string, enabled: boolean) => void
}

/**
 * Drag-and-drop list for sorting priority criteria using \@dnd-kit.
 */
export function SortingPriorityDragList({
  items,
  onDragEnd,
  onToggleEnabled,
}: SortingPriorityDragListProps) {
  //
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8, // 8px
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250, // 250ms
        tolerance: 5, // 5px
      },
    }),
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
      modifiers={[restrictToVerticalAxis, restrictToWindowEdges]}
    >
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={verticalListSortingStrategy}
      >
        {items.map((item) => (
          <SortingCriteriaItem
            key={item.id}
            item={item}
            onToggleEnabled={onToggleEnabled}
          />
        ))}
      </SortableContext>
    </DndContext>
  )
}
