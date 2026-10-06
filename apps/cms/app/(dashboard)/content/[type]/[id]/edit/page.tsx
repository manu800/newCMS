import { EditContentItemClient } from "@/components/content/edit-content-item-client";

export default async function EditContentItemPage(props: PageProps<"/content/[type]/[id]/edit">) {
  const { type, id } = await props.params;
  return <EditContentItemClient contentType={type} id={id} />;
}
