# Tutorial: How Data Flows to the PWA, and How Design Is Managed from API Data

This walks through exactly what happens between a browser requesting a page and the
PWA rendering it — where the content comes from, where the visual styling comes from,
and how the two get merged at render time. Every code snippet below is copied from the
actual current source, with the file path it lives in, so you can jump straight to it.

---

## 1. The mental model

```text
CMS (MongoDB)
   │  Property / Theme / Component / Page(sections) — all just data
   ▼
FastAPI backend
   │  resolves + assembles everything into TWO responses
   ▼
PWA (Next.js, server component)
   │  fetches those two responses, renders them through a fixed set of
   │  approved React components — never anything uploaded or executed
   ▼
Browser
```

The PWA never queries MongoDB, never knows the CMS's internal collections, and never
executes anything the CMS sent it. It calls exactly two backend endpoints and renders
whatever comes back through a closed **component registry**. That's the whole trick
that lets a CMS change control the live site without a PWA code change or redeploy.

---

## 2. The two endpoints the PWA calls

Everything the PWA needs to render one page comes from these two calls, both fired in
parallel:

```typescript
// apps/pwa/renderer/page-route.tsx
export async function PageRoute({ pageSlug }: { pageSlug: string }) {
  const [config, page] = await Promise.all([getPwaConfig(), getPwaPage(pageSlug)]);
  if (!config || !page) notFound();
  return <PageRenderer config={config} page={page} />;
}
```

| Call | Backend route | Returns |
|---|---|---|
| `getPwaConfig()` | `GET /api/pwa/config/:propertySlug?device=...` | property info, the **active theme's design tokens**, navigation menus |
| `getPwaPage(pageSlug)` | `GET /api/pwa/page/:propertySlug/:pageSlug?device=...` | the page's **sections**, each already resolved with real article data |

Both live in `apps/pwa/lib/api.ts`:

```typescript
// apps/pwa/lib/api.ts
const MOBILE_UA_REGEX = /Mobi|Android|iPhone|iPad|iPod/i;

async function getDevice(): Promise<"mobile" | "desktop"> {
  const ua = (await headers()).get("user-agent") ?? "";
  return MOBILE_UA_REGEX.test(ua) ? "mobile" : "desktop";
}

export async function getPwaConfig() {
  const device = await getDevice();
  return fetchJson<PwaConfigResponse>(`/pwa/config/${PROPERTY_SLUG}?device=${device}`);
}

export async function getPwaPage(pageSlug: string) {
  const device = await getDevice();
  return fetchJson<PwaPageResponse>(`/pwa/page/${PROPERTY_SLUG}/${pageSlug}?device=${device}`);
}
```

Note `getDevice()` reads the real HTTP `User-Agent` header **server-side**, before any
HTML is sent — so mobile and desktop can get genuinely different themes, layouts, and
designs from the very first byte, no client-side flash or hydration mismatch. Every
fetch also uses `cache: "no-store"`, so a CMS change is visible on the very next
request, not after a rebuild.

---

## 3. Backend: assembling those two responses

### 3a. Config — theme resolution

```python
# backend/app/services/pwa_service.py
async def build_pwa_config(property_slug: str, device: str = "desktop") -> dict:
    prop = await get_property_or_404(property_slug)

    theme_config = prop.get("theme_config") or {}
    device_theme_id = (
        theme_config.get("mobile_theme_id") if device == "mobile" else theme_config.get("desktop_theme_id")
    )
    theme_id = device_theme_id or prop.get("active_theme_id")   # fallback if no per-device theme set

    theme = await theme_repo.get(theme_id) if theme_id else None
    ...
    return {
        "property": {...},
        "theme": {..., "tokens": theme["design_tokens"] if theme else {}, ...},
        "navigation": {...},
    }
```

This is where **mobile and desktop get independent themes** — a property can have a
completely different theme per device, falling back to a single `active_theme_id` if
no device-specific one is set (so older properties that predate this feature keep
working unchanged).

### 3b. Page — section + article resolution

```python
# backend/app/services/pwa_service.py
async def build_pwa_page(property_slug: str, page_slug: str, device: str = "desktop") -> dict:
    prop = await get_property_or_404(property_slug)
    page = await page_repo.get_by_property_and_slug(prop["id"], page_slug)

    sections = page.get("published_sections") or []   # NEVER the draft `sections` field
    resolved_sections = await resolve_sections(sections, device)
    return {"page": {...}, "sections": resolved_sections}
```

Two important things here:

1. It reads `published_sections`, never the working-draft `sections` — so editing a
   page in the CMS Page Builder never leaks to visitors until you explicitly hit
   **Publish**.
2. The real resolution work happens in `resolve_sections`:

