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

/** Single-select folder picker for Assets — options come from the distinct
 * folder names already in use for this property (always includes "uploads").
 * No inline "create new folder" option — folders can only be picked from
 * what already exists. */
export function FolderSelect({ value, onChange }: { value: string; onChange: (folder: string) => void }) {
  const { current } = useProperty();
  const [folders, setFolders] = useState<string[]>(["uploads"]);

  useEffect(() => {
    if (!current) return;
    api
      .get<string[]>(`/assets/folders?property_id=${current.id}`)
      .then(setFolders)
      .catch(() => setFolders(["uploads"]));
  }, [current?.id]);

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select folder" />
      </SelectTrigger>
      <SelectContent>
        {folders.map((f) => (
          <SelectItem key={f} value={f}>
            {f}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
