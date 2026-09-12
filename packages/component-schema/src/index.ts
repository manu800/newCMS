import type { ComponentType } from "@cms-pwa/shared-types";

/**
 * Static UI metadata (palette icon + friendly label + category) for the Page Builder's
 * component palette. Field/variant definitions themselves stay authoritative in MongoDB
 * (the `components` collection) — this is purely presentation metadata shared by the CMS.
 */
export const COMPONENT_PALETTE: {
  type: ComponentType;
  label: string;
  icon: string;
  group: "layout" | "content" | "navigation";
}[] = [
  { type: "header", label: "Header", icon: "PanelTop", group: "layout" },
  { type: "hero", label: "Hero", icon: "Image", group: "content" },
  { type: "banner", label: "Banner", icon: "GalleryHorizontal", group: "content" },
  { type: "news_card", label: "News Card", icon: "Newspaper", group: "content" },
  { type: "news_list", label: "News List", icon: "List", group: "content" },
  { type: "news_grid", label: "News Grid", icon: "LayoutGrid", group: "content" },
  { type: "carousel", label: "Carousel", icon: "GalleryHorizontalEnd", group: "content" },
  { type: "video", label: "Video", icon: "Video", group: "content" },
  { type: "image", label: "Image", icon: "ImageIcon", group: "content" },
  { type: "text", label: "Text", icon: "Type", group: "content" },
  { type: "category", label: "Category", icon: "Tag", group: "content" },
  { type: "ad", label: "Ad", icon: "Megaphone", group: "content" },
  { type: "spacer", label: "Spacer", icon: "MoveVertical", group: "layout" },
  { type: "footer", label: "Footer", icon: "PanelBottom", group: "layout" },
  { type: "bottom_navigation", label: "Bottom Navigation", icon: "AlignJustify", group: "navigation" },
];

/**
 * The named sub-elements a component's PWA implementation actually renders, in its
 * default order. Only components wired to read `section.structure` appear here — for
 * every other component type, structure editing simply isn't offered in the CMS since
 * there's nothing in the renderer that would act on it.
 */
export const STRUCTURE_ELEMENTS: Partial<Record<ComponentType, { id: string; label: string }[]>> = {
  hero: [
    { id: "image", label: "Image" },
    { id: "title", label: "Title" },
    { id: "subtitle", label: "Subtitle" },
    { id: "button", label: "Button" },
  ],
};

export const DATA_SOURCE_LABELS: Record<string, string> = {
  latest: "Latest Articles",
  trending: "Trending",
  breaking: "Breaking News",
  category: "By Category",
  tag: "By Tag",
  manual: "Manual Selection",
  video: "Videos",
  search: "Search Query",
};
