# Contessa Core v2 Technical Upgrade Blueprint

This document defines the recommended production architecture for `Contessa Core v2`.

The goal is to preserve the current UI, workflows, and brand identity while replacing demo-only assumptions with a deployable, secure, offline-capable SaaS foundation.

## Core stack

- `Next.js` App Router
- `React`
- `TypeScript`
- `Tailwind CSS`
- `Supabase Auth`
- `Supabase Postgres`
- `Supabase Storage`
- `Vercel`
- `IndexedDB` for offline cache
- `localStorage` only for lightweight preferences

## System principles

1. UI should remain stable while the data layer is replaced underneath it.
2. Feature code should not call Supabase directly from screen components.
3. Real permissions must be enforced by backend membership + Row Level Security.
4. Offline changes should queue locally and sync later.
5. Missing optional services must degrade gracefully rather than crash the app.

## Target folder structure

```text
app/
  api/
    health/
    share/
    sync/
  (authenticated)/
    command-center/
    tasks-maintenance/
    route-planning/
    certificates-crew/
    expenses-approvals/
    documents/
    legal/
  layout.tsx
  page.tsx

components/
  branding/
  layout/
  map/
  mobile/
  ui/

features/
  command-center/
    components/
    hooks/
    server/
    types.ts
    utils.ts
  tasks/
  maintenance/
  route-planning/
  crew/
  certificates/
  expenses/
  approvals/
  documents/
  legal/
  settings/

lib/
  auth/
    permissions.ts
    roles.ts
    session.ts
  config/
    env.ts
    feature-flags.ts
  demoData/
  monitoring/
    logger.ts
    sentry.ts
  offline/
    connectivity.ts
    queue.ts
    service-worker/
  pwa/
    install.ts
    manifest.ts
  storage/
    local-cache.ts
    persistence.ts
    sync-queue.ts
  supabase/
    client.ts
    middleware.ts
    server.ts
  uploads/
    file-validation.ts
    image-processing.ts
    upload-client.ts
  utils/
  validation/
    schemas.ts

db/
  migrations/
  policies/
  seed/
  types/

tests/
  integration/
  smoke/
  unit/
```

## Environment strategy

The app should support these variables without hard failure when optional values are missing:

```env
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_MAP_STYLE_URL=
NEXT_PUBLIC_MAPTILER_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SENTRY_DSN=
```

## Runtime mode rules

### Demo mode

Used when Supabase is not configured.

- reads demo data from `lib/demoData`
- persists user work locally
- does not pretend to offer shared multi-user storage
- keeps role switch as a preview-only control

### Production mode

Used when Supabase environment variables are present.

- session comes from Supabase Auth
- role comes from `vessel_memberships`
- writes go through typed feature data modules
- uploads use Supabase Storage
- offline queue syncs against live backend data

## Feature architecture rules

Each feature should own:

- visual components
- hooks
- types
- server/data access methods
- feature utility functions

Each feature should avoid:

- direct global state mutation from random components
- direct browser storage writes inside UI components
- raw Supabase queries spread across unrelated files

## Authentication model

Auth should be built around:

- `profiles`
- `vessels`
- `vessel_memberships`

The active vessel membership determines access to all vessel-scoped data.

Roles:

- `owner`
- `manager`
- `captain`
- `first_mate`
- `engineer`
- `bosun`
- `deckhand`
- `stewardess`
- `guest`

## Permission model

Permissions should exist at two levels:

1. frontend visibility helpers
2. database-enforced rules via Supabase RLS

Frontend checks improve UX. RLS is the real security boundary.

## Offline-first model

### Local persistence

- `IndexedDB` stores entity cache and queued mutations
- `localStorage` stores theme, selected demo role, and low-risk UI preferences

### Sync behavior

- write locally first
- mark row as `pending_sync`
- retry when online
- server response becomes the source of truth

### Sync priorities

Start with:

1. tasks
2. maintenance
3. crew/certificates read cache
4. expenses
5. route draft state

## Upload model

Use Supabase Storage buckets:

- `task-attachments`
- `expense-receipts`
- `crew-documents`
- `certificates`
- `vessel-documents`

Uploads should:

- validate type and file size
- compress large images when useful
- store metadata in Postgres
- never depend on local file paths

## Audit model

Two tracks:

### Activity log

User-facing recent activity feed for the app UI.

### Audit log

Immutable system record of:

- create
- update
- delete
- approve
- reject
- upload

## PWA model

Phase 1:

- manifest
- service worker
- shell caching
- offline fallback page
- install support

Phase 2:

- background sync
- push notification delivery
- smarter cache invalidation

## Monitoring

Add:

- Sentry client monitoring
- Sentry server monitoring
- structured error context
- health endpoint

Track:

- map load failures
- auth failures
- upload failures
- sync failures
- runtime crashes

## Build and deployment

Use Vercel with:

- preview deploys for branches
- production deploys from `main`
- environment separation: `local`, `preview`, `production`

Required quality gates:

```text
npm install
npm run lint
npm run typecheck
npm run test
npm run build
```

## Recommended implementation order

1. foundation and env layer
2. Supabase schema
3. auth and vessel memberships
4. RLS policies
5. feature data-access modules
6. tasks and maintenance migration
7. crew and certificates migration
8. expenses, quotes, approvals migration
9. uploads
10. offline-first queue
11. audit and activity logs
12. PWA shell
13. monitoring
14. CI and deployment gates
