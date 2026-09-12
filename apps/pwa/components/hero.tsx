import Link from "next/link";

import { containerDesignStyle, imageDesignStyle, imageLoadingAttr, textDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

const DEFAULT_ORDER = ["image", "title", "subtitle", "button"];

/** section.structure (if set) picks which of DEFAULT_ORDER's elements render and in
 * what order — unset means "use the default order, everything on" (backward compatible). */
function resolveOrder(section: PwaComponentProps["section"]): string[] {
  if (!section.structure) return DEFAULT_ORDER;
  return section.structure.filter((el) => el.enabled).map((el) => el.element_id);
}

export function Hero({ section }: PwaComponentProps) {
  const article = section.items?.[0];
  const title = (section.props?.title as string) || article?.script_headline || section.title;
  const subtitle = (section.props?.subtitle as string) || article?.script_summary;
  const image = (section.props?.image as string) || article?.script_thumbnail;
  const href = article?.script_slug ? `/article/${article.script_slug}` : "#";
  const variant = section.variant ?? "centered";

  const containerStyle = containerDesignStyle(section.resolved_design);
  const titleStyle = textDesignStyle(section.resolved_design);
  const imgStyle = imageDesignStyle(section.resolved_design);
  const imgLoading = imageLoadingAttr(section.resolved_design);
  const order = resolveOrder(section);
  const show = (id: string) => order.includes(id);

  const buttonText = (section.props?.buttonText as string) || "Read More";

  if (variant === "fullbleed") {
    // Image is always the background here — reordering applies to the overlay text elements only.
    const textOrder = order.filter((id) => id !== "image");
    const renderTextElement = (id: string) => {
      if (id === "title") {
        return (
          <h1 key={id} className="text-2xl leading-tight md:text-4xl" style={{ fontWeight: "var(--font-heading-weight)", ...titleStyle }}>
            {title}
          </h1>
        );
      }
      if (id === "subtitle" && subtitle) {
        return (
          <p key={id} className="mt-3 max-w-xl text-sm opacity-90 md:text-base">
            {subtitle}
          </p>
        );
      }
      if (id === "button") {
        return (
          <Link
            key={id}
            href={href}
            className="mt-5 inline-block px-4 py-2 text-sm"
            style={{ backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-small)" }}
          >
            {buttonText}
          </Link>
        );
      }
      return null;
    };

    return (
      <section
        className="relative flex min-h-[420px] items-end overflow-hidden"
        style={{ backgroundColor: "var(--color-secondary)", ...containerStyle }}
      >
        {show("image") && image && (
          <img
            src={image}
            alt={title ?? ""}
            loading={imgLoading}
            className="absolute inset-0 h-full w-full object-cover"
            style={imgStyle}
          />
        )}
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to top, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.35) 55%, rgba(0,0,0,0.05) 100%)" }}
        />
        <div className="relative z-10 max-w-2xl p-6 pb-10 text-white md:p-10">
          {textOrder.map(renderTextElement)}
        </div>
      </section>
    );
  }

  const renderElement = (id: string) => {
    if (id === "image" && image) {
      return (
        <img
          key={id}
          src={image}
          alt={title ?? ""}
          loading={imgLoading}
          className={variant === "split" ? "h-40 w-56 shrink-0 object-cover" : "mx-auto mb-4 h-56 w-full max-w-2xl object-cover"}
          style={{ borderRadius: "var(--radius-medium)", ...imgStyle }}
        />
      );
    }
    if (id === "title") {
      return (
        <h1 key={id} className="text-2xl md:text-3xl" style={{ fontWeight: "var(--font-heading-weight)", ...titleStyle }}>
          {title}
        </h1>
      );
    }
    if (id === "subtitle" && subtitle) {
      return (
        <p
          key={id}
          className={variant === "split" ? "mt-2 max-w-xl text-sm opacity-90" : "mx-auto mt-2 max-w-xl text-sm opacity-90"}
        >
          {subtitle}
        </p>
      );
    }
    if (id === "button") {
      return (
        <Link
          key={id}
          href={href}
          className="mt-4 inline-block px-4 py-2 text-sm"
          style={{ backgroundColor: "var(--color-primary)", borderRadius: "var(--radius-small)" }}
        >
          {buttonText}
        </Link>
      );
    }
    return null;
  };

  // Title/subtitle/button stay grouped in their own text block (matching the original
  // layout); `order` controls their order within that block, plus whether the image
  // slot renders before or after the whole text block.
  const textIds = order.filter((id) => id !== "image");
  const imageIndex = order.indexOf("image");
  const firstTextIndex = order.findIndex((id) => id !== "image");
  const imageFirst = imageIndex !== -1 && (firstTextIndex === -1 || imageIndex < firstTextIndex);
  const imageElement = show("image") ? renderElement("image") : null;
  const textBlock = textIds.length > 0 ? <div key="text-block">{textIds.map(renderElement)}</div> : null;

  return (
    <section
      className={variant === "split" ? "flex items-center gap-6 p-6 md:p-10" : "p-8 text-center"}
      style={{ backgroundColor: "var(--color-secondary)", color: "#fff", ...containerStyle }}
    >
      {imageFirst ? (
        <>
          {imageElement}
          {textBlock}
        </>
      ) : (
        <>
          {textBlock}
          {imageElement}
        </>
      )}
    </section>
  );
}
