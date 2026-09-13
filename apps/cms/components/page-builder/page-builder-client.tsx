"use client";

import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  closestCenter,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import * as Icons from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { COMPONENT_PALETTE } from "@cms-pwa/component-schema";

import { PageHeader } from "@/components/layout/page-header";
import { Palette } from "@/components/page-builder/palette";
import { PreviewDialog } from "@/components/page-builder/preview-dialog";
import { PropertiesPanel } from "@/components/page-builder/properties-panel";
import { SectionCard } from "@/components/page-builder/section-card";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { VersionHistoryDialog } from "@/components/versions/version-history-dialog";
import { api } from "@/lib/api-client";
import { genId } from "@/lib/utils";
import type { CmsComponent, Page, Section } from "@cms-pwa/shared-types";

function emptySection(type: Section["type"], component: CmsComponent | undefined): Section {
  const props: Record<string, unknown> = {};
  for (const field of component?.fields ?? []) {
    if (field.default !== undefined && field.default !== null) props[field.name] = field.default;
  }
  return {
    id: genId("s"),
    type,
    variant: component?.variants[0]?.slug,
    title: component?.name,
    data_source: undefined,
    config: { columns: { mobile: 1, tablet: 2, desktop: 3 }, spacing: { top: 20, bottom: 20 } },
    props,
  };
}

export function PageBuilderClient({ id }: { id: string }) {
  const [page, setPage] = useState<Page | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [components, setComponents] = useState<CmsComponent[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);

  const load = () => {
    api.get<Page>(`/pages/${id}`).then((p) => {
      setPage(p);
      setSections(p.sections);
    });
  };

  useEffect(() => {
    load();
    api.get<CmsComponent[]>("/components").then(setComponents).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const { setNodeRef: setCanvasRef, isOver } = useDroppable({ id: "canvas-dropzone" });
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  const addSection = (type: Section["type"]) => {
    const component = components.find((c) => c.type === type);
    const newSection = emptySection(type, component);
    setSections((prev) => [...prev, newSection]);
    setSelectedId(newSection.id);
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragId(null);
    if (!over) return;

    const paletteType = active.data.current?.paletteType as Section["type"] | undefined;
    if (paletteType) {
      addSection(paletteType);
      return;
    }

    if (active.id !== over.id) {
      setSections((prev) => {
        const oldIndex = prev.findIndex((s) => s.id === active.id);
        const newIndex = prev.findIndex((s) => s.id === over.id);
        if (oldIndex === -1 || newIndex === -1) return prev;
        return arrayMove(prev, oldIndex, newIndex);
      });
    }
  };

  const draggingPaletteMeta = activeDragId?.startsWith("palette-")
    ? COMPONENT_PALETTE.find((c) => `palette-${c.type}` === activeDragId)
    : undefined;
  const draggingSection = activeDragId ? sections.find((s) => s.id === activeDragId) : undefined;

  const updateSection = (sectionId: string, patch: Partial<Section>) =>
    setSections((prev) => prev.map((s) => (s.id === sectionId ? { ...s, ...patch } : s)));

  const deleteSection = (sectionId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== sectionId));
    if (selectedId === sectionId) setSelectedId(null);
  };

  const duplicateSection = (sectionId: string) => {
    const section = sections.find((s) => s.id === sectionId);
    if (!section) return;
    const copy = { ...section, id: genId("s") };
    const idx = sections.findIndex((s) => s.id === sectionId);
    setSections((prev) => [...prev.slice(0, idx + 1), copy, ...prev.slice(idx + 1)]);
  };

  const saveDraft = async () => {
    setSaving(true);
    try {
      await api.put(`/pages/${id}`, { sections });
      toast.success("Draft saved");
      load();
    } catch {
      toast.error("Failed to save draft");
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    setSaving(true);
    try {
      await api.put(`/pages/${id}`, { sections });
      await api.post(`/pages/${id}/publish`);
      toast.success("Page published");
      load();
    } catch {
      toast.error("Failed to publish page");
    } finally {
      setSaving(false);
    }
  };

  if (!page) {
    return (
      <div>
        <PageHeader title="Page Builder" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const selectedSection = sections.find((s) => s.id === selectedId);
  const selectedComponent = components.find((c) => c.type === selectedSection?.type);
  const activeTypes = new Set(components.filter((c) => c.status === "active").map((c) => c.type));

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title={`Page Builder — ${page.name}`}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={page.status} onDark />
            <Link href="/pages" className="text-xs underline">
              Back to pages
            </Link>
          </span>
        }
        actions={
          <>
            <VersionHistoryDialog entityType="page" entityId={id} onRestored={load} />
            <Button variant="outline" onClick={() => setPreviewOpen(true)}>
              Preview
            </Button>
            <Button variant="outline" onClick={saveDraft} disabled={saving}>
              Save Draft
            </Button>
            <Button onClick={publish} disabled={saving}>
              Publish
            </Button>
          </>
        }
      />

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => setActiveDragId(null)}
      >
        <div className="relative z-10 grid flex-1 grid-cols-[220px_1fr_320px] gap-4">
          <div className="rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] p-3">
            <Palette activeTypes={activeTypes} onAdd={addSection} />
          </div>

          <div
            ref={setCanvasRef}
            className={`min-h-[400px] space-y-2 rounded-lg border bg-muted/30 p-3 ${
              isOver ? "border-primary bg-primary/5" : ""
            }`}
          >
            {sections.length === 0 ? (
              <div className="flex h-full min-h-96 items-center justify-center text-sm text-muted-foreground">
                Drag components here to build your page
              </div>
            ) : (
              <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
                {sections.map((s) => (
                  <SectionCard
                    key={s.id}
                    section={s}
                    selected={s.id === selectedId}
                    onSelect={() => setSelectedId(s.id)}
                    onDelete={() => deleteSection(s.id)}
                    onDuplicate={() => duplicateSection(s.id)}
                  />
                ))}
              </SortableContext>
            )}
          </div>

          <div className="rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] p-4">

            {selectedSection ? (
              <PropertiesPanel
                section={selectedSection}
                component={selectedComponent}
                onChange={(patch) => updateSection(selectedSection.id, patch)}
              />
            ) : (
              <p className="text-sm text-muted-foreground">Select a section to edit its properties.</p>
            )}
          </div>
          
        </div>

        <DragOverlay>
          {draggingPaletteMeta ? (
            <div className="flex items-center gap-2 rounded-md border bg-card px-3 py-2 text-sm shadow-lg">
              {(() => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[draggingPaletteMeta.icon] ?? Icons.Box;
                return <Icon className="h-4 w-4 text-muted-foreground" />;
              })()}
              {draggingPaletteMeta.label}
            </div>
          ) : draggingSection ? (
            <div className="rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] p-3 text-sm shadow-lg">
              {draggingSection.title || draggingSection.type}
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      <PreviewDialog pageId={id} open={previewOpen} onOpenChange={setPreviewOpen} />
    </div>
  );
}
