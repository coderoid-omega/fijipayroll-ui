/**
 * MSW request handlers implementing the Sprint 1 contract
 * (../fijipayroll-api/docs/api-contract/openapi.yaml) against the in-memory seed.
 *
 * Conventions honoured: JWT bearer + X-Company-Id scope (D11), RFC 7807 problem+json errors
 * with stable errorCode, {items,total,page,pageSize} paging, bare arrays for reference lists.
 */
import { http, HttpResponse, type RequestHandler } from 'msw';
import { COMPANY_HEADER } from '@/lib/constants';
import type {
  Company,
  CompanyLookup,
  CompanyLookupWrite,
  CompanyWrite,
  Department,
  DepartmentWrite,
  Employee,
  EmployeeCreate,
  EmployeePatch,
  EnableLoginRequest,
  FnpfScheme,
  FnpfSchemeWrite,
  Lookup,
  LookupWrite,
  Office,
  OfficeWrite,
  PayElement,
  PayElementWrite,
  TaxRuleSet,
  TaxRuleSetWrite,
} from '@/types/api';
import { overallCompleteness } from '@/features/employees/profileCompleteness';
import {
  companies,
  contractTypes,
  departments,
  DEMO_CREDENTIALS,
  DEMO_TOKEN,
  divisions,
  documentTypes,
  employees,
  employmentStages,
  ethnicOrigins,
  exitReasons,
  fnpfSchemes,
  grades,
  levels,
  me,
  occupations,
  offices,
  relationshipTypes,
  sections,
  payElements,
  payFrequencies,
  payGroups,
  payPeriods,
  provinces,
  taxRuleSets,
  workPermitTypes,
} from './seed';

const BASE = '/api/v1';
const url = (path: string) => `${BASE}${path}`;

// ---- helpers ----

let idSeq = 1000;
function newId(prefix = 'g'): string {
  idSeq += 1;
  return `${prefix}0000000-0000-0000-0000-${String(idSeq).padStart(12, '0')}`;
}

function problem(
  status: number,
  errorCode: string,
  title: string,
  extra?: { detail?: string; errors?: Record<string, string[]> },
) {
  return HttpResponse.json(
    {
      type: 'about:blank',
      title,
      status,
      errorCode,
      traceId: newId('t'),
      detail: extra?.detail,
      errors: extra?.errors,
    },
    { status, headers: { 'Content-Type': 'application/problem+json' } },
  );
}

function requireAuth(request: Request) {
  const auth = request.headers.get('Authorization');
  return auth?.startsWith('Bearer ') ? auth.slice(7) : null;
}

function activeCompanyId(request: Request): string | null {
  return request.headers.get(COMPANY_HEADER);
}

function paginate<T>(items: T[], reqUrl: string) {
  const sp = new URL(reqUrl).searchParams;
  const page = Math.max(1, Number(sp.get('page') ?? '1'));
  const pageSize = Math.min(200, Math.max(1, Number(sp.get('pageSize') ?? '25')));
  const start = (page - 1) * pageSize;
  return {
    items: items.slice(start, start + pageSize),
    total: items.length,
    page,
    pageSize,
  };
}

function matchesSearch<T extends object>(item: T, search: string | null, fields: (keyof T)[]) {
  if (!search) return true;
  const q = search.toLowerCase();
  return fields.some((f) => String(item[f] ?? '').toLowerCase().includes(q));
}

// Small artificial latency so loading states are visible during development.
const LATENCY_MS = 250;
const delay = () => new Promise((r) => setTimeout(r, LATENCY_MS));

// Handlers are grouped per resource so integration can flip a single resource to the real API
// (see browser.ts + VITE_MSW_LIVE_RESOURCES) while the rest stay mocked.

export const authHandlers: RequestHandler[] = [
  // ---------------- AUTH ----------------
  http.post(url('/auth/login'), async ({ request }) => {
    await delay();
    const body = (await request.json()) as { loginCode?: string; password?: string };
    if (!body.loginCode || !body.password) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.loginCode ? {} : { loginCode: ['Login code is required'] }),
          ...(body.password ? {} : { password: ['Password is required'] }),
        },
      });
    }
    if (
      body.loginCode !== DEMO_CREDENTIALS.loginCode ||
      body.password !== DEMO_CREDENTIALS.password
    ) {
      return problem(401, 'INVALID_CREDENTIALS', 'Invalid login code or password');
    }
    return HttpResponse.json({ accessToken: DEMO_TOKEN, tokenType: 'Bearer', expiresIn: 3600 });
  }),

  http.get(url('/me'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    return HttpResponse.json(me);
  }),

];

