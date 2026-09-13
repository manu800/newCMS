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
        <div className="relative z-10">
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Edit Article" description={values.script_headline} />
      <div className="relative z-10">
        <ArticleForm initial={values} />
      </div>
    </div>
  );
}