```python
# backend/app/services/page_service.py
async def resolve_sections(sections: list[dict], device: str = "desktop") -> list[dict]:
    resolved = []
    for section in sections:
        section = dict(section)
        component = await component_repo.get_by_type(section.get("type"))
        section["component"] = component                       # variant/field/design_contract metadata

        data_source = section.get("data_source")
        if data_source:
            section["items"] = await article_repo.resolve_data_source(data_source)
        else:
            section["items"] = []

        section["resolved_design"] = (section.get("design") or {}).get(device)  # <-- device picked HERE
        resolved.append(section)
    return resolved
```

So by the time the PWA receives a section, it already has:
- `items` — real `CommonArticle` documents (if the section has a `data_source` like
  "latest 6 articles" or "trending")
- `component` — that component type's variants/fields/design_contract, straight from
  the `components` collection
- `resolved_design` — **one device's** design override, already picked out of the
  `{mobile: {...}, desktop: {...}}` pair, based on the `device` query param

The PWA does zero data-fetching of its own for any of this — it just renders what it's
handed.

---

## 4. PWA: theme tokens → CSS variables

```tsx
// apps/pwa/renderer/theme-provider.tsx
function tokensToCssVars(tokens: DesignTokens): string {
  const { colors, typography, spacing, radius, shadows, breakpoints } = tokens;
  return `
    --color-primary: ${colors.primary};
    --color-secondary: ${colors.secondary};
    ...
    --font-family: ${fontStack(typography.fontFamily)};
    --spacing-md: ${spacing.md}px;
    --radius-medium: ${radius.medium}px;
    --shadow-md: ${shadows.md};
    ...
  `;
}

export function ThemeProvider({ tokens, children }) {
  const resolved = tokens && "colors" in tokens ? tokens : DEFAULT_TOKENS;
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: `:root { ${tokensToCssVars(resolved)} }` }} />
      <div style={{ backgroundColor: "var(--color-background)", ... }}>{children}</div>
    </>
  );
}
```

Every component in `apps/pwa/components/*.tsx` reads these CSS variables directly
(`style={{ color: "var(--color-primary)" }}`) — **never a hardcoded color, font, or
radius**. Change the theme in the CMS, and every component that references
`--color-primary` changes together, with zero PWA code touched. (It also injects a
Google Fonts `<link>` when the selected font needs one — see `GOOGLE_FONTS` in the same
file.)

---

## 5. PWA: page → sections → components

```tsx
// apps/pwa/renderer/page-renderer.tsx
export function PageRenderer({ config, page }) {
  return (
    <ThemeProvider tokens={config.theme.tokens}>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} navigation={config.navigation} property={config.property} />
      ))}
    </ThemeProvider>
  );
}
```

```tsx
// apps/pwa/renderer/section-renderer.tsx
export function SectionRenderer({ section, navigation, property }) {
  const Component = componentRegistry[section.type];
  if (!Component) return null;
  if (section.resolved_design?.hidden) return null;   // per-device Visibility toggle

  return (
    <div style={{ paddingTop: section.config?.spacing?.top ?? 0, paddingBottom: section.config?.spacing?.bottom ?? 0 }}>
      <Component section={section} navigation={navigation} property={property} />
    </div>
  );
}
```

```tsx
// apps/pwa/renderer/component-registry.tsx
export const componentRegistry: Record<ComponentType, React.ComponentType<PwaComponentProps>> = {
  hero: Hero, banner: Banner, news_card: NewsCard, news_list: NewsList,
  news_grid: NewsGrid, carousel: Carousel, video: Video, image: ImageBlock,
  text: TextBlock, category: CategoryBlock, ad: AdBlock, spacer: Spacer,
  header: Header, footer: Footer, bottom_navigation: BottomNavigation,
};
```

This registry is the security boundary: `section.type` is just a string that came from
the CMS/database, and it can **only** ever select one of these 15 pre-written,
developer-approved components. There is no `eval`, no dynamic `import()`, no way for
CMS data to cause anything else to render.

---

## 6. How a component turns `section` into pixels

Every component in `apps/pwa/components/` receives exactly one prop shape:

```typescript
// apps/pwa/components/types.ts
export interface PwaComponentProps {
  section: ResolvedSection;
  navigation?: { top: NavItem[]; bottom: NavItem[]; sidebar: NavItem[] };
  property?: { name: string; slug: string; logo?: string };
}
```

`section` (a `ResolvedSection`) is where **everything** lives:

