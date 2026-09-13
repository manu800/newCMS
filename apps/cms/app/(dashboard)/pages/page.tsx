"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
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
import type { Page } from "@cms-pwa/shared-types";

const PAGE_TYPES = ["home", "category", "article", "search", "video", "custom"];

export default function PagesPage() {
  const { current } = useProperty();
  const [pages, setPages] = useState<Page[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [type, setType] = useState("custom");

  const load = () => {
    if (!current) return;
    api.get<Page[]>(`/pages?property_id=${current.id}`).then(setPages).catch(() => setPages([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const createPage = async () => {
    if (!current) return;
    try {
      await api.post("/pages", { name, slug, type, property_id: current.id, sections: [] });
      toast.success("Page created");
      setCreating(false);
      setName("");
      setSlug("");
      load();
    } catch {
      toast.error("Failed to create page");
    }
  };

  const publish = async (page: Page) => {
    try {
      await api.post(`/pages/${page.id}/publish`);
      toast.success(`${page.name} published`);
      load();
    } catch {
      toast.error("Failed to publish page");
    }
  };

  const duplicate = async (page: Page) => {
    try {
      await api.post(`/pages/${page.id}/duplicate`);
      toast.success("Page duplicated");
      load();
    } catch {
      toast.error("Failed to duplicate page");
    }
  };

  const remove = async (page: Page) => {
    try {
      await api.delete(`/pages/${page.id}`);
      toast.success("Page deleted");
      load();
    } catch {
      toast.error("Failed to delete page");
    }
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Build and publish pages for the current property."
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button>+ New Page</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Page</DialogTitle>
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
                <div className="space-y-2">
                  <Label>Type</Label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAGE_TYPES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button onClick={createPage} disabled={!name || !slug}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {pages === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Slug</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pages.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <Link href={`/pages/${p.id}/builder`} className="font-medium hover:underline">
                      {p.name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">/{p.slug}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{p.type}</Badge>
                  </TableCell>
                  <TableCell>
                    <StatusBadge status={p.status} />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/pages/${p.id}/builder`}>
                        <Button variant="outline" size="sm">
                          Edit
                        </Button>
                      </Link>
                      <Button size="sm" onClick={() => publish(p)}>
                        Publish
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => duplicate(p)}>
                        Duplicate
                      </Button>
                      <Button variant="destructive" size="sm" onClick={() => remove(p)}>
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
