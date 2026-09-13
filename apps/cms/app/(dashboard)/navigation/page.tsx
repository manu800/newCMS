"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { SortableNavList } from "@/components/navigation/sortable-nav-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProperty } from "@/hooks/use-property";
import { api } from "@/lib/api-client";
import { genId } from "@/lib/utils";
import type { Navigation, NavItem } from "@cms-pwa/shared-types";

const NAV_TYPES: { type: Navigation["type"]; label: string }[] = [
  { type: "top_navigation", label: "Top Navigation" },
  { type: "bottom_navigation", label: "Bottom Navigation" },
  { type: "sidebar", label: "Sidebar" },
];

export default function NavigationPage() {
  const { current } = useProperty();
  const [navs, setNavs] = useState<Navigation[] | null>(null);

  const load = () => {
    if (!current) return;
    api.get<Navigation[]>(`/navigation?property_id=${current.id}`).then(setNavs).catch(() => setNavs([]));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current?.id]);

  const updateItems = (navId: string, items: NavItem[]) => {
    setNavs((prev) => (prev ? prev.map((n) => (n.id === navId ? { ...n, items } : n)) : prev));
  };

  const addItem = (nav: Navigation) => {
    const id = genId("nav");
    updateItems(nav.id, [...nav.items, { id, label: "New Item", icon: "circle", url: "/", order: nav.items.length }]);
  };

  const save = async (nav: Navigation) => {
    try {
      await api.put(`/navigation/${nav.id}`, { items: nav.items });
      toast.success(`${nav.type.replace("_", " ")} saved`);
    } catch {
      toast.error("Failed to save navigation");
    }
  };

  const createNav = async (type: Navigation["type"]) => {
    if (!current) return;
    await api.post("/navigation", { property_id: current.id, type, items: [] });
    load();
  };

  return (
    <div>
      <PageHeader title="Navigation" description="Manage top, bottom, and sidebar navigation for the current property." />

      <div className="relative z-10">
      {navs === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <Tabs defaultValue="top_navigation">
          <div className="mb-4 w-fit rounded-lg bg-card p-1.5 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
            <TabsList>
              {NAV_TYPES.map((t) => (
                <TabsTrigger key={t.type} value={t.type}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
          {NAV_TYPES.map((t) => {
            const nav = navs.find((n) => n.type === t.type);
            return (
              <TabsContent key={t.type} value={t.type}>
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t.label}</CardTitle>
                    {nav ? (
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => addItem(nav)}>
                          + Add Item
                        </Button>
                        <Button size="sm" onClick={() => save(nav)}>
                          Save
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => createNav(t.type)}>
                        Create {t.label}
                      </Button>
                    )}
                  </CardHeader>
                  <CardContent>
                    {nav ? (
                      <SortableNavList items={nav.items} onItemsChange={(items) => updateItems(nav.id, items)} />
                    ) : (
                      <p className="text-sm text-muted-foreground">No {t.label.toLowerCase()} configured yet.</p>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            );
          })}
        </Tabs>
      )}
      </div>
    </div>
  );
}
