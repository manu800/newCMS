import Link from "next/link";

import type { ArticleSummary } from "@cms-pwa/shared-types";

export function ArticleCard({
  article,
  variant = "vertical",
  showSummary = true,
  showCategory = true,
  showThumbnail = true,
  imageStyle,
  imageLoading,
}: {
  article: ArticleSummary;
  variant?: string;
  showSummary?: boolean;
  showCategory?: boolean;
  showThumbnail?: boolean;
  imageStyle?: React.CSSProperties;
  imageLoading?: "lazy" | "eager";
}) {
  const href = article.script_slug ? `/article/${article.script_slug}` : "#";
  const horizontal = variant === "horizontal";
  const featured = variant === "featured";

  return (
    <Link
      href={href}
      className={`group ${horizontal ? "flex gap-3" : "block"} transition-shadow duration-200 hover:shadow-lg`}
      style={{
        backgroundColor: "var(--color-surface)",
        borderRadius: "var(--radius-medium)",
        boxShadow: "var(--shadow-md)",
      }}
    >
      {showThumbnail && article.script_thumbnail && (
        <div
          className={`overflow-hidden ${horizontal ? "h-20 w-28 shrink-0" : featured ? "aspect-[16/9]" : "aspect-[4/3]"}`}
          style={{ borderRadius: horizontal ? "var(--radius-medium)" : "var(--radius-medium) var(--radius-medium) 0 0" }}
        >
          <img
            src={article.script_thumbnail}
            alt={article.script_headline}
            loading={imageLoading}
            className="h-full w-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
            style={imageStyle}
          />
        </div>
      )}
      <div className="p-3">
        {showCategory && article.parent_category && (
          <span
            className="inline-block text-[10px] font-semibold uppercase tracking-wide"
            style={{ color: "var(--color-primary)" }}
          >
            {article.parent_category.name}
          </span>
        )}
        <p
          className={`line-clamp-2 ${featured ? "mt-1 text-lg" : "mt-1 text-sm"} group-hover:underline`}
          style={{ fontWeight: "var(--font-heading-weight)", color: "var(--color-text)" }}
        >
          {article.script_headline}
        </p>
        {showSummary && (featured || horizontal) && article.script_summary && (
          <p className="mt-1 line-clamp-2 text-xs" style={{ color: "var(--color-muted)" }}>
            {article.script_summary}
          </p>
        )}
      </div>
    </Link>
  );
}
