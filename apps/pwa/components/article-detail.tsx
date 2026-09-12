import type { ArticleSummary } from "@cms-pwa/shared-types";

interface ArticleDetail extends ArticleSummary {
  script_content?: string;
}

export function ArticleDetailView({ article }: { article: ArticleDetail }) {
  return (
    <article className="px-4 py-6">
      {article.parent_category && (
        <span className="text-xs font-semibold uppercase" style={{ color: "var(--color-primary)" }}>
          {article.parent_category.name}
        </span>
      )}
      <h1 className="mt-2 text-2xl md:text-3xl" style={{ fontWeight: "var(--font-heading-weight)" }}>
        {article.script_headline}
      </h1>
      {article.author?.name && (
        <p className="mt-2 text-xs" style={{ color: "var(--color-muted)" }}>
          By {article.author.name}
          {article.publication_date ? ` · ${new Date(article.publication_date).toLocaleDateString()}` : ""}
        </p>
      )}
      {article.script_thumbnail && (
        <img
          src={article.script_thumbnail}
          alt={article.script_headline}
          className="mt-4 w-full object-cover"
          style={{ borderRadius: "var(--radius-medium)", maxHeight: 420 }}
        />
      )}
      {article.script_summary && (
        <p className="mt-4 text-lg" style={{ color: "var(--color-muted)" }}>
          {article.script_summary}
        </p>
      )}
      {article.script_content && (
        <div
          className="prose mt-4 max-w-none"
          style={{ color: "var(--color-text)" }}
          dangerouslySetInnerHTML={{ __html: article.script_content }}
        />
      )}
    </article>
  );
}
