# By Justine — blog

Astro 7 site on Vercel. Posts live in a **Neon Postgres** database and are managed
from a private portal at `/portal` (email + password + authenticator-app MFA).
New AI drafts come from the n8n workflow **byJustine Blog Writer (Form + HITL)**
(form: https://jl-labs.up.railway.app/form/byjustine-new-post), which saves them
through `POST /api/posts` as **hidden** posts until you switch them on in the portal.

## Stack

| Piece | Where |
| --- | --- |
| Pages | `src/pages` (server-rendered, public pages CDN-cached 60 s) |
| Database | Drizzle ORM → Neon Postgres, schema in `src/db/schema.ts`, migrations in `drizzle/` |
| Auth | Better Auth (`src/lib/auth.ts`), sign-up disabled, TOTP two-factor required, DB rate limits |
| Portal | `/portal` (posts list, show/hide switch, Markdown editor with live preview, security) |
| n8n ingest | `src/pages/api/posts.ts` — `Authorization: Bearer $INGEST_API_KEY` |

## First-time setup

1. Create a free project at https://neon.tech and copy the **pooled** connection string.
2. `cp .env.example .env` and fill in the values (`openssl rand -base64 32` for the auth secret,
   `openssl rand -hex 32` for the ingest key).
3. Install and set up the database:

   ```sh
   pnpm install
   pnpm db:migrate        # creates the tables
   pnpm posts:import      # copies legacy/blog/*.md into the database (safe to re-run)
   pnpm admin:create justinedlimguis@gmail.com "Justine"   # asks for a password
   ```

4. `pnpm dev`, open http://localhost:4321/portal, sign in and scan the QR code with your authenticator app.
5. In Vercel → Project → Settings → Environment Variables add `DATABASE_URL`, `BETTER_AUTH_SECRET`,
   `BETTER_AUTH_URL` (your site URL), `ADMIN_EMAILS`, `INGEST_API_KEY`, `TOPIC_FORM_URL`, then redeploy.

## Commands

| Command | Action |
| --- | --- |
| `pnpm dev` | Dev server at `localhost:4321` |
| `pnpm build` | Production build (Vercel output) |
| `pnpm check` | Type-check |
| `pnpm db:generate` | New migration after editing `src/db/schema.ts` |
| `pnpm db:migrate` | Apply migrations |
| `pnpm db:studio` | Browse the database |
| `pnpm posts:import [dir]` | Import Markdown posts |
| `pnpm admin:create <email> [name]` | Create the admin or reset its password |

## Ingest API (used by n8n)

```http
POST /api/posts
Authorization: Bearer <INGEST_API_KEY>
Content-Type: application/json

{ "title": "…", "description": "…", "body": "markdown…", "slug": "optional", "pubDate": "2026-10-31", "published": false }
```

Returns `201 { id, slug, published, url, editUrl }`. Slugs are made unique automatically.
