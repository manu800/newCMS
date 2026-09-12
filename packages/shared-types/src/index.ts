export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "multiselect"
  | "image"
  | "video"
  | "url"
  | "color"
  | "article"
  | "category"
  | "tag"
  | "date"
  | "datetime";

export type ComponentType =
  | "hero"
  | "banner"
  | "news_card"
  | "news_list"
  | "news_grid"
  | "carousel"
  | "video"
  | "image"
  | "text"
  | "category"
  | "ad"
  | "spacer"
  | "header"
  | "footer"
  | "bottom_navigation";

export type DataSourceType =
  | "latest"
  | "trending"
  | "breaking"
  | "category"
  | "tag"
  | "manual"
  | "video"
  | "search";

export interface ComponentField {
  name: string;
  label: string;
  type: FieldType;
  required?: boolean;
  default?: unknown;
  options?: string[];
}

export interface ComponentVariant {
  name: string;
  slug: string;
}

export interface DesignContract {
  typography: boolean;
  colors: boolean;
  spacing: boolean;
  border: boolean;
  shadow: boolean;
  cursor: boolean;
  layout: boolean;
  images: boolean;
  positioning: boolean;
}

export interface CmsComponent {
  id: string;
  name: string;
  slug: string;
  type: ComponentType;
  variants: ComponentVariant[];
  fields: ComponentField[];
  design_contract?: DesignContract;
  status: "active" | "inactive";
}

export type CSSCursorValue =
  | "auto"
  | "default"
  | "pointer"
  | "wait"
  | "text"
  | "move"
  | "help"
  | "not-allowed"
  | "none"
  | "grab"
  | "grabbing"
  | "crosshair"
  | "col-resize"
  | "row-resize"
  | "n-resize"
  | "e-resize"
  | "s-resize"
  | "w-resize"
  | "zoom-in"
  | "zoom-out";

export interface DesignOverride {
  font_size?: number;
  font_weight?: number;
  text_align?: "left" | "center" | "right";
  text_color?: string;
  background_color?: string;
  padding_top?: number;
  padding_right?: number;
  padding_bottom?: number;
  padding_left?: number;
  border_radius?: number;
  border_radius_top_left?: number;
  border_radius_top_right?: number;
  border_radius_bottom_right?: number;
  border_radius_bottom_left?: number;
  border_width?: number;
  border_color?: string;
  shadow?: "none" | "sm" | "md" | "lg";
  cursor?: CSSCursorValue;

  display?: "block" | "flex" | "grid" | "inline-block";
  flex_direction?: "row" | "column";
  justify_content?: "flex-start" | "center" | "flex-end" | "space-between" | "space-around";
  align_items?: "flex-start" | "center" | "flex-end" | "stretch";
  gap?: number;
  width?: string;
  height?: string;

  object_fit?: "cover" | "contain" | "fill";
  object_position?: string;
  lazy_loading?: boolean;

  position?: "static" | "relative" | "absolute" | "sticky";
  position_top?: number;
  position_right?: number;
  position_bottom?: number;
  position_left?: number;

  hidden?: boolean;
}

export interface ColorTokens {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  muted: string;
}

export interface TypographyTokens {
  fontFamily: string;
  headingWeight: number;
  bodyWeight: number;
}

export interface SpacingTokens {
  xs: number;
  sm: number;
  md: number;
  lg: number;
}

export interface RadiusTokens {
  small: number;
  medium: number;
  large: number;
}

export interface ShadowTokens {
  sm: string;
  md: string;
  lg: string;
}

export interface BreakpointTokens {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface DesignTokens {
  colors: ColorTokens;
  typography: TypographyTokens;
  spacing: SpacingTokens;
  radius: RadiusTokens;
  shadows: ShadowTokens;
  breakpoints: BreakpointTokens;
}

export interface Theme {
  id: string;
  name: string;
  slug: string;
  description?: string;
  logo?: string;
  status: "draft" | "active" | "inactive";
  device_type?: "mobile" | "desktop";
  design_tokens: DesignTokens;
  component_mapping: Record<string, string>;
}

export interface ThemeConfig {
  mobile_theme_id?: string;
  desktop_theme_id?: string;
}

export interface Property {
  id: string;
  property_id: number;
  name: string;
  slug: string;
  logo?: string;
  host?: string;
  active_theme_id?: string;
  active_home_page_id?: string;
  theme_config?: ThemeConfig;
  status: string;
}

export interface PwaTarget {
  id: string;
  name: string;
  url: string;
  notes?: string;
  is_default: boolean;
  status?: string;
}

export interface DataSource {
  type: DataSourceType;
  limit?: number;
  category_id?: string;
  category_slug?: string;
  tag?: string;
  query?: string;
  article_ids?: string[];
}

export interface ResponsiveColumns {
  mobile: number;
  tablet: number;
  desktop: number;
}

export interface SectionConfig {
  columns: ResponsiveColumns;
  spacing: { top: number; bottom: number };
}

export interface StructureElement {
  element_id: string;
  enabled: boolean;
}

export interface Section {
  id: string;
  type: ComponentType;
  variant?: string;
  title?: string;
  data_source?: DataSource;
  config: SectionConfig;
  props: Record<string, unknown>;
  design?: { mobile?: DesignOverride; desktop?: DesignOverride };
  structure?: StructureElement[];
}

export interface Page {
  id: string;
  name: string;
  slug: string;
  type: "home" | "category" | "article" | "search" | "video" | "custom";
  property_id: string;
  theme_id?: string;
  status: "draft" | "published" | "inactive";
  sections: Section[];
  published_sections: Section[];
  seo: { title?: string; description?: string; keywords?: string };
  published_at?: string | null;
}

export interface NavItem {
  id: string;
  label: string;
  icon?: string;
  url: string;
  order: number;
}

export interface Navigation {
  id: string;
  property_id: string;
  type: "top_navigation" | "bottom_navigation" | "sidebar";
  items: NavItem[];
}

export interface ArticleSummary {
  id: string;
  script_headline?: string;
  script_slug?: string;
  script_summary?: string;
  script_thumbnail?: string;
  script_thumbnail_16_9?: string;
  parent_category?: { name: string; slug: string };
  tags?: { name: string; slug: string }[];
  article_type?: string;
  video_url?: string;
  is_trending?: boolean;
  is_breaking?: string;
  publication_date?: string;
  author?: { name?: string };
}

export interface ResolvedSection extends Section {
  component: CmsComponent | null;
  items: ArticleSummary[];
  resolved_design?: DesignOverride | null;
}

export interface PwaConfigResponse {
  property: { name: string; slug: string; logo?: string; host?: string };
  theme: {
    id: string | null;
    name: string | null;
    slug: string | null;
    tokens: DesignTokens | Record<string, never>;
    component_mapping: Record<string, string>;
  };
  navigation: { top: NavItem[]; bottom: NavItem[]; sidebar: NavItem[] };
}

export interface PwaPageResponse {
  page: {
    name: string;
    slug: string;
    type: string;
    status: string;
    seo: Record<string, string | undefined>;
    published_at?: string | null;
  };
  sections: ResolvedSection[];
}

export interface VersionRecord<T = unknown> {
  id: string;
  entity_type: "theme" | "page" | "navigation" | "component";
  entity_id: string;
  version: number;
  created_by?: string;
  created_at: string;
  snapshot: T;
}
