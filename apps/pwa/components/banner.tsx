import Link from "next/link";

import { containerDesignStyle, imageDesignStyle, imageLoadingAttr } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function Banner({ section }: PwaComponentProps) {
  const image = (section.props?.image as string) || "https://picsum.photos/seed/banner/1200/300";
  const link = (section.props?.link as string) || "#";
  const boxed = section.variant === "boxed";

  return (
    <section className={boxed ? "px-4 py-4" : ""} style={containerDesignStyle(section.resolved_design)}>
      <Link href={link} style={{ boxShadow: boxed ? "var(--shadow-md)" : undefined, display: "block", borderRadius: boxed ? "var(--radius-medium)" : 0 }}>
        <img
          src={image}
          alt={(section.props?.altText as string) ?? "Banner"}
          loading={imageLoadingAttr(section.resolved_design)}
          className="w-full object-cover"
          style={{ borderRadius: boxed ? "var(--radius-medium)" : 0, maxHeight: 220, ...imageDesignStyle(section.resolved_design) }}
        />
      </Link>
    </section>
  );
}
