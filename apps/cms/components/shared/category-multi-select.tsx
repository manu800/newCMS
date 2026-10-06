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
import type { Category } from "@cms-pwa/shared-types";

/** Multi-category picker backed by the CMS's real Category list (Content →
 * Categories) — used by the Page Builder's "category" data source so a
 * section can pull from one or more real categories instead of a free-typed
 * slug. Only top-level categories are offered, matching how article/video
 * category filtering matches on parent_category.slug. */
export function CategoryMultiSelect({
  value,
  onChange,
}: {
  value: string[];
  onChange: (slugs: string[]) => void;
}) {
  const { current } = useProperty();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!current) return;
    api
      .get<Category[]>(`/categories?property_id=${current.id}`)
      .then((all) => setCategories(all.filter((c) => !c.parent_id)))
      .catch(() => setCategories([]));
  }, [current?.id]);

  const available = categories.filter((c) => !value.includes(c.slug));

  const addCategory = (slug: string) => {
    if (!value.includes(slug)) onChange([...value, slug]);
  };

  const removeCategory = (slug: string) => onChange(value.filter((s) => s !== slug));

  const labelFor = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {value.map((slug) => (
          <Badge key={slug} variant="secondary" className="gap-1 pr-1">
            {labelFor(slug)}
            <button type="button" onClick={() => removeCategory(slug)} className="rounded-full hover:bg-foreground/10">
              <X className="h-3 w-3" />
            </button>
          </Badge>
        ))}
        {value.length === 0 && <span className="text-xs text-muted-foreground">No categories selected</span>}
      </div>
      {available.length > 0 ? (
        <Select value="" onValueChange={addCategory}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder="Add category" />
          </SelectTrigger>
          <SelectContent>
            {available.map((c) => (
              <SelectItem key={c.slug} value={c.slug}>
                {c.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        categories.length === 0 && (
          <p className="text-xs text-muted-foreground">No categories yet — create one on the Categories page first.</p>
        )
      )}
    </div>
  );
}