export const companiesHandlers: RequestHandler[] = [
  // ---------------- COMPANIES (D11) ----------------
  http.get(url('/companies'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const search = new URL(request.url).searchParams.get('search');
    const filtered = companies.filter((c) => matchesSearch(c, search, ['code', 'name', 'legalName']));
    return HttpResponse.json(paginate(filtered, request.url));
  }),

  http.post(url('/companies'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const body = (await request.json()) as CompanyWrite;
    if (!body.code || !body.name) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.name ? {} : { name: ['Name is required'] }),
        },
      });
    }
    if (companies.some((c) => c.code.toLowerCase() === body.code.toLowerCase())) {
      return problem(409, 'COMPANY_CODE_DUPLICATE', 'A company with this code already exists');
    }
    const created: Company = {
      id: newId('c'),
      isPrimary: false,
      status: 'Active',
      roundTo5cMode: body.roundTo5cMode ?? 'None',
      autoAddFnpfPayCode: body.autoAddFnpfPayCode ?? true,
      enablePaydayReporting: body.enablePaydayReporting ?? true,
      audit: { createdAt: new Date().toISOString(), createdBy: me.displayName, updatedAt: null, updatedBy: null },
      ...body,
    };
    companies.push(created);
    return HttpResponse.json(created, { status: 201, headers: { Location: url(`/companies/${created.id}`) } });
  }),

  http.get(url('/companies/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const company = companies.find((c) => c.id === params.id);
    if (!company) return problem(404, 'COMPANY_NOT_FOUND', 'Company not found');
    return HttpResponse.json(company);
  }),

  http.put(url('/companies/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = companies.findIndex((c) => c.id === params.id);
    if (idx === -1) return problem(404, 'COMPANY_NOT_FOUND', 'Company not found');
    const body = (await request.json()) as CompanyWrite;
    if (
      companies.some((c) => c.id !== params.id && c.code.toLowerCase() === body.code.toLowerCase())
    ) {
      return problem(409, 'COMPANY_CODE_DUPLICATE', 'A company with this code already exists');
    }
    const existing = companies[idx]!;
    const updated: Company = {
      ...existing,
      ...body,
      id: existing.id,
      isPrimary: existing.isPrimary,
      status: existing.status,
      audit: { ...existing.audit!, updatedAt: new Date().toISOString(), updatedBy: me.displayName },
    };
    companies[idx] = updated;
    return HttpResponse.json(updated);
  }),

  http.post(url('/companies/:id/set-primary'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const target = companies.find((c) => c.id === params.id);
    if (!target) return problem(404, 'COMPANY_NOT_FOUND', 'Company not found');
    // Enforce the invariant: exactly one primary.
    companies.forEach((c) => {
      c.isPrimary = c.id === params.id;
    });
    me.companies = companies.map((c) => ({ id: c.id, code: c.code, name: c.name, isPrimary: c.isPrimary }));
    return new HttpResponse(null, { status: 204 });
  }),

];

