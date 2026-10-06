"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { CategorySelect, SubcategorySelect } from "@/components/articles/category-select";
import { ArticlePreviewDialog } from "@/components/articles/article-preview-dialog";
import { DynamicField } from "@/components/shared/dynamic-field";
import { TagMultiSelect } from "@/components/shared/tag-multi-select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperty } from "@/hooks/use-property";
import { api, ApiError } from "@/lib/api-client";
import { toArticlePreviewData } from "@/lib/content-preview";
import { cn } from "@/lib/utils";
import type { ContentModel, ContentModelField } from "@cms-pwa/shared-types";

export interface ArticleFormValues {
  id?: string;
  script_headline?: string;
  script_slug?: string;
  script_summary?: string;
  script_content?: string;
  script_thumbnail?: string;
  script_thumbnail_16_9?: string;
  parent_category?: { name: string; slug: string };
  child_category?: { name: string; slug: string };
  tags?: { name: string; slug: string }[];
  article_type?: string;
  video_url?: string;
  video_orientation?: string;
  meta_title?: string;
  meta_description?: string;
  meta_keywords?: string;
  og_title?: string;
  og_description?: string;
  social_headline?: string;
  social_caption?: string;
  social_image?: string;
  script_status?: boolean;
  show_on_web?: boolean;
  show_on_app?: boolean;
  is_breaking?: string;
  is_trending?: boolean;
  trending_order?: number;
  language_code?: string;
}

const DEFAULTS: ArticleFormValues = {
  article_type: "article",
  script_status: true,
  show_on_web: true,
  show_on_app: true,
  is_breaking: "false",
  is_trending: false,
  language_code: "en",
};

const TAB_LABELS: Record<string, string> = {
  content: "Content",
  seo_aeo: "SEO & AEO",
  metadata: "Metadata",
};

// Fields whose input needs the full row width — everything else sits two-up
// in the grid.
function isFullWidth(field: ContentModelField) {
  return (
    field.type === "textarea" ||
    field.type === "richtext" ||
    field.type === "image" ||
    field.type === "video" ||
    field.type === "audio" ||
    field.type === "cards" ||
    field.type === "suggestion_links" ||
    field.key === "tags" ||
    field.key === "script_content"
  );
}

// A model field only renders when its underlying data still makes sense —
// these two conditions mirror the form's pre-content-model behavior and
// aren't something the Content Models page controls.
function shouldRender(field: ContentModelField, values: ArticleFormValues) {
  if ((field.key === "video_url" || field.key === "video_orientation") && values.article_type !== "video") {
    return false;
  }
  if (field.key === "trending_order" && !values.is_trending) return false;
  return true;
}

