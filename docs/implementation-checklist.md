# Contessa Core v2 Implementation Checklist

This is the execution order for moving Contessa Core v2 from deployable demo to production-ready yacht operations SaaS.

## Phase 1 - Foundation

- [ ] Add `lib/config/env.ts` with safe environment parsing
- [ ] Add `lib/config/feature-flags.ts`
- [ ] Add `lib/supabase/client.ts`
- [ ] Add `lib/supabase/server.ts`
- [ ] Add `lib/supabase/middleware.ts`
- [ ] Add `lib/auth/roles.ts`
- [ ] Add `lib/auth/permissions.ts`
- [ ] Add typed app runtime mode: `demo`, `production`
- [ ] Add graceful backend availability detection

## Phase 2 - Database

- [ ] Create the initial migration from `db/migrations/0001_contessa_core_foundation.sql`
- [ ] Generate database types into `db/types`
- [ ] Add demo seed shape aligned to live schema
- [ ] Add indexes for high-frequency read paths

## Phase 3 - Authentication

- [ ] Enable Supabase Auth
- [ ] Add login/logout session handling
- [ ] Add `profiles` bootstrap
- [ ] Add `vessels` and `vessel_memberships`
- [ ] Resolve current vessel from membership
- [ ] Gate protected routes
- [ ] Keep demo role selector only in demo mode

## Phase 4 - Row Level Security

- [ ] Enable RLS on vessel-scoped tables
- [ ] Add read policies based on active membership
- [ ] Add write policies based on role
- [ ] Add stricter approval policies for `owner`, `manager`, `captain`
- [ ] Add guest read-only policy
- [ ] Add tests for unauthorized access paths

## Phase 5 - Tasks and Maintenance

- [ ] Create feature data modules for tasks
- [ ] Create feature data modules for maintenance
- [ ] Replace local demo writes with typed mutations
- [ ] Preserve current UI and interactions
- [ ] Add optimistic writes with rollback path
- [ ] Add sync-state badges to task and maintenance records

## Phase 6 - Crew and Certificates

- [ ] Create crew data queries and mutations
- [ ] Create certificate data queries and mutations
- [ ] Preserve current expiry logic and warning views
- [ ] Store uploaded certificate files through Supabase Storage
- [ ] Add document linkage to certificate records

## Phase 7 - Expenses, Quotes, and Approvals

- [ ] Create expense data queries and mutations
- [ ] Create quote data queries and mutations
- [ ] Create approval workflows
- [ ] Enforce selected-quote summary behavior at data layer
- [ ] Add role-based approval permissions
- [ ] Add approval activity logging

## Phase 8 - Route Planning

- [ ] Extract route-planning server/data helpers into a dedicated feature layer
- [ ] Persist routes and waypoints in Supabase
- [ ] Preserve client-only map rendering
- [ ] Keep graceful fallback when map config is missing
- [ ] Store vessel draft and under-keel safety settings
- [ ] Keep planning-only disclaimer visible

## Phase 9 - Offline-First

- [ ] Add IndexedDB cache
- [ ] Add mutation queue
- [ ] Add connectivity detection
- [ ] Add retry/replay behavior
- [ ] Add `pending`, `synced`, `failed` states
- [ ] Start with tasks and maintenance
- [ ] Extend to expenses and route drafts

## Phase 10 - Uploads and Documents

- [ ] Create storage buckets
- [ ] Add upload validation
- [ ] Add image compression where useful
- [ ] Store metadata rows in `documents`
- [ ] Link documents to tasks, expenses, certificates, vessel records
- [ ] Keep uploads portable across devices

## Phase 11 - Activity and Audit

- [ ] Add activity log insertions for user-facing feed
- [ ] Add audit log capture for writes
- [ ] Cover tasks, maintenance, expenses, approvals, certificates, documents, routes
- [ ] Expose recent activity in Command Center

## Phase 12 - PWA

- [ ] Add `manifest.json`
- [ ] Add service worker
- [ ] Add install prompt support
- [ ] Add offline fallback route
- [ ] Cache shell and last-used vessel state
- [ ] Prepare background sync support

## Phase 13 - Push-Ready Structure

- [ ] Create `device_registrations`
- [ ] Create `notification_preferences`
- [ ] Add permission request flow
- [ ] Define notification event types
- [ ] Add placeholder delivery pipeline for future edge functions

## Phase 14 - Monitoring and Ops

- [ ] Add Sentry client config
- [ ] Add Sentry server config
- [ ] Add health endpoint
- [ ] Add structured error logging
- [ ] Add route/map failure tracking
- [ ] Add upload and sync failure tracking

## Phase 15 - Build and Deployment Gates

- [ ] Add `npm run lint`
- [ ] Add `npm run typecheck`
- [ ] Add `npm run verify`
- [ ] Add CI workflow for install, lint, typecheck, test, build
- [ ] Keep Vercel production deployment tied to `main`
- [ ] Add preview deployment smoke checks

## First milestone definition

This is the first production milestone worth shipping internally:

- [ ] login works
- [ ] vessel membership works
- [ ] tasks load from Supabase
- [ ] maintenance loads from Supabase
- [ ] role permissions are enforced
- [ ] app still builds and deploys cleanly
- [ ] demo mode still works when backend config is absent

## Recommended immediate next tasks

1. Build the Supabase schema and database types.
2. Add auth and memberships.
3. Migrate tasks and maintenance first.
4. Add RLS tests before broad feature migration.
5. Add offline queue after the first live tables are stable.
