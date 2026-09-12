import { notFound } from "next/navigation";

import { getPwaPreview } from "@/lib/api";
import { PageRenderer } from "@/renderer/page-renderer";

export default async function PreviewPage(props: PageProps<"/preview/[pageId]">) {
  const { pageId } = await props.params;
  const searchParams = await props.searchParams;
  const device = searchParams.device === "mobile" ? "mobile" : "desktop";

  const preview = await getPwaPreview(pageId, device);
  if (!preview) notFound();

  return (
    <PageRenderer
      config={{ property: preview.property, theme: preview.theme, navigation: preview.navigation }}
      page={{ page: preview.page, sections: preview.sections }}
    />
  );
}
