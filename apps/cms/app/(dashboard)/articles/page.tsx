"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { api } from "@/lib/api-client";
import type { ArticleSummary } from "@cms-pwa/shared-types";

const PAGE_SIZE = 10;

export default function ArticlesPage() {
  const [articles, setArticles] = useState<ArticleSummary[] | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    api.get<ArticleSummary[]>("/articles?limit=200").then(setArticles).catch(() => setArticles([]));
  }, []);

  const pageCount = Math.max(1, Math.ceil((articles?.length ?? 0) / PAGE_SIZE));
  const pageRows = useMemo(
    () => (articles ?? []).slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE),
    [articles, page]
  );

  return (
    <div>
      <PageHeader
        title="Articles"
        description="Manage CommonArticle content."
        actions={
          <Link href="/articles/new">
            <Button>+ New Article</Button>
          </Link>
        }
      />

      {articles === null ? (
        <Skeleton className="h-96 w-full" />
      ) : articles.length === 0 ? (
        <div className="rounded-lg border bg-card p-12 text-center text-sm text-muted-foreground">
          No articles yet. Create your first article.
        </div>
      ) : (
        <div className="rounded-lg border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Headline</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Trending</TableHead>
                <TableHead>Breaking</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pageRows.map((a) => (
                <TableRow key={a.id}>
                  <TableCell>
                    <Link href={`/articles/${a.id}/edit`} className="font-medium hover:underline">
                      {a.script_headline}
                    </Link>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{a.parent_category?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{a.article_type}</Badge>
                  </TableCell>
                  <TableCell>{a.is_trending ? <Badge>Trending</Badge> : null}</TableCell>
                  <TableCell>
                    {a.is_breaking === "true" ? <Badge variant="destructive">Breaking</Badge> : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <div className="flex items-center justify-between border-t p-3">
            <span className="text-sm text-muted-foreground">
              Page {page + 1} of {pageCount}
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(pageCount - 1, p + 1))}
                disabled={page >= pageCount - 1}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