export function ArticleForm({ initial }: { initial?: ArticleFormValues }) {
  const { current } = useProperty();
  // A "New {model}" link elsewhere (e.g. the Video content list) can send
  // ?type=video to land here with that Article Type preselected instead of
  // opening a separate create dialog — `initial` (editing an existing
  // article) always wins over the query param.
  const typeParam = useSearchParams().get("type");
  const [values, setValues] = useState<ArticleFormValues>({
    ...DEFAULTS,
    ...(typeParam ? { article_type: typeParam } : {}),
    ...initial,
  });
  const [model, setModel] = useState<ContentModel | null>(null);
  const [altModel, setAltModel] = useState<ContentModel | null>(null);
  const [altData, setAltData] = useState<Record<string, unknown>>({});
  const [saving, setSaving] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [modelTypes, setModelTypes] = useState<string[]>(["article"]);
  const router = useRouter();
  const isEditing = !!initial?.id;

  useEffect(() => {
    if (!current) return;
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=article`)
      .then(setModel)
      .catch(() => toast.error("Failed to load form fields"));
  }, [current?.id]);

  // Article Type's options mirror whatever Content Models exist for this
  // property right now, rather than a fixed list on the field itself — so a
  // newly created model (e.g. "Quiz") shows up here immediately.
  useEffect(() => {
    if (!current) return;
    api
      .get<ContentModel[]>(`/content-models?property_id=${current.id}`)
      .then((list) => {
        const types = list.map((m) => m.content_type);
        setModelTypes(["article", ...types.filter((t) => t !== "article")]);
      })
      .catch(() => setModelTypes(["article"]));
  }, [current?.id]);

  // Only a brand-new article can switch content type — an existing article
  // keeps rendering with the Article schema it was saved under. When the
  // chosen Article Type has its own Content Model, the form swaps to that
  // model's fields entirely and saves as a Content Item instead of an Article.
  useEffect(() => {
    if (isEditing || !current) return;
    const type = values.article_type;
    if (!type || type === "article") {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAltModel(null);
      return;
    }
    let cancelled = false;
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=${type}`)
      .then((m) => {
        if (!cancelled) {
          setAltModel(m);
          setAltData({});
        }
      })
      .catch(() => {
        if (!cancelled) setAltModel(null);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values.article_type, current?.id, isEditing]);

  const set = <K extends keyof ArticleFormValues>(key: K, val: ArticleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const setDynamic = (key: string, val: unknown) => setValues((v) => ({ ...v, [key]: val }));

  const setAlt = (key: string, val: unknown) => setAltData((d) => ({ ...d, [key]: val }));

  const submit = async () => {
    if (altModel) {
      const missing = altModel.fields.find((f) => f.visible && f.required && !altData[f.key]);
      if (missing) {
        toast.error(`${missing.label} is required`);
        return;
      }
      setSaving(true);
      try {
        await api.post("/content-items", {
          content_type: altModel.content_type,
          property_id: current?.id,
          data: altData,
        });
        toast.success(`${altModel.name} item created`);
        router.push(`/content/${altModel.content_type}`);
      } catch (e) {
        toast.error(e instanceof ApiError ? e.message : "Failed to save item");
      } finally {
        setSaving(false);
      }
      return;
    }

    const missing = (model?.fields ?? []).find(
      (f) => f.visible && f.required && !values[f.key as keyof ArticleFormValues]
    );
    if (missing) {
      toast.error(`${missing.label} is required`);
      return;
    }
    setSaving(true);
    try {
      const payload = { ...values };
      delete payload.id;
      if (values.id) {
        await api.put(`/articles/${values.id}`, payload);
        toast.success("Article updated");
      } else {
        // property_id only applies to a brand-new article — new articles are
        // stored as a Content Item, which is always property-scoped; existing
        // (legacy) articles have no such field, so it's never sent on update.
        await api.post("/articles", { ...payload, property_id: current?.id });
        toast.success("Article created");
      }
      router.push("/articles");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  if (!model) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    );
  }

  const visibleFields = model.fields.filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const tabs = Array.from(new Set(visibleFields.map((f) => f.tab)));
  // Article's own catalog already has a dedicated Video Orientation field —
  // skip auto-managing the same value inline so it isn't shown twice.
  const hasOwnOrientationField = model.fields.some((f) => f.key === "video_orientation");

  const renderField = (field: ContentModelField) => {
    const full = isFullWidth(field);
    if (field.key === "parent_category") {
      return (
        <Field key={field.key} label={field.label} description={field.help_text} required={field.required} full={full}>
          <CategorySelect
            value={values.parent_category?.slug}
            onChange={(cat) => {
              set("parent_category", cat);
              if (cat.slug !== values.parent_category?.slug) set("child_category", undefined);
            }}
          />
        </Field>
      );
    }
    if (field.key === "child_category") {
      return (
        <Field key={field.key} label={field.label} description={field.help_text} required={field.required} full={full}>
          <SubcategorySelect
            parentSlug={values.parent_category?.slug}
            value={values.child_category?.slug}
            onChange={(cat) => set("child_category", cat)}
          />
        </Field>
      );
    }
    if (field.key === "tags") {
      return (
        <Field key={field.key} label={field.label} description={field.help_text} required={field.required} full={full}>
          <TagMultiSelect
            value={(values.tags ?? []).map((t) => t.slug)}
            onChange={() => {
              /* onChangeTags below carries the {name, slug} shape this form needs */
            }}
            onChangeTags={(tags) => set("tags", tags.map((t) => ({ name: t.name, slug: t.slug })))}
          />
        </Field>
      );
    }
    if (field.type === "boolean") {
      return (
        <ToggleField
          key={field.key}
          label={field.label}
          description={field.help_text}
          checked={!!values[field.key as keyof ArticleFormValues]}
          onChange={(v) => setDynamic(field.key, v)}
        />
      );
    }
    return (
      <Field
        key={field.key}
        label={field.label}
        description={field.key === "article_type" && isEditing ? "Can't be changed once an article is created." : field.help_text}
        required={field.required}
        full={full}
      >
        <DynamicField
          type={field.type}
          options={field.key === "article_type" ? modelTypes : field.options}
          value={values[field.key as keyof ArticleFormValues]}
          onChange={(v) => setDynamic(field.key, v)}
          disabled={field.key === "article_type" && isEditing}
          orientationValue={
            field.type === "video" && !hasOwnOrientationField ? (values.video_orientation as string | undefined) : undefined
          }
          onOrientationChange={
            field.type === "video" && !hasOwnOrientationField ? (v: string) => setDynamic("video_orientation", v) : undefined
          }
          suggestedName={values.script_headline}
        />
      </Field>
    );
  };

  const articleTypeField = model.fields.find((f) => f.key === "article_type");
  const altHasOwnOrientationField = (altModel?.fields ?? []).some((f) => f.key === "video_orientation");

  const renderAltField = (field: ContentModelField) => {
    if (field.type === "boolean") {
      return (
        <ToggleField
          key={field.key}
          label={field.label}
          description={field.help_text}
          checked={!!altData[field.key]}
          onChange={(v) => setAlt(field.key, v)}
        />
      );
    }
    return (
      <Field
        key={field.key}
        label={field.label}
        description={field.help_text}
        required={field.required}
        full={isFullWidth(field)}
      >
        <DynamicField
          type={field.type}
          options={field.options}
          value={altData[field.key]}
          onChange={(v) => setAlt(field.key, v)}
          orientationValue={
            field.type === "video" && !altHasOwnOrientationField
              ? (altData.video_orientation as string | undefined)
              : undefined
          }
          onOrientationChange={
            field.type === "video" && !altHasOwnOrientationField ? (v: string) => setAlt("video_orientation", v) : undefined
          }
          suggestedName={(altData.script_headline as string | undefined) ?? values.script_headline}
        />
      </Field>
    );
  };

  const altVisibleFields = (altModel?.fields ?? []).filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const altTabs = Array.from(new Set(altVisibleFields.map((f) => f.tab)));

  return (
    <div className="space-y-6">
      {altModel ? (
        <Tabs defaultValue={altTabs[0] ?? "content"}>
          <div className="mb-4 w-fit rounded-lg bg-card p-1.5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
            <TabsList className="flex-wrap">
              {altTabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {TAB_LABELS[tab] ?? tab}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {altTabs.map((tab, i) => (
            <TabsContent key={tab} value={tab}>
              <div className="rounded-xl border bg-card p-5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)] sm:p-6">
                <div className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
                  {i === 0 && articleTypeField && renderField(articleTypeField)}
                  {altVisibleFields.filter((f) => f.tab === tab).map(renderAltField)}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
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
                  {visibleFields
                    .filter((f) => f.tab === tab && shouldRender(f, values))
                    .map(renderField)}
                </div>
              </div>
            </TabsContent>
          ))}
        </Tabs>
      )}

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => setPreviewOpen(true)} disabled={!current}>
          Preview
        </Button>
        <Button
          variant="outline"
          onClick={() => router.push(altModel ? `/content/${altModel.content_type}` : "/articles")}
        >
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving..." : altModel ? `Create ${altModel.name}` : values.id ? "Save Changes" : "Create Article"}
        </Button>
      </div>

      {current && (
        <ArticlePreviewDialog
          propertyId={current.id}
          data={altModel ? toArticlePreviewData(values as Record<string, unknown>) : (values as Record<string, unknown>)}
          open={previewOpen}
          onOpenChange={setPreviewOpen}
        />
      )}
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
