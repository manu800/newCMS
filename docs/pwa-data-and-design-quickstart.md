# Quickstart: How the PWA Gets Its Data and Design

*A short, plain-language version. For the full deep-dive with code, see
[`pwa-data-and-design-tutorial.md`](./pwa-data-and-design-tutorial.md).*

---

## The one-sentence version

The CMS saves everything as **data** in a database. The PWA asks the backend for that
data every time someone visits a page, and draws the page using that data — it never
runs any code that came from the CMS.

---

## The big picture

```text
CMS  →  saves Theme, Page, Content as data in MongoDB
  ↓
Backend  →  when the PWA asks, packages that data into 2 responses
  ↓
PWA  →  fetches those 2 responses, draws the page with them
  ↓
Visitor's browser
```

That's it. Change something in the CMS → next time someone loads the page, the PWA
asks the backend again → gets the new data → draws it differently. No PWA code change,
no rebuild, no redeploy.

---

## Step 1 — The PWA asks for exactly 2 things

Every time a page loads, the PWA makes 2 requests:

1. **"What does this website look like?"** → get the active **theme** (colors, fonts,
   spacing) and the **navigation menu**.
2. **"What goes on this page?"** → get the list of **sections** for this page (Hero,
   News Grid, Footer, etc.), each one already filled in with real article content.

It also checks whether the visitor is on **mobile or desktop** (by reading their
browser's identity string) and tells the backend — so mobile and desktop can get
completely different themes and designs.

---

## Step 2 — The backend fills in the blanks

The backend does the "hard part" before the PWA ever sees anything:

- Looks up which **theme** applies (mobile theme vs desktop theme vs the fallback
  theme, whichever is set)
- Looks up the **page**'s list of sections
- For every section that says "show me the latest 6 articles" (or trending, or a
  specific category, etc.), it goes and fetches those **real articles** from the
  database and attaches them
- For every section, it also picks out **this device's** design tweaks (if an admin
  set any) and attaches those too

So the PWA never talks to the database directly — it just receives a ready-to-draw
package.

---

## Step 3 — The PWA draws it

1. The theme's colors/fonts/spacing get turned into a small set of reusable style
   variables (like `--color-primary`), applied once at the top of the page.
2. The PWA goes through the list of sections one by one.
3. For each section, it looks at the section's **type** (`"hero"`, `"news_grid"`, ...)
   and picks the matching, already-written React component to draw it — this list of
   allowed components is fixed in the code, so the CMS can never make the PWA draw
   something a developer didn't build.
4. That component reads:
   - its **content** (either typed manually in the CMS, or the real article data that
     was attached)
   - its **design tweaks** (if any were set for this device) — these just add small
     style adjustments (a color, a padding, a shadow...) on top of the theme's normal
     look
   - its **element order** (if an admin reordered or hid a piece, like moving the
     button above the title)

---

## The two "on top of the theme" systems

There are two separate ways an admin can adjust one specific section beyond what the
theme already gives it:

| | What it controls | Example |
|---|---|---|
| **Design** | how it *looks* — color, size, spacing, shadow, layout | "Make this Hero's title 40px and add a shadow, on desktop only" |
| **Structure** | which *pieces* show, and in what order | "Hide the subtitle, put the button above the title" |

Both are just saved as data on the section. Nothing is ever "coded" — an admin is
always picking from a fixed menu of options (a color, a number, on/off, a position in
a list), never typing raw CSS or code.

---

## Why this is safe

The PWA only ever does two things with data from the CMS:
1. Picks a pre-written component off a fixed list, by name.
2. Fills in props and small, whitelisted style values on it.

It never executes anything, never runs a script, never interprets typed-in code. So no
matter what an admin configures, the worst that can happen is "this page looks/behaves
oddly" — never "this page ran something dangerous."

---

Want the details — actual file names, exact code, and a full step-by-step trace of one
real section rendering? Read
[`pwa-data-and-design-tutorial.md`](./pwa-data-and-design-tutorial.md).
