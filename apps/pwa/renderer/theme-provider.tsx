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

function fontStack(fontFamily: string): string {
  const fallback = FONT_FALLBACKS[fontFamily] ?? "sans-serif";
  return `"${fontFamily}", ${fallback}`;
}

function tokensToCssVars(tokens: DesignTokens): string {
  const { colors, typography, spacing, radius, shadows, breakpoints } = tokens;
  return `
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    --color-background: ${colors.background};
    --color-surface: ${colors.surface};
    --color-text: ${colors.text};
    --color-muted: ${colors.muted};

    --font-family: ${fontStack(typography.fontFamily)};
    --font-heading-weight: ${typography.headingWeight};
    --font-body-weight: ${typography.bodyWeight};

    --spacing-xs: ${spacing.xs}px;
    --spacing-sm: ${spacing.sm}px;
    --spacing-md: ${spacing.md}px;
    --spacing-lg: ${spacing.lg}px;

    --radius-small: ${radius.small}px;
    --radius-medium: ${radius.medium}px;
    --radius-large: ${radius.large}px;

    --shadow-sm: ${shadows.sm};
    --shadow-md: ${shadows.md};
    --shadow-lg: ${shadows.lg};

    --breakpoint-tablet: ${breakpoints.tablet}px;
    --breakpoint-desktop: ${breakpoints.desktop}px;
  `;
}

const DEFAULT_TOKENS: DesignTokens = {
  colors: { primary: "#E11D48", secondary: "#0F172A", background: "#FFFFFF", surface: "#F8FAFC", text: "#111827", muted: "#64748B" },
  typography: { fontFamily: "Inter", headingWeight: 700, bodyWeight: 400 },
  spacing: { xs: 4, sm: 8, md: 16, lg: 24 },
  radius: { small: 6, medium: 12, large: 20 },
  shadows: { sm: "0 1px 2px rgba(0,0,0,0.05)", md: "0 4px 6px rgba(0,0,0,0.1)", lg: "0 10px 15px rgba(0,0,0,0.15)" },
  breakpoints: { mobile: 0, tablet: 768, desktop: 1024 },
};

export function ThemeProvider({
  tokens,
  children,
}: {
  tokens: DesignTokens | Record<string, never> | undefined;
  children: React.ReactNode;
}) {
  const resolved: DesignTokens = tokens && "colors" in tokens ? (tokens as DesignTokens) : DEFAULT_TOKENS;
  const googleFontQuery = GOOGLE_FONTS[resolved.typography.fontFamily];

  return (
    <>
      {googleFontQuery && (
        <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${googleFontQuery}&display=swap`} />
      )}
      <style dangerouslySetInnerHTML={{ __html: `:root { ${tokensToCssVars(resolved)} }` }} />
      <div
        style={{
          backgroundColor: "var(--color-background)",
          color: "var(--color-text)",
          fontFamily: "var(--font-family)",
          fontWeight: "var(--font-body-weight)",
          minHeight: "100vh",
        }}
      >
        {children}
      </div>
    </>
  );
}
