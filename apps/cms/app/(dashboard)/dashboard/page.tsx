"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  CheckCircle2,
  FileStack,
  FileEdit,
  Newspaper,
  Palette,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { api } from "@/lib/api-client";
import type { ArticleSummary, Page, Theme } from "@cms-pwa/shared-types";

export default function DashboardPage() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [pages, setPages] = useState<Page[] | null>(null);
  const [themes, setThemes] = useState<Theme[] | null>(null);

  useEffect(() => {
    api.get<ArticleSummary[]>("/articles?limit=200").then(setArticles).catch(() => setArticles([]));
    api.get<Page[]>("/pages").then(setPages).catch(() => setPages([]));
    api.get<Theme[]>("/themes").then(setThemes).catch(() => setThemes([]));
  }, []);

  const loading = articles === null || pages === null || themes === null;

  const published = pages?.filter((p) => p.status === "published").length ?? 0;
  const draft = pages?.filter((p) => p.status === "draft").length ?? 0;
  const trending = articles?.filter((a) => a.is_trending).length ?? 0;

  const stats: { label: string; value: number; icon: LucideIcon; color: string }[] = [
    { label: "Articles", value: articles?.length ?? 0, icon: Newspaper, color: "text-blue-600 bg-blue-500/10" },
    { label: "Pages", value: pages?.length ?? 0, icon: FileStack, color: "text-purple-600 bg-purple-500/10" },
    { label: "Themes", value: themes?.length ?? 0, icon: Palette, color: "text-primary bg-primary/10" },
    { label: "Published Pages", value: published, icon: CheckCircle2, color: "text-emerald-600 bg-emerald-500/10" },
    { label: "Draft Pages", value: draft, icon: FileEdit, color: "text-amber-600 bg-amber-500/10" },
    { label: "Trending Articles", value: trending, icon: TrendingUp, color: "text-orange-600 bg-orange-500/10" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Overview of your content and configuration.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Card key={s.label} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{s.label}</p>
                  {loading ? (
                    <Skeleton className="mt-2 h-7 w-12" />
                  ) : (
                    <p className="mt-1 text-2xl font-bold text-foreground">{s.value}</p>
                  )}
                </div>
                <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", s.color)}>
                  <Icon className="h-4.5 w-4.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Articles</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <ul className="divide-y">
              {articles.slice(0, 8).map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5 text-sm">
                  <Link href={`/articles/${a.id}/edit`} className="font-medium hover:text-primary hover:underline">
                    {a.script_headline}
                  </Link>
                  {a.parent_category?.name && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                      {a.parent_category.name}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No articles yet.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
