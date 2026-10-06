import { EditUserClient } from "@/components/users/edit-user-client";

export default async function EditUserPage(props: PageProps<"/users/[id]/edit">) {
  const { id } = await props.params;
  return <EditUserClient id={id} />;
}
