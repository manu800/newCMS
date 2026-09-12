import { ArticleForm } from "@/components/articles/article-form";
import { PageHeader } from "@/components/layout/page-header";

export default function NewArticlePage() {
  return (
    <div>
      <PageHeader title="New Article" description="Create a new CommonArticle." />
      <ArticleForm />
    </div>
  );
}
