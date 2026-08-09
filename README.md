# ArtistHub — Portfolio with Mom-Friendly Studio CMS

Artist portfolio site with a private **Studio** editor. Paintings, collections, bio/CV, and messages save to **Cloudflare D1 + R2** and go live immediately — no redeploy for content changes.

---

## How it works

| Piece | Role |
|--------|------|
| Vite + React | Public site + Studio UI |
| Cloudflare Pages Functions | `/api/*` backend |
| D1 (SQLite) | Profile, artworks, collections, inquiries |
| R2 | New photo uploads (`/api/media/...`) |
| `public/vonder/` | Existing gallery photos (static) |

Studio passcode is checked **on the server**. Session tokens are signed with `SESSION_SECRET`.

---

## Local development

```bash
npm install
cp .dev.vars.example .dev.vars   # if needed
npm run db:migrate:local
npm run dev
```

`npm run dev` runs Vite behind `wrangler pages dev` so `/api` + D1/R2 work locally.

- Site: usually `http://localhost:8788` (or the port Wrangler prints)
- Studio: `/studio` (also in the nav) — default passcode `1988`

Useful commands:

```bash
npm run build              # production client build
npm run preview            # serve dist + Functions locally
npm run db:migrate:local   # apply D1 migrations locally
npm run deploy             # build + wrangler pages deploy
```

---

## First Cloudflare deploy (one-time)

1. Create a D1 database and R2 bucket in the Cloudflare dashboard (or CLI).
2. Put the real `database_id` in [`wrangler.jsonc`](wrangler.jsonc).
3. Set secrets on the Pages project:
   ```bash
   npx wrangler pages secret put STUDIO_PASSCODE_HASH
   npx wrangler pages secret put SESSION_SECRET
   ```
   `STUDIO_PASSCODE_HASH` is the SHA-256 hex of the passcode (see `.dev.vars.example`).
4. Bind D1 (`DB`) and R2 (`IMAGES`) to the Pages project (or rely on `wrangler.jsonc` on deploy).
5. Apply migrations remotely: `npm run db:migrate:remote`
6. Deploy: `npm run deploy` (or connect the Git repo to Cloudflare Pages with build command `npm run build` and output `dist`).

The first `GET /api/portfolio` seeds content from `data/*.json` if the database is empty. Existing image paths keep using files in `public/`.

After that, your mom only uses **Studio → Save**. No Git, no JSON export, no redeploy for content.

---

## Studio (for the artist)

1. Open **Studio** in the menu (or bookmark `/studio`).
2. Enter the passcode.
3. **My Paintings** — add/edit photos and titles (details optional).
4. **Collections** — name groups for the gallery filters.
5. **About my site** — home text, bio, photos, CV.
6. **Messages** — inquiries from the gallery contact form.

Saving shows: “Saved — it’s on your website now.”

Optional: **Download backup** saves a JSON snapshot for peace of mind.

---

## Project layout

```
data/                 # Seed JSON (imported on first empty DB)
functions/api/        # Pages Functions API
migrations/           # D1 schema
public/               # Static assets including /vonder photos
src/db.ts             # Client API layer
src/studio/           # Mom-friendly Studio panels
src/pages/            # Public pages + Studio shell
```
