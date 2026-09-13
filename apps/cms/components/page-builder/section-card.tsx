"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Copy, GripVertical, Trash2 } from "lucide-react";
import * as Icons from "lucide-react";

import { COMPONENT_PALETTE } from "@cms-pwa/component-schema";
import type { Section } from "@cms-pwa/shared-types";
import { cn } from "@/lib/utils";

export function SectionCard({
  section,
  selected,
  onSelect,
  onDelete,
  onDuplicate,
}: {
  section: Section;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onDuplicate: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: section.id,
  });
  const meta = COMPONENT_PALETTE.find((c) => c.type === section.type);
  const Icon = meta ? (Icons as unknown as Record<string, Icons.LucideIcon>)[meta.icon] : Icons.Box;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      onClick={onSelect}
      className={cn(
        "flex items-center gap-3 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] p-3 transition-colors",
        selected ? "border-primary ring-1 ring-primary" : "hover:border-muted-foreground/40",
        isDragging && "opacity-50"
      )}
    >
      <button
        {...attributes}
        {...listeners}
        type="button"
        className="cursor-grab text-muted-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      {Icon && <Icon className="h-4 w-4 text-muted-foreground" />}
      <div className="flex-1">
        <p className="text-sm font-medium">{section.title || meta?.label || section.type}</p>
        <p className="text-xs text-muted-foreground">
          {section.type}
          {section.variant ? ` · ${section.variant}` : ""}
          {section.data_source ? ` · ${section.data_source.type}` : ""}
        </p>
      </div>
      <button
        type="button"
        className="rounded p-1.5 hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onDuplicate();
        }}
      >
        <Copy className="h-4 w-4" />
      </button>
      <button
        type="button"
        className="rounded p-1.5 hover:bg-muted"
        onClick={(e) => {
          e.stopPropagation();
          onDelete();
        }}
      >
        <Trash2 className="h-4 w-4 text-destructive" />
      </button>
    </div>
  );
}
