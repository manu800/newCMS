import { ContentItemsClient } from "@/components/content/content-items-client";

export default async function ContentItemsPage(props: PageProps<"/content/[type]">) {
  const { type } = await props.params;
  return <ContentItemsClient contentType={type} />;
}
