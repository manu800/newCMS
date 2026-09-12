import { notFound } from "next/navigation";

import { ArticleDetailView } from "@/components/article-detail";
import { getArticleBySlug, getPwaConfig, getPwaPage } from "@/lib/api";
import { SectionRenderer } from "@/renderer/section-renderer";
import { ThemeProvider } from "@/renderer/theme-provider";

export default async function ArticlePage(props: PageProps<"/article/[slug]">) {
  const { slug } = await props.params;

  const [config, article, template] = await Promise.all([
    getPwaConfig(),
    getArticleBySlug(slug),
    getPwaPage("article-detail"),
  ]);

  if (!config || !article) {
    notFound();
  }

  const headerSection = template?.sections.find((s) => s.type === "header");
  const footerSection = template?.sections.find((s) => s.type === "footer");
  const relatedSection = template?.sections.find((s) => s.type === "news_list");

  return (
    <ThemeProvider tokens={config.theme.tokens}>
      {headerSection && <SectionRenderer section={headerSection} navigation={config.navigation} property={config.property} />}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <ArticleDetailView article={article as any} />
      {relatedSection && <SectionRenderer section={relatedSection} navigation={config.navigation} property={config.property} />}
      {footerSection && <SectionRenderer section={footerSection} navigation={config.navigation} property={config.property} />}
    </ThemeProvider>
  );
}
