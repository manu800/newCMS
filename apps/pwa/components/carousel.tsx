import { containerDesignStyle, imageDesignStyle, imageLoadingAttr, textDesignStyle } from "@/lib/design-style";

import { ArticleCard } from "./article-card";
import { SectionHeading } from "./section-heading";
import type { PwaComponentProps } from "./types";

export function Carousel({ section }: PwaComponentProps) {
  const fullwidth = section.variant === "fullwidth";

  return (
    <section
      className="py-3"
      style={{ paddingTop: "var(--spacing-md)", paddingBottom: "var(--spacing-md)", ...containerDesignStyle(section.resolved_design) }}
    >
      {section.title && (
        <div className="px-4">
          <SectionHeading title={section.title} style={textDesignStyle(section.resolved_design)} />
        </div>
      )}
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth px-4 pb-2">
        {(section.items ?? []).map((article) => (
          <div key={article.id} className={`snap-start ${fullwidth ? "w-64 shrink-0" : "w-44 shrink-0"}`}>
            <ArticleCard
              article={article}
              variant="vertical"
              showSummary={false}
              imageStyle={imageDesignStyle(section.resolved_design)}
              imageLoading={imageLoadingAttr(section.resolved_design)}
            />
          </div>
        ))}
      </div>
    </section>
  );
}
