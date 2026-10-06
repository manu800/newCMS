"use client";

import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { DATA_SOURCE_LABELS } from "@cms-pwa/component-schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { ContentModel } from "@cms-pwa/shared-types";

const BASE_TYPES = ["latest", "trending", "breaking", "category", "tag", "manual", "search", "authors"];

// const BASE_TYPES = ["trending"];

interface TypeOption {
  key: string;
  label: string;
  custom?: boolean;
  field?: string;
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^_|_$)/g, "");
}

/** Lets an admin curate which Source Type options show up in the Page
 * Builder's Data Source picker — everything is shown until configured here
 * (same "empty means default" convention as the sidebar order setting) —
 * plus add brand-new custom ones beyond the built-ins and Content Models.
 * A custom entry resolves the same way an unrecognized type always has:
 * the Page Builder treats its key as a content_type and pulls matching
 * Content Items, so it's only useful once something is actually tagged
 * with that content_type. */
export function SourceTypesEditor() {
  const { current } = useProperty();
  const [builtins, setBuiltins] = useState<TypeOption[] | null>(null);
  const [custom, setCustom] = useState<TypeOption[]>([]);
  const [enabled, setEnabled] = useState<Set<string> | null>(null);
  const [newLabel, setNewLabel] = useState("");
  const [newField, setNewField] = useState("");

  useEffect(() => {
    if (!current) return;
    Promise.all([
      api.get<ContentModel[]>(`/content-models?property_id=${current.id}`).catch(() => []),
      api
        .get<{ enabled: string[]; custom: { key: string; label: string; field?: string }[] }>("/settings/source-types")
        .catch(() => ({ enabled: [] as string[], custom: [] as { key: string; label: string; field?: string }[] })),
    ]).then(([models, saved]) => {
      const base: TypeOption[] = [
        ...BASE_TYPES.map((key) => ({ key, label: DATA_SOURCE_LABELS[key] ?? key })),
        ...models.filter((m) => m.content_type !== "article").map((m) => ({ key: m.content_type, label: m.name })),
      ];
      const customOptions: TypeOption[] = (saved.custom ?? []).map((c) => ({ ...c, custom: true }));
      setBuiltins(base);
      setCustom(customOptions);
      const all = [...base, ...customOptions];
      setEnabled(new Set(saved.enabled.length > 0 ? saved.enabled : all.map((o) => o.key)));
    });
  }, [current?.id]);

  const persist = async (nextEnabled: Set<string>, nextCustom: TypeOption[]) => {
    setEnabled(nextEnabled);
    setCustom(nextCustom);
    try {
      await api.put("/settings/source-types", {
        enabled: Array.from(nextEnabled),
        custom: nextCustom.map(({ key, label, field }) => ({ key, label, field })),
      });
    } catch {
      toast.error("Failed to save Source Type settings");
    }
  };

  const toggle = (key: string, on: boolean) => {
    if (!enabled) return;
    const next = new Set(enabled);
    if (on) next.add(key);
    else next.delete(key);
    persist(next, custom);
  };

  const addCustom = () => {
    const label = newLabel.trim();
    if (!label || !enabled || !builtins) return;
    const key = slugify(label);
    if (!key) return;
    const allKeys = new Set([...builtins.map((o) => o.key), ...custom.map((o) => o.key)]);
    if (allKeys.has(key)) {
      toast.error("A source type with that name already exists");
      return;
    }
    const field = slugify(newField) || undefined;
    const nextCustom = [...custom, { key, label, custom: true, field }];
    const nextEnabled = new Set(enabled);
    nextEnabled.add(key);
    setNewLabel("");
    setNewField("");
    persist(nextEnabled, nextCustom);
  };

  const removeCustom = (key: string) => {
    if (!enabled) return;
    const nextCustom = custom.filter((o) => o.key !== key);
    const nextEnabled = new Set(enabled);
    nextEnabled.delete(key);
    persist(nextEnabled, nextCustom);
  };

  if (!builtins || !enabled) return null;

  const options = [...builtins, ...custom];

  return (
    <div className="rounded-lg border-0 bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
      <h3 className="mb-1 text-sm font-semibold">Source types</h3>
      <p className="mb-3 text-xs text-muted-foreground">
        Choose which Source Type options show up in the Page Builder&apos;s Data Source picker, or add your own.
      </p>
      <div className="space-y-1.5">
        {options.map((o) => (
          <div key={o.key} className="flex items-center justify-between rounded-md border bg-card px-2.5 py-2 text-sm">
            <span className="truncate">
              {o.label}
              {o.field && <span className="ml-1.5 text-xs text-muted-foreground">by {o.field}</span>}
            </span>
            <div className="flex items-center gap-2">
              <Switch checked={enabled.has(o.key)} onCheckedChange={(v: boolean) => toggle(o.key, v)} />
              {o.custom && (
                <button
                  type="button"
                  onClick={() => removeCustom(o.key)}
                  title="Delete this custom source type"
                  className="text-muted-foreground transition-colors hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="mt-3 space-y-1.5">
        <div className="flex items-center gap-2">
          <Input
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="New source type name…"
            className="h-8 text-xs"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustom();
              }
            }}
          />
          <Button type="button" size="sm" variant="outline" className="h-8 shrink-0" onClick={addCustom}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Add
          </Button>
        </div>
        <Input
          value={newField}
          onChange={(e) => setNewField(e.target.value)}
          placeholder="Field name (optional) — e.g. author, to group by that field across content types"
          className="h-8 text-xs"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addCustom();
            }
          }}
        />
      </div>
    </div>
  );
}
