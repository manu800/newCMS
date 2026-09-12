import Link from "next/link";

import { containerDesignStyle, imageDesignStyle, imageLoadingAttr } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function ImageBlock({ section }: PwaComponentProps) {
  const image = (section.props?.image as string) || "https://picsum.photos/seed/imageblock/800/450";
  const link = (section.props?.link as string) || "#";
  const rounded = section.variant === "rounded";

  return (
    <section className="px-4 py-3" style={containerDesignStyle(section.resolved_design)}>
      <Link href={link}>
        <img
          src={image}
          alt={(section.props?.altText as string) ?? ""}
          loading={imageLoadingAttr(section.resolved_design)}
          className="w-full object-cover"
          style={{ borderRadius: rounded ? "var(--radius-large)" : "var(--radius-small)", ...imageDesignStyle(section.resolved_design) }}
        />
      </Link>
    </section>
  );
}
