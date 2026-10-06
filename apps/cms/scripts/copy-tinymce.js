// Self-hosts TinyMCE (no cloud API key / "domain not registered" banner) by
// copying its static assets from node_modules into public/, where the
// RichTextField component loads them from via a plain <script src> path.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "..", "..", "..", "node_modules", "tinymce");
const dest = path.join(__dirname, "..", "public", "tinymce");

if (!fs.existsSync(src)) {
  console.warn("tinymce package not found in node_modules — skipping copy");
  process.exit(0);
}

fs.rmSync(dest, { recursive: true, force: true });
fs.cpSync(src, dest, { recursive: true });
console.log("Copied TinyMCE assets to public/tinymce");