| Field | What it holds | Example |
|---|---|---|
| `variant` | which structural layout to use | `"fullbleed"`, `"split"`, `"centered"` |
| `props` | manually-entered content values | `{ title: "...", buttonText: "..." }` |
| `items` | real article data from the data source | `[{ script_headline, script_thumbnail, ... }]` |
| `config` | responsive column counts + top/bottom spacing | `{ columns: {...}, spacing: {...} }` |
| `resolved_design` | **this device's** style override | `{ font_size: 40, shadow: "lg", ... }` |
| `structure` | element order/visibility override | `[{element_id: "title", enabled: true}, ...]` |

A component typically merges manual content with real article data like this (from
`apps/pwa/components/hero.tsx`):

```tsx
const title = (section.props?.title as string) || article?.script_headline || section.title;
const image = (section.props?.image as string) || article?.script_thumbnail;
```

— manual value first, falling back to whatever the data source resolved, falling back
to the section's own title. This is what lets the *same* Hero component work both as a
hand-authored banner and as an auto-populated "show today's top trending story" block.

---

## 7. How Design overrides actually apply (the interesting part)

A `DesignOverride` is a flat object of *optional* style properties — font size, color,
padding, border radius (including per-corner), shadow, flex/grid layout, image
object-fit, position, visibility, cursor. It's stored **per device**:

```python
# backend/app/models/page.py
class Section(MongoBaseModel):
    ...
    design: Optional[dict[str, DesignOverride]] = None  # keyed "mobile" | "desktop"
```

The backend already picked the right device's copy into `resolved_design` (§3b above).
The PWA turns that into real inline styles using small, shared, pure helper functions —
**not** duplicated per component:

```typescript
// apps/pwa/lib/design-style.ts
export function containerDesignStyle(design?: DesignOverride | null): React.CSSProperties {
  if (!design) return {};
  return {
    ...(design.background_color && { backgroundColor: design.background_color }),
    ...(design.padding_top !== undefined && { paddingTop: design.padding_top }),
    ...(borderRadiusValue(design) !== undefined && { borderRadius: borderRadiusValue(design) }),
    ...(design.shadow && { boxShadow: SHADOW_VARS[design.shadow] }),
    ...(design.display && { display: design.display }),
    ...(design.position && { position: design.position }),
    // ...layout, positioning, etc.
  };
}

export function textDesignStyle(design?: DesignOverride | null): React.CSSProperties { ... }
export function imageDesignStyle(design?: DesignOverride | null): React.CSSProperties { ... }
export function imageLoadingAttr(design?: DesignOverride | null): "lazy" | "eager" | undefined { ... }
```

Every field is spread in conditionally — **an unset field is simply absent from the
returned style object**, so it never overrides the theme's CSS-variable-driven default.
This is the "Component Override → Theme Token → Component Default" priority chain in
practice: the inline style (if present) always wins over the CSS variable it's sitting
next to, because inline styles beat stylesheet rules by CSS specificity rules — no
custom priority logic needed.

A component applies these on top of its normal theme-driven styling:

```tsx
// apps/pwa/components/hero.tsx
const containerStyle = containerDesignStyle(section.resolved_design);
const titleStyle = textDesignStyle(section.resolved_design);

<section style={{ backgroundColor: "var(--color-secondary)", ...containerStyle }}>
  <h1 style={{ fontWeight: "var(--font-heading-weight)", ...titleStyle }}>{title}</h1>
```

