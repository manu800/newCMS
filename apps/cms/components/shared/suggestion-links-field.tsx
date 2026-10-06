"use client";

import { Search } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Input } from "@/components/ui/input";
import { api } from "@/lib/api-client";

export interface SuggestionLink {
  type: "story" | "podcast";
  article_id: string | null;
  article_headline?: string;
}

const SLOT_COUNT = 2;

function emptyLinks(): SuggestionLink[] {
  return Array.from({ length: SLOT_COUNT }, () => ({ type: "story", article_id: null }));
}

/** Exactly two "link a related story" slots — each picks Story (only type
 * available today; Podcast has no content type yet) or Podcast, then
 * searches existing Articles by headline to link one. */
export function SuggestionLinksField({
  value,
  onChange,
}: {
  value: unknown;
  onChange: (v: SuggestionLink[]) => void;
}) {
  const links: SuggestionLink[] =
    Array.isArray(value) && value.length === SLOT_COUNT ? (value as SuggestionLink[]) : emptyLinks();

  const update = (i: number, next: SuggestionLink) => {
    const copy = [...links];
    copy[i] = next;
    onChange(copy);
  };

  return (
    <div className="space-y-5 rounded-lg border bg-card p-4 shadow-[0_10px_30px_0_rgba(17,38,146,0.05)]">
      {links.map((link, i) => (
        <div key={i} className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label className="text-sm font-medium">Story Suggestion Link {i + 1}</label>
            <div className="flex items-center gap-4 text-sm">
              <label className="flex items-center gap-1.5">
                <input
                  type="radio"
                  name={`suggestion-link-type-${i}`}
                  checked={link.type === "story"}
                  onChange={() => update(i, { ...link, type: "story" })}
                />
                Story
              </label>
              <label
                className="flex cursor-not-allowed items-center gap-1.5 text-muted-foreground"
                title="No podcast content type exists yet"
              >
                <input type="radio" name={`suggestion-link-type-${i}`} disabled />
                Podcast
              </label>
            </div>
          </div>
          <ArticleSearchSelect
            value={link.article_id ? { id: link.article_id, headline: link.article_headline ?? "" } : null}
            onChange={(article) =>
              update(i, { ...link, article_id: article?.id ?? null, article_headline: article?.headline })
            }
          />
        </div>
      ))}
    </div>
  );
}

interface ArticleHit {
  id: string;
  script_headline?: string;
}

function ArticleSearchSelect({
  value,
  onChange,
}: {
  value: { id: string; headline: string } | null;
  onChange: (article: { id: string; headline: string } | null) => void;
}) {
  const [query, setQuery] = useState(value?.headline ?? "");
  const [results, setResults] = useState<ArticleHit[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => setQuery(value?.headline ?? ""), [value?.id, value?.headline]);

  useEffect(() => {
    if (!open || query.trim().length < 2) {
      setResults([]);
      return;
    }
    const handle = setTimeout(() => {
      api
        .get<ArticleHit[]>(`/articles?search=${encodeURIComponent(query)}&limit=8`)
        .then(setResults)
        .catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(handle);
  }, [query, open]);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-2.5 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-8"
          placeholder="Search stories to link with article"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
            if (value) onChange(null);
          }}
          onFocus={() => setOpen(true)}
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-64 w-full overflow-y-auto rounded-md border bg-popover shadow-md">
          {results.map((a) => (
            <button
              key={a.id}
              type="button"
              className="block w-full truncate px-3 py-2 text-left text-sm hover:bg-muted"
              onClick={() => {
                onChange({ id: a.id, headline: a.script_headline ?? "" });
                setQuery(a.script_headline ?? "");
                setOpen(false);
              }}
            >
              {a.script_headline}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
