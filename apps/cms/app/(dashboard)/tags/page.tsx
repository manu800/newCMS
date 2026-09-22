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
import type { Tag } from "@cms-pwa/shared-types";

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function TagsPage() {
  const { current } = useProperty();
  const [tags, setTags] = useState<Tag[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Tag | null>(null);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");

  const load = () => {
    if (!current) return;
    api.get<Tag[]>(`/tags?property_id=${current.id}`).then(setTags).catch(() => setTags([]));
  };

  useEffect(load, [current?.id]);

  const openCreate = () => {
    setName("");
    setSlug("");
    setCreating(true);
  };

  const startEditing = (tag: Tag) => {
    setName(tag.name);
    setSlug(tag.slug);
    setEditing(tag);
  };

  const create = async () => {
    if (!current || !name || !slug) return;
    try {
      await api.post("/tags", { name, slug, property_id: current.id });
      toast.success("Tag created");
      setCreating(false);
      load();
    } catch {
      toast.error("Failed to create tag — the slug may already exist");
    }
  };

  const save = async () => {
    if (!editing) return;
    try {
      await api.put(`/tags/${editing.id}`, { name, slug });
      toast.success("Tag updated");
      setEditing(null);
      load();
    } catch {
      toast.error("Failed to update tag");
    }
  };

  const remove = async (tag: Tag) => {
    if (!confirm(`Delete "${tag.name}"? Content already tagged with it keeps the tag as plain text.`)) return;
    try {
      await api.delete(`/tags/${tag.id}`);
      toast.success("Tag deleted");
      load();
    } catch {
      toast.error("Failed to delete tag");
    }
  };

  return (
    <div>
      <PageHeader
        title="Tags"
        description="The shared tag list used across Assets, Articles, and anywhere else content is tagged."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button onClick={openCreate}>+ New Tag</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>New Tag</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setSlug(slugify(e.target.value));
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Slug</Label>
                  <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={create} disabled={!name || !slug}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(tags ?? []).map((tag) => (
              <TableRow key={tag.id}>
                <TableCell className="font-medium">{tag.name}</TableCell>
                <TableCell className="text-muted-foreground">{tag.slug}</TableCell>
                <TableCell className="text-right space-x-2">
                  <Button variant="outline" size="sm" onClick={() => startEditing(tag)}>
                    Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => remove(tag)}>
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {tags?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-sm text-muted-foreground">
                  No tags yet — create one to start tagging content.
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
              <Input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
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
