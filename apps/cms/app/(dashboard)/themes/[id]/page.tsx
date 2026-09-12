import { ThemeEditorClient } from "@/components/themes/theme-editor-client";

export default async function ThemeEditorPage(props: PageProps<"/themes/[id]">) {
  const { id } = await props.params;
  return <ThemeEditorClient id={id} />;
}
