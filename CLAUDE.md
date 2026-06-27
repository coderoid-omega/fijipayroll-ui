# CLAUDE.md — Fiji Payroll UI (fijipayroll-ui)

> Build brief & repo context for **Claude Code in VS Code**. Read this first, then read the
> domain docs in `../Docs/` (especially the four named in §Reference docs). Build
> **production-grade** UI for the Fiji Payroll & HRMS platform.

## 1. What this is
The React front-end for a Fiji-compliant, multi-tenant payroll platform (backend is .NET 10 +
PostgreSQL, built separately). This repo is **UI only**; it talks to the backend over a REST API.
Phase 1 is payroll; the app is architected to grow into HRMS. Aesthetic/flow references are the
clickable HTML prototypes in `../Prototypes/` (payroll-run, admin-configuration, corrections).

## 2. Stack (decided — do not deviate without asking)
- **Vite + React 18 + TypeScript (strict)**. SPA, talks to the .NET API.
- **Ant Design (antd v5)** as the component library + **@ant-design/icons**. Use the AntD
  theme token system (ConfigProvider) — no ad-hoc CSS for things AntD tokens cover.
- **Routing:** React Router v6 (data routers).
- **Server state:** TanStack Query (React Query v5). **Client/UI state:** Zustand (light) or
  React context — avoid Redux unless a real need appears.
- **Forms:** AntD Form + **Zod** for schema validation (resolver pattern). One source of truth
  for validation, shared with TypeScript types.
- **HTTP:** a typed Axios client (`src/lib/apiClient.ts`) with interceptors for auth token +
  tenant/company headers + error normalisation.
- **Mock-first:** **MSW (Mock Service Worker)** so the UI runs fully **without the backend**.
  This is what lets UI and backend proceed in parallel — see §6.
