import { containerDesignStyle, textDesignStyle } from "@/lib/design-style";

import type { PwaComponentProps } from "./types";

export function Footer({ section, property }: PwaComponentProps) {
  const minimal = section.variant === "minimal";
  const copyright = (section.props?.copyrightText as string) || `© ${property?.name ?? "Hook"}. All rights reserved.`;

  return (
    <footer
      className={minimal ? "px-4 py-4 text-center text-xs" : "px-4 py-8 text-center text-sm"}
      style={{
        backgroundColor: "var(--color-secondary)",
        color: "#fff",
        ...containerDesignStyle(section.resolved_design),
        ...textDesignStyle(section.resolved_design),
      }}
    >
      <p>{copyright}</p>
      {section.props?.showSocial !== false && (
        <div className={minimal ? "mt-2 flex justify-center gap-3 text-[10px] opacity-80" : "mt-3 flex justify-center gap-4 text-xs opacity-80"}>
          <span>Twitter</span>
          <span>Facebook</span>
          <span>Instagram</span>
        </div>
      )}
    </footer>
  );
}
