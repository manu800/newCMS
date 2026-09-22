"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { DynamicField } from "@/components/shared/dynamic-field";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProperty } from "@/hooks/use-property";
import { api, ApiError } from "@/lib/api-client";
import type { ContentItem, ContentModel, ContentModelField } from "@cms-pwa/shared-types";

function displayValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") {
    const named = (v as { name?: string }).name;
    if (named) return named;
    if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? (x as { name?: string })?.name : x)).join(", ");
    return JSON.stringify(v);
  }
  return String(v);
}

export function ContentItemsClient({ contentType }: { contentType: string }) {
  const { current } = useProperty();
  const [model, setModel] = useState<ContentModel | null>(null);
  const [items, setItems] = useState<ContentItem[] | null>(null);
  const [dialog, setDialog] = useState<{ mode: "create" | "edit"; item?: ContentItem } | null>(null);
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);

  const load = () => {
    if (!current) return;
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=${contentType}`)
      .then(setModel)
      .catch(() => toast.error("Failed to load content model"));
    api
      .get<ContentItem[]>(`/content-items?property_id=${current.id}&content_type=${contentType}`)
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, contentType]);

  const visibleFields = (model?.fields ?? []).filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const columns = visibleFields.slice(0, 3);
  const tabs = Array.from(new Set(visibleFields.map((f) => f.tab)));

  const openCreate = () => {
    setFormData({});
    setDialog({ mode: "create" });
  };

  const openEdit = (item: ContentItem) => {
    setFormData({ ...item.data });
    setDialog({ mode: "edit", item });
  };

  const submit = async () => {
    if (!current) return;
    const missing = visibleFields.find((f) => f.required && !formData[f.key]);
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    try {
      if (dialog?.mode === "edit" && dialog.item) {
        await api.put(`/content-items/${dialog.item.id}`, { data: formData });
        toast.success("Item updated");
      } else {
        await api.post("/content-items", { content_type: contentType, property_id: current.id, data: formData });
        toast.success("Item created");
      }
      setDialog(null);
      load();
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (item: ContentItem) => {
    if (!confirm("Delete this item? This can't be undone.")) return;
    try {
      await api.delete(`/content-items/${item.id}`);
      toast.success("Item deleted");
      load();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  const renderField = (field: ContentModelField) => (
    <div key={field.key} className="space-y-2">
      <Label>{field.label}</Label>
      <DynamicField
        type={field.type}
        options={field.options}
        value={formData[field.key]}
        onChange={(v) => setFormData((d) => ({ ...d, [field.key]: v }))}
      />
      {field.help_text && <p className="text-xs text-muted-foreground">{field.help_text}</p>}
    </div>
  );

  return (
    <div>
      <PageHeader
        title={model?.name ?? contentType}
        description={`Manage ${model?.name ?? contentType} items for this property.`}
        actions={
          <Button onClick={openCreate} disabled={!model || visibleFields.length === 0}>
            + New {model?.name ?? "item"}
          </Button>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        {model && visibleFields.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This model has no fields yet — add some on the Content Models page before creating items.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items === null ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1) + 1} className="text-center text-sm text-muted-foreground">
                    No items yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>{displayValue(item.data[c.key])}</TableCell>
                    ))}
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" onClick={() => openEdit(item)}>
                        Edit
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(item)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>

      <Dialog open={!!dialog} onOpenChange={(open: boolean) => !open && setDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialog?.mode === "edit" ? `Edit ${model?.name}` : `New ${model?.name}`}</DialogTitle>
          </DialogHeader>
          <div className="max-h-[65vh] space-y-6 overflow-y-auto pr-1">
            {tabs.map((tab) => (
              <div key={tab} className="space-y-4">
                {tabs.length > 1 && <h4 className="text-xs font-semibold uppercase text-muted-foreground">{tab}</h4>}
                {visibleFields.filter((f) => f.tab === tab).map(renderField)}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(null)}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={saving}>
              {saving ? "Saving..." : dialog?.mode === "edit" ? "Save" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
