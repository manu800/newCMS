"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { Category } from "@cms-pwa/shared-types";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

interface CategoryFormState {
  name: string;
  slug: string;
  thumbnail: string;
  metaTitle: string;
  metaDescription: string;
  metaTags: string;
  lookBookSummary: string;
}

const EMPTY_FORM: CategoryFormState = {
  name: "",
  slug: "",
  thumbnail: "",
  metaTitle: "",
  metaDescription: "",
  metaTags: "",
  lookBookSummary: "",
};

type DragData = { type: "parent" } | { type: "child"; parentId: string };

export default function CategoriesPage() {
  const { current } = useProperty();
  const [categories, setCategories] = useState<Category[] | null>(null);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; parentId?: string; category?: Category } | null>(
    null
  );
  const [form, setForm] = useState<CategoryFormState>(EMPTY_FORM);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const load = () => {
    if (!current) return;
    api.get<Category[]>(`/categories?property_id=${current.id}`).then(setCategories).catch(() => setCategories([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const parents = (categories ?? []).filter((c) => !c.parent_id).sort((a, b) => a.order - b.order);
  const childrenOf = (parentId: string) =>
    (categories ?? []).filter((c) => c.parent_id === parentId).sort((a, b) => a.order - b.order);
  const byId = (id: string) => (categories ?? []).find((c) => c.id === id);

  const openCreate = (parentId?: string) => {
    setForm(EMPTY_FORM);
    setDialog({ mode: "create", parentId });
  };

  const openEdit = (category: Category) => {
    setForm({
      name: category.name,
      slug: category.slug,
      thumbnail: category.thumbnail ?? "",
      metaTitle: category.meta_title ?? "",
      metaDescription: category.meta_description ?? "",
      metaTags: (category.meta_tags ?? []).join(", "),
      lookBookSummary: category.look_book_summary ?? "",
    });
    setDialog({ mode: "edit", category });
  };

  const submit = async () => {
    if (!current || !form.name || !form.slug) return;
    const body = {
      name: form.name,
      slug: form.slug,
      thumbnail: form.thumbnail || null,
      meta_title: form.metaTitle || null,
      meta_description: form.metaDescription || null,
      meta_tags: form.metaTags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean),
      look_book_summary: form.lookBookSummary || null,
    };
    try {
      if (dialog?.mode === "edit" && dialog.category) {
        await api.put(`/categories/${dialog.category.id}`, body);
        toast.success("Category updated");
      } else {
        await api.post("/categories", {
          ...body,
          property_id: current.id,
          parent_id: dialog?.parentId ?? null,
        });
        toast.success(dialog?.parentId ? "Subcategory created" : "Category created");
      }
      setDialog(null);
      load();
    } catch {
      toast.error("Failed to save category");
    }
  };

  const remove = async (category: Category) => {
    const hasChildren = childrenOf(category.id).length > 0;
    if (
      !confirm(
        hasChildren
          ? `Delete "${category.name}"? Its subcategories will become top-level categories. Articles keep their existing tag.`
          : `Delete "${category.name}"? Articles keep their existing tag.`
      )
    )
      return;
    try {
      await api.delete(`/categories/${category.id}`);
      toast.success("Category deleted");
      load();
    } catch {
      toast.error("Failed to delete category");
    }
  };

  // Resequences server-side, reading fresh order values at request time
  // (not client-held state), so drops always resolve against current data.
  const reposition = async (categoryId: string, parentId: string | null, index: number) => {
    try {
      await api.put(`/categories/${categoryId}/position`, { parent_id: parentId, index });
      load();
    } catch {
      toast.error("Couldn't move there — subcategories can't be nested more than one level deep.");
    }
  };

  const handleDragStart = (event: DragStartEvent) => setActiveId(String(event.active.id));

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const activeData = active.data.current as DragData | undefined;
    const overData = over.data.current as DragData | undefined;
    if (!activeData) return;

    if (activeData.type === "parent") {
      if (overData?.type !== "parent") return;
      const newIndex = parents.findIndex((p) => p.id === over.id);
      if (newIndex === -1) return;
      reposition(String(active.id), null, newIndex);
      return;
    }

    // Dragging a subcategory.
    if (overData?.type === "child") {
      const targetSiblings = childrenOf(overData.parentId);
      const newIndex = targetSiblings.findIndex((c) => c.id === over.id);
      reposition(String(active.id), overData.parentId, newIndex === -1 ? targetSiblings.length : newIndex);
    } else if (overData?.type === "parent") {
      // Dropped directly on a parent row — append to the end of its children.
      reposition(String(active.id), String(over.id), childrenOf(String(over.id)).length);
    }
  };

  const activeCategory = activeId ? byId(activeId) : null;

  return (
    <div>
      <PageHeader
        title="Categories"
        description="Drag to reorder, or drag a subcategory onto a different category to move it there."
        actions={
          <Button onClick={() => openCreate()}>
            <Plus className="mr-1 h-4 w-4" /> New Category
          </Button>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        {categories === null ? (
          <div className="space-y-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : parents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No categories yet — create one to start organizing articles.
          </p>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={() => setActiveId(null)}
          >
            <SortableContext items={parents.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <div className="space-y-2">
                {parents.map((parent) => {
                  const children = childrenOf(parent.id);
                  return (
                    <div key={parent.id} className="space-y-1.5">
                      <DraggableRow
                        id={parent.id}
                        dragData={{ type: "parent" }}
                        category={parent}
                        subCount={children.length}
                        onEdit={() => openEdit(parent)}
                        onDelete={() => remove(parent)}
                        onAddChild={() => openCreate(parent.id)}
                      />
                      <SortableContext items={children.map((c) => c.id)} strategy={verticalListSortingStrategy}>
                        <div className="ml-8 space-y-1.5">
                          {children.map((child) => (
                            <DraggableRow
                              key={child.id}
                              id={child.id}
                              dragData={{ type: "child", parentId: parent.id }}
                              category={child}
                              onEdit={() => openEdit(child)}
                              onDelete={() => remove(child)}
                            />
                          ))}
                          {children.length === 0 && (
                            <EmptyDropZone parentId={parent.id} />
                          )}
                        </div>
                      </SortableContext>
                    </div>
                  );
                })}
              </div>
            </SortableContext>
            <DragOverlay>
              {activeCategory && (
                <div className="flex items-center gap-2 rounded-md border bg-card p-3 shadow-lg">
                  <GripVertical className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{activeCategory.name}</span>
                </div>
              )}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      <Dialog open={!!dialog} onOpenChange={(open: boolean) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {dialog?.mode === "edit"
                ? `Edit ${dialog.category?.name}`
                : dialog?.parentId
                  ? "New Subcategory"
                  : "New Category"}
            </DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-4 overflow-y-auto pr-1">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm((f) => ({ ...f, name, slug: dialog?.mode === "edit" ? f.slug : slugify(name) }));
                }}
              />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={form.slug} onChange={(e) => setForm((f) => ({ ...f, slug: e.target.value }))} />
            </div>
            <div className="space-y-2">
              <Label>Thumbnail Image</Label>
              <Input
                placeholder="https://example.com/image.jpg"
                value={form.thumbnail}
                onChange={(e) => setForm((f) => ({ ...f, thumbnail: e.target.value }))}
              />
              {!!form.thumbnail && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={form.thumbnail}
                  alt="Preview"
                  className="h-20 w-full rounded-md border object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = "none";
                  }}
                />
              )}
            </div>
            <div className="space-y-2">
              <Label>Look Book Summary</Label>
              <Textarea
                value={form.lookBookSummary}
                onChange={(e) => setForm((f) => ({ ...f, lookBookSummary: e.target.value }))}
                placeholder="A short summary shown wherever this category is featured."
              />
            </div>
            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">SEO &amp; Metadata</h3>
              <div className="space-y-2">
                <Label>Meta Title</Label>
                <Input value={form.metaTitle} onChange={(e) => setForm((f) => ({ ...f, metaTitle: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Meta Description</Label>
                <Textarea
                  value={form.metaDescription}
                  onChange={(e) => setForm((f) => ({ ...f, metaDescription: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Meta Tags (comma separated)</Label>
                <Input
                  value={form.metaTags}
                  onChange={(e) => setForm((f) => ({ ...f, metaTags: e.target.value }))}
                  placeholder="breaking-news, politics, india"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!form.name || !form.slug}>
              {dialog?.mode === "edit" ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function EmptyDropZone({ parentId }: { parentId: string }) {
  // Data shape matches a "child" drop target (not "parent") so handleDragEnd's
  // existing child-drop-target branch handles this with no special-casing —
  // childrenOf(parentId) is empty here, so it correctly resolves to index 0.
  const { setNodeRef, isOver } = useDroppable({ id: `empty-${parentId}`, data: { type: "child", parentId } });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-md border border-dashed p-2 text-center text-xs text-muted-foreground transition-colors",
        isOver && "border-primary bg-primary/5 text-primary"
      )}
    >
      Drop a subcategory here
    </div>
  );
}

function DraggableRow({
  id,
  dragData,
  category,
  subCount,
  onEdit,
  onDelete,
  onAddChild,
}: {
  id: string;
  dragData: DragData;
  category: Category;
  subCount?: number;
  onEdit: () => void;
  onDelete: () => void;
  onAddChild?: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging, isOver } = useSortable({
    id,
    data: dragData,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors",
        isDragging && "opacity-40",
        isOver && !isDragging && "border-primary bg-primary/5"
      )}
    >
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <button
          {...attributes}
          {...listeners}
          type="button"
          className="shrink-0 cursor-grab text-muted-foreground touch-none active:cursor-grabbing"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-medium">{category.name}</span>
            {!!subCount && (
              <Badge variant="outline" className="text-xs">
                {subCount} sub
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground">
            /{category.slug} · {category.item_count ?? 0} items
          </p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        {onAddChild && (
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onAddChild}>
            <Plus className="h-3.5 w-3.5" />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDelete}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
