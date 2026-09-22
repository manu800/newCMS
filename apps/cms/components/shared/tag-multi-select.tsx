"use client";

import { X } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { Tag } from "@cms-pwa/shared-types";

/** Reusable multi-tag picker backed by the CMS's shared, managed Tag list
 * (Content → Tags) — used anywhere content needs tagging (Assets, Articles)
 * so the same tags stay consistent everywhere instead of free-typed text.
 * New tags are created on the Tags page, not inline here. */
export function TagMultiSelect({
  value,
  onChange,
  onChangeTags,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
  /** Optional: also receive the full resolved Tag objects (name + slug) for
   * callers that need more than just the slug, e.g. ArticleForm's legacy
   * {name, slug} tag shape. */
  onChangeTags?: (tags: Tag[]) => void;
}) {
  const { current } = useProperty();
  const [tags, setTags] = useState<Tag[]>([]);

  const load = () => {
    if (!current) return;
    api.get<Tag[]>(`/tags?property_id=${current.id}`).then(setTags).catch(() => setTags([]));
  };

  useEffect(load, [current?.id]);

  const available = tags.filter((t) => !value.includes(t.slug));

  const emit = (slugs: string[]) => {
    onChange(slugs);
    onChangeTags?.(slugs.map((s) => tags.find((t) => t.slug === s)).filter((t): t is Tag => !!t));
  };

  const addTag = (slug: string) => {
    if (!value.includes(slug)) emit([...value, slug]);
  };

  const removeTag = (slug: string) => emit(value.filter((s) => s !== slug));

  const labelFor = (slug: string) => tags.find((t) => t.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((slug) => (
          <Badge key={slug} variant="secondary" className="gap-1 pr-1">
            {labelFor(slug)}
            <button type="button" onClick={() => removeTag(slug)} className="rounded-full hover:bg-foreground/10">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
      </div>
      {available.length > 0 ? (
        <Select value="" onValueChange={addTag}>
          <SelectTrigger className="w-44">
            <SelectValue placeholder="Add existing tag" />
          </SelectTrigger>
          <SelectContent>
            {available.map((t) => (
              <SelectItem key={t.id} value={t.slug}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        tags.length === 0 && (
          <p className="text-xs text-muted-foreground">No tags yet — create one on the Tags page first.</p>
        )
      )}
    </div>
  );
}
