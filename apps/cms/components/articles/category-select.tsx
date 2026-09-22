"use client";

import { useEffect, useState } from "react";

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

function useCategories() {
  const { current } = useProperty();
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    if (!current) return;
    api.get<Category[]>(`/categories?property_id=${current.id}`).then(setCategories).catch(() => setCategories([]));
  }, [current]);

  return categories;
}

export function CategorySelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (category: { name: string; slug: string }) => void;
}) {
  const categories = useCategories();
  const parents = categories.filter((c) => !c.parent_id);

  return (
    <Select
      value={value}
      onValueChange={(slug: string) => {
        const cat = parents.find((c) => c.slug === slug);
        if (cat) onChange({ name: cat.name, slug: cat.slug });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={parents.length === 0 ? "No categories yet" : "Select category"} />
      </SelectTrigger>
      <SelectContent>
        {parents.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function SubcategorySelect({
  parentSlug,
  value,
  onChange,
}: {
  parentSlug?: string;
  value?: string;
  onChange: (category: { name: string; slug: string }) => void;
}) {
  const categories = useCategories();
  const parent = categories.find((c) => c.slug === parentSlug && !c.parent_id);
  const children = parent ? categories.filter((c) => c.parent_id === parent.id) : [];

  return (
    <Select
      value={value}
      onValueChange={(slug: string) => {
        const cat = children.find((c) => c.slug === slug);
        if (cat) onChange({ name: cat.name, slug: cat.slug });
      }}
      disabled={!parent || children.length === 0}
    >
      <SelectTrigger className="w-full">
        <SelectValue
          placeholder={!parent ? "Select a category first" : children.length === 0 ? "No subcategories" : "Select subcategory"}
        />
      </SelectTrigger>
      <SelectContent>
        {children.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
