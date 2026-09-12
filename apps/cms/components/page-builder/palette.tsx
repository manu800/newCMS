"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import * as Icons from "lucide-react";

import { COMPONENT_PALETTE } from "@cms-pwa/component-schema";
import type { ComponentType } from "@cms-pwa/shared-types";
import { cn } from "@/lib/utils";

function PaletteItem({
  type,
  label,
  icon,
  onAdd,
}: {
  type: ComponentType;
  label: string;
  icon: string;
  onAdd: (type: ComponentType) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging, transform } = useDraggable({
    id: `palette-${type}`,
    data: { paletteType: type },
  });
  const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[icon] ?? Icons.Box;

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      type="button"
      onClick={() => onAdd(type)}
      style={{ transform: CSS.Translate.toString(transform), touchAction: "none" }}
      className={cn(
        "flex w-full cursor-grab items-center gap-2 rounded-md border bg-card px-3 py-2 text-left text-sm hover:border-primary hover:bg-accent active:cursor-grabbing",
        isDragging && "z-50 opacity-50 shadow-lg"
      )}
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      {label}
    </button>
  );
}

export function Palette({
  activeTypes,
  onAdd,
}: {
  activeTypes: Set<string>;
  onAdd: (type: ComponentType) => void;
}) {
  const groups: { key: string; label: string }[] = [
    { key: "layout", label: "Layout" },
    { key: "content", label: "Content" },
    { key: "navigation", label: "Navigation" },
  ];

  return (
    <div className="space-y-4">
      <p className="text-xs text-muted-foreground">Drag a component onto the canvas, or click it to add it.</p>
      {groups.map((g) => {
        const items = COMPONENT_PALETTE.filter((c) => c.group === g.key && activeTypes.has(c.type));
        if (items.length === 0) return null;
        return (
          <div key={g.key}>
            <h4 className="mb-2 text-xs font-semibold uppercase text-muted-foreground">{g.label}</h4>
            <div className="space-y-1.5">
              {items.map((item) => (
                <PaletteItem key={item.type} type={item.type} label={item.label} icon={item.icon} onAdd={onAdd} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
