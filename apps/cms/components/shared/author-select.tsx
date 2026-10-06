"use client";

import { useEffect, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import type { User } from "@cms-pwa/shared-types";

/** Single-select picker over Users flagged `is_author` — the counterpart to
 * CategorySelect/TagMultiSelect for an `author` field. Users aren't scoped
 * to a property, so this fetches the same list regardless of which
 * property's content is being edited. */
export function AuthorSelect({
  value,
  onChange,
}: {
  value?: { id: string; name: string };
  onChange: (author: { id: string; name: string }) => void;
}) {
  const [authors, setAuthors] = useState<User[]>([]);

  useEffect(() => {
    api
      .get<User[]>("/users?is_author=true")
      .then(setAuthors)
      .catch(() => setAuthors([]));
  }, []);

  return (
    <Select
      value={value?.id}
      onValueChange={(id: string) => {
        const author = authors.find((a) => a.id === id);
        if (author) onChange({ id: author.id, name: author.name });
      }}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder={authors.length === 0 ? "No authors yet" : "Select author"} />
      </SelectTrigger>
      <SelectContent>
        {authors.map((a) => (
          <SelectItem key={a.id} value={a.id}>
            {a.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
