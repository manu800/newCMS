import { containerDesignStyle, imageDesignStyle, imageLoadingAttr, textDesignStyle } from "@/lib/design-style";

import { ArticleCard } from "./article-card";
import { SectionHeading } from "./section-heading";
import type { PwaComponentProps } from "./types";

export function NewsList({ section }: PwaComponentProps) {
  const compact = section.variant === "compact";

  return (
    <section
      className="px-4"
      style={{ paddingTop: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", ...containerDesignStyle(section.resolved_design) }}
    >
      <SectionHeading title={section.title} style={textDesignStyle(section.resolved_design)} />
      <div className="space-y-3">
        {(section.items ?? []).map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="horizontal"
            showSummary={!compact}
            showThumbnail={section.props?.showThumbnail !== false}
            imageStyle={imageDesignStyle(section.resolved_design)}
            imageLoading={imageLoadingAttr(section.resolved_design)}
          />
        ))}
      </div>
    </section>
  );
}