export const payElementsHandlers: RequestHandler[] = [
  // ---------------- PAY GROUPS & ELEMENTS ----------------
  http.get(url('/pay-groups'), async () => {
    await delay();
    return HttpResponse.json(payGroups);
  }),

  http.get(url('/pay-elements'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    if (!companyId) return problem(400, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
    const sp = new URL(request.url).searchParams;
    const group = sp.get('payGroupCode');
    const search = sp.get('search');
    const filtered = payElements
      .filter((e) => e.companyId === companyId)
      .filter((e) => (group ? e.payGroupCode === group : true))
      .filter((e) => matchesSearch(e, search, ['code', 'description']));
    return HttpResponse.json(paginate(filtered, request.url));
  }),

  http.post(url('/pay-elements'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    if (!companyId) return problem(400, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
    const body = (await request.json()) as PayElementWrite;
    if (!body.code || !body.description) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.description ? {} : { description: ['Description is required'] }),
        },
      });
    }
    if (payElements.some((e) => e.companyId === companyId && e.code === body.code)) {
      return problem(409, 'PAY_ELEMENT_CODE_DUPLICATE', 'A pay element with this code already exists');
    }
    const created: PayElement = {
      id: newId('e'),
      companyId,
      status: 'Active',
      eRate: body.eRate ?? 1,
      isPayeAble: body.isPayeAble ?? true,
      isFnpfAble: body.isFnpfAble ?? true,
      isOneTimeForTax: body.isOneTimeForTax ?? false,
      isPreTax: body.isPreTax ?? false,
      isPostTax: body.isPostTax ?? false,
      showOnPayslip: body.showOnPayslip ?? true,
      hasGoalAmount: body.hasGoalAmount ?? false,
      quickEntryColumnNo: body.quickEntryColumnNo ?? null,
      audit: { createdAt: new Date().toISOString(), createdBy: me.displayName, updatedAt: null, updatedBy: null },
      ...body,
    };
    payElements.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.get(url('/pay-elements/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const found = payElements.find((e) => e.id === params.id);
    if (!found) return problem(404, 'PAY_ELEMENT_NOT_FOUND', 'Pay element not found');
    return HttpResponse.json(found);
  }),

  http.put(url('/pay-elements/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = payElements.findIndex((e) => e.id === params.id);
    if (idx === -1) return problem(404, 'PAY_ELEMENT_NOT_FOUND', 'Pay element not found');
    const body = (await request.json()) as PayElementWrite;
    const existing = payElements[idx]!;
    const updated: PayElement = {
      ...existing,
      ...body,
      id: existing.id,
      companyId: existing.companyId,
      audit: { ...existing.audit!, updatedAt: new Date().toISOString(), updatedBy: me.displayName },
    };
    payElements[idx] = updated;
    return HttpResponse.json(updated);
  }),

];

