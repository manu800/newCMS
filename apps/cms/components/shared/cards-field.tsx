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
import { GripVertical, ImagePlus, Plus, Trash2 } from "lucide-react";

import { MediaPicker } from "@/components/shared/media-picker";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const TITLE_MAX = 75;

export interface CardItem {
  id: string;
  image?: string;
  title?: string;
}

function newCard(): CardItem {
  return { id: crypto.randomUUID(), image: "", title: "" };
}

/** A repeatable list of {image, title} cards — add/remove/reorder rows.
 * Stored as an array on the content item's data under the field's key. */
export function CardsField({ value, onChange }: { value: unknown; onChange: (v: CardItem[]) => void }) {
  const cards: CardItem[] = Array.isArray(value) && value.length > 0 ? (value as CardItem[]) : [newCard()];
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const update = (next: CardItem[]) => onChange(next.length ? next : [newCard()]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = cards.findIndex((c) => c.id === active.id);
    const newIndex = cards.findIndex((c) => c.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    update(arrayMove(cards, oldIndex, newIndex));
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={cards.map((c) => c.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-3">
          {cards.map((card, i) => (
            <CardRow
              key={card.id}
              card={card}
              index={i}
              isLast={i === cards.length - 1}
              onChange={(next) => update(cards.map((c) => (c.id === card.id ? next : c)))}
              onRemove={() => update(cards.filter((c) => c.id !== card.id))}
              onAdd={() => update([...cards, newCard()])}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function CardRow({
  card,
  index,
  isLast,
  onChange,
  onRemove,
  onAdd,
}: {
  card: CardItem;
  index: number;
  isLast: boolean;
  onChange: (c: CardItem) => void;
  onRemove: () => void;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: card.id });
  const title = card.title ?? "";

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex gap-4 rounded-lg border bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]",
        isDragging && "opacity-40"
      )}
    >
      <div className="flex shrink-0 flex-col items-center gap-1 pt-1 text-xs text-muted-foreground">
        <button {...attributes} {...listeners} type="button" className="cursor-grab touch-none active:cursor-grabbing">
          <GripVertical className="h-4 w-4" />
        </button>
        <span>{index + 1}</span>
      </div>

      <div className="flex w-40 shrink-0 flex-col items-center gap-2">
        {card.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={card.image} alt="" className="h-40 w-full rounded-md border object-cover" />
        ) : (
          <div className="flex h-40 w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-sky-300 bg-sky-50 p-2 text-center">
            <ImagePlus className="h-5 w-5 text-sky-500" />
            <p className="mt-1 text-[11px] font-medium text-sky-700">Upload a high resolution image</p>
            <p className="mt-0.5 text-[10px] text-sky-500">.jpg .png .webp .gif</p>
          </div>
        )}
        <MediaPicker type="image" value={card.image} onSelect={(asset) => onChange({ ...card, image: asset.url })} />
      </div>

      <div className="flex-1 space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">Title</label>
          <span className="text-xs text-muted-foreground">
            {title.length}/{TITLE_MAX}
          </span>
        </div>
        <Input
          value={title}
          maxLength={TITLE_MAX}
          placeholder="Title"
          onChange={(e) => onChange({ ...card, title: e.target.value })}
        />
      </div>

      <div className="flex shrink-0 flex-col items-center gap-2 pt-1">
        <button type="button" onClick={onRemove} className="text-destructive hover:opacity-70">
          <Trash2 className="h-4 w-4" />
        </button>
        {isLast && (
          <button type="button" onClick={onAdd} className="text-muted-foreground hover:text-foreground">
            <Plus className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
