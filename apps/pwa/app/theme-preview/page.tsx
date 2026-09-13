import { notFound } from "next/navigation";

import { getPwaPreview } from "@/lib/api";
import { ThemePreviewClient } from "@/renderer/theme-preview-client";

// A real, existing content page used purely as a fixture — it already exercises
// nearly every component type, so it doubles as a representative theme preview.
const DEFAULT_DEMO_PAGE_ID = "6aa3e025a93e7bb82fe18227";

export default async function ThemePreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ pageId?: string; device?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const pageId = resolvedSearchParams.pageId ?? DEFAULT_DEMO_PAGE_ID;
  const device = resolvedSearchParams.device === "mobile" ? "mobile" : "desktop";

  const preview = await getPwaPreview(pageId, device);
  if (!preview) notFound();

  return <ThemePreviewClient sections={preview.sections} navigation={preview.navigation} property={preview.property} />;
}
