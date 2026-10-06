"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { ArticlePreviewDialog } from "@/components/articles/article-preview-dialog";
import { DynamicField } from "@/components/shared/dynamic-field";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { api, ApiError } from "@/lib/api-client";
import { toArticlePreviewData } from "@/lib/content-preview";
import { cn } from "@/lib/utils";
import type { ContentItem, ContentModel, ContentModelField } from "@cms-pwa/shared-types";

const TAB_LABELS: Record<string, string> = {
  content: "Content",
  seo_aeo: "SEO & AEO",
  metadata: "Metadata",
};

/** Full-page create/edit for a Content Item (Video, Quiz, or any other
 * custom Content Model) — the counterpart to ArticleForm, used once an
 * item already exists (or is being created directly from its own list
 * page rather than via the Article Type switcher). */
export function ContentItemForm({
  model,
  propertyId,
  initial,
}: {
  model: ContentModel;
  propertyId: string;
  initial?: ContentItem;
}) {
  const [data, setData] = useState<Record<string, unknown>>(initial?.data ?? {});
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const router = useRouter();
  const isEditing = !!initial;

  const set = (key: string, val: unknown) => setData((d) => ({ ...d, [key]: val }));

  const visibleFields = model.fields.filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const tabs = Array.from(new Set(visibleFields.map((f) => f.tab)));
  // Only auto-manage a "video_orientation" companion value when the model
  // doesn't already define that field itself (e.g. the legacy Article
  // catalog, which has its own dedicated Video Orientation field) — avoids
  // showing the same choice twice.
  const hasOwnOrientationField = model.fields.some((f) => f.key === "video_orientation");

  const submit = async () => {
    const missing = visibleFields.find((f) => f.required && !data[f.key]);
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    try {
      if (isEditing) {
        await api.put(`/content-items/${initial.id}`, { data });
        toast.success("Item updated");
      } else {
        await api.post("/content-items", { content_type: model.content_type, property_id: propertyId, data });
        toast.success("Item created");
      }
      router.push(`/content/${model.content_type}`);
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save item");
    } finally {
      setSaving(false);
    }
  };

  const renderField = (field: ContentModelField) => {
    if (field.type === "boolean") {
      return (
        <ToggleField
          key={field.key}
          label={field.label}
          description={field.help_text}
          checked={!!data[field.key]}
          onChange={(v) => set(field.key, v)}
        />
      );
    }
    return (
      <Field
        key={field.key}
        label={field.label}
        description={field.help_text}
        required={field.required}
        full={
          field.type === "textarea" ||
          field.type === "richtext" ||
          field.type === "image" ||
          field.type === "video" ||
          field.type === "audio" ||
          field.type === "cards" ||
          field.type === "suggestion_links"
        }
      >
        <DynamicField
          type={field.type}
          options={field.options}
          value={data[field.key]}
          onChange={(v) => set(field.key, v)}
          orientationValue={
            field.type === "video" && !hasOwnOrientationField ? (data.video_orientation as string | undefined) : undefined
          }
          onOrientationChange={
            field.type === "video" && !hasOwnOrientationField ? (v: string) => set("video_orientation", v) : undefined
          }
        />
      </Field>
    );
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue={tabs[0] ?? "content"}>
        <div className="mb-4 w-fit rounded-lg bg-card p-1.5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
          <TabsList className="flex-wrap">
            {tabs.map((tab) => (
              <TabsTrigger key={tab} value={tab}>
                {TAB_LABELS[tab] ?? tab}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {tabs.map((tab) => (
          <TabsContent key={tab} value={tab}>
            <div className="rounded-xl border bg-card p-5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] sm:p-6">
              <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                {visibleFields.filter((f) => f.tab === tab).map(renderField)}
              </div>
            </div>
          </TabsContent>
        ))}
      </Tabs>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => setPreviewOpen(true)}>
          Preview
        </Button>
        <Button variant="outline" onClick={() => router.push(`/content/${model.content_type}`)}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving..." : isEditing ? "Save Changes" : `Create ${model.name}`}
        </Button>
      </div>

      <ArticlePreviewDialog
        propertyId={propertyId}
        data={toArticlePreviewData(data)}
        open={previewOpen}
        onOpenChange={setPreviewOpen}
      />
    </div>
  );
}

function Field({
  label,
  description,
  required,
  full,
  children,
}: {
  label: string;
  description?: string;
  required?: boolean;
  full?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1.5", full && "sm:col-span-2")}>
      <Label>
        {label}
        {required && <span className="ml-0.5 text-destructive">*</span>}
      </Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}

function ToggleField({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border bg-muted/30 px-3 py-2.5">
      <div>
        <Label>{label}</Label>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
