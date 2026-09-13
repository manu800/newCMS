"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { StatusBadge } from "@/components/ui/status-badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import type { Page, Property, Theme } from "@cms-pwa/shared-types";

export default function PropertiesPage() {
  const { properties, refresh } = useProperty();
  const [themes, setThemes] = useState<Theme[]>([]);
  const [pages, setPages] = useState<Page[]>([]);
  const [editing, setEditing] = useState<Property | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<Property>>({});

  useEffect(() => {
    api.get<Theme[]>("/themes").then(setThemes).catch(() => {});
  }, []);

  useEffect(() => {
    if (editing) {
      api.get<Page[]>(`/pages?property_id=${editing.id}`).then(setPages).catch(() => {});
    }
  }, [editing]);

  const startEditing = (p: Property) => {
    setEditing(p);
    setForm(p);
  };

  const save = async () => {
    if (!editing) return;
    try {
      await api.put(`/properties/${editing.id}`, {
        name: form.name,
        logo: form.logo,
        host: form.host,
        active_theme_id: form.active_theme_id,
        active_home_page_id: form.active_home_page_id,
        theme_config: {
          mobile_theme_id: form.theme_config?.mobile_theme_id,
          desktop_theme_id: form.theme_config?.desktop_theme_id,
        },
        status: form.status,
      });
      toast.success("Property updated");
      setEditing(null);
      refresh();
    } catch {
      toast.error("Failed to update property");
    }
  };

  const createProperty = async (data: { name: string; slug: string }) => {
    try {
      await api.post("/properties", data);
      toast.success("Property created");
      setCreating(false);
      refresh();
    } catch {
      toast.error("Failed to create property");
    }
  };

  return (
    <div>
      <PageHeader
        title="Properties"
        description="Each property (brand/edition) has its own active theme and home page."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button>+ Create Property</Button>
            </DialogTrigger>
            <CreatePropertyDialog onCreate={createProperty} />
          </Dialog>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Active Theme</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {properties.map((p) => (
              <TableRow key={p.id}>
                <TableCell className="font-medium">{p.name}</TableCell>
                <TableCell className="text-muted-foreground">{p.slug}</TableCell>
                <TableCell>
                  {themes.find((t) => t.id === p.active_theme_id)?.name ?? (
                    <span className="text-muted-foreground">None</span>
                  )}
                </TableCell>
                <TableCell>
                  <StatusBadge status={p.status} />
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="outline" size="sm" onClick={() => startEditing(p)}>
                    Edit
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!editing} onOpenChange={(open: boolean) => !open && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit {editing?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input value={form.name ?? ""} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Host</Label>
              <Input value={form.host ?? ""} onChange={(e) => setForm({ ...form, host: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Active Theme</Label>
              <Select
                value={form.active_theme_id ?? undefined}
                onValueChange={(v: string) => setForm({ ...form, active_theme_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select theme" />
                </SelectTrigger>
                <SelectContent>
                  {themes.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Active Home Page</Label>
              <Select
                value={form.active_home_page_id ?? undefined}
                onValueChange={(v: string) => setForm({ ...form, active_home_page_id: v })}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select page" />
                </SelectTrigger>
                <SelectContent>
                  {pages.map((pg) => (
                    <SelectItem key={pg.id} value={pg.id}>
                      {pg.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 border-t pt-4">
              <h3 className="text-sm font-semibold">Theme Configuration</h3>
              <p className="text-xs text-muted-foreground">
                Mobile and desktop each render an independent theme. If unset, the PWA falls back to the
                Active Theme above.
              </p>

              <div className="space-y-2">
                <Label>
                  Mobile Theme
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    Current: {themes.find((t) => t.id === form.theme_config?.mobile_theme_id)?.name ?? "None"}
                  </span>
                </Label>
                <Select
                  value={form.theme_config?.mobile_theme_id ?? "none"}
                  onValueChange={(v: string) =>
                    setForm({
                      ...form,
                      theme_config: { ...form.theme_config, mobile_theme_id: v === "none" ? undefined : v },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select mobile theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (use Active Theme fallback)</SelectItem>
                    {themes
                      .filter((t) => t.device_type === "mobile")
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>
                  Desktop Theme
                  <span className="ml-1 text-xs font-normal text-muted-foreground">
                    Current: {themes.find((t) => t.id === form.theme_config?.desktop_theme_id)?.name ?? "None"}
                  </span>
                </Label>
                <Select
                  value={form.theme_config?.desktop_theme_id ?? "none"}
                  onValueChange={(v: string) =>
                    setForm({
                      ...form,
                      theme_config: { ...form.theme_config, desktop_theme_id: v === "none" ? undefined : v },
                    })
                  }
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select desktop theme" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (use Active Theme fallback)</SelectItem>
                    {themes
                      .filter((t) => t.device_type === "desktop")
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CreatePropertyDialog({ onCreate }: { onCreate: (data: { name: string; slug: string }) => void }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Create Property</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-"));
            }}
          />
        </div>
        <div className="space-y-2">
          <Label>Slug</Label>
          <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({ name, slug })} disabled={!name || !slug}>
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
