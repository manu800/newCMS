import Link from "next/link";

import { containerDesignStyle, textDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function CategoryBlock({ section }: PwaComponentProps) {
  const name = (section.props?.displayName as string) || section.title || "Category";
  const isCard = section.variant === "card";

  if (isCard) {
    return (
      <div className="px-4 py-2">
        <Link
          href={section.data_source?.category_slug ? `/category/${section.data_source.category_slug}` : "#"}
          className="flex items-center justify-between px-5 py-4"
          style={{
            backgroundColor: "var(--color-surface)",
            color: "var(--color-text)",
            borderRadius: "var(--radius-medium)",
            boxShadow: "var(--shadow-md)",
            borderLeft: "4px solid var(--color-primary)",
            ...containerDesignStyle(section.resolved_design),
          }}
        >
          <span className="text-base" style={{ fontWeight: "var(--font-heading-weight)", ...textDesignStyle(section.resolved_design) }}>
            {name}
          </span>
          <span className="text-xs" style={{ color: "var(--color-primary)" }}>
            Browse →
          </span>
        </Link>
      </div>
    );
  }

  return (
    <Link
      href={section.data_source?.category_slug ? `/category/${section.data_source.category_slug}` : "#"}
      className="mx-4 inline-block px-3 py-1 text-xs"
      style={{
        backgroundColor: "var(--color-primary)",
        color: "#fff",
        borderRadius: "var(--radius-large)",
      }}
    >
      {name}
    </Link>
  );
}
