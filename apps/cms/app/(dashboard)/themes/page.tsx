"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
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
import type { Theme } from "@cms-pwa/shared-types";

export default function ThemesPage() {
  const { current, refresh: refreshProperties } = useProperty();
  const [themes, setThemes] = useState<Theme[] | null>(null);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [deviceType, setDeviceType] = useState<"none" | "mobile" | "desktop">("none");

  const load = () => api.get<Theme[]>("/themes").then(setThemes).catch(() => setThemes([]));

  useEffect(() => {
    load();
  }, []);

  const createTheme = async () => {
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    try {
      await api.post("/themes", { name, slug, device_type: deviceType === "none" ? undefined : deviceType });
      toast.success("Theme created");
      setCreating(false);
      setName("");
      setDeviceType("none");
      load();
    } catch {
      toast.error("Failed to create theme");
    }
  };

  const activate = async (theme: Theme) => {
    if (!current) return;
    try {
      await api.post(`/themes/${theme.id}/activate?property_id=${current.id}`);
      toast.success(`${theme.name} set as fallback theme for ${current.name}`);
      load();
      refreshProperties();
    } catch {
      toast.error("Failed to activate theme");
    }
  };

  return (
    <div>
      <PageHeader
        title="Themes"
        description={
          <>
            Design tokens and component mappings that drive the PWA&apos;s look. A theme tagged Mobile or
            Desktop is assigned per-device from the{" "}
            <Link href="/properties" className="underline">
              Properties
            </Link>{" "}
            screen — both can be in effect for {current?.name ?? "a property"} at the same time.
          </>
        }
        actions={
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button>+ Create Theme</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Theme</DialogTitle>
              </DialogHeader>
              <div className="space-y-2">
                <Label>Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Midnight" />
              </div>
              <div className="space-y-2">
                <Label>Device Type</Label>
                <Select value={deviceType} onValueChange={(v: string) => setDeviceType(v as "none" | "mobile" | "desktop")}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None (universal)</SelectItem>
                    <SelectItem value="mobile">Mobile</SelectItem>
                    <SelectItem value="desktop">Desktop</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <DialogFooter>
                <Button onClick={createTheme} disabled={!name}>
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      {themes === null ? (
        <Skeleton className="h-64 w-full" />
      ) : (
        <div className="relative z-10 rounded-lg border-0 bg-card shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Theme</TableHead>
                <TableHead>Role for {current?.name ?? "current property"}</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {themes.map((t) => (
                <TableRow key={t.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span
                        className="h-4 w-4 rounded-full border"
                        style={{ backgroundColor: t.design_tokens?.colors?.primary ?? "#e5e7eb" }}
                      />
                      <Link href={`/themes/${t.id}`} className="font-medium hover:underline">
                        {t.name}
                      </Link>
                      {t.device_type && (
                        <Badge variant="outline" className="capitalize">
                          {t.device_type}
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {(() => {
                      const isMobile = t.id === current?.theme_config?.mobile_theme_id;
                      const isDesktop = t.id === current?.theme_config?.desktop_theme_id;
                      const isFallback = t.id === current?.active_theme_id;
                      if (!isMobile && !isDesktop && !isFallback) {
                        return <Badge variant="secondary">Not in use</Badge>;
                      }
                      return (
                        <div className="flex flex-wrap gap-1">
                          {isMobile && <Badge>Mobile Theme</Badge>}
                          {isDesktop && <Badge>Desktop Theme</Badge>}
                          {isFallback && <Badge variant="outline">Fallback (Active Theme)</Badge>}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {t.id !== current?.active_theme_id && (
                        <Button variant="outline" size="sm" onClick={() => activate(t)}>
                          Set as Fallback
                        </Button>
                      )}
                      <Link href={`/themes/${t.id}`}>
                        <Button size="sm">Edit</Button>
                      </Link>
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
