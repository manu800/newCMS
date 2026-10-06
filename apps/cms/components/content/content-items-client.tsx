"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import type { ContentItem, ContentModel } from "@cms-pwa/shared-types";

function displayValue(v: unknown): string {
  if (v == null || v === "") return "—";
  if (typeof v === "object") {
    const named = (v as { name?: string }).name;
    if (named) return named;
    if (Array.isArray(v)) return v.map((x) => (typeof x === "object" ? (x as { name?: string })?.name : x)).join(", ");
    return JSON.stringify(v);
  }
  return String(v);
}

export function ContentItemsClient({ contentType }: { contentType: string }) {
  const { current } = useProperty();
  const [model, setModel] = useState<ContentModel | null>(null);
  const [items, setItems] = useState<ContentItem[] | null>(null);

  const load = () => {
    if (!current) return;
    api
      .get<ContentModel>(`/content-models/active?property_id=${current.id}&content_type=${contentType}`)
      .then(setModel)
      .catch(() => toast.error("Failed to load content model"));
    api
      .get<ContentItem[]>(`/content-items?property_id=${current.id}&content_type=${contentType}`)
      .then(setItems)
      .catch(() => setItems([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id, contentType]);

  const visibleFields = (model?.fields ?? []).filter((f) => f.visible).sort((a, b) => a.order - b.order);
  const columns = visibleFields.slice(0, 3);

  const remove = async (item: ContentItem) => {
    if (!confirm("Delete this item? This can't be undone.")) return;
    try {
      await api.delete(`/content-items/${item.id}`);
      toast.success("Item deleted");
      load();
    } catch {
      toast.error("Failed to delete item");
    }
  };

  return (
    <div>
      <PageHeader
        title={model?.name ?? contentType}
        description={`Manage ${model?.name ?? contentType} items for this property.`}
        actions={
          <Button asChild disabled={!model || visibleFields.length === 0}>
            <Link href={`/articles/new?type=${contentType}`}>+ New {model?.name ?? "item"}</Link>
          </Button>
        }
      />

      <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
        {model && visibleFields.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            This model has no fields yet — add some on the Content Models page before creating items.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((c) => (
                  <TableHead key={c.key}>{c.label}</TableHead>
                ))}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items === null ? (
                <TableRow>
                  <TableCell colSpan={columns.length + 1}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={Math.max(columns.length, 1) + 1} className="text-center text-sm text-muted-foreground">
                    No items yet.
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id}>
                    {columns.map((c) => (
                      <TableCell key={c.key}>{displayValue(item.data[c.key])}</TableCell>
                    ))}
                    <TableCell className="space-x-2 text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/content/${contentType}/${item.id}/edit`}>Edit</Link>
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => remove(item)}>
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
