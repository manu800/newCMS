"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { ThemePreview } from "@/components/themes/theme-preview";
import { VersionHistoryDialog } from "@/components/versions/version-history-dialog";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { api } from "@/lib/api-client";
import type { CmsComponent, Theme } from "@cms-pwa/shared-types";

const FONT_OPTIONS = ["Inter", "Georgia", "Helvetica", "Roboto", "Merriweather", "Poppins"];

export function ThemeEditorClient({ id }: { id: string }) {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [components, setComponents] = useState<CmsComponent[]>([]);
  const [saving, setSaving] = useState(false);

  const load = () => {
    api.get<Theme>(`/themes/${id}`).then(setTheme).catch(() => setTheme(null));
  };

  useEffect(() => {
    load();
    api.get<CmsComponent[]>("/components").then(setComponents).catch(() => {});
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (!theme) {
    return (
      <div>
        <PageHeader title="Theme" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  const update = (patch: Partial<Theme>) => setTheme((t) => (t ? { ...t, ...patch } : t));
  const updateTokens = <K extends keyof Theme["design_tokens"]>(
    section: K,
    patch: Partial<Theme["design_tokens"][K]>
  ) =>
    setTheme((t) =>
      t
        ? {
            ...t,
            design_tokens: {
              ...t.design_tokens,
              [section]: { ...t.design_tokens[section], ...patch },
            },
          }
        : t
    );
  const updateMapping = (type: string, variant: string) =>
    setTheme((t) => (t ? { ...t, component_mapping: { ...t.component_mapping, [type]: variant } } : t));

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/themes/${id}`, {
        name: theme.name,
        description: theme.description,
        device_type: theme.device_type ?? null,
        design_tokens: theme.design_tokens,
        component_mapping: theme.component_mapping,
      });
      toast.success("Theme saved");
      load();
    } catch {
      toast.error("Failed to save theme");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={theme.name}
        description={
          <span className="flex items-center gap-2">
            <StatusBadge status={theme.status} />
            <Link href="/themes" className="text-xs underline">
              Back to themes
            </Link>
          </span>
        }
        actions={
          <>
            <VersionHistoryDialog entityType="theme" entityId={id} onRestored={load} />
            <Button onClick={save} disabled={saving}>
              {saving ? "Saving..." : "Save"}
            </Button>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Tabs defaultValue="colors">
          <TabsList className="flex-wrap">
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="typography">Typography</TabsTrigger>
            <TabsTrigger value="spacing">Spacing</TabsTrigger>
            <TabsTrigger value="radius">Radius</TabsTrigger>
            <TabsTrigger value="shadows">Shadows</TabsTrigger>
            <TabsTrigger value="components">Components</TabsTrigger>
            <TabsTrigger value="navigation">Navigation</TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4">
            <Field label="Name">
              <Input value={theme.name} onChange={(e) => update({ name: e.target.value })} />
            </Field>
            <Field label="Description">
              <Textarea value={theme.description ?? ""} onChange={(e) => update({ description: e.target.value })} />
            </Field>
            <Field label="Device Type">
              <Select
                value={theme.device_type ?? "none"}
                onValueChange={(v: string) => update({ device_type: v === "none" ? undefined : (v as "mobile" | "desktop") })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (universal)</SelectItem>
                  <SelectItem value="mobile">Mobile</SelectItem>
                  <SelectItem value="desktop">Desktop</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Restricts this theme so only Mobile Theme / Desktop Theme pickers on the Properties screen can
                select it accordingly.
              </p>
            </Field>
          </TabsContent>

          <TabsContent value="colors" className="space-y-3">
            {Object.entries(theme.design_tokens.colors).map(([key, value]) => (
              <ColorField
                key={key}
                label={key}
                value={value}
                onChange={(v) => updateTokens("colors", { [key]: v })}
              />
            ))}
          </TabsContent>

          <TabsContent value="typography" className="space-y-4">
            <Field label="Font Family">
              <Select
                value={theme.design_tokens.typography.fontFamily}
                onValueChange={(v: string) => updateTokens("typography", { fontFamily: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONT_OPTIONS.map((f) => (
                    <SelectItem key={f} value={f}>
                      {f}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Heading Weight">
              <Input
                type="number"
                value={theme.design_tokens.typography.headingWeight}
                onChange={(e) => updateTokens("typography", { headingWeight: Number(e.target.value) })}
              />
            </Field>
            <Field label="Body Weight">
              <Input
                type="number"
                value={theme.design_tokens.typography.bodyWeight}
                onChange={(e) => updateTokens("typography", { bodyWeight: Number(e.target.value) })}
              />
            </Field>
          </TabsContent>

          <TabsContent value="spacing" className="space-y-3">
            {Object.entries(theme.design_tokens.spacing).map(([key, value]) => (
              <NumberField
                key={key}
                label={key}
                value={value}
                onChange={(v) => updateTokens("spacing", { [key]: v })}
              />
            ))}
          </TabsContent>

          <TabsContent value="radius" className="space-y-3">
            {Object.entries(theme.design_tokens.radius).map(([key, value]) => (
              <NumberField
                key={key}
                label={key}
                value={value}
                onChange={(v) => updateTokens("radius", { [key]: v })}
              />
            ))}
          </TabsContent>

          <TabsContent value="shadows" className="space-y-3">
            {Object.entries(theme.design_tokens.shadows).map(([key, value]) => (
              <Field key={key} label={key}>
                <div className="flex items-center gap-3">
                  <Input value={value} onChange={(e) => updateTokens("shadows", { [key]: e.target.value })} />
                  <div
                    className="h-10 w-14 shrink-0 rounded-md bg-white"
                    style={{ boxShadow: value }}
                    title={`Swatch preview for "${value}" — if this box shows no shadow, the value isn't valid CSS box-shadow syntax`}
                  />
                </div>
              </Field>
            ))}
          </TabsContent>

          <TabsContent value="components" className="space-y-3">
            {components.map((c) => (
              <Field key={c.type} label={c.name}>
                <Select
                  value={theme.component_mapping[c.type] ?? undefined}
                  onValueChange={(v: string) => updateMapping(c.type, v)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select variant" />
                  </SelectTrigger>
                  <SelectContent>
                    {c.variants.map((v) => (
                      <SelectItem key={v.slug} value={v.slug}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>
            ))}
          </TabsContent>

          <TabsContent value="navigation" className="space-y-3">
            <p className="text-sm text-muted-foreground">
              Bottom navigation variant: <strong>{theme.component_mapping.bottom_navigation ?? "default"}</strong>
            </p>
            <p className="text-sm text-muted-foreground">
              Manage navigation items (links, order) on the{" "}
              <Link href="/navigation" className="underline">
                Navigation
              </Link>{" "}
              screen.
            </p>
          </TabsContent>
        </Tabs>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-medium text-muted-foreground">Live Preview</h3>
            {theme.device_type && (
              <Badge variant="outline" className="capitalize">
                {theme.device_type} viewport
              </Badge>
            )}
          </div>
          <div className={theme.device_type === "mobile" ? "flex justify-center" : undefined}>
            <div
              className={
                theme.device_type === "mobile"
                  ? "w-[375px] overflow-hidden rounded-[2rem] border-4 border-neutral-800 shadow-lg"
                  : "w-full"
              }
            >
              <ThemePreview tokens={theme.design_tokens} componentMapping={theme.component_mapping} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-2">
      <Label className="capitalize">{label.replace(/_/g, " ")}</Label>
      {children}
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="w-28 shrink-0 capitalize">{label}</Label>
      <div className="flex flex-1 items-center gap-2">
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-9 w-9 shrink-0 cursor-pointer rounded border"
        />
        <Input value={value} onChange={(e) => onChange(e.target.value)} />
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <Label className="w-28 shrink-0 capitalize">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(Number(e.target.value))} className="flex-1" />
    </div>
  );
}
