import { headers } from "next/headers";

import type { PwaConfigResponse, PwaPageResponse } from "@cms-pwa/shared-types";

const API_BASE_URL = process.env.NEXT_PUBLIC_PWA_API_BASE_URL || "http://localhost:8010/api";
export const PROPERTY_SLUG = process.env.NEXT_PUBLIC_PROPERTY_SLUG || "hook";

const MOBILE_UA_REGEX = /Mobi|Android|iPhone|iPad|iPod/i;

async function getDevice(): Promise<"mobile" | "desktop"> {
  const ua = (await headers()).get("user-agent") ?? "";
  return MOBILE_UA_REGEX.test(ua) ? "mobile" : "desktop";
}

async function fetchJson<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${API_BASE_URL}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function getPwaConfig() {
  const device = await getDevice();
  return fetchJson<PwaConfigResponse>(`/pwa/config/${PROPERTY_SLUG}?device=${device}`);
}

export async function getPwaPage(pageSlug: string) {
  const device = await getDevice();
  return fetchJson<PwaPageResponse>(`/pwa/page/${PROPERTY_SLUG}/${pageSlug}?device=${device}`);
}

export function getArticleBySlug(slug: string) {
  return fetchJson(`/articles/slug/${slug}`);
}

export interface PwaPreviewResponse {
  property: PwaConfigResponse["property"];
  theme: PwaConfigResponse["theme"];
  navigation: PwaConfigResponse["navigation"];
  page: PwaPageResponse["page"];
  sections: PwaPageResponse["sections"];
}

export function getPwaPreview(pageId: string, device: "mobile" | "desktop") {
  return fetchJson<PwaPreviewResponse>(`/pwa/preview/${pageId}?device=${device}`);
}
