"use client";

import { useEffect, useRef, useState } from "react";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { api } from "@/lib/api-client";
import type { DesignTokens, PwaTarget } from "@cms-pwa/shared-types";

const READY_MESSAGE = "hook-cms:theme-preview-ready";
const TOKENS_MESSAGE = "hook-cms:theme-tokens";
const STORAGE_KEY = "cms:themePreview:pwaTargetId";
const CUSTOM_ID = "__custom__";

export function usePwaTarget() {
  const [targets, setTargets] = useState<PwaTarget[]>([]);
  const [targetId, setTargetIdState] = useState<string>(CUSTOM_ID);
  const [customUrl, setCustomUrl] = useState("");

  useEffect(() => {
    api
      .get<PwaTarget[]>("/pwa-targets")
      .then((list) => {
        setTargets(list);
        let savedId: string | null = null;
        let savedCustom = "";
        try {
          savedId = localStorage.getItem(STORAGE_KEY);
          savedCustom = localStorage.getItem(STORAGE_KEY + ":customUrl") ?? "";
        } catch {
          // localStorage unavailable — fall back to defaults
        }
        setCustomUrl(savedCustom);
        if (savedId && (savedId === CUSTOM_ID || list.some((t) => t.id === savedId))) {
          setTargetIdState(savedId);
        } else {
          setTargetIdState(list.find((t) => t.is_default)?.id ?? list[0]?.id ?? CUSTOM_ID);
        }
      })
      .catch(() => setTargets([]));
  }, []);

  function setTargetId(next: string) {
    setTargetIdState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }

  function updateCustomUrl(next: string) {
    setCustomUrl(next);
    try {
      localStorage.setItem(STORAGE_KEY + ":customUrl", next);
    } catch {
      // ignore
    }
  }

  const baseUrl = targetId === CUSTOM_ID ? customUrl : targets.find((t) => t.id === targetId)?.url ?? "";

  return { targets, targetId, setTargetId, customUrl, setCustomUrl: updateCustomUrl, baseUrl };
}

export function PwaTargetSelect({
  targets,
  targetId,
  setTargetId,
  customUrl,
  setCustomUrl,
}: ReturnType<typeof usePwaTarget>) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">PWA:</span>
      <Select value={targetId} onValueChange={setTargetId}>
        <SelectTrigger className="h-8 w-40 text-xs">
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
          onChange={(e) => setCustomUrl(e.target.value)}
          placeholder="http://localhost:3003"
          className="h-8 w-40 rounded-md border px-2 text-xs"
        />
      )}
    </div>
  );
}

export function LiveThemePreview({
  tokens,
  deviceType,
  baseUrl,
}: {
  tokens: DesignTokens;
  deviceType?: "mobile" | "desktop";
  baseUrl: string;
}) {
  const [readySrc, setReadySrc] = useState<string | null>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const device = deviceType === "mobile" ? "mobile" : "desktop";
  const src = baseUrl ? `${baseUrl}/theme-preview?device=${device}` : "";
  // The handshake is only trusted for the src it was received for — when src
  // changes (switching target, editing the custom URL), this naturally goes
  // false again until the new document sends its own ready ping.
  const ready = !!src && readySrc === src;

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === READY_MESSAGE && event.source === iframeRef.current?.contentWindow) {
        setReadySrc(src);
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, [src]);

  useEffect(() => {
    if (!ready) return;
    iframeRef.current?.contentWindow?.postMessage({ type: TOKENS_MESSAGE, tokens }, "*");
  }, [ready, tokens]);

  if (!src) {
    return <p className="p-8 text-center text-sm text-muted-foreground">Select a PWA target above to preview.</p>;
  }

  return <iframe ref={iframeRef} src={src} title="Live theme preview" className="h-[600px] w-full border-0" />;
}
