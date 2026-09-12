"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { CategorySelect } from "@/components/articles/category-select";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError } from "@/lib/api-client";

export interface ArticleFormValues {
  id?: string;
  script_headline?: string;
  script_slug?: string;
  script_summary?: string;
  script_content?: string;
  script_thumbnail?: string;
  script_thumbnail_16_9?: string;
  parent_category?: { name: string; slug: string };
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

export function ArticleForm({ initial }: { initial?: ArticleFormValues }) {
  const [values, setValues] = useState<ArticleFormValues>({ ...DEFAULTS, ...initial });
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  const set = <K extends keyof ArticleFormValues>(key: K, val: ArticleFormValues[K]) =>
    setValues((v) => ({ ...v, [key]: val }));

  const submit = async () => {
    if (!values.script_headline) {
      toast.error("Headline is required");
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
        await api.post("/articles", payload);
        toast.success("Article created");
      }
      router.push("/articles");
    } catch (e) {
      toast.error(e instanceof ApiError ? e.message : "Failed to save article");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="general">
        <TabsList className="flex-wrap">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="video">Video</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="publishing">Publishing</TabsTrigger>
          <TabsTrigger value="advanced">Advanced</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Field label="Headline">
            <Input value={values.script_headline ?? ""} onChange={(e) => set("script_headline", e.target.value)} />
          </Field>
          <Field label="Slug">
            <Input value={values.script_slug ?? ""} onChange={(e) => set("script_slug", e.target.value)} />
          </Field>
          <Field label="Summary">
            <Textarea value={values.script_summary ?? ""} onChange={(e) => set("script_summary", e.target.value)} />
          </Field>
          <Field label="Content">
            <Textarea
              className="min-h-32"
              value={values.script_content ?? ""}
              onChange={(e) => set("script_content", e.target.value)}
            />
          </Field>
        </TabsContent>

        <TabsContent value="media" className="space-y-4">
          <Field label="Thumbnail URL">
            <Input value={values.script_thumbnail ?? ""} onChange={(e) => set("script_thumbnail", e.target.value)} />
          </Field>
          <Field label="Thumbnail (16:9) URL">
            <Input
              value={values.script_thumbnail_16_9 ?? ""}
              onChange={(e) => set("script_thumbnail_16_9", e.target.value)}
            />
          </Field>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4">
          <Field label="Category">
            <CategorySelect
              value={values.parent_category?.slug}
              onChange={(cat) => set("parent_category", cat)}
            />
          </Field>
          <Field label="Tags (comma separated)">
            <Input
              value={(values.tags ?? []).map((t) => t.name).join(", ")}
              onChange={(e) =>
                set(
                  "tags",
                  e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean)
                    .map((name) => ({ name, slug: name.toLowerCase().replace(/\s+/g, "-") }))
                )
              }
            />
          </Field>
        </TabsContent>

        <TabsContent value="video" className="space-y-4">
          <Field label="Article Type">
            <Select value={values.article_type} onValueChange={(v: string) => set("article_type", v)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="article">Article</SelectItem>
                <SelectItem value="video">Video</SelectItem>
              </SelectContent>
            </Select>
          </Field>
          {values.article_type === "video" && (
            <>
              <Field label="Video URL">
                <Input value={values.video_url ?? ""} onChange={(e) => set("video_url", e.target.value)} />
              </Field>
              <Field label="Orientation">
                <Select value={values.video_orientation} onValueChange={(v: string) => set("video_orientation", v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select orientation" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="landscape">Landscape</SelectItem>
                    <SelectItem value="portrait">Portrait</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </>
          )}
        </TabsContent>

        <TabsContent value="seo" className="space-y-4">
          <Field label="Meta Title">
            <Input value={values.meta_title ?? ""} onChange={(e) => set("meta_title", e.target.value)} />
          </Field>
          <Field label="Meta Description">
            <Textarea value={values.meta_description ?? ""} onChange={(e) => set("meta_description", e.target.value)} />
          </Field>
          <Field label="Meta Keywords">
            <Input value={values.meta_keywords ?? ""} onChange={(e) => set("meta_keywords", e.target.value)} />
          </Field>
        </TabsContent>

        <TabsContent value="social" className="space-y-4">
          <Field label="OG Title">
            <Input value={values.og_title ?? ""} onChange={(e) => set("og_title", e.target.value)} />
          </Field>
          <Field label="OG Description">
            <Textarea value={values.og_description ?? ""} onChange={(e) => set("og_description", e.target.value)} />
          </Field>
          <Field label="Social Headline">
            <Input value={values.social_headline ?? ""} onChange={(e) => set("social_headline", e.target.value)} />
          </Field>
          <Field label="Social Caption">
            <Input value={values.social_caption ?? ""} onChange={(e) => set("social_caption", e.target.value)} />
          </Field>
          <Field label="Social Image URL">
            <Input value={values.social_image ?? ""} onChange={(e) => set("social_image", e.target.value)} />
          </Field>
        </TabsContent>

        <TabsContent value="publishing" className="space-y-4">
          <ToggleField label="Published" checked={!!values.script_status} onChange={(v) => set("script_status", v)} />
          <ToggleField label="Show on Web" checked={!!values.show_on_web} onChange={(v) => set("show_on_web", v)} />
          <ToggleField label="Show on App" checked={!!values.show_on_app} onChange={(v) => set("show_on_app", v)} />
          <ToggleField
            label="Breaking News"
            checked={values.is_breaking === "true"}
            onChange={(v) => set("is_breaking", v ? "true" : "false")}
          />
          <ToggleField label="Trending" checked={!!values.is_trending} onChange={(v) => set("is_trending", v)} />
          {values.is_trending && (
            <Field label="Trending Order">
              <Input
                type="number"
                value={values.trending_order ?? ""}
                onChange={(e) => set("trending_order", Number(e.target.value))}
              />
            </Field>
          )}
        </TabsContent>

        <TabsContent value="advanced" className="space-y-4">
          <Field label="Language Code">
            <Input value={values.language_code ?? ""} onChange={(e) => set("language_code", e.target.value)} />
          </Field>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2 border-t pt-4">
        <Button variant="outline" onClick={() => router.push("/articles")}>
          Cancel
        </Button>
        <Button onClick={submit} disabled={saving}>
          {saving ? "Saving..." : values.id ? "Save Changes" : "Create Article"}
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

function ToggleField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <Label>{label}</Label>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  );
}
