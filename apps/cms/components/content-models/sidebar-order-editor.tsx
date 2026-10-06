"use client";

import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Layers, type LucideIcon } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CONTENT_STATIC_ITEMS, SIDEBAR_MODELS_CHANGED } from "@/components/layout/sidebar";
import { cn } from "@/lib/utils";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { ContentModel } from "@cms-pwa/shared-types";

interface OrderItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/** Drag-and-drop control for the sidebar's Content section order — spans
 * both the built-in pages (Articles, Categories, ...) and any custom
 * content models currently flagged `show_in_sidebar`. Saved centrally so
 * it applies for every admin, not just the one dragging. */
export function SidebarOrderEditor() {
  const { current } = useProperty();
  const [items, setItems] = useState<OrderItem[] | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  useEffect(() => {
    if (!current) return;
    Promise.all([
      api.get<ContentModel[]>(`/content-models?property_id=${current.id}`).catch(() => []),
      api.get<{ order: string[] }>("/settings/sidebar-order").catch(() => ({ order: [] as string[] })),
    ]).then(([models, { order }]) => {
      const all: OrderItem[] = [
        ...CONTENT_STATIC_ITEMS,
        ...models
          .filter((m) => m.show_in_sidebar)
          .map((m) => ({ href: `/content/${m.content_type}`, label: m.name, icon: Layers })),
      ];
      const sorted =
        order.length === 0
          ? all
          : [...all].sort((a, b) => {
              const ai = order.indexOf(a.href);
              const bi = order.indexOf(b.href);
              if (ai === -1 && bi === -1) return 0;
              if (ai === -1) return 1;
              if (bi === -1) return -1;
              return ai - bi;
            });
      setItems(sorted);
    });
  }, [current?.id]);

  const persist = async (next: OrderItem[]) => {
    setItems(next);
    try {
      await api.put("/settings/sidebar-order", { order: next.map((i) => i.href) });
      window.dispatchEvent(new Event(SIDEBAR_MODELS_CHANGED));
    } catch {
      toast.error("Failed to save sidebar order");
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    if (!items) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((i) => i.href === active.id);
    const newIndex = items.findIndex((i) => i.href === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persist(arrayMove(items, oldIndex, newIndex));
  };

  if (!items) return null;

  return (
    <div className="rounded-lg border-0 bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
      <h3 className="mb-1 text-sm font-semibold">Sidebar order</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Drag to reorder how these show up in the Content section of the sidebar, for everyone.
      </p>
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={items.map((i) => i.href)} strategy={verticalListSortingStrategy}>
          <div className="space-y-1.5">
            {items.map((item) => (
              <OrderRow key={item.href} item={item} />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function OrderRow({ item }: { item: OrderItem }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.href });
  const Icon = item.icon;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center gap-2 rounded-md border bg-card px-2.5 py-2 text-sm transition-colors",
        isDragging && "opacity-40"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="shrink-0 cursor-grab text-muted-foreground touch-none active:cursor-grabbing"
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <span className="truncate">{item.label}</span>
    </div>
  );
}
