import type { DesignOverride } from "@cms-pwa/shared-types";

const SHADOW_VARS: Record<string, string> = {
  none: "none",
  sm: "var(--shadow-sm)",
  md: "var(--shadow-md)",
  lg: "var(--shadow-lg)",
};

function borderRadiusValue(design: DesignOverride): string | number | undefined {
  const { border_radius_top_left: tl, border_radius_top_right: tr, border_radius_bottom_right: br, border_radius_bottom_left: bl } = design;
  if (tl === undefined && tr === undefined && br === undefined && bl === undefined) {
    return design.border_radius;
  }
  const base = design.border_radius ?? 0;
  return `${tl ?? base}px ${tr ?? base}px ${br ?? base}px ${bl ?? base}px`;
}

/** Container-level overrides: background, spacing, border, shadow, layout, positioning. Apply to a section's outer wrapper. */
export function containerDesignStyle(design?: DesignOverride | null): React.CSSProperties {
  if (!design) return {};
  return {
    ...(design.background_color && { backgroundColor: design.background_color }),
    ...(design.padding_top !== undefined && { paddingTop: design.padding_top }),
    ...(design.padding_right !== undefined && { paddingRight: design.padding_right }),
    ...(design.padding_bottom !== undefined && { paddingBottom: design.padding_bottom }),
    ...(design.padding_left !== undefined && { paddingLeft: design.padding_left }),
    ...(borderRadiusValue(design) !== undefined && { borderRadius: borderRadiusValue(design) }),
    ...(design.border_width !== undefined && {
      borderWidth: design.border_width,
      borderStyle: "solid",
      borderColor: design.border_color ?? "var(--color-muted)",
    }),
    ...(design.shadow && { boxShadow: SHADOW_VARS[design.shadow] }),
    ...(design.cursor && { cursor: design.cursor }),
    ...(design.display && { display: design.display }),
    ...(design.flex_direction && { flexDirection: design.flex_direction }),
    ...(design.justify_content && { justifyContent: design.justify_content }),
    ...(design.align_items && { alignItems: design.align_items }),
    ...(design.gap !== undefined && { gap: design.gap }),
    ...(design.width && { width: design.width }),
    ...(design.height && { height: design.height }),
    ...(design.position && { position: design.position }),
    ...(design.position_top !== undefined && { top: design.position_top }),
    ...(design.position_right !== undefined && { right: design.position_right }),
    ...(design.position_bottom !== undefined && { bottom: design.position_bottom }),
    ...(design.position_left !== undefined && { left: design.position_left }),
  };
}

/** Text-level overrides: font size/weight, alignment, color. Apply to a section's primary heading/text element. */
export function textDesignStyle(design?: DesignOverride | null): React.CSSProperties {
  if (!design) return {};
  return {
    ...(design.font_size !== undefined && { fontSize: design.font_size }),
    ...(design.font_weight !== undefined && { fontWeight: design.font_weight }),
    ...(design.text_align && { textAlign: design.text_align }),
    ...(design.text_color && { color: design.text_color }),
  };
}

/** Image-level overrides: object-fit/position. Apply to an <img>'s style. */
export function imageDesignStyle(design?: DesignOverride | null): React.CSSProperties {
  if (!design) return {};
  return {
    ...(design.object_fit && { objectFit: design.object_fit as React.CSSProperties["objectFit"] }),
    ...(design.object_position && { objectPosition: design.object_position }),
  };
}

/** The <img loading="..."> attribute, not a style. */
export function imageLoadingAttr(design?: DesignOverride | null): "lazy" | "eager" | undefined {
  if (design?.lazy_loading === undefined) return undefined;
  return design.lazy_loading ? "lazy" : "eager";
}
