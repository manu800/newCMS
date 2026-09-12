import { EditArticleClient } from "@/components/articles/edit-article-client";

export default async function EditArticlePage(props: PageProps<"/articles/[id]/edit">) {
  const { id } = await props.params;
  return <EditArticleClient id={id} />;
}
