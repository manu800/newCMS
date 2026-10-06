/** Best-effort mapping from a non-article Content Item's field data (e.g. a
 * Video or Quiz item, whose Content Model uses its own field keys) onto the
 * article-shaped fields the PWA's article-preview template expects — lets
 * the same live-theme Preview dialog used for Articles render a reasonable
 * approximation for any content type without a dedicated PWA template per
 * Content Model. */
export function toArticlePreviewData(data: Record<string, unknown>): Record<string, unknown> {
  const pick = (...keys: string[]) => keys.map((k) => data[k]).find((v) => v !== undefined && v !== "" && v !== null);

  return {
    ...data,
    script_headline: pick("script_headline", "headline", "title", "name"),
    script_summary: pick("script_summary", "summary", "description"),
    script_content: pick("script_content", "body", "content"),
    script_thumbnail: pick("script_thumbnail", "card_thumbnail", "large_image", "thumbnail", "image"),
    script_thumbnail_16_9: pick("script_thumbnail_16_9", "large_image", "script_thumbnail"),
    parent_category: pick("parent_category", "category"),
    tags: pick("tags"),
    author: pick("author"),
  };
}
