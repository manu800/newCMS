import { notFound } from "next/navigation";

import { getPwaConfig, getPwaPage } from "@/lib/api";

import { PageRenderer } from "./page-renderer";

export async function PageRoute({ pageSlug }: { pageSlug: string }) {
  const [config, page] = await Promise.all([getPwaConfig(), getPwaPage(pageSlug)]);

  if (!config || !page) {
    notFound();
  }

  return <PageRenderer config={config} page={page} />;
}
