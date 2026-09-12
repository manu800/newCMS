"use client";

import { useEffect } from "react";

import type { DesignTokens } from "@cms-pwa/shared-types";

const GOOGLE_FONTS: Record<string, string> = {
  Inter: "Inter:wght@400;700",
  Roboto: "Roboto:wght@400;700",
  Poppins: "Poppins:wght@400;700",
  Merriweather: "Merriweather:wght@400;700",
};

const FONT_FALLBACKS: Record<string, string> = {
  Inter: "ui-sans-serif, system-ui, sans-serif",
  Roboto: "ui-sans-serif, system-ui, sans-serif",
  Poppins: "ui-sans-serif, system-ui, sans-serif",
  Helvetica: "Arial, sans-serif",
  Georgia: "'Times New Roman', serif",
  Merriweather: "Georgia, serif",
};

function useGoogleFont(fontFamily: string) {
  useEffect(() => {
    const query = GOOGLE_FONTS[fontFamily];
    if (!query) return;
    const id = `google-font-${fontFamily}`;
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${query}&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);
}

function fontStack(fontFamily: string) {
  const fallback = FONT_FALLBACKS[fontFamily];
  return fallback ? `"${fontFamily}", ${fallback}` : fontFamily;
}

const SAMPLE_ARTICLES = [
  { title: "India wins the match in a thrilling final", category: "Sports", img: "https://picsum.photos/seed/preview1/400/240" },
  { title: "New movie tops box office on opening weekend", category: "Entertainment", img: "https://picsum.photos/seed/preview2/400/240" },
  { title: "Startup unveils AI-powered assistant", category: "Technology", img: "https://picsum.photos/seed/preview3/400/240" },
  { title: "Five habits for a healthier morning routine", category: "Lifestyle", img: "https://picsum.photos/seed/preview4/400/240" },
];

export function ThemePreview({
  tokens,
  componentMapping,
}: {
  tokens: DesignTokens;
  componentMapping: Record<string, string>;
}) {
  const { colors, typography, radius, spacing, shadows } = tokens;
  const heroVariant = componentMapping.hero ?? "centered";
  const cardVariant = componentMapping.news_card ?? "vertical";
  const gridColumns: Record<string, number> = { two_column: 2, three_column: 3, four_column: 4 };
  const gridCols = gridColumns[componentMapping.news_grid ?? "three_column"] ?? 3;
  const headerVariant = componentMapping.header ?? "default";
  const footerVariant = componentMapping.footer ?? "default";
  const carouselVariant = componentMapping.carousel ?? "cards";
  const navVariant = componentMapping.bottom_navigation ?? "default";
  const bannerVariant = componentMapping.banner ?? "full_width";
  const textVariant = componentMapping.text ?? "default";
  const imageVariant = componentMapping.image ?? "default";
  const categoryVariant = componentMapping.category ?? "pill";
  const newsListVariant = componentMapping.news_list ?? "compact";

  useGoogleFont(typography.fontFamily);

  return (
    <div
      className="overflow-hidden rounded-lg border"
      style={{
        backgroundColor: colors.background,
        color: colors.text,
        fontFamily: fontStack(typography.fontFamily),
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3"
        style={
          headerVariant === "transparent"
            ? { backgroundColor: "transparent", borderBottom: `1px solid ${colors.muted}33` }
            : { backgroundColor: colors.surface, boxShadow: shadows.sm }
        }
      >
        <span style={{ fontWeight: typography.headingWeight, color: colors.primary }}>Hook</span>
        <div className="flex gap-3 text-xs" style={{ color: colors.muted }}>
          <span>Home</span>
          <span>Trending</span>
          <span>Videos</span>
        </div>
      </div>

      {/* Hero */}
      {heroVariant === "fullbleed" ? (
        <div className="relative h-48 w-full overflow-hidden" style={{ backgroundColor: colors.secondary }}>
          <img
            src="https://picsum.photos/seed/hero/500/260"
            alt="hero"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div
            className="absolute inset-0 flex flex-col justify-end p-4"
            style={{ background: "linear-gradient(to top, rgba(0,0,0,0.75), transparent)" }}
          >
            <h2 className="text-white" style={{ fontWeight: typography.headingWeight, fontSize: 18 }}>
              Breaking: Parliament passes new infrastructure bill
            </h2>
            <button
              className="mt-2 w-fit px-3 py-1 text-xs"
              style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: radius.small }}
            >
              Read More
            </button>
          </div>
        </div>
      ) : (
        <div
          className={heroVariant === "split" ? "flex items-center gap-4 p-4" : "p-6 text-center"}
          style={{ backgroundColor: colors.secondary, color: "#fff" }}
        >
          <img
            src="https://picsum.photos/seed/hero/500/260"
            alt="hero"
            className={heroVariant === "split" ? "h-24 w-32 shrink-0 object-cover" : "mx-auto mb-3 h-28 w-full max-w-xs object-cover"}
            style={{ borderRadius: radius.medium }}
          />
          <div>
            <h2 style={{ fontWeight: typography.headingWeight, fontSize: 18 }}>
              Breaking: Parliament passes new infrastructure bill
            </h2>
            <button
              className="mt-2 px-3 py-1 text-xs"
              style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: radius.small }}
            >
              Read More
            </button>
          </div>
        </div>
      )}

      {/* News cards */}
      <div className="p-4" style={{ paddingTop: spacing.md, paddingBottom: spacing.md }}>
        <h3 className="mb-3 text-sm" style={{ fontWeight: typography.headingWeight, color: colors.text }}>
          Trending Now
        </h3>
        <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))` }}>
          {SAMPLE_ARTICLES.map((a) => (
            <div
              key={a.title}
              className={cardVariant === "horizontal" ? "flex gap-3" : ""}
              style={{
                backgroundColor: colors.surface,
                borderRadius: radius.medium,
                boxShadow: shadows.md,
                borderLeft: cardVariant === "featured" ? `3px solid ${colors.primary}` : undefined,
              }}
            >
              <img
                src={a.img}
                alt={a.title}
                className={
                  cardVariant === "horizontal"
                    ? "h-16 w-24 shrink-0 object-cover"
                    : cardVariant === "featured"
                      ? "h-28 w-full object-cover"
                      : "h-20 w-full object-cover"
                }
                style={{
                  borderRadius: cardVariant === "horizontal" ? radius.medium : `${radius.medium}px ${radius.medium}px 0 0`,
                }}
              />
              <div className="p-2">
                <span
                  className={cardVariant === "featured" ? "text-[10px] font-bold uppercase" : "text-[10px] uppercase"}
                  style={{ color: colors.primary }}
                >
                  {a.category}
                </span>
                <p
                  className={cardVariant === "featured" ? "text-sm font-bold leading-snug" : "text-xs leading-snug"}
                  style={{ fontWeight: cardVariant === "featured" ? undefined : typography.bodyWeight }}
                >
                  {a.title}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Carousel strip */}
      {carouselVariant === "fullwidth" ? (
        <div
          className="mx-4 mb-4 flex items-center justify-around py-2 text-xs"
          style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: radius.small }}
        >
          {["Sports", "Politics", "Tech", "Lifestyle"].map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : (
        <div className="flex gap-2 overflow-x-auto px-4 pb-4">
          {["Sports", "Politics", "Tech", "Lifestyle"].map((tag) => (
            <span
              key={tag}
              className="shrink-0 px-3 py-1 text-xs"
              style={{ backgroundColor: colors.primary, color: "#fff", borderRadius: radius.large }}
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Banner */}
      <div className={bannerVariant === "boxed" ? "px-4 pb-4" : "pb-4"}>
        <div
          className="flex items-center justify-center py-3 text-[11px] font-semibold uppercase tracking-wide"
          style={{
            backgroundColor: colors.muted + "33",
            color: colors.muted,
            borderRadius: bannerVariant === "boxed" ? radius.medium : 0,
            border: bannerVariant === "boxed" ? `1px dashed ${colors.muted}` : undefined,
          }}
        >
          Advertisement
        </div>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 px-4 pb-4">
        {["Sports", "Tech"].map((c) => (
          <span
            key={c}
            className={categoryVariant === "card" ? "px-3 py-2 text-xs" : "px-3 py-1 text-xs"}
            style={{
              backgroundColor: colors.surface,
              color: colors.text,
              borderRadius: categoryVariant === "card" ? radius.small : radius.large,
              boxShadow: categoryVariant === "card" ? shadows.sm : undefined,
              border: categoryVariant === "pill" ? `1px solid ${colors.muted}66` : undefined,
            }}
          >
            {c}
          </span>
        ))}
      </div>

      {/* Text block */}
      <div className="px-4 pb-4">
        <p
          className="text-xs leading-relaxed"
          style={
            textVariant === "highlighted"
              ? {
                  backgroundColor: colors.primary + "1a",
                  borderLeft: `3px solid ${colors.primary}`,
                  padding: 10,
                  borderRadius: radius.small,
                  color: colors.text,
                }
              : { color: colors.text }
          }
        >
          Editors note: this text block demonstrates the {textVariant} typography variant for body copy.
        </p>
      </div>

      {/* Image block */}
      <div className="px-4 pb-4">
        <img
          src="https://picsum.photos/seed/imageblock/500/200"
          alt="image block"
          className="h-24 w-full object-cover"
          style={{ borderRadius: imageVariant === "rounded" ? radius.large : 0 }}
        />
      </div>

      {/* News list */}
      <div className="px-4 pb-4">
        <h3 className="mb-2 text-sm" style={{ fontWeight: typography.headingWeight, color: colors.text }}>
          More Stories
        </h3>
        <div className="space-y-2">
          {SAMPLE_ARTICLES.slice(0, newsListVariant === "detailed" ? 3 : 2).map((a) => (
            <div key={a.title} className="flex items-center gap-2">
              <img
                src={a.img}
                alt={a.title}
                className={newsListVariant === "detailed" ? "h-12 w-16 shrink-0 object-cover" : "h-8 w-10 shrink-0 object-cover"}
                style={{ borderRadius: radius.small }}
              />
              <div>
                <p className="text-xs leading-snug" style={{ color: colors.text }}>
                  {a.title}
                </p>
                {newsListVariant === "detailed" && (
                  <span className="text-[10px]" style={{ color: colors.muted }}>
                    {a.category}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      {footerVariant === "minimal" ? (
        <div className="py-2 text-center text-[10px]" style={{ color: colors.muted }}>
          © Hook
        </div>
      ) : (
        <div className="space-y-2 px-4 py-4 text-center text-xs" style={{ backgroundColor: colors.secondary, color: "#fff" }}>
          <div className="flex justify-center gap-3 text-[11px] opacity-80">
            <span>About</span>
            <span>Contact</span>
            <span>Privacy</span>
          </div>
          <div>© Hook. All rights reserved.</div>
        </div>
      )}

      {/* Bottom nav */}
      <div
        className={
          navVariant === "floating"
            ? "mx-4 mb-3 flex items-center justify-around rounded-full py-2 text-xs"
            : "flex items-center justify-around border-t py-2 text-xs"
        }
        style={
          navVariant === "floating"
            ? { backgroundColor: colors.surface, color: colors.muted, boxShadow: shadows.lg }
            : { backgroundColor: colors.background, color: colors.muted }
        }
      >
        {["Home", "Trending", "Videos", "Search"].map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </div>
  );
}
