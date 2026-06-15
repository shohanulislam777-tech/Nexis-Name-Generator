# Nexis — Chrome Extension Licensing Platform

A complete SaaS licensing platform for Chrome Extensions. Nexis consists of three main components: a React+Vite admin panel, an Express API backend, and a production-ready Chrome Extension (MV3) targeting lovable.dev.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at `/api`)
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `DATABASE_URL`, `SESSION_SECRET`

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5, pino logging
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- Admin UI: React 19 + Vite + shadcn/ui + Tailwind v4, Recharts
- API codegen: Orval (from OpenAPI spec → React Query hooks + Zod schemas)
- Build: esbuild (CJS bundle)

## Where Things Live

```
lib/db/src/schema/          — Drizzle ORM tables (admins, plans, licenses, devices, notifications, activity_logs, settings)
lib/api-spec/openapi.yaml   — OpenAPI 3.1 spec (source of truth for API contract)
lib/api-client-react/       — Generated React Query hooks + Zod schemas
artifacts/api-server/src/   — Express API backend
  routes/auth.ts            — Admin auth (login/logout/me)
  routes/license-public.ts  — Public license endpoints (validate/activate/deactivate/check)
  routes/admin-*.ts         — Protected admin CRUD routes
  lib/auth.ts               — JWT, hashPassword, requireAdmin, generateLicenseKey
  lib/activity.ts           — Activity log helper
artifacts/admin/src/        — React admin panel
  pages/                    — All 13 pages (dashboard, licenses, license-detail, plans, users, devices, notifications, analytics, activity-logs, settings, login, not-found)
  components/layout.tsx     — Sidebar layout
  lib/auth.tsx              — Auth context + JWT management
extension/nexis/            — Chrome Extension (MV3)
  manifest.json             — Extension manifest
  background.js             — Service worker (proxy fetch, side panel)
  content.js                — Content script (injected into lovable.dev)
  license.js                — License validation system
  sidepanel.*               — Side panel HTML/CSS/JS
  lib/hwFingerprint.js      — Hardware device fingerprinting
```

## Architecture Decisions

- **Contract-first API**: OpenAPI spec → Orval codegen → typed React Query hooks. Never handwrite API calls.
- **Hand-rolled JWT**: HMAC-SHA256 with `SESSION_SECRET`, 7-day expiry. No jsonwebtoken package needed.
- **Denormalized users**: Users are derived from license `user_email/user_name` fields — no separate users table.
- **Device fingerprinting**: Multi-factor (WebGL GPU, Canvas 2D, OfflineAudioContext, fonts, screen metrics) hashed to SHA-256. Cached in `chrome.storage.local`.
- **Proxy fetch via background worker**: All API calls from the extension go through `background.js` to bypass CORS restrictions on lovable.dev.
- **Path-based routing**: Admin panel at `/` (port 23744), API at `/api` (port 8080), both proxied by the shared reverse proxy.

## Product

**For operators**: Full admin panel to create and manage software licenses, plans, users, and devices. Includes real-time analytics, activity logs, bulk license generation (up to 500 at a time), CSV export, and system settings.

**For end users**: Chrome Extension that gates access to lovable.dev features behind a license key. Uses hardware fingerprinting for device binding. Supports side panel and floating UI modes.

**License key format**: `NEXIS-XXXXXX-XXXXXX-XXXXXX-XXXXXX` (hex segments, generated with `crypto.randomBytes`)

**License statuses**: `active`, `trial`, `suspended`, `revoked`, `expired`

## Default Credentials

- Admin username: `admin`
- Admin password: `admin123`
- **Change these in production via a DB update.**

## User Preferences

_Populate as you build._

## Gotchas

- **Chrome Extension API URL**: Before loading the extension, update `NEXIS_API_BASE` in `extension/nexis/license.js`, `extension/nexis/content.js`, and `extension/nexis/sidepanel.js` to point to the deployed backend URL.
- **Extension icons**: The `extension/nexis/assets/` folder needs actual PNG icon files (icon16/32/48/128.png) before loading. Chrome will error without them.
- **DB schema push**: Always run `pnpm --filter @workspace/db run push` after schema changes before starting the API server.
- **Codegen after spec changes**: Run `pnpm --filter @workspace/api-spec run codegen` after editing `openapi.yaml`.
- **Do not run `pnpm dev` at workspace root** — each artifact runs via its own workflow with proper PORT/BASE_PATH env vars.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
- OpenAPI spec: `lib/api-spec/openapi.yaml`
- Drizzle config: `lib/db/drizzle.config.ts`
