import { containerDesignStyle, imageDesignStyle, imageLoadingAttr, textDesignStyle } from "@/lib/design-style";

import { ArticleCard } from "./article-card";
import { SectionHeading } from "./section-heading";
import type { PwaComponentProps } from "./types";

const COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
  3: "grid-cols-2 md:grid-cols-3",
  4: "grid-cols-2 md:grid-cols-4",
};

const VARIANT_COLS: Record<string, number> = {
  two_column: 2,
  three_column: 3,
  four_column: 4,
};

export function NewsGrid({ section }: PwaComponentProps) {
  const cols = VARIANT_COLS[section.variant ?? ""] ?? section.config.columns.desktop ?? 3;

  return (
    <section
      className="px-4"
      style={{ paddingTop: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", ...containerDesignStyle(section.resolved_design) }}
    >
      <SectionHeading title={section.title} style={textDesignStyle(section.resolved_design)} />
      <div className={`grid gap-4 ${COLS[cols] ?? COLS[3]}`}>
        {(section.items ?? []).map((article) => (
          <ArticleCard
            key={article.id}
            article={article}
            variant="vertical"
            showSummary={!!section.props?.showExcerpt}
            imageStyle={imageDesignStyle(section.resolved_design)}
            imageLoading={imageLoadingAttr(section.resolved_design)}
          />
        ))}
      </div>
    </section>
  );
}
