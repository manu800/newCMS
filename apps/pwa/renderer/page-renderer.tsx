import type { PwaConfigResponse, PwaPageResponse } from "@cms-pwa/shared-types";

import { SectionRenderer } from "./section-renderer";
import { ThemeProvider } from "./theme-provider";

export function PageRenderer({ config, page }: { config: PwaConfigResponse; page: PwaPageResponse }) {
  const hasBottomNav = page.sections.some((s) => s.type === "bottom_navigation");

  return (
    <ThemeProvider tokens={config.theme.tokens}>
      <div style={{ paddingBottom: hasBottomNav ? 64 : 0 }}>
        {page.sections.map((section) => (
          <SectionRenderer
            key={section.id}
            section={section}
            navigation={config.navigation}
            property={config.property}
          />
        ))}
      </div>
    </ThemeProvider>
  );
}
