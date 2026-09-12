import { containerDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function AdBlock({ section }: PwaComponentProps) {
  const size = (section.props?.size as string) || "300x250";
  const [w, h] = size.split("x").map(Number);

  return (
    <div className="flex justify-center px-4 py-4">
      <div
        className="flex items-center justify-center text-xs"
        style={{
          width: w || 300,
          height: h || 250,
          maxWidth: "100%",
          backgroundColor: "var(--color-surface)",
          color: "var(--color-muted)",
          border: "1px dashed var(--color-muted)",
          ...containerDesignStyle(section.resolved_design),
        }}
      >
        Advertisement {section.props?.adSlotId ? `(${section.props.adSlotId})` : ""}
      </div>
    </div>
  );
}
