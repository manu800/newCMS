"use client";

import type { Tag } from "@cms-pwa/shared-types";

import { CategorySelect } from "@/components/articles/category-select";
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
import { Textarea } from "@/components/ui/textarea";
import { MediaPicker } from "@/components/shared/media-picker";
import { TagMultiSelect } from "@/components/shared/tag-multi-select";

/** Renders one form control from a field's declared type — shared by the
 * Page Builder's per-component properties panel and any other schema-driven
 * form (e.g. ArticleForm) that has a flat key/value bag of props. */
export function DynamicField({
  type,
  options,
  value,
  onChange,
  inputRef,
  disabled,
}: {
  type: string;
  options?: string[];
  value: unknown;
  onChange: (v: unknown) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
}) {
  switch (type) {
    case "textarea":
      return <Textarea value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "number":
      return <Input type="number" value={(value as number) ?? ""} onChange={(e) => onChange(Number(e.target.value))} />;
    case "boolean":
      return <Switch checked={!!value} onCheckedChange={onChange} />;
    case "color":
      return <Input type="color" value={(value as string) ?? "#000000"} onChange={(e) => onChange(e.target.value)} />;
    case "date":
      return <Input type="date" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "datetime":
      return <Input type="datetime-local" value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
    case "url":
      return (
        <Input
          ref={inputRef}
          type="url"
          placeholder="https://example.com"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
        />
      );
    case "image":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="https://example.com/image.jpg"
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
            />
            <MediaPicker type="image" value={value as string} onSelect={(asset) => onChange(asset.url)} />
          </div>
          {!!value && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value as string}
              alt="Preview"
              className="h-20 w-full rounded-md border object-cover"
              onError={(e) => {
                e.currentTarget.style.display = "none";
              }}
            />
          )}
        </div>
      );
    case "video":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="https://example.com/video.mp4"
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
            />
            <MediaPicker type="video" value={value as string} onSelect={(asset) => onChange(asset.url)} />
          </div>
          {!!value && (
            <video src={value as string} controls className="h-32 w-full rounded-md border bg-black object-contain" />
          )}
        </div>
      );
    case "audio":
      return (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Input
              ref={inputRef}
              placeholder="https://example.com/audio.mp3"
              value={(value as string) ?? ""}
              onChange={(e) => onChange(e.target.value)}
            />
            <MediaPicker type="audio" value={value as string} onSelect={(asset) => onChange(asset.url)} />
          </div>
          {!!value && <audio src={value as string} controls className="w-full" />}
        </div>
      );
    case "select":
      return (
        <Select value={value as string} onValueChange={onChange} disabled={disabled}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Select" />
          </SelectTrigger>
          <SelectContent>
            {(options ?? []).map((o) => (
              <SelectItem key={o} value={o}>
                {o}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    case "multiselect":
      return (
        <Input
          value={Array.isArray(value) ? value.join(", ") : ""}
          placeholder="comma, separated, values"
          onChange={(e) => onChange(e.target.value.split(",").map((s) => s.trim()).filter(Boolean))}
        />
      );
    case "category":
      return (
        <CategorySelect
          value={(value as { slug?: string } | undefined)?.slug}
          onChange={(cat) => onChange(cat)}
        />
      );
    case "tag":
      return (
        <TagMultiSelect
          value={Array.isArray(value) ? (value as { slug: string }[]).map((t) => t.slug) : []}
          onChange={() => {
            /* onChangeTags below carries the full {name, slug} shape this field stores */
          }}
          onChangeTags={(tags: Tag[]) => onChange(tags.map((t) => ({ name: t.name, slug: t.slug })))}
        />
      );
    default:
      return <Input ref={inputRef} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs capitalize">{label}</Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  );
}
