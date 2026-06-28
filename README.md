# Fiji Payroll UI (`fijipayroll-ui`)

React front-end for the Fiji-compliant, multi-tenant **payroll & HRMS** platform. UI only — it
talks to the .NET 10 backend over REST, and runs **fully on mocks** (MSW) so UI and backend can
proceed in parallel. See [`CLAUDE.md`](./CLAUDE.md) for the full build brief and
[`docs/sprint-1-backlog.md`](./docs/sprint-1-backlog.md) for the current sprint.

## Stack

Vite + React 18 + TypeScript (strict) · Ant Design v5 · React Router v6 (data router) ·
TanStack Query v5 · Zod · Axios · Day.js · MSW · Vitest + React Testing Library ·
ESLint + Prettier.

## Getting started

```bash
npm install
npm run dev          # http://localhost:5173 — runs on MSW mocks by default
```

Sign in with the demo (mock) credentials:

> **Login code:** `ADMIN001` &nbsp;·&nbsp; **Password:** `password`

## Running with vs. without the backend (mock-first)

The whole app runs without a backend via **Mock Service Worker**. This is controlled by
`VITE_ENABLE_MSW`:

| Mode | Setting | Behaviour |
|---|---|---|
| **Mocks (default)** | `VITE_ENABLE_MSW=true` | MSW intercepts every `/api/v1/*` call and serves realistic seed data from `src/mocks/`. No backend needed. |
| **Real API** | `VITE_ENABLE_MSW=false` | Calls hit the .NET API. In dev, Vite proxies `/api` to `VITE_API_PROXY_TARGET` (default `http://localhost:5080`). |

Copy `.env.example` → `.env.local` to override. As each real endpoint lands you can flip MSW off
**per route** by removing/commenting its handler in `src/mocks/handlers.ts` — the React Query hooks
don't change because they're written against the contract, not the mock.

## The API contract (integration boundary)

The **canonical** Sprint 1 contract is OpenAPI 3.1 in the backend repo:
`../fijipayroll-api/docs/api-contract/openapi.yaml`. UI-side types in
[`src/types/api.ts`](./src/types/api.ts) mirror it by hand; regenerate the raw shapes anytime with:

```bash
npm run gen:api      # -> src/types/openapi.d.ts (reconcile drift into src/types/api.ts)
```

Any shape change is a PR to the canonical spec first, agreed by UI + API owners, then implemented
on both sides.

## Scripts

| Script | What it does |
|---|---|
| `npm run dev` | Vite dev server (MSW on by default) |
| `npm run build` | Type-check (`tsc -b`) + production build |
| `npm run preview` | Preview the production build |
| `npm run lint` | ESLint (zero warnings allowed) |
| `npm run format` / `format:check` | Prettier |
| `npm run typecheck` | `tsc -b --noEmit` |
| `npm run test` / `test:watch` | Vitest (unit/component) |
| `npm run gen:api` | Generate TS types from the OpenAPI contract |

## Project layout

Feature-first (see `CLAUDE.md` §3). Highlights:

```
src/
├── app/
│   ├── providers/   # Query, Theme(AntD), Auth, TenantCompany — composed in AppProviders
│   ├── layout/      # AppLayout (Sider + Topbar + company switcher), nav config
│   ├── routes/      # ProtectedRoute guard, RouteError boundary
│   ├── pages/       # Dashboard, Placeholder, 404
│   └── router.tsx
├── components/      # DataTable, FormDrawer, ConfirmDelete, EffectiveDateField, PageHeader, states
├── features/        # vertical slices (auth/ today; companies, pay-elements, … added per epic)
├── lib/             # apiClient (Axios), apiError, session, queryKeys, money, date, format, zodForm
├── mocks/           # MSW worker + handlers + seed data (mirrors the contract)
├── types/           # DTO types (mirror of the OpenAPI contract)
└── styles/          # theme tokens, global.css
```

## Multi-tenant & multi-company (D11)

The platform is **tenant (DB) → company (brand) → data**. After login the user has a tenant and
one-or-more companies (one `isPrimary`). The Topbar **company switcher** sets the active
`companyId`, which is persisted and sent on every API call via the `X-Company-Id` header; switching
invalidates company-scoped queries so lists refetch for the new brand. Tenant identity rides in the
JWT.

## Conventions

TypeScript strict, no `any`. Money/date formatting is centralised (`lib/money.ts`, `lib/date.ts`) —
**FJD** and **DD-MM-YYYY**; the backend is authoritative for all computed amounts. Query keys live
in `lib/queryKeys.ts`. Forms use AntD Form + Zod (`lib/zodForm.ts`). Tests co-locate as
`*.test.ts(x)`.
