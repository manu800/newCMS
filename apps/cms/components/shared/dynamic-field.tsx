"use client";

import { FileAudio, ImageIcon, Music, Video as VideoIcon, X } from "lucide-react";
import { useEffect, useState } from "react";

import type { Tag } from "@cms-pwa/shared-types";

import { CategorySelect } from "@/components/articles/category-select";
import { AuthorSelect } from "@/components/shared/author-select";
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
import { MediaDropzone } from "@/components/shared/media-dropzone";
import { MediaPicker } from "@/components/shared/media-picker";
import { TagMultiSelect } from "@/components/shared/tag-multi-select";
import { CardsField } from "@/components/shared/cards-field";
import { RichTextField } from "@/components/shared/rich-text-field";
import { SuggestionLinksField } from "@/components/shared/suggestion-links-field";
import { cn } from "@/lib/utils";

const MEDIA_META = {
  image: { icon: ImageIcon, label: "image", hint: "JPG, PNG, WEBP or GIF" },
  video: { icon: VideoIcon, label: "video", hint: "MP4, WEBM or MOV" },
  audio: { icon: FileAudio, label: "audio", hint: "MP3, WAV or M4A" },
} as const;

/** Shared chrome for image/video/audio fields — a bordered card with an
 * icon-labeled header, a proper empty-state dropzone look when nothing's
 * selected yet, and a quick clear (×) button once something is, instead of
 * a bare input + an unstyled preview. */
function MediaFieldShell({
  kind,
  value,
  onClear,
  inputRef,
  onChange,
  aspectRatio,
  suggestedName,
  children,
}: {
  kind: keyof typeof MEDIA_META;
  value: unknown;
  onClear: () => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  onChange: (v: string) => void;
  /** e.g. "864 / 1536" from the file's own decoded size — sizes the preview
   * card to match instead of a fixed-width box letterboxing the content. */
  aspectRatio?: string;
  /** Falls back to this (e.g. the article's headline) when the upload name
   * prompt is left blank. */
  suggestedName?: string;
  children: React.ReactNode;
}) {
  const meta = MEDIA_META[kind];

  return (
    <div className="space-y-2 rounded-lg border bg-card p-3 shadow-sm">
      <div className="flex items-center gap-2">
        <Input
          ref={inputRef}
          placeholder={`https://example.com/file.${kind === "image" ? "jpg" : kind === "video" ? "mp4" : "mp3"}`}
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="h-9"
        />
        <MediaPicker type={kind} value={value as string} onSelect={(asset) => onChange(asset.url)} suggestedName={suggestedName} />
      </div>

      {value ? (
        // The outer flex row lets the inner box shrink-wrap to the content's
        // aspect ratio (a plain block child would just stretch to 100% width
        // regardless of aspect-ratio, leaving a portrait file stranded in a
        // wide, mostly-empty card) — centered, capped so a huge file can't
        // take over the form.
        <div className="flex justify-center">
          <div
            className={cn(
              "group relative max-h-80 max-w-full overflow-hidden rounded-md border bg-muted",
              aspectRatio ? "h-80" : "w-full"
            )}
            style={aspectRatio ? { aspectRatio } : undefined}
          >
            {children}
            <button
              type="button"
              onClick={onClear}
              title={`Remove ${meta.label}`}
              className="absolute top-2 right-2 rounded-full bg-black/60 p-1.5 text-white opacity-0 transition-opacity hover:bg-black/80 group-hover:opacity-100"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      ) : (
        <MediaDropzone kind={kind} hint={meta.hint} onUploaded={(asset) => onChange(asset.url)} suggestedName={suggestedName} />
      )}
    </div>
  );
}

/** The uploaded file's actual pixel dimensions (read from the decoded
 * image/video itself, not a stored value), overlaid bottom-left on the
 * preview — handy for picking the right asset for a given aspect ratio. */