- **Dates/money:** Day.js (AntD's default) for dates; a `Money`/currency util for **FJD**
  formatting and 2dp display. Never format currency ad-hoc.
- **Testing:** Vitest + React Testing Library (unit/component); Playwright optional for e2e later.
- **Lint/format:** ESLint (typescript-eslint) + Prettier. CI-friendly `npm run lint && build`.

## 3. Architecture — feature-first folder structure
```
src/
├── app/                # app shell: providers, router, layout (Sider+Header), theme
│   ├── providers/      # QueryClient, AntD ConfigProvider+theme, AuthProvider, TenantCompanyProvider
│   ├── layout/         # AppLayout, Sidebar, Topbar (tenant+company switcher), Breadcrumbs
│   └── router.tsx
├── features/           # one folder per domain feature (vertical slices)
│   ├── auth/
│   ├── companies/      # company/brand master (D11), primary flag
│   ├── employees/
│   ├── pay-elements/   # pay codes + 14 pay groups
│   ├── tax-config/     # tax rule sets (PAYE/SRT/ECAL), FNPF scheme
│   ├── pay-calendar/   # frequencies + managed calendar
│   └── ...             # (payroll run, corrections, payday filing — later sprints)
│       ├── api/        # query/mutation hooks (React Query) + DTO types
│       ├── components/ # feature-specific components
│       ├── pages/      # routed pages
│       └── schema.ts   # Zod schemas / types
├── components/         # shared, reusable UI (DataTable wrapper, PageHeader, FormDrawer, etc.)
├── lib/                # apiClient, money, date, query-keys, constants
├── mocks/              # MSW handlers + seed data (mirrors the API contract)
├── types/              # shared/domain TypeScript types (generated or hand-written from contract)
└── styles/             # theme tokens, global.css (minimal)
```
Rule: **features never import from each other's internals** — share via `components/`, `lib/`,
`types/`. Keep pages thin; logic in hooks.

## 4. Multi-tenant & multi-company (D11 — important)
The platform is **tenant (DB) → company (brand) → data**. The UI must be **company-aware**:
- After login, the user has a **tenant**; within it, **one or more companies** (one is
  `isPrimary`). The **Topbar has a company switcher**; the selected `companyId` is held in
  `TenantCompanyProvider` and **sent on every API call** (header `X-Company-Id`, tenant via the
  JWT). Persist the last-selected company (localStorage).
- Company-scoped data (employees, payroll runs, pay periods, most masters) is filtered by the
  active company. Statutory rule sets (PAYE/SRT/ECAL, FNPF) are likely **tenant-wide** — render
  them read-mostly and not company-switchable (confirm per `../Docs/Architecture-Decisions.md`
  D11). Each company has its **own FNPF#/TIN** and files its own outputs.
- Never assume one company. Components that list/edit company-scoped data must react to company
  switches (React Query keys include `companyId`).

## 5. Design system & UX bar
- **Theme:** AntD ConfigProvider with brand tokens — primary `#0a6ebd` (Fiji blue), success
  `#1f9d57`, warning `#c97a16`, error `#d14343`. Comfortable density; tabular numerals for money.
  Keep it clean and professional (see prototypes). One theme file: `src/styles/theme.ts`.
- **Layout:** fixed left Sider (collapsible) nav grouped by domain, Topbar with company switcher
  + user menu, content area with a consistent `PageHeader` (title, breadcrumbs, primary action).
- **Data tables:** a shared `DataTable` wrapper over AntD Table with server-side pagination,
  sort, filter, column config, empty/loading/error states, and row actions. Payroll is
  table-heavy — invest here.
- **Forms:** AntD Form + Zod; use **Drawers** for create/edit of master data, full pages for
  complex multi-tab records (employee). Inline validation, optimistic where safe, clear errors.
- **Effective-dated config UX:** for tax rule sets / FNPF / pay elements, surface an
  **"effective from" date** and show that edits create a new version; closed/historical data is
  immutable (mirror `../Prototypes/admin-configuration.html`).
- **States:** every list/detail handles loading (skeletons), empty, and error consistently.
- **Accessibility:** keyboard-navigable, proper labels, AA contrast. **i18n-ready** (wrap strings;
  default en-FJ). **Currency = FJD**, dates `DD-MM-YYYY` (Fiji convention) — centralise both.
- **Responsive:** desktop-first (it's an admin tool) but usable down to tablet.

## 6. API contract & parallel work with backend  ⭐
Backend (.NET 10) is built in parallel. To avoid blocking:
- **Contract-first.** For each Sprint-1 resource, the API shape is defined in
  `docs/api-contract/` (OpenAPI-style or typed `.ts`). UI and backend implement to the **same
  contract**. Treat the contract as the integration boundary.
- **MSW mocks** implement that contract in `src/mocks/` with realistic seed data (use the field
  lists and the 14 pay groups from `../Docs`). The whole app runs on mocks today.
- When a real endpoint lands, **flip MSW off for that route** — UI code (React Query hooks) does
  not change because it was written against the contract, not the mock.
- Keep DTO types in `src/types/` (later: generate from the backend's OpenAPI/Swagger).

## 7. Conventions
- TypeScript strict; no `any` (use `unknown` + narrowing). Functional components + hooks only.
- Query keys centralised in `lib/queryKeys.ts`. Mutations invalidate precisely.
- Money never as JS float for logic — display only; the backend is source of truth for amounts.
- Co-locate tests (`*.test.tsx`) with components. Cover the `DataTable`, forms, and money/date utils.
- Commit small, conventional commits; keep PRs per feature slice.

## 8. Reference docs (read these for field-level truth)
In `../Docs/`:
- `Architecture-Decisions.md` (D1–D11 — esp. **D11 multi-company**, D10 config-driven).
- `Fiji-Payroll-Domain-Reference.md` (statutory rules, **pay-element model & flags**).
- `Digipayroll Field Level Info.md` + `FijiPayroll2025-Desktop-App-Dissection.md` (employee
  fields, **14 pay groups**, YTD structure, company settings).
- `Development-Plan.md` (phases + UI/UX track) and `Fiji-Payroll-and-HRMS-BRD.md/.docx`.
Visual/flow references: `../Prototypes/*.html`.

## 9. Definition of done (every screen)
Typed against the contract; loading/empty/error states; company-aware; form validation (Zod);
accessible; responsive to tablet; FJD/date formatting centralised; runs on MSW mocks; lints &
builds clean; key logic has a test.

## 10. Current sprint
**Sprint 1 = Foundation + Configuration & Masters.** See `docs/sprint-1-backlog.md`.
Do NOT build payroll-run/engine or corrections UI yet (later sprints; depends on backend P2–P3).
