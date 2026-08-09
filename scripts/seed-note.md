# Seeding

Local and first-run production seeding happens automatically:

1. Apply D1 migrations (`npm run db:migrate:local` or remote).
2. The first `GET /api/portfolio` call inserts profile, collections, and artworks from `data/*.json`.
3. Existing image paths (`/vonder/...`, `vondergray.jpg`) continue to be served as static assets from `public/`.
4. New Studio uploads go to R2 and are served from `/api/media/...`.

No separate R2 upload step is required for the current gallery photos.
