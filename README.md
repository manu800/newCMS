# CMS-PWA Platform

A theme-driven CMS that controls the design, layout, components, and content of a separate
PWA — **without ever touching the PWA's source code**. One CMS, multiple themes, multiple
page layouts, the same underlying `CommonArticle` content, multiple PWA looks.

```
CMS  →  Property  →  Theme  →  Page  →  Sections  →  Components  →  CommonArticle content  →  PWA Renderer
```

## Monorepo Structure

```
cms-pwa-platform/
├── apps/
│   ├── cms/     Next.js admin app (theme editor, page builder, article management)
│   └── pwa/     Next.js public-facing app that renders whatever the CMS configures
├── backend/     FastAPI + MongoDB API
├── packages/
│   ├── shared-types/       TypeScript types shared by cms + pwa
│   └── component-schema/   Static palette metadata for the Page Builder
├── docker-compose.yml
└── .env.example
```

---

## 1. Installation

Requirements: Node.js 20+, Python 3.11+, MongoDB, Redis (optional — endpoints work without it).

```bash
# from the repo root
npm install                     # installs apps/cms, apps/pwa, and links packages/*

cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

## 2. Environment Variables

Copy `.env.example` to `.env` at the repo root and to `backend/.env`:

```bash
cp .env.example .env
cp .env.example backend/.env
```

Key variables:

| Variable | Purpose |
|---|---|
| `MONGO_URI`, `MONGO_DB_NAME` | MongoDB connection |
| `REDIS_URL` | Short-TTL cache for the two `/api/pwa/*` endpoints |
| `JWT_SECRET`, `JWT_ALGORITHM`, `JWT_EXPIRES_MINUTES` | Auth token signing |
| `CORS_ORIGINS` | Allowed origins for the backend (CMS + PWA dev ports) |
| `NEXT_PUBLIC_API_BASE_URL` | Used by `apps/cms` to reach the backend |
| `NEXT_PUBLIC_PWA_API_BASE_URL`, `NEXT_PUBLIC_PROPERTY_SLUG` | Used by `apps/pwa` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Demo admin created by the seed script |

Each app also has its own `.env.local` (`apps/cms/.env.local`, `apps/pwa/.env.local`) pointing at
the backend — already checked in with sane local defaults (backend on port `8010`).

## 3. MongoDB Setup

Any reachable MongoDB works — a local `mongod`, a system service, or the `mongo` service in
`docker-compose.yml`. No manual schema setup is required; collections are created on first write
and the seed script provisions everything needed for a demo.

## 4. Backend Startup

```bash
cd backend
source .venv/bin/activate
uvicorn app.main:app --reload --port 8010
```

Health check: `GET http://localhost:8010/health`.

## 5. CMS Startup

```bash
npm run dev:cms       # http://localhost:3000
```

## 6. PWA Startup

```bash
npm run dev:pwa       # http://localhost:3001
```

## 7. Seed Command

```bash
cd backend
source .venv/bin/activate
python -m app.scripts.seed
```

This **clears and repopulates every collection** with: 3 properties (Hook, Hook Hindi, Hook
English), 3 themes (Hook Modern / Hook Classic / Minimal) with distinct design tokens, all 15
component types with variants and field schemas, ~24 `CommonArticle` documents across 6
categories, top/bottom navigation, and 8 pages (Home, Trending, Latest News, Sports,
Entertainment, Videos, Article Detail, Search) — all published, plus one extra draft page
("Weekend Special") to demonstrate the draft/publish split.

## 8. Demo Login

```
Email:    shailendra@hook.online
Password: admin123
Role:     admin
```

Sign in at `http://localhost:3000/login`.

## 9. API Structure

All routes are prefixed `/api`. Full CRUD for `properties`, `themes`, `components`, `pages`,
`navigation`, `articles`, plus:

- `POST /api/auth/login`, `GET /api/auth/me`
- `POST /api/themes/:id/activate?property_id=...` — sets a property's active theme
- `POST /api/pages/:id/publish` — copies draft `sections` → `published_sections`
- `POST /api/pages/:id/duplicate`, `GET /api/pages/:id/preview` (resolves draft sections, used by
  the Page Builder's Preview button)
- `GET /api/versions/:entityType/:entityId`, `POST /api/versions/:entityType/:entityId/:version/restore`
- **The two endpoints the PWA actually talks to:**
  - `GET /api/pwa/config/:propertySlug` — property + active theme tokens + navigation
  - `GET /api/pwa/page/:propertySlug/:pageSlug` — page metadata + sections, each with its
    component definition and resolved `CommonArticle` items already attached

Everything except `/api/pwa/*` and `/api/auth/login` requires a `Bearer` JWT. Write routes are
additionally role-gated (`admin` > `editor`/`designer`/`viewer`) via `require_role(...)` in
`backend/app/core/deps.py`.

## 10. Database Structure

MongoDB collections (see `backend/app/models/*.py` for the exact Pydantic shapes):

- `users` — email, password_hash, role
- `properties` — brand/edition, `active_theme_id`, `active_home_page_id`
- `themes` — `design_tokens` (colors/typography/spacing/radius/shadows/breakpoints) +
  `component_mapping` (component type → default variant)
- `components` — type, `variants[]`, `fields[]` (the dynamic form schema the Page Builder reads)
- `pages` — `sections[]` (draft) and `published_sections[]` (live), `status`, `published_at`
- `navigations` — `type` (top/bottom/sidebar) + ordered `items[]`
- `common_articles` — the existing `CommonArticle` schema, ported field-for-field into
  `backend/app/models/common_article.py`, left untouched by the design system
- `versions` — generic snapshot log for `theme` / `page` / `navigation` entities

## 11. Theme Architecture

A theme is **only** design tokens + a component-variant mapping — never markup, never code:

```json
{
  "design_tokens": { "colors": {...}, "typography": {...}, "spacing": {...}, "radius": {...} },
  "component_mapping": { "hero": "split", "news_card": "vertical", "carousel": "cards" }
}
```

The CMS theme editor (`apps/cms/components/themes/theme-editor-client.tsx`) edits this document
and shows a live preview (`theme-preview.tsx`) driven by the same in-memory token state. The PWA's
`ThemeProvider` (`apps/pwa/renderer/theme-provider.tsx`) converts the active theme's tokens into
CSS custom properties (`--color-primary`, `--radius-medium`, ...) on every request; every PWA
component reads exclusively from those variables. Activating a different theme for a property
(`POST /api/themes/:id/activate`) is the only thing that changes what the PWA looks like.

## 12. Page Builder Architecture

A page is an ordered list of **sections**; each section is `{ type, variant, data_source, config,
props }` — never HTML. The builder (`apps/cms/components/page-builder/page-builder-client.tsx`)
is a 3-pane `dnd-kit` layout: a component palette (draggable), a sortable canvas of section cards,
and a properties panel that renders **dynamically** from the selected component's `fields` schema
(pulled live from the `components` collection — this is what makes "how to add a new component"
possible without ever touching builder code). Save Draft writes `sections`; Publish copies
`sections` → `published_sections` and snapshots a version. The PWA only ever reads
`published_sections`.

## 13. How to Add a New Component

1. Insert a new document into `components` (via `POST /api/components` or the seed script) with
   a unique `type`, its `variants`, and its `fields` (the dynamic form schema — see the field
   types listed in `backend/app/models/component.py::FIELD_TYPES`).
2. Add a palette entry in `packages/component-schema/src/index.ts` (icon + label + group) so it
   shows up in the Page Builder's palette.
3. Implement a React component in `apps/pwa/components/` that reads `section.props`,
   `section.variant`, and `section.items` (resolved articles, if it has a data source), styled
   only from the `--color-*` / `--radius-*` / `--spacing-*` CSS variables.
4. Register it in `apps/pwa/renderer/component-registry.tsx` under the same `type` key.

No other PWA route or CMS screen needs to change — the Page Builder's property panel and the
PWA's `SectionRenderer` are both fully data-driven from steps 1 and 4.

## 14. How to Add a New Theme

`POST /api/themes` with a `name`/`slug` (or use "+ Create Theme" in the CMS), then fill in
`design_tokens` and `component_mapping` in the theme editor. Activate it for a property with
`POST /api/themes/:id/activate?property_id=...` (or the "Activate" button on the Themes list).
The PWA picks it up on the next request — no deploy, no code change.

## 15. How CMS Configuration Reaches the PWA

```
Fetch /api/pwa/config/:propertySlug   → property + active theme tokens + navigation
Fetch /api/pwa/page/:propertySlug/:pageSlug → page sections, each pre-resolved with:
      - its Component definition (variants/fields)
      - its CommonArticle items (if it has a data_source)
        ↓
apps/pwa/renderer/page-route.tsx  (server component, no-store fetch — always fresh)
        ↓
ThemeProvider   → injects CSS variables from theme tokens
        ↓
PageRenderer → SectionRenderer → componentRegistry[section.type]
        ↓
Rendered PWA page
```

The PWA never imports anything from the CMS's database structure — it only ever calls those two
`/api/pwa/*` endpoints and renders whatever they return through the registry above.

---

## Demo Flow (proves the whole point)

1. Log into the CMS, open **Themes → Hook Modern**, change the primary color and the `news_card`
   variant, hit **Save**.
2. Open the PWA (`http://localhost:3001`) and refresh — the color and card layout changed with
   zero PWA code edits.
3. Back in the CMS, open **Pages → Home → Edit** (the Page Builder), drag in a new section,
   configure its data source, hit **Publish**.
4. Refresh the PWA — the new section appears.
5. In **Themes**, click **Activate** on **Hook Classic** for the `Hook` property. Refresh the
   PWA — same articles, completely different look (navy/gold, serif type, sharp-to-soft radius
   change) — because only the active theme pointer changed.

## Docker

```bash
docker compose up --build
```

Then run the seed script once against the containerized backend (`docker compose exec backend
python -m app.scripts.seed`) to populate demo data.
