"use client";

import {
  DndContext,
  DragOverlay,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, GripVertical, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SIDEBAR_MODELS_CHANGED } from "@/components/layout/sidebar";
import { SidebarOrderEditor } from "@/components/content-models/sidebar-order-editor";
import { SourceTypesEditor } from "@/components/content-models/source-types-editor";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { useProperty } from "@/hooks/use-property";
import { api, ApiError } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { ContentModel, ContentModelField } from "@cms-pwa/shared-types";

const TYPE_OPTIONS = [
  "text",
  "textarea",
  "number",
  "boolean",
  "select",
  "multiselect",
  "image",
  "video",
  "audio",
  "url",
  "color",
  "category",
  "tag",
  "author",
  "date",
  "datetime",
  "cards",
  "suggestion_links",
  "richtext",
];

// Display-only label lookup for Article's known tabs — Tab is a free-text
// field now (custom content types aren't bound to these 3), this just makes
// Article's own tabs render nicely; anything else shows its raw tab string.
const TAB_LABELS: Record<string, string> = {
  content: "Content",
  seo_aeo: "SEO & AEO",
  metadata: "Metadata",
};

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/(^_|_$)/g, "");
}

const OPTIONS_TYPES = new Set(["select", "multiselect"]);

function parseOptions(s: string): string[] | undefined {
  const parsed = s
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  return parsed.length ? parsed : undefined;
}

const EMPTY_CUSTOM_FIELD = { key: "", label: "", type: "text", tab: "content", required: false, options: "" };