export const statutoryHandlers: RequestHandler[] = [
  // ---------------- STATUTORY (tenant-wide) ----------------
  http.get(url('/tax-rule-sets'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const asOf = new URL(request.url).searchParams.get('asOfDate');
    const list = asOf
      ? taxRuleSets.filter((t) => t.validFrom <= asOf && (!t.validTo || t.validTo >= asOf))
      : taxRuleSets;
    return HttpResponse.json(list);
  }),

  http.get(url('/tax-rule-sets/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const found = taxRuleSets.find((t) => t.id === params.id);
    if (!found) return problem(404, 'TAX_RULE_SET_NOT_FOUND', 'Tax rule set not found');
    return HttpResponse.json(found);
  }),

  http.post(url('/tax-rule-sets'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const body = (await request.json()) as TaxRuleSetWrite;
    if (!body.code || !body.validFrom || !body.brackets?.length) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.validFrom ? {} : { validFrom: ['Effective-from date is required'] }),
          ...(body.brackets?.length ? {} : { brackets: ['At least one bracket is required'] }),
        },
      });
    }
    if (taxRuleSets.some((t) => t.code.toLowerCase() === body.code.toLowerCase())) {
      return problem(409, 'TAX_RULE_SET_CODE_DUPLICATE', 'A rule set with this code already exists');
    }
    const status = body.status ?? 'Active';
    // Activating supersedes the current active set (stamp validTo, mark immutable).
    if (status === 'Active') {
      taxRuleSets.forEach((t) => {
        if (t.status === 'Active') {
          t.status = 'Superseded';
          t.validTo = body.validFrom;
        }
      });
    }
    const created: TaxRuleSet = {
      id: newId('a'),
      code: body.code,
      description: body.description ?? null,
      validFrom: body.validFrom,
      validTo: null,
      status,
      brackets: body.brackets.map((b, i) => ({ ...b, id: newId('d') + i })),
    };
    taxRuleSets.push(created);
    return HttpResponse.json(created, {
      status: 201,
      headers: { Location: url(`/tax-rule-sets/${created.id}`) },
    });
  }),

  http.put(url('/tax-rule-sets/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = taxRuleSets.findIndex((t) => t.id === params.id);
    if (idx === -1) return problem(404, 'TAX_RULE_SET_NOT_FOUND', 'Tax rule set not found');
    const existing = taxRuleSets[idx]!;
    if (existing.status === 'Superseded') {
      return problem(409, 'TAX_RULE_SET_IMMUTABLE', 'A superseded rule set is immutable');
    }
    const body = (await request.json()) as TaxRuleSetWrite;
    const newStatus = body.status ?? existing.status;
    // Activating a Draft supersedes the current active rule set (excluding this one).
    if (newStatus === 'Active' && existing.status !== 'Active') {
      taxRuleSets.forEach((t) => {
        if (t.id !== existing.id && t.status === 'Active') {
          t.status = 'Superseded';
          t.validTo = body.validFrom;
        }
      });
    }
    const updated: TaxRuleSet = {
      ...existing,
      code: body.code,
      description: body.description ?? null,
      validFrom: body.validFrom,
      status: newStatus,
      brackets: body.brackets.map((b, i) => ({ ...b, id: newId('d') + i })),
    };
    taxRuleSets[idx] = updated;
    return HttpResponse.json(updated);
  }),

  http.get(url('/fnpf-schemes'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const asOf = new URL(request.url).searchParams.get('asOfDate');
    const list = asOf
      ? fnpfSchemes.filter((s) => s.validFrom <= asOf && (!s.validTo || s.validTo >= asOf))
      : fnpfSchemes;
    return HttpResponse.json(list);
  }),

  http.get(url('/fnpf-schemes/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const found = fnpfSchemes.find((s) => s.id === params.id);
    if (!found) return problem(404, 'FNPF_SCHEME_NOT_FOUND', 'FNPF scheme not found');
    return HttpResponse.json(found);
  }),

  http.post(url('/fnpf-schemes'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const body = (await request.json()) as FnpfSchemeWrite;
    if (!body.validFrom || body.employeePct == null || body.employerPct == null) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.validFrom ? {} : { validFrom: ['Effective-from date is required'] }),
          ...(body.employeePct != null ? {} : { employeePct: ['Employee % is required'] }),
          ...(body.employerPct != null ? {} : { employerPct: ['Employer % is required'] }),
        },
      });
    }
    const status = body.status ?? 'Active';
    // Only an activated version supersedes the current active scheme; a Draft does not.
    if (status === 'Active') {
      fnpfSchemes.forEach((s) => {
        if (s.status === 'Active') {
          s.status = 'Superseded';
          s.validTo = body.validFrom;
        }
      });
    }
    const created: FnpfScheme = {
      id: newId('b'),
      validFrom: body.validFrom,
      validTo: null,
      employeePct: body.employeePct,
      employerPct: body.employerPct,
      voluntaryPct: body.voluntaryPct ?? 0,
      employerExcessExemptPct: body.employerExcessExemptPct,
      wageCeiling: body.wageCeiling ?? null,
      status,
    };
    fnpfSchemes.push(created);
    return HttpResponse.json(created, {
      status: 201,
      headers: { Location: url(`/fnpf-schemes/${created.id}`) },
    });
  }),

  http.put(url('/fnpf-schemes/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = fnpfSchemes.findIndex((s) => s.id === params.id);
    if (idx === -1) return problem(404, 'FNPF_SCHEME_NOT_FOUND', 'FNPF scheme not found');
    const existing = fnpfSchemes[idx]!;
    if (existing.status === 'Superseded') {
      return problem(409, 'FNPF_SCHEME_IMMUTABLE', 'A superseded scheme is immutable');
    }
    const body = (await request.json()) as FnpfSchemeWrite;
    const newStatus = body.status ?? existing.status;
    // Activating a Draft supersedes the current active scheme (excluding this one).
    if (newStatus === 'Active' && existing.status !== 'Active') {
      fnpfSchemes.forEach((s) => {
        if (s.id !== existing.id && s.status === 'Active') {
          s.status = 'Superseded';
          s.validTo = body.validFrom;
        }
      });
    }
    fnpfSchemes[idx] = {
      ...existing,
      validFrom: body.validFrom,
      employeePct: body.employeePct,
      employerPct: body.employerPct,
      voluntaryPct: body.voluntaryPct ?? 0,
      employerExcessExemptPct: body.employerExcessExemptPct,
      wageCeiling: body.wageCeiling ?? null,
      status: newStatus,
    };
    return HttpResponse.json(fnpfSchemes[idx]);
  }),

];

