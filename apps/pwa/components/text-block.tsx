import { containerDesignStyle, textDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function TextBlock({ section }: PwaComponentProps) {
  const heading = section.props?.heading as string | undefined;
  const body = section.props?.body as string | undefined;
  const alignment = (section.props?.alignment as string) || "left";
  const highlighted = section.variant === "highlighted";

  return (
    <section className="px-4 py-4">
      <div
        style={{
          ...(highlighted
            ? {
                textAlign: alignment as "left" | "center" | "right",
                backgroundColor: "var(--color-surface)",
                borderLeft: alignment === "left" ? "4px solid var(--color-primary)" : undefined,
                borderRadius: "var(--radius-medium)",
                boxShadow: "var(--shadow-sm)",
                padding: 20,
              }
            : { textAlign: alignment as "left" | "center" | "right" }),
          ...containerDesignStyle(section.resolved_design),
        }}
      >
        {heading && (
          <h3 className="mb-2 text-lg" style={{ fontWeight: "var(--font-heading-weight)", ...textDesignStyle(section.resolved_design) }}>
            {heading}
          </h3>
        )}
        {body && <p style={{ color: section.resolved_design?.text_color ?? "var(--color-muted)" }}>{body}</p>}
      </div>
    </section>
  );
}