export default function ContentModelsPage() {
  const { current } = useProperty();
  const [models, setModels] = useState<ContentModel[] | null>(null);
  const [contentType, setContentType] = useState("article");
  const [model, setModel] = useState<ContentModel | null>(null);
  const [catalog, setCatalog] = useState<ContentModelField[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [editing, setEditing] = useState<ContentModelField | null>(null);
  const [editingOriginalKey, setEditingOriginalKey] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [customField, setCustomField] = useState(EMPTY_CUSTOM_FIELD);
  const [newModelOpen, setNewModelOpen] = useState(false);
  const [newModelName, setNewModelName] = useState("");
  const [newModelSlug, setNewModelSlug] = useState("");
  const [slugEdited, setSlugEdited] = useState(false);

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const loadModels = () => {
    if (!current) return;
    api
      .get<ContentModel[]>(`/content-models?property_id=${current.id}`)
      .then((list) => setModels(list.sort((a, b) => (a.content_type === "article" ? -1 : b.content_type === "article" ? 1 : a.name.localeCompare(b.name)))))
      .catch(() => setModels([]));
  };

  const load = () => {
    if (!current) return;
    setModel(null);
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=${contentType}`)
      .then(setModel)
      .catch(() => toast.error("Failed to load content model"));
    if (contentType === "article") {
      api
        .get<ContentModelField[]>(`/content-models/field-catalog?content_type=${contentType}`)
        .then(setCatalog)
        .catch(() => setCatalog([]));
    } else {
      setCatalog([]);
    }
  };

  useEffect(() => {
    loadModels();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, contentType]);

  const persist = async (fields: ContentModelField[]) => {
    if (!model) return;
    const ordered = fields.map((f, i) => ({ ...f, order: i }));
    setModel({ ...model, fields: ordered });
    try {
      await api.put<ContentModel>(`/content-models/${model.id}`, { fields: ordered });
    } catch {
      toast.error("Failed to save — reloading");
      load();
    }
  };

  const toggleSidebar = async (show: boolean) => {
    if (!model) return;
    setModel({ ...model, show_in_sidebar: show });
    try {
      await api.put<ContentModel>(`/content-models/${model.id}`, { show_in_sidebar: show });
      window.dispatchEvent(new Event(SIDEBAR_MODELS_CHANGED));
      toast.success(show ? "Added to sidebar" : "Removed from sidebar");
    } catch {
      toast.error("Failed to update — reloading");
      load();
    }
  };

  const fields = (model?.fields ?? []).slice().sort((a, b) => a.order - b.order);

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = fields.findIndex((f) => f.key === active.id);
    const newIndex = fields.findIndex((f) => f.key === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    persist(arrayMove(fields, oldIndex, newIndex));
  };

  const toggle = (key: string, patch: Partial<ContentModelField>) =>
    persist(fields.map((f) => (f.key === key ? { ...f, ...patch } : f)));

  const removeField = (key: string) => {
    if (!confirm("Remove this field from the form? Existing data for it is kept, just hidden.")) return;
    persist(fields.filter((f) => f.key !== key));
  };

  const addableCatalog = catalog.filter((c) => !fields.some((f) => f.key === c.key));

  const addCatalogField = (key: string) => {
    const entry = catalog.find((c) => c.key === key);
    if (!entry) return;
    persist([...fields, { ...entry, visible: true }]);
    setAddOpen(false);
  };

  const addCustomField = () => {
    const key = slugify(customField.key);
    if (!key || !customField.label.trim()) {
      toast.error("Field key and label are required");
      return;
    }
    if (fields.some((f) => f.key === key)) {
      toast.error("A field with this key already exists");
      return;
    }
    persist([
      ...fields,
      {
        key,
        label: customField.label.trim(),
        type: customField.type as ContentModelField["type"],
        tab: customField.tab.trim() || "content",
        required: customField.required,
        visible: true,
        order: fields.length,
        options: OPTIONS_TYPES.has(customField.type) ? parseOptions(customField.options) : undefined,
      },
    ]);
    setAddOpen(false);
    setCustomField(EMPTY_CUSTOM_FIELD);
  };

  const saveEdit = async () => {
    if (!editing || !editingOriginalKey || !model) return;
    let finalKey = editingOriginalKey;
    if (!isArticle && editing.key !== editingOriginalKey) {
      const newKey = slugify(editing.key);
      if (!newKey) {
        toast.error("Field key is required");
        return;
      }
      if (fields.some((f) => f.key !== editingOriginalKey && f.key === newKey)) {
        toast.error("A field with this key already exists");
        return;
      }
      try {
        await api.put(`/content-models/${model.id}/rename-field`, { old_key: editingOriginalKey, new_key: newKey });
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Failed to rename field key");
        return;
      }
      finalKey = newKey;
    }
    persist(fields.map((f) => (f.key === editingOriginalKey ? { ...editing, key: finalKey } : f)));
    setEditing(null);
    setEditingOriginalKey(null);
  };

  const createModel = async () => {
    if (!current) return;
    const content_type = newModelSlug || slugify(newModelName);
    if (!newModelName.trim() || !content_type) {
      toast.error("Name is required");
      return;
    }
    try {
      const created = await api.post<ContentModel>("/content-models", {
        name: newModelName.trim(),
        content_type,
        property_id: current.id,
      });
      toast.success(`"${created.name}" model created`);
      setNewModelOpen(false);
      setNewModelName("");
      setNewModelSlug("");
      setSlugEdited(false);
      loadModels();
      setContentType(created.content_type);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to create model");
    }
  };

  const activeField = activeId ? fields.find((f) => f.key === activeId) : null;
  const isArticle = contentType === "article";

  return (
    <div>
      <PageHeader
        title="Content Models"
        description="Control which fields appear on each content type's form, their order, tab, and whether they're required."
      />

      <div className="relative z-10 grid grid-cols-1 gap-4 md:grid-cols-[220px_1fr]">
        <div className="space-y-2">
          <div className="rounded-lg border-0 bg-card p-2 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
            {models === null ? (
              <div className="space-y-1.5 p-1">
                <Skeleton className="h-8 w-full" />
                <Skeleton className="h-8 w-full" />
              </div>
            ) : (
              models.map((m) => (
                <button
                  key={m.content_type}
                  onClick={() => setContentType(m.content_type)}
                  className={cn(
                    "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition-colors",
                    contentType === m.content_type ? "bg-primary text-primary-foreground" : "hover:bg-muted"
                  )}
                >
                  {m.name}
                </button>
              ))
            )}
          </div>
          <Button variant="outline" size="sm" className="w-full" onClick={() => setNewModelOpen(true)}>
            <Plus className="mr-1 h-3.5 w-3.5" /> New model
          </Button>
          <SidebarOrderEditor />
          <SourceTypesEditor />
        </div>

        <div className="rounded-lg border-0 bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold">{model?.name ?? "Fields"}</h3>
              {!isArticle && model && (
                <Link
                  href={`/content/${contentType}`}
                  className="mt-0.5 inline-flex items-center gap-1 text-xs text-primary hover:underline"
                >
                  Manage items <ArrowRight className="h-3 w-3" />
                </Link>
              )}
            </div>
            <div className="flex items-center gap-3">
              {!isArticle && model && (
                <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  Show in sidebar
                  <Switch checked={!!model.show_in_sidebar} onCheckedChange={toggleSidebar} />
                </label>
              )}
              <Button
                size="sm"
                onClick={() => setAddOpen(true)}
                disabled={!model || (isArticle && addableCatalog.length === 0)}
              >
                <Plus className="mr-1 h-3.5 w-3.5" /> Add field
              </Button>
            </div>
          </div>

          {model === null ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : fields.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No fields yet — add one to start building this form.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={(e: DragStartEvent) => setActiveId(String(e.active.id))}
              onDragEnd={handleDragEnd}
              onDragCancel={() => setActiveId(null)}
            >
              <SortableContext items={fields.map((f) => f.key)} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {fields.map((field) => (
                    <FieldRow
                      key={field.key}
                      field={field}
                      onToggleVisible={(v) => toggle(field.key, { visible: v })}
                      onToggleRequired={(v) => toggle(field.key, { required: v })}
                      onEdit={() => {
                        setEditing(field);
                        setEditingOriginalKey(field.key);
                      }}
                      onRemove={() => removeField(field.key)}
                    />
                  ))}
                </div>
              </SortableContext>
              <DragOverlay>
                {activeField && (
                  <div className="flex items-center gap-2 rounded-md border bg-card p-3 shadow-lg">
                    <GripVertical className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{activeField.label}</span>
                  </div>
                )}
              </DragOverlay>
            </DndContext>
          )}
        </div>
      </div>

      <Dialog open={newModelOpen} onOpenChange={setNewModelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New content model</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={newModelName}
                onChange={(e) => {
                  const name = e.target.value;
                  setNewModelName(name);
                  if (!slugEdited) setNewModelSlug(slugify(name));
                }}
                placeholder="e.g. Reel"
              />
            </div>
            <div className="space-y-2">
              <Label>Content type</Label>
              <Input
                value={newModelSlug}
                onChange={(e) => {
                  setSlugEdited(true);
                  setNewModelSlug(slugify(e.target.value));
                }}
                placeholder="e.g. reel"
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, digits, and underscores only. Used internally to store this type&apos;s data.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setNewModelOpen(false)}>
              Cancel
            </Button>
            <Button onClick={createModel} disabled={!newModelName.trim() || !newModelSlug}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={addOpen}
        onOpenChange={(open: boolean) => {
          setAddOpen(open);
          if (!open) setCustomField(EMPTY_CUSTOM_FIELD);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add field</DialogTitle>
          </DialogHeader>
          {isArticle ? (
            <div className="max-h-[60vh] space-y-1 overflow-y-auto">
              {addableCatalog.length === 0 ? (
                <p className="text-sm text-muted-foreground">Every available field is already on this form.</p>
              ) : (
                addableCatalog.map((c) => (
                  <button
                    key={c.key}
                    onClick={() => addCatalogField(c.key)}
                    className="flex w-full items-center justify-between rounded-md border p-2.5 text-left text-sm hover:bg-muted"
                  >
                    <span>{c.label}</span>
                    <Badge variant="outline" className="text-xs">
                      {c.type}
                    </Badge>
                  </button>
                ))
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Field key</Label>
                <Input
                  value={customField.key}
                  onChange={(e) => setCustomField((f) => ({ ...f, key: e.target.value }))}
                  placeholder="e.g. video_url"
                />
                <p className="text-xs text-muted-foreground">
                  Lowercase letters, digits, and underscores only — this is how the value is stored.
                </p>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input
                  value={customField.label}
                  onChange={(e) => setCustomField((f) => ({ ...f, label: e.target.value }))}
                  placeholder="e.g. Video URL"
                />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={customField.type} onValueChange={(v: string) => setCustomField((f) => ({ ...f, type: v }))}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {OPTIONS_TYPES.has(customField.type) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <Input
                    value={customField.options}
                    onChange={(e) => setCustomField((f) => ({ ...f, options: e.target.value }))}
                    placeholder="e.g. Male, Female, Other"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated — these are the choices shown on the form.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Tab</Label>
                <Input
                  value={customField.tab}
                  onChange={(e) => setCustomField((f) => ({ ...f, tab: e.target.value }))}
                  placeholder="e.g. details"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border p-3">
                <Label>Required</Label>
                <Switch
                  checked={customField.required}
                  onCheckedChange={(v: boolean) => setCustomField((f) => ({ ...f, required: v }))}
                />
              </div>
            </div>
          )}
          {!isArticle && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddOpen(false)}>
                Cancel
              </Button>
              <Button onClick={addCustomField}>Add</Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!editing}
        onOpenChange={(open: boolean) => {
          if (!open) {
            setEditing(null);
            setEditingOriginalKey(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit field</DialogTitle>
          </DialogHeader>
          {editing && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Field key</Label>
                <Input
                  value={editing.key}
                  disabled={isArticle}
                  onChange={(e) => setEditing({ ...editing, key: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                  {isArticle
                    ? "Article's field keys are fixed — not editable, since it's what binds this row to the actual data."
                    : "Renaming this moves any data already saved under the old key to the new one."}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Label</Label>
                <Input value={editing.label} onChange={(e) => setEditing({ ...editing, label: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Type</Label>
                <Select
                  value={editing.type}
                  onValueChange={(v: string) => setEditing({ ...editing, type: v as ContentModelField["type"] })}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {(editing.key === "parent_category" || editing.key === "child_category" || editing.key === "tags") && (
                  <p className="text-xs text-muted-foreground">
                    This field always renders as its dedicated picker regardless of type — changing it here only
                    affects the badge shown on this page.
                  </p>
                )}
              </div>
              {OPTIONS_TYPES.has(editing.type) && (
                <div className="space-y-2">
                  <Label>Options</Label>
                  <Input
                    value={(editing.options ?? []).join(", ")}
                    onChange={(e) => setEditing({ ...editing, options: parseOptions(e.target.value) })}
                    placeholder="e.g. Male, Female, Other"
                  />
                  <p className="text-xs text-muted-foreground">Comma-separated — these are the choices shown on the form.</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Tab</Label>
                <Input value={editing.tab} onChange={(e) => setEditing({ ...editing, tab: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Help text</Label>
                <Input
                  placeholder="Shown under the field on the form"
                  value={editing.help_text ?? ""}
                  onChange={(e) => setEditing({ ...editing, help_text: e.target.value || undefined })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setEditing(null);
                setEditingOriginalKey(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function FieldRow({
  field,
  onToggleVisible,
  onToggleRequired,
  onEdit,
  onRemove,
}: {
  field: ContentModelField;
  onToggleVisible: (v: boolean) => void;
  onToggleRequired: (v: boolean) => void;
  onEdit: () => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.key });
  const tabLabel = TAB_LABELS[field.tab] ?? field.tab;

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(
        "flex items-center justify-between gap-3 rounded-md border bg-card p-3 transition-colors",
        isDragging && "opacity-40",
        !field.visible && "opacity-60"
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
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">{field.label}</span>
            <Badge variant="outline" className="text-xs">
              {field.type}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {tabLabel}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">{field.key}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Required
          <Switch checked={field.required} onCheckedChange={onToggleRequired} />
        </label>
        <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
          Visible
          <Switch checked={field.visible} onCheckedChange={onToggleVisible} />
        </label>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
          <Pencil className="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5 text-destructive" />
        </Button>
      </div>
    </div>
  );
}