function DimensionsBadge({ w, h }: { w: number; h: number }) {
  return (
    <span className="absolute bottom-2 left-2 rounded-md bg-black/60 px-2 py-0.5 text-[11px] font-medium text-white">
      {w} × {h}
    </span>
  );
}

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
  orientationValue,
  onOrientationChange,
  suggestedName,
}: {
  type: string;
  options?: string[];
  value: unknown;
  onChange: (v: unknown) => void;
  inputRef?: React.RefObject<HTMLInputElement | null>;
  disabled?: boolean;
  /** Only used by "video" — pass both to show an inline Landscape/Portrait
   * toggle alongside the upload, instead of requiring a second field. */
  orientationValue?: string;
  onOrientationChange?: (v: string) => void;
  /** Only used by image/video/audio — falls back to this (e.g. the
   * article's headline) when the upload name prompt is left blank. */
  suggestedName?: string;
}) {
  // Only read by image/video — the file's actual decoded pixel size, used
  // both for the dimensions badge and to size the preview card to match
  // (instead of always filling the full width and letterboxing portrait
  // content inside a mostly-empty box).
  const [naturalSize, setNaturalSize] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    setNaturalSize(null);
  }, [value]);
  const aspectRatio = naturalSize ? `${naturalSize.w} / ${naturalSize.h}` : undefined;

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
        <MediaFieldShell
          kind="image"
          value={value}
          onChange={onChange}
          onClear={() => onChange("")}
          inputRef={inputRef}
          aspectRatio={aspectRatio}
          suggestedName={suggestedName}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={value as string}
            alt="Preview"
            className="h-full w-full object-cover"
            onLoad={(e) => setNaturalSize({ w: e.currentTarget.naturalWidth, h: e.currentTarget.naturalHeight })}
            onError={(e) => {
              e.currentTarget.style.display = "none";
            }}
          />
          {naturalSize && <DimensionsBadge w={naturalSize.w} h={naturalSize.h} />}
        </MediaFieldShell>
      );
    case "video":
      return (
        <MediaFieldShell
          kind="video"
          value={value}
          onChange={onChange}
          onClear={() => onChange("")}
          inputRef={inputRef}
          aspectRatio={aspectRatio}
          suggestedName={suggestedName}
        >
          <video
            src={value as string}
            controls
            className="h-full w-full bg-black object-cover"
            onLoadedMetadata={(e) => setNaturalSize({ w: e.currentTarget.videoWidth, h: e.currentTarget.videoHeight })}
          />
          {naturalSize && <DimensionsBadge w={naturalSize.w} h={naturalSize.h} />}
          {onOrientationChange && (
            <div className="flex items-center gap-2 border-t bg-card px-3 py-2">
              <span className="text-xs font-medium text-muted-foreground">Orientation</span>
              <div className="flex gap-1.5">
                {(["landscape", "portrait"] as const).map((o) => (
                  <button
                    key={o}
                    type="button"
                    onClick={() => onOrientationChange(o)}
                    className={cn(
                      "rounded-md border px-2.5 py-1 text-xs capitalize transition-colors",
                      (orientationValue ?? "landscape") === o
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-input hover:bg-muted"
                    )}
                  >
                    {o}
                  </button>
                ))}
              </div>
            </div>
          )}
        </MediaFieldShell>
      );
    case "audio":
      return (
        <MediaFieldShell
          kind="audio"
          value={value}
          onChange={onChange}
          onClear={() => onChange("")}
          inputRef={inputRef}
          suggestedName={suggestedName}
        >
          <div className="flex items-center gap-3 p-4">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Music className="h-5 w-5" />
            </div>
            <audio src={value as string} controls className="h-10 w-full" />
          </div>
        </MediaFieldShell>
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
    case "author":
      return (
        <AuthorSelect
          value={value as { id: string; name: string } | undefined}
          onChange={(author) => onChange(author)}
        />
      );
    case "richtext":
      return <RichTextField value={value} onChange={onChange} />;
    case "cards":
      return <CardsField value={value} onChange={onChange} />;
    case "suggestion_links":
      return <SuggestionLinksField value={value} onChange={onChange} />;
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