export const payCalendarHandlers: RequestHandler[] = [
  // ---------------- PAY CALENDAR (company-scoped) ----------------
  http.get(url('/pay-frequencies'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    return HttpResponse.json(payFrequencies.filter((f) => f.companyId === companyId));
  }),

  http.get(url('/pay-periods'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    const sp = new URL(request.url).searchParams;
    const year = sp.get('payYear');
    const freq = sp.get('payFrequencyId');
    const list = payPeriods
      .filter((p) => p.companyId === companyId)
      .filter((p) => (year ? p.payYear === Number(year) : true))
      .filter((p) => (freq ? p.payFrequencyId === freq : true));
    return HttpResponse.json(list);
  }),

];

/** Routes for one company-scoped org-structure master (division/section/grade/level) —
 * mirrors the API: name required + unique per company; code optional + unique per company. */
function companyLookupRoutes(
  path: string,
  store: CompanyLookup[],
  slug: string,
  label: string,
  idPrefix: string,
): RequestHandler[] {
  const normalizeCode = (code?: string | null) => (code?.trim() ? code.trim() : null);
  return [
    http.get(url(path), async ({ request }) => {
      await delay();
      if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
      const companyId = activeCompanyId(request);
      return HttpResponse.json(store.filter((x) => x.companyId === companyId));
    }),

    http.post(url(path), async ({ request }) => {
      await delay();
      if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
      const companyId = activeCompanyId(request);
      if (!companyId) return problem(400, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
      const body = (await request.json()) as CompanyLookupWrite;
      if (!body.name?.trim()) {
        return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
          errors: { name: ['Name is required'] },
        });
      }
      const code = normalizeCode(body.code);
      if (code && store.some((x) => x.companyId === companyId && x.code?.toLowerCase() === code.toLowerCase())) {
        return problem(409, `${slug}_CODE_DUPLICATE`, `A ${label} with code '${code}' already exists for this company.`);
      }
      if (store.some((x) => x.companyId === companyId && x.name.toLowerCase() === body.name.trim().toLowerCase())) {
        return problem(409, `${slug}_NAME_DUPLICATE`, `A ${label} named '${body.name.trim()}' already exists for this company.`);
      }
      const created: CompanyLookup = { id: newId(idPrefix), companyId, status: 'Active', code, name: body.name.trim() };
      store.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.put(url(`${path}/:id`), async ({ request, params }) => {
      await delay();
      if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
      const companyId = activeCompanyId(request);
      const idx = store.findIndex((x) => x.id === params.id && x.companyId === companyId);
      if (idx === -1) return problem(404, `${slug}_NOT_FOUND`, `${label} not found`);
      const body = (await request.json()) as CompanyLookupWrite;
      store[idx] = { ...store[idx]!, code: normalizeCode(body.code), name: body.name?.trim() ?? store[idx]!.name };
      return HttpResponse.json(store[idx]);
    }),
  ];
}

/** CRUD routes for a tenant-wide employee-config lookup (Sprint 2 Epic 1 — no X-Company-Id,
 * OQ-24). Serves both the plain Lookup trio (work-permit / relationship / document types) and the
 * richer contract-type / employment-stage / exit-reason shapes: extra fields fall back to
 * `defaults` on create and spread over the row on update. */
function tenantLookupRoutes<T extends Lookup>(
  path: string,
  store: T[],
  slug: string,
  label: string,
  idPrefix: string,
  defaults: Omit<T, keyof Lookup>,
): RequestHandler[] {
  return [
    http.get(url(path), async () => {
      await delay();
      return HttpResponse.json(store);
    }),

    http.post(url(path), async ({ request }) => {
      await delay();
      if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
      const body = (await request.json()) as LookupWrite & Partial<T>;
      if (!body.code || !body.name) {
        return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
          errors: {
            ...(body.code ? {} : { code: ['Code is required'] }),
            ...(body.name ? {} : { name: ['Name is required'] }),
          },
        });
      }
      if (store.some((x) => x.code.toLowerCase() === body.code.toLowerCase())) {
        return problem(409, `${slug}_CODE_DUPLICATE`, `A ${label} with code '${body.code}' already exists.`);
      }
      const created = { ...defaults, ...body, id: newId(idPrefix) } as T;
      store.push(created);
      return HttpResponse.json(created, { status: 201 });
    }),

    http.put(url(`${path}/:id`), async ({ request, params }) => {
      await delay();
      if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
      const idx = store.findIndex((x) => x.id === params.id);
      if (idx === -1) return problem(404, `${slug}_NOT_FOUND`, `${label} not found`);
      const body = (await request.json()) as Partial<T>;
      store[idx] = { ...store[idx]!, ...body, id: store[idx]!.id };
      return HttpResponse.json(store[idx]);
    }),
  ];
}

