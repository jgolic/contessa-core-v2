# Contessa Operations

Deployable Next.js version of the Contessa yacht operations app.

## Stack

- Next.js App Router
- React
- TypeScript-ready project structure
- Tailwind CSS
- Client-only map runtime with graceful fallback

## Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) during local development.

## Production build

```bash
npm run build
npm run start
```

## Environment

Create `.env.local` from `.env.example` and set the values you need:

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAP_STYLE_URL=
NEXT_PUBLIC_MAPTILER_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_ALLOW_DEMO_EDITING=
NEXT_PUBLIC_ALLOW_SENSITIVE_CREW_DATA=
NEXT_PUBLIC_ALLOW_DEMO_CREW_PORTRAITS=
```

Notes:

- `NEXT_PUBLIC_APP_URL` is the canonical public share link used by the `Share` flow.
- If `NEXT_PUBLIC_APP_URL` is missing, the app falls back to `window.location.origin` in the browser.
- Optional map and backend variables fail gracefully and keep the app in demo mode instead of crashing.
- In production without a configured backend, the app hardens itself into a safer public demo by default: view-only mode, masked crew identifiers, and portrait generation disabled.
- You can explicitly re-enable those demo-only capabilities with the `NEXT_PUBLIC_ALLOW_*` flags above when operating in a trusted environment.

## Deployment

This project is prepared for Vercel deployment as a standard Next.js app.

### Vercel

1. Import the repository into Vercel.
2. Add any needed environment variables in the Vercel project settings.
3. Deploy with the default Next.js build settings.

No custom localhost setup, Windows startup scripts, or file-based preview flow is required.

## Demo mode

The app currently uses demo/local persistence so the core workflows remain usable without a backend.

Planned backend connection points are isolated in:

- `lib/config`
- `lib/storage`
- `lib/demoData`

## Technical upgrade planning

Architecture and implementation planning docs live here:

- [docs/architecture-roadmap.md](/C:/Users/J_Gol/Documents/Codex/2026-04-23-can-we-continue-with-my-app/contessa-core-v2-live/docs/architecture-roadmap.md)
- [docs/implementation-checklist.md](/C:/Users/J_Gol/Documents/Codex/2026-04-23-can-we-continue-with-my-app/contessa-core-v2-live/docs/implementation-checklist.md)
- [db/migrations/0001_contessa_core_foundation.sql](/C:/Users/J_Gol/Documents/Codex/2026-04-23-can-we-continue-with-my-app/contessa-core-v2-live/db/migrations/0001_contessa_core_foundation.sql)

## Important behavior

- Sharing never generates `file://` links or Windows file paths.
- The app rejects `localhost` as a production share URL.
- The map loads client-side only so server rendering does not break production builds.
- If map configuration is missing, the app shows a professional fallback instead of crashing.
