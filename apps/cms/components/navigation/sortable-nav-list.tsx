"use client";

import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { NavItem } from "@cms-pwa/shared-types";

function SortableItem({
  item,
  onChange,
  onRemove,
}: {
  item: NavItem;
  onChange: (id: string, patch: Partial<NavItem>) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: item.id,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`flex items-center gap-2 rounded-md border bg-card p-2 ${isDragging ? "opacity-50" : ""}`}
    >
      <button {...attributes} {...listeners} className="cursor-grab text-muted-foreground" type="button">
        <GripVertical className="h-4 w-4" />
      </button>
      <Input
        value={item.label}
        onChange={(e) => onChange(item.id, { label: e.target.value })}
        placeholder="Label"
        className="w-40"
      />
      <Input
        value={item.url}
        onChange={(e) => onChange(item.id, { url: e.target.value })}
        placeholder="/url"
        className="flex-1"
      />
      <Input
        value={item.icon ?? ""}
        onChange={(e) => onChange(item.id, { icon: e.target.value })}
        placeholder="icon"
        className="w-28"
      />
      <Button variant="ghost" size="icon" onClick={() => onRemove(item.id)} type="button">
        <Trash2 className="h-4 w-4 text-destructive" />
      </Button>
    </div>
  );
}

export function SortableNavList({
  items,
  onItemsChange,
}: {
  items: NavItem[];
  onItemsChange: (items: NavItem[]) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    const reordered = arrayMove(items, oldIndex, newIndex).map((it, idx) => ({ ...it, order: idx }));
    onItemsChange(reordered);
  };

  const updateItem = (id: string, patch: Partial<NavItem>) =>
    onItemsChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  const removeItem = (id: string) => onItemsChange(items.filter((i) => i.id !== id));

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={items.map((i) => i.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-2">
          {items.map((item) => (
            <SortableItem key={item.id} item={item} onChange={updateItem} onRemove={removeItem} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
