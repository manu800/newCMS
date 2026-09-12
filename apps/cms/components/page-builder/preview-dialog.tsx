"use client";

import { Laptop, Smartphone, Tablet } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import type { PwaTarget } from "@cms-pwa/shared-types";

const FRAME_HEIGHT = 1400;
const STORAGE_KEY = "cms:preview:pwaTargetId";
const CUSTOM_URL_KEY = "cms:preview:pwaCustomUrl";
const CUSTOM_ID = "__custom__";

const VIEWPORTS = {
  mobile: { label: "Mobile", icon: Smartphone, width: 390, device: "mobile" as const },
  tablet: { label: "Tablet", icon: Tablet, width: 834, device: "mobile" as const },
  desktop: { label: "Desktop", icon: Laptop, width: 1280, device: "desktop" as const },
};

type ViewportKey = keyof typeof VIEWPORTS;

export function PreviewDialog({
  pageId,
  open,
  onOpenChange,
}: {
  pageId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [viewport, setViewport] = useState<ViewportKey>("mobile");
  const [reloadKey, setReloadKey] = useState(0);
  const [containerWidth, setContainerWidth] = useState(0);
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);
  const [targets, setTargets] = useState<PwaTarget[]>([]);
  const [targetId, setTargetId] = useState<string>(CUSTOM_ID);
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    if (!open) return;
    api
      .get<PwaTarget[]>("/pwa-targets")
      .then((list) => {
        setTargets(list);
        let savedId: string | null = null;
        let savedCustom = "";
        try {
          savedId = localStorage.getItem(STORAGE_KEY);
          savedCustom = localStorage.getItem(CUSTOM_URL_KEY) ?? "";
        } catch {
          // localStorage unavailable — fall back to defaults
        }
        setCustomUrl(savedCustom);
        if (savedId && (savedId === CUSTOM_ID || list.some((t) => t.id === savedId))) {
          setTargetId(savedId);
        } else {
          setTargetId(list.find((t) => t.is_default)?.id ?? list[0]?.id ?? CUSTOM_ID);
        }
      })
      .catch(() => setTargets([]));
  }, [open]);

  function selectTarget(next: string) {
    setTargetId(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  const active = VIEWPORTS[viewport];
  const baseUrl = targetId === CUSTOM_ID ? customUrl : targets.find((t) => t.id === targetId)?.url ?? "";
  const src = baseUrl ? `${baseUrl}/preview/${pageId}?device=${active.device}` : "";

  useEffect(() => {
    if (!containerEl) return;
    const observer = new ResizeObserver((entries) => {
      setContainerWidth(entries[0].contentRect.width);
    });
    observer.observe(containerEl);
    return () => observer.disconnect();
  }, [containerEl]);

  const scale = containerWidth > 0 ? Math.min(1, containerWidth / active.width) : 1;

  return (
    <Dialog
      open={open}
      onOpenChange={(next: boolean) => {
        if (next) setReloadKey((k) => k + 1);
        onOpenChange(next);
      }}
    >
      <DialogContent className="flex max-h-[90vh] w-[95vw] !max-w-5xl flex-col">
        <DialogHeader>
          <DialogTitle>Preview (draft sections)</DialogTitle>
        </DialogHeader>

        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <div className="flex items-center gap-1">
            {(Object.keys(VIEWPORTS) as ViewportKey[]).map((key) => {
              const v = VIEWPORTS[key];
              const Icon = v.icon;
              return (
                <Button
                  key={key}
                  type="button"
                  size="sm"
                  variant={viewport === key ? "default" : "ghost"}
                  onClick={() => setViewport(key)}
                  className="gap-1.5"
                >
                  <Icon className="size-4" />
                  {v.label}
                  <span className="text-xs opacity-60">{v.width}px</span>
                </Button>
              );
            })}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">PWA:</span>
            <Select value={targetId} onValueChange={selectTarget}>
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {targets.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_ID}>Custom URL…</SelectItem>
              </SelectContent>
            </Select>
            {targetId === CUSTOM_ID && (
              <input
                value={customUrl}
                onChange={(e) => {
                  setCustomUrl(e.target.value);
                  try {
                    localStorage.setItem(CUSTOM_URL_KEY, e.target.value);
                  } catch {
                    // ignore
                  }
                }}
                placeholder="http://localhost:3003"
                className="h-8 w-44 rounded-md border px-2 text-xs"
              />
            )}
          </div>
        </div>

        <div
          ref={setContainerEl}
          className="flex flex-1 items-start justify-center overflow-auto rounded-md bg-muted/40 p-4"
        >
          {!src ? (
            <p className="pt-10 text-sm text-muted-foreground">
              {targets.length === 0 && targetId !== CUSTOM_ID
                ? "No PWA targets configured yet — add one under Configuration → PWA Targets, or pick Custom URL."
                : "Enter a PWA URL above to preview."}
            </p>
          ) : (
            <div
              className="shrink-0 overflow-hidden rounded-lg border bg-background shadow-sm transition-[width] duration-200"
              style={{ width: active.width * scale, height: FRAME_HEIGHT * scale }}
            >
              <iframe
                key={`${reloadKey}-${targetId}`}
                src={src}
                title="Page preview"
                className="origin-top-left border-0"
                style={{
                  width: active.width,
                  height: FRAME_HEIGHT,
                  transform: `scale(${scale})`,
                }}
              />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
