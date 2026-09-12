import { PageRoute } from "@/renderer/page-route";

export default async function CustomSlugPage(props: PageProps<"/[slug]">) {
  const { slug } = await props.params;
  return <PageRoute pageSlug={slug} />;
}