If `resolved_design.text_color` is set, it wins. If not, the `<h1>` just inherits
`color` from its ancestor (which reads the theme's `--color-text` variable) — nothing
special has to happen for the "fall back to theme" case, because there's nothing there
to override in the first place.

**Where you set this from the CMS**: the Page Builder's Properties panel → **Design**
section (`apps/cms/components/page-builder/properties-panel.tsx`) has a Mobile/Desktop
tab and one control group per category the selected component's `design_contract`
declares support for. Only categories the actual PWA component reads ever get exposed —
if a component's code doesn't call `imageDesignStyle`, its Design panel doesn't offer
Object Fit, because nothing would happen if you set it.

---

## 8. How Structure overrides work (element order/visibility)

Separate from *how something looks*, `structure` controls *which of a component's named
sub-elements render, and in what order* — e.g. Hero's `image` / `title` / `subtitle` /
`button`.

```python
# backend/app/models/page.py
class StructureElement(MongoBaseModel):
    element_id: str
    enabled: bool = True

class Section(MongoBaseModel):
    ...
    structure: Optional[list[StructureElement]] = None  # array order IS render order
```

Unlike Design, structure isn't split per-device — it's the same for mobile and desktop
(pair it with the per-device **Visibility** design toggle if you specifically need an
element to disappear on just one device).

The component reads it directly (no backend resolution needed — it's not
device-dependent):

```tsx
// apps/pwa/components/hero.tsx
const DEFAULT_ORDER = ["image", "title", "subtitle", "button"];

function resolveOrder(section): string[] {
  if (!section.structure) return DEFAULT_ORDER;               // unset = default order, everything on
  return section.structure.filter((el) => el.enabled).map((el) => el.element_id);
}
```

Then it renders each named element through a small per-id switch and maps over the
resolved order instead of a fixed JSX sequence. Which components support this is
declared centrally, not guessed at:

```typescript
// packages/component-schema/src/index.ts
export const STRUCTURE_ELEMENTS: Partial<Record<ComponentType, { id: string; label: string }[]>> = {
  hero: [
    { id: "image", label: "Image" },
    { id: "title", label: "Title" },
    { id: "subtitle", label: "Subtitle" },
    { id: "button", label: "Button" },
  ],
};
```

Only component types listed here get a "Structure" panel in the CMS at all — same
principle as `design_contract`: never show a control that the renderer wouldn't act on.

---

## 9. Full trace: one Hero section, start to finish

1. **CMS**: admin selects the Hero section in the Page Builder, sets Structure to
   `[button, title, subtitle(off), image]`, sets Design → Desktop → Font Size 40,
   Shadow Large, Border Radius (per corner). Hits **Publish**.
2. Backend copies the page's draft `sections` → `published_sections`.
3. Browser (desktop) requests `/`. `apps/pwa/lib/api.ts` detects `device=desktop` from
   the `User-Agent` header and fires both API calls.
4. `GET /api/pwa/page/hook/home?device=desktop` → `build_pwa_page` → `resolve_sections`
   picks `section.design.desktop` into `resolved_design`, resolves the Hero's
   `data_source` into `items` (a real article).
5. PWA receives the response, `PageRenderer` wraps it all in `ThemeProvider` (theme →
   CSS vars), and loops sections into `SectionRenderer` → `componentRegistry.hero` →
   `Hero({ section })`.
6. `Hero` computes `resolveOrder(section)` → `["button", "title", "image"]` (subtitle
   filtered out since `enabled: false`), computes `containerDesignStyle`/`textDesignStyle`
   from `resolved_design`, and renders the Button *before* the Title, with the
   configured font size/shadow/radius as real inline styles layered over the theme's
   CSS-variable defaults.
7. Final HTML ships with `font-size:40px`, the configured `border-radius`, and
   `<a>Read More</a>` appearing before `<h1>` in the DOM — all driven by CMS data, zero
   PWA source changes.

---

## 10. Adding a new component to this system

1. Add the type to `COMPONENT_TYPES` in `backend/app/models/component.py` and seed a
   `Component` document (name/slug/type/variants/fields/design_contract) — this is the
   *contract* the CMS builds its forms from.
2. Write the actual React component in `apps/pwa/components/your-component.tsx`. Read
   `section.props`/`section.items` for content, `section.resolved_design` via the
   `design-style.ts` helpers for styling, `section.variant` for structural layout
   choice.
3. Register it in `apps/pwa/renderer/component-registry.tsx`.
4. If it should support Design overrides, set the matching flags (`typography`,
   `colors`, `spacing`, `border`, `shadow`, `layout`, `images`, `positioning`) true on
   its `Component.design_contract` — the CMS panel picks these up automatically.
5. If it should support element reordering/hiding, add its element list to
   `STRUCTURE_ELEMENTS` in `packages/component-schema/src/index.ts` and give the
   component a `resolveOrder`-style helper like Hero's.

Nothing else in the pipeline needs to know this component exists — the registry lookup,
the Properties panel's dynamic form generation, and the resolve/render flow all pick it
up automatically from steps 1–5.

---

## Quick file reference

| Concern | File |
|---|---|
| Device detection + the two API calls | `apps/pwa/lib/api.ts` |
| Theme tokens → CSS variables | `apps/pwa/renderer/theme-provider.tsx` |
| Page → sections loop | `apps/pwa/renderer/page-renderer.tsx` |
| Section → component dispatch + visibility | `apps/pwa/renderer/section-renderer.tsx` |
| The approved component list | `apps/pwa/renderer/component-registry.tsx` |
| Shared Design-override → inline-style helpers | `apps/pwa/lib/design-style.ts` |
| Individual components | `apps/pwa/components/*.tsx` |
| Config/page assembly (backend) | `backend/app/services/pwa_service.py` |
| Article/design resolution per section (backend) | `backend/app/services/page_service.py` |
| Section/DesignOverride/StructureElement schema | `backend/app/models/page.py` |
| Which components support which Design categories | `backend/app/models/component.py` (`DesignContract`) + each `Component` doc's `design_contract` |
| Which components support Structure reordering | `packages/component-schema/src/index.ts` (`STRUCTURE_ELEMENTS`) |
