import { PageBuilderClient } from "@/components/page-builder/page-builder-client";

export default async function PageBuilderPage(props: PageProps<"/pages/[id]/builder">) {
  const { id } = await props.params;
  return <PageBuilderClient id={id} />;
}
