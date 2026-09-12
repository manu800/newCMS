"use client";

import { useEffect, useState } from "react";

import { ArticleForm, type ArticleFormValues } from "@/components/articles/article-form";
import { PageHeader } from "@/components/layout/page-header";
import { Skeleton } from "@/components/ui/skeleton";
import { api } from "@/lib/api-client";

export function EditArticleClient({ id }: { id: string }) {
  const [values, setValues] = useState<ArticleFormValues | null>(null);

  useEffect(() => {
    api.get<ArticleFormValues>(`/articles/${id}`).then(setValues).catch(() => setValues(null));
  }, [id]);

  if (!values) {
    return (
      <div>
        <PageHeader title="Edit Article" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Article" description={values.script_headline} />
      <ArticleForm initial={values} />
    </div>
  );
}