export const orgLookupsHandlers: RequestHandler[] = [
  // ---------------- ORG LOOKUPS ----------------
  http.get(url('/departments'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    return HttpResponse.json(departments.filter((d) => d.companyId === companyId));
  }),

  http.post(url('/departments'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    if (!companyId) return problem(400, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
    const body = (await request.json()) as DepartmentWrite;
    if (!body.code || !body.name) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.name ? {} : { name: ['Name is required'] }),
        },
      });
    }
    const created: Department = {
      id: newId('de'),
      companyId,
      status: 'Active',
      parentDepartmentId: body.parentDepartmentId ?? null,
      headEmployeeId: body.headEmployeeId ?? null,
      code: body.code,
      name: body.name,
    };
    departments.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(url('/departments/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = departments.findIndex((d) => d.id === params.id);
    if (idx === -1) return problem(404, 'DEPARTMENT_NOT_FOUND', 'Department not found');
    const body = (await request.json()) as DepartmentWrite;
    departments[idx] = { ...departments[idx]!, ...body };
    return HttpResponse.json(departments[idx]);
  }),

  http.get(url('/offices'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    return HttpResponse.json(offices.filter((o) => o.companyId === companyId));
  }),

  http.post(url('/offices'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    if (!companyId) return problem(400, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
    const body = (await request.json()) as OfficeWrite;
    if (!body.code || !body.name) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.name ? {} : { name: ['Name is required'] }),
        },
      });
    }
    if (offices.some((o) => o.companyId === companyId && o.code.toLowerCase() === body.code.toLowerCase())) {
      return problem(409, 'OFFICE_CODE_DUPLICATE', `An office with code '${body.code}' already exists for this company.`);
    }
    const created: Office = { id: newId('of'), companyId, status: 'Active', code: body.code, name: body.name };
    offices.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(url('/offices/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    const idx = offices.findIndex((o) => o.id === params.id && o.companyId === companyId);
    if (idx === -1) return problem(404, 'OFFICE_NOT_FOUND', 'Office not found');
    const body = (await request.json()) as OfficeWrite;
    offices[idx] = { ...offices[idx]!, ...body };
    return HttpResponse.json(offices[idx]);
  }),

  http.get(url('/occupations'), async () => {
    await delay();
    return HttpResponse.json(occupations);
  }),

  http.post(url('/occupations'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const body = (await request.json()) as LookupWrite;
    if (!body.code || !body.name) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: {
          ...(body.code ? {} : { code: ['Code is required'] }),
          ...(body.name ? {} : { name: ['Name is required'] }),
        },
      });
    }
    if (occupations.some((o) => o.code.toLowerCase() === body.code.toLowerCase())) {
      return problem(409, 'OCCUPATION_CODE_DUPLICATE', `An occupation with code '${body.code}' already exists.`);
    }
    const created: Lookup = { id: newId('oc'), code: body.code, name: body.name };
    occupations.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.put(url('/occupations/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const idx = occupations.findIndex((o) => o.id === params.id);
    if (idx === -1) return problem(404, 'OCCUPATION_NOT_FOUND', 'Occupation not found');
    const body = (await request.json()) as LookupWrite;
    occupations[idx] = { ...occupations[idx]!, ...body };
    return HttpResponse.json(occupations[idx]);
  }),

  ...companyLookupRoutes('/divisions', divisions, 'DIVISION', 'division', 'dv'),
  ...companyLookupRoutes('/sections', sections, 'SECTION', 'section', 'se'),
  ...companyLookupRoutes('/grades', grades, 'GRADE', 'grade', 'gr'),
  ...companyLookupRoutes('/levels', levels, 'LEVEL', 'level', 'lv'),

  // Employee-config lookups (Sprint 2 Epic 1) — tenant-wide, no X-Company-Id (OQ-24).
  ...tenantLookupRoutes('/contract-types', contractTypes, 'CONTRACT_TYPE', 'contract type', 'ct', {
    isFixedTerm: false,
    status: 'Active',
  }),
  ...tenantLookupRoutes('/employment-stages', employmentStages, 'EMPLOYMENT_STAGE', 'employment stage', 'es', {
    ordinal: 0,
    isProbationary: false,
    status: 'Active',
  }),
  ...tenantLookupRoutes('/exit-reasons', exitReasons, 'EXIT_REASON', 'exit reason', 'xr', {
    initiator: 'Employer',
    severanceEligible: false,
    noticeRequired: true,
    rehireEligible: true,
    status: 'Active',
  }),
  ...tenantLookupRoutes('/work-permit-types', workPermitTypes, 'WORK_PERMIT_TYPE', 'work-permit type', 'wp', {}),
  ...tenantLookupRoutes('/relationship-types', relationshipTypes, 'RELATIONSHIP_TYPE', 'relationship type', 'rt', {}),
  ...tenantLookupRoutes('/document-types', documentTypes, 'DOCUMENT_TYPE', 'document type', 'dt', {}),

  http.get(url('/provinces'), async () => {
    await delay();
    return HttpResponse.json(provinces);
  }),

  http.get(url('/ethnic-origins'), async () => {
    await delay();
    return HttpResponse.json(ethnicOrigins);
  }),

];

