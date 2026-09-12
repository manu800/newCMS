import Link from "next/link";

import { containerDesignStyle, textDesignStyle } from "@/lib/design-style";

import { SectionHeading } from "./section-heading";
import type { PwaComponentProps } from "./types";

export function Video({ section }: PwaComponentProps) {
  const article = section.items?.[0];
  const videoUrl = (section.props?.videoUrl as string) || article?.video_url;
  const poster = (section.props?.poster as string) || article?.script_thumbnail;

  if (!videoUrl) return null;

  return (
    <section className="px-4 py-3" style={containerDesignStyle(section.resolved_design)}>
      <SectionHeading title={section.title} style={textDesignStyle(section.resolved_design)} />
      <video
        controls
        poster={poster}
        className="w-full"
        style={{ borderRadius: "var(--radius-medium)", boxShadow: "var(--shadow-md)" }}
        autoPlay={!!section.props?.autoplay}
      >
        <source src={videoUrl} />
      </video>
      {article && (
        <Link
          href={`/article/${article.script_slug}`}
          className="mt-2 block text-sm font-medium hover:opacity-70"
          style={{ color: "var(--color-primary)" }}
        >
          {article.script_headline}
        </Link>
      )}
    </section>
  );
}
