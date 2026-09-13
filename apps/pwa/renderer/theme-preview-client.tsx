"use client";

import { useEffect, useState } from "react";

import type { DesignTokens, NavItem, ResolvedSection } from "@cms-pwa/shared-types";

import { SectionRenderer } from "./section-renderer";
import { ThemeProvider } from "./theme-provider";

const READY_MESSAGE = "hook-cms:theme-preview-ready";
const TOKENS_MESSAGE = "hook-cms:theme-tokens";

export function ThemePreviewClient({
  sections,
  navigation,
  property,
}: {
  sections: ResolvedSection[];
  navigation?: { top: NavItem[]; bottom: NavItem[]; sidebar: NavItem[] };
  property?: { name: string; slug: string; logo?: string };
}) {
  const [tokens, setTokens] = useState<DesignTokens | undefined>(undefined);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.data?.type === TOKENS_MESSAGE && event.data.tokens) {
        setTokens(event.data.tokens as DesignTokens);
      }
    }
    window.addEventListener("message", onMessage);
    // Tell the parent (CMS) we're ready to receive live token updates —
    // a postMessage sent before this listener existed would otherwise be lost.
    window.parent?.postMessage({ type: READY_MESSAGE }, "*");
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return (
    <ThemeProvider tokens={tokens}>
      {sections.map((section) => (
        <SectionRenderer key={section.id} section={section} navigation={navigation} property={property} />
      ))}
    </ThemeProvider>
  );
}
