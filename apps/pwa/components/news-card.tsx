import { containerDesignStyle, imageDesignStyle, imageLoadingAttr } from "@/lib/design-style";

import { ArticleCard } from "./article-card";
import type { PwaComponentProps } from "./types";

export function NewsCard({ section }: PwaComponentProps) {
  const article = section.items?.[0];
  if (!article) return null;

  return (
    <div className="px-4 py-3" style={containerDesignStyle(section.resolved_design)}>
      <ArticleCard
        article={article}
        variant={section.variant}
        showSummary={section.props?.showSummary !== false}
        showCategory={section.props?.showCategory !== false}
        imageStyle={imageDesignStyle(section.resolved_design)}
        imageLoading={imageLoadingAttr(section.resolved_design)}
      />
    </div>
  );
}
