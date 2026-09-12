"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { VersionHistoryDialog } from "@/components/versions/version-history-dialog";
import { api } from "@/lib/api-client";
import type { CmsComponent } from "@cms-pwa/shared-types";

export default function ComponentsPage() {
  const [components, setComponents] = useState<CmsComponent[] | null>(null);
  const [selected, setSelected] = useState<CmsComponent | null>(null);

  const load = () => api.get<CmsComponent[]>("/components").then(setComponents).catch(() => setComponents([]));

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (c: CmsComponent) => {
    try {
      await api.put(`/components/${c.id}`, { status: c.status === "active" ? "inactive" : "active" });
      toast.success("Component updated");
      load();
    } catch {
      toast.error("Failed to update component");
    }
  };

  return (
    <div>
      <PageHeader
        title="Components"
        description="Component types and their variants. Field schemas power the Page Builder's property panel."
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {components === null
          ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          : components.map((c) => (
              <Card key={c.id} className="cursor-pointer hover:border-primary" onClick={() => setSelected(c)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-base">{c.name}</CardTitle>
                  <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-xs text-muted-foreground">type: {c.type}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {c.variants.map((v) => (
                      <Badge key={v.slug} variant="outline" className="text-xs">
                        {v.name}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
      </div>

      <Sheet open={!!selected} onOpenChange={(open: boolean) => !open && setSelected(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle className="flex items-center justify-between gap-2">
              {selected?.name}
              {selected && <VersionHistoryDialog entityType="component" entityId={selected.id} onRestored={load} />}
            </SheetTitle>
          </SheetHeader>
          <div className="space-y-6 px-4">
            <div>
              <h3 className="mb-2 text-sm font-medium">Variants</h3>
              <div className="flex flex-wrap gap-1">
                {selected?.variants.map((v) => (
                  <Badge key={v.slug} variant="outline">
                    {v.name}
                  </Badge>
                ))}
              </div>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium">Fields</h3>
              <div className="space-y-2">
                {selected?.fields.map((f) => (
                  <div key={f.name} className="rounded-md border p-2 text-sm">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{f.label}</span>
                      <Badge variant="secondary" className="text-xs">
                        {f.type}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">name: {f.name}</p>
                  </div>
                ))}
                {selected?.fields.length === 0 && (
                  <p className="text-sm text-muted-foreground">No configurable fields.</p>
                )}
              </div>
            </div>
            {selected && (
              <Button variant="outline" onClick={() => toggleStatus(selected)}>
                {selected.status === "active" ? "Deactivate" : "Activate"}
              </Button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
