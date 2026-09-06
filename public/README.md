# Static Assets Directory (`/public`)

This directory contains static assets served directly by the web server and Vite bundler without code transformation.

---

## 📁 Directory Structure

```
/public
  │
  ├── /assets/        # Static visual assets, brand icons, and badges
  └── README.md       # Asset directory documentation
```

---

## 📌 Usage & Rules

- **Direct Serving**: All files placed in `/public` are served at the root URL path (e.g., `/public/favicon.ico` is accessible at `/favicon.ico`).
- **Referencing in Code**: Reference files in `/public` with an absolute path starting with `/` (e.g. `<img src="/assets/..." />`).
- **No Bundling**: Files here are not parsed or bundled by Vite/esbuild; they are copied verbatim to `dist/` during `npm run build`.
