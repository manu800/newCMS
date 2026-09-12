"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const CATEGORIES = [
  { name: "Politics", slug: "politics" },
  { name: "Sports", slug: "sports" },
  { name: "Entertainment", slug: "entertainment" },
  { name: "Technology", slug: "technology" },
  { name: "Lifestyle", slug: "lifestyle" },
  { name: "Videos", slug: "videos" },
];

export function CategorySelect({
  value,
  onChange,
}: {
  value?: string;
  onChange: (category: { name: string; slug: string }) => void;
}) {
  return (
    <Select
      value={value}
      onValueChange={(slug: string) => {
        const cat = CATEGORIES.find((c) => c.slug === slug);
        if (cat) onChange(cat);
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select category" />
      </SelectTrigger>
      <SelectContent>
        {CATEGORIES.map((c) => (
          <SelectItem key={c.slug} value={c.slug}>
            {c.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
