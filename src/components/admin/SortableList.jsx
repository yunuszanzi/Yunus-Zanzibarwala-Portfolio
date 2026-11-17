import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { cn } from '../../lib/utils'

function SortableItem({ id, label, children, className }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id })
  const handle = (
    <button
      type="button"
      ref={setActivatorNodeRef}
      {...attributes}
      {...listeners}
      aria-label={`Reorder ${label}. Press space, then arrow keys.`}
      className="text-muted hover:text-fg inline-flex size-10 shrink-0 cursor-grab touch-none items-center justify-center rounded-lg active:cursor-grabbing"
    >
      <GripVertical size={16} />
    </button>
  )
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(className, isDragging && 'relative z-10 opacity-80 shadow-xl')}
    >
      {children(handle)}
    </li>
  )
}

/**
 * Drag-and-drop list (mouse, touch and keyboard). Calls onReorder with the new array.
 * `renderItem(item, handle)` must place `handle` (the drag button) somewhere in the row.
 * @param {{ items: {id:string}[], onReorder: (items:any[]) => void, renderItem: (item:any, handle:any) => any, getLabel?: (item:any) => string, grid?: boolean, className?: string, itemClassName?: string }} props
 */
export default function SortableList({
  items,
  onReorder,
  renderItem,
  getLabel = (i) => i.title ?? i.name ?? 'item',
  grid = false,
  className,
  itemClassName,
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return
    const from = items.findIndex((i) => i.id === active.id)
    const to = items.findIndex((i) => i.id === over.id)
    onReorder(arrayMove(items, from, to))
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext
        items={items.map((i) => i.id)}
        strategy={grid ? rectSortingStrategy : verticalListSortingStrategy}
      >
        <ul className={className}>
          {items.map((item) => (
            <SortableItem
              key={item.id}
              id={item.id}
              label={getLabel(item)}
              className={itemClassName}
            >
              {(handle) => renderItem(item, handle)}
            </SortableItem>
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  )
}
