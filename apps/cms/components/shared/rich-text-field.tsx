"use client";

import { Editor as TinyMceEditor } from "@tinymce/tinymce-react";
import type { ComponentType } from "react";

// The monorepo's hoisted node_modules resolves this package's own "react"
// type import to a different (structurally identical) copy than the app's,
// which TS treats as a nominal mismatch on the class's React.Component base
// — a types-only quirk, not a runtime one, so it's cast away here.
const Editor = TinyMceEditor as unknown as ComponentType<Record<string, unknown>>;

/** A WYSIWYG rich-text editor for "richtext" fields — self-hosted (assets
 * copied from node_modules/tinymce into public/tinymce by
 * scripts/copy-tinymce.js) so it needs no cloud API key and shows no
 * "domain not registered" nag. */
export function RichTextField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: string) => void;
}) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      licenseKey="gpl"
      value={(value as string) ?? ""}
      onEditorChange={(content: string) => onChange(content)}
      init={{
        height: 360,
        menubar: false,
        plugins: ["link", "lists", "image", "table", "code", "autolink", "wordcount"],
        toolbar:
          "undo redo | blocks | bold italic underline | bullist numlist | link image table | code | removeformat",
        content_style: "body { font-family: sans-serif; font-size: 14px; }",
        branding: false,
      }}
    />
  );
}
