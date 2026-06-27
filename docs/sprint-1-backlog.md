# Fiji Payroll UI — Sprint 1 Backlog

> **Theme: Foundation + Configuration & Masters.** Runs in parallel with backend **P0–P1**
> (foundation + config & masters). UI builds against MSW mocks + a shared API contract, so no
> backend dependency blocks this sprint. Stack: Vite + React + TS + Ant Design + React Query +
> MSW. See `../CLAUDE.md`.

## Sprint goal
A running, production-grade SPA shell with authentication, tenant/**company** awareness (D11),
and the core **master-data** screens — all working end-to-end on mocked APIs, ready to flip to
the real .NET endpoints as they land.

---

## Epic 0 — Project foundation (do first)
- **0.1 Scaffold** Vite + React + TS; add antd, @ant-design/icons, react-router-dom,
  @tanstack/react-query, zustand, zod, axios, dayjs, msw; ESLint + Prettier; Vitest + RTL.
- **0.2 App shell**: `AppLayout` (collapsible Sider nav grouped by domain, Topbar, content),
  `PageHeader`, breadcrumbs, 404/error boundary.
- **0.3 Theme**: `styles/theme.ts` brand tokens (primary `#0a6ebd`), ConfigProvider, dark-mode-ready.
- **0.4 API layer**: `lib/apiClient.ts` (axios + auth/tenant/company headers + error normalise),
  `lib/queryKeys.ts`, React Query provider with sensible defaults.
- **0.5 MSW**: `mocks/` server + handlers + seed data (use field lists & 14 pay groups from `../Docs`).
- **0.6 Shared components**: `DataTable` (server pagination/sort/filter, loading/empty/error,
  row actions), `FormDrawer`, `ConfirmDelete`, `EffectiveDateField`, money/date formatters.
- **0.7 Utilities**: `lib/money.ts` (FJD), `lib/date.ts` (DD-MM-YYYY), `lib/format.ts`.

## Epic 1 — Auth & tenant/company context (D11)
- **1.1 Login** page (mock auth → token); protected routes; logout.
- **1.2 TenantCompanyProvider**: load the user's tenant + companies; hold active `companyId`;
  persist last choice. All queries key on `companyId`.
- **1.3 Company switcher** in the Topbar (shows companies; primary badge); switching refetches
  company-scoped data.

## Epic 2 — Company / Brand master (D11)  ⭐ headline of this sprint
- **2.1 Companies list** — table of companies (brands) in the tenant; `is_primary` badge; status.
- **2.2 Company create/edit** (Drawer/page): name, address, **FNPF employer #**, **FNPF check
  digit**, **TIN**, default pay codes (Normal/Director Fee/FNPF), round-to-5c, FNPF %s
  (employer 10 / employee 8), **Employer FNPF Excess Tax Exempt %**, feature flags.
- **2.3 Set primary** action (exactly one primary; guard the invariant in the UI).
- *(Source of fields: desktop "Company Details" — see `FijiPayroll2025-Desktop-App-Dissection.md` §2.)*

## Epic 3 — Pay Elements (Pay Codes + 14 Pay Groups)
- **3.1 Pay groups** reference view (the 14: PY/HP/FP/BK/DD/PD/MP/NT/TA/FB/LP/RP/BN/OO).
- **3.2 Pay elements list** — table (Code, Description, Group, Type, Rate, flags, status); filter by group.
- **3.3 Create/edit pay element** (Drawer): Group, Type (Hour/Dollar/%), **E-Rate** multiplier,
  tax-treatment flags (**PAYE-able, FNPF-able, one-time-for-tax**, pre/post tax), **goal-amount**
  option, **effective-from**. Mirror `../Prototypes/admin-configuration.html`.

## Epic 4 — Tax configuration (read-mostly, tenant-wide)
- **4.1 Tax rule sets**: effective-dated PAYE bands (resident + non-resident), SRT, ECAL —
  versioned, with an "effective from" and the immutability note. (Render editable behind a
  permission; default read view.)
- **4.2 FNPF scheme**: employee %, employer %, **excess-exempt threshold**, effective-dated.

## Epic 5 — Pay calendar & org lookups
- **5.1 Pay frequencies + managed calendar**: frequencies (Weekly/Fortnightly/Bi-monthly/Monthly),
  generated periods with system Pay#, statuses (read view this sprint).
- **5.2 Departments / Offices / Occupations** simple CRUD lists (per company).

## Stretch (only if ahead)
- Employee **list** (table) + read-only employee detail tabs scaffold (full employee CRUD is
  Sprint 2). This de-risks Sprint 2 without committing to the big form now.

---

## API contract for this sprint (define in `docs/api-contract/`)
Agree these resource shapes with the backend team so UI mocks == backend implementation:
`/companies` (CRUD + set-primary), `/pay-groups` (read), `/pay-elements` (CRUD, effective-dated),
`/tax-rule-sets` (read + versioned write), `/fnpf-schemes` (read + versioned write),
`/pay-frequencies` + `/pay-periods` (read), `/departments` `/offices` `/occupations` (CRUD),
`/auth/login`, `/me` (tenant + companies). All company-scoped lists accept the active company.

## Parallelisation with backend (P0–P1)
| Backend (P0–P1) | UI (this sprint) | Meet at |
|---|---|---|
| Foundation: tenancy, identity, DbContext, CI | Epic 0–1 shell, auth, company context | `/auth`, `/me` contract |
| Config & masters: company, pay elements, tax rule sets, FNPF, calendar, lookups | Epic 2–5 screens | the resource contracts above |

Sequence: lock the **contract** first → both sides build to it → integrate per-resource by
turning MSW off. No big-bang integration.

## Definition of done (sprint)
All screens run on MSW; company-aware; typed to the contract; loading/empty/error states;
Zod-validated forms; FJD/date formatting centralised; lints & builds clean; `DataTable`, forms,
and utils have tests; a short README on running with/without mocks.