export const employeesHandlers: RequestHandler[] = [
  // ---------------- EMPLOYEES (read; stretch) ----------------
  http.get(url('/employees'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    const search = new URL(request.url).searchParams.get('search');
    const filtered = employees
      .filter((e) => e.companyId === companyId)
      .filter((e) => matchesSearch(e, search, ['employeeCode', 'displayName', 'tin', 'fnpfNo']));
    return HttpResponse.json(paginate(filtered, request.url));
  }),

  http.get(url('/employees/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    // Company-scoped like the real API: a cross-company id does not resolve (404, never 403).
    const companyId = activeCompanyId(request);
    const found = employees.find((e) => e.id === params.id && e.companyId === companyId);
    if (!found) return problem(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');
    return HttpResponse.json(found);
  }),

  // ---------------- EMPLOYEES (write; Sprint 2 Epic 2) ----------------
  http.post(url('/employees'), async ({ request }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    if (!companyId) return problem(422, 'COMPANY_HEADER_REQUIRED', 'X-Company-Id header is required');
    const body = (await request.json()) as EmployeeCreate;
    if (!body.firstName || !body.lastName || !body.contractTypeId || !body.dateOfHire || !body.payType || !body.taxCode) {
      return problem(422, 'VALIDATION_FAILED', 'Validation failed', {
        errors: { firstName: ['The minimal core is required'] },
      });
    }

    // employee_code: manual override → 409 on duplicate; omitted → next from the mock sequence.
    let employeeCode = body.employeeCode?.trim() || '';
    const taken = (code: string) =>
      employees.some((e) => e.companyId === companyId && e.employeeCode.toLowerCase() === code.toLowerCase());
    if (employeeCode) {
      if (taken(employeeCode))
        return problem(409, 'EMPLOYEE_CODE_DUPLICATE', `An employee with code '${employeeCode}' already exists in this company.`);
    } else {
      let n = employees.filter((e) => e.companyId === companyId).length + 1;
      while (taken(`EMP${String(n).padStart(3, '0')}`)) n += 1;
      employeeCode = `EMP${String(n).padStart(3, '0')}`;
    }

    const created: Employee = {
      id: newId('em'),
      companyId,
      employeeCode,
      loginCode: null,        // enable-login (Epic 3) — never set at onboarding
      displayName: body.displayName?.trim() || `${body.firstName} ${body.lastName}`,
      firstName: body.firstName,
      lastName: body.lastName,
      middleName: body.middleName ?? null,
      status: 'Active',
      canLogin: false,
      contractTypeId: body.contractTypeId,
      stageId: body.stageId ?? null,
      dateOfHire: body.dateOfHire,
      payType: body.payType,
      hourlyRate: body.hourlyRate ?? null,
      salaryPerPeriod: body.salaryPerPeriod ?? null,
      payFrequencyId: body.payFrequencyId ?? null,
      taxCode: body.taxCode,
      taxType: 'Resident',
      tin: body.tin ?? null,
      fnpfNo: body.fnpfNo ?? null,
      dateOfBirth: body.dateOfBirth ?? null,
      paymentMethod: null,
      isGrossUp: false,
      useSpecialTaxRate: false,
      suspension: null,
      audit: { createdAt: new Date().toISOString(), createdBy: 'mock', updatedAt: null, updatedBy: null },
    };
    created.profileCompleteness = overallCompleteness(created);
    employees.push(created);
    return HttpResponse.json(created, { status: 201 });
  }),

  http.patch(url('/employees/:id'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    const idx = employees.findIndex((e) => e.id === params.id && e.companyId === companyId);
    if (idx === -1) return problem(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');

    const body = (await request.json()) as EmployeePatch;
    if (body.employeeCode !== undefined) {
      const dup = employees.some(
        (e) => e.companyId === companyId && e.id !== params.id &&
          e.employeeCode.toLowerCase() === body.employeeCode!.toLowerCase());
      if (dup) return problem(409, 'EMPLOYEE_CODE_DUPLICATE', `An employee with code '${body.employeeCode}' already exists in this company.`);
    }

    // Merge-patch: absent = unchanged; explicit null clears (the spread keeps nulls).
    const merged: Employee = { ...employees[idx]!, ...body } as Employee;
    merged.displayName = merged.displayName?.trim() || `${merged.firstName} ${merged.lastName}`;
    merged.profileCompleteness = overallCompleteness(merged);
    employees[idx] = merged;
    return HttpResponse.json(merged);
  }),

  // ---------------- ENABLE-LOGIN (Sprint 2 Epic 3) ----------------
  // Assigns the global login CODE only — no credential, so canLogin stays false
  // ("credentials pending"). Immutable once set; collisions are global.
  http.post(url('/employees/:id/enable-login'), async ({ request, params }) => {
    await delay();
    if (!requireAuth(request)) return problem(401, 'UNAUTHORIZED', 'Missing/invalid token');
    const companyId = activeCompanyId(request);
    const idx = employees.findIndex((e) => e.id === params.id && e.companyId === companyId);
    if (idx === -1) return problem(404, 'EMPLOYEE_NOT_FOUND', 'Employee not found');
    const employee = employees[idx]!;

    if (employee.loginCode) {
      return problem(409, 'LOGIN_ALREADY_ENABLED',
        `This employee already has login code '${employee.loginCode}' — it is immutable and never reused.`);
    }

    const body = (await request.json().catch(() => null)) as EnableLoginRequest | null;
    const companyCode = companies.find((c) => c.id === companyId)?.code ?? 'MAIN';
    const loginCode = body?.loginCode?.trim() || `${companyCode}-${employee.employeeCode}`;

    // Global uniqueness (app_user.login_code UNIQUE) — every assigned code counts.
    if (employees.some((e) => e.loginCode?.toLowerCase() === loginCode.toLowerCase())) {
      return problem(409, 'LOGIN_CODE_TAKEN', `Login code '${loginCode}' is already in use.`);
    }

    employees[idx] = { ...employee, loginCode, canLogin: false };
    return HttpResponse.json(employees[idx]);
  }),
];

/**
 * Handlers keyed by resource. A resource listed in VITE_MSW_LIVE_RESOURCES is dropped from the
 * worker so its requests fall through to the real API (see browser.ts). The keys match the epic
 * names in the integration plan.
 */
export const handlersByResource: Record<string, RequestHandler[]> = {
  auth: authHandlers,
  companies: companiesHandlers,
  'pay-elements': payElementsHandlers,
  statutory: statutoryHandlers,
  'pay-calendar': payCalendarHandlers,
  'org-lookups': orgLookupsHandlers,
  employees: employeesHandlers,
};

/** All mock handlers (every resource). Used by tests and as the default full-mock set. */
export const handlers: RequestHandler[] = Object.values(handlersByResource).flat();
