"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
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
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api-client";
import type { PwaTarget } from "@cms-pwa/shared-types";

export default function PwaTargetsPage() {
  const [targets, setTargets] = useState<PwaTarget[] | null>(null);
  const [editing, setEditing] = useState<PwaTarget | null>(null);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState<Partial<PwaTarget>>({});

  const load = () => {
    api.get<PwaTarget[]>("/pwa-targets").then(setTargets).catch(() => setTargets([]));
  };

  useEffect(load, []);

  const startEditing = (t: PwaTarget) => {
    setEditing(t);
    setForm(t);
  };

  const save = async () => {
    if (!editing) return;
    try {
      await api.put(`/pwa-targets/${editing.id}`, {
        name: form.name,
        url: form.url,
        notes: form.notes,
        is_default: form.is_default,
      });
      toast.success("PWA target updated");
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to update PWA target");
    }
  };

  const remove = async (t: PwaTarget) => {
    if (!confirm(`Delete "${t.name}"? This can't be undone.`)) return;
    try {
      await api.delete(`/pwa-targets/${t.id}`);
      toast.success("PWA target deleted");
      load();
    } catch {
      toast.error("Failed to delete PWA target");
    }
  };

  const createTarget = async (data: { name: string; url: string }) => {
    try {
      await api.post("/pwa-targets", data);
      toast.success("PWA target created");
      setCreating(false);
      load();
    } catch {
      toast.error("Failed to create PWA target");
    }
  };

  return (
    <div>
      <PageHeader
        title="PWA Targets"
        description="The PWA/app projects the Page Builder's Preview dialog can render draft pages against."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button>+ Add PWA Target</Button>
            </DialogTrigger>
            <CreateTargetDialog onCreate={createTarget} />
          </Dialog>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>URL</TableHead>
              <TableHead>Notes</TableHead>
              <TableHead>Default</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(targets ?? []).map((t) => (
              <TableRow key={t.id}>
                <TableCell className="font-medium">{t.name}</TableCell>
                <TableCell className="text-muted-foreground">{t.url}</TableCell>
                <TableCell className="max-w-64 truncate text-muted-foreground">{t.notes}</TableCell>
                <TableCell>
                  {t.is_default ? (
                    <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      Default
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => startEditing(t)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(t)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {targets?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                  No PWA targets yet — add one to enable the Preview dialog.
                </TableCell>
              </TableRow>
            )}
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
              <Label>Base URL</Label>
              <Input
                value={form.url ?? ""}
                onChange={(e) => setForm({ ...form, url: e.target.value })}
                placeholder="http://localhost:3001"
              />
            </div>
            <div className="space-y-2">
              <Label>Notes</Label>
              <Input value={form.notes ?? ""} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label>Default</Label>
                <p className="text-xs text-muted-foreground">Preselected in the Preview dialog.</p>
              </div>
              <Switch
                checked={!!form.is_default}
                onCheckedChange={(v: boolean) => setForm({ ...form, is_default: v })}
              />
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

function CreateTargetDialog({ onCreate }: { onCreate: (data: { name: string; url: string }) => void }) {
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  return (
    <DialogContent>
      <DialogHeader>
        <DialogTitle>Add PWA Target</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. hook-pwa-v2" />
        </div>
        <div className="space-y-2">
          <Label>Base URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="http://localhost:3001" />
        </div>
      </div>
      <DialogFooter>
        <Button onClick={() => onCreate({ name, url })} disabled={!name || !url}>
          Create
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}
