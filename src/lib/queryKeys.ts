/**
 * Centralised React Query keys (CLAUDE.md §7). Company-scoped keys include `companyId` so a
 * company switch (D11) re-fetches automatically. Build keys ONLY through these factories so
 * mutations can invalidate precisely.
 */

export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  [key: string]: unknown;
}

export const queryKeys = {
  me: () => ['me'] as const,

  companies: {
    all: () => ['companies'] as const,
    list: (params?: ListParams) => ['companies', 'list', params ?? {}] as const,
    detail: (id: string) => ['companies', 'detail', id] as const,
  },

  payGroups: () => ['pay-groups'] as const,

  payElements: {
    all: (companyId: string) => ['pay-elements', companyId] as const,
    list: (companyId: string, params?: ListParams) =>
      ['pay-elements', companyId, 'list', params ?? {}] as const,
    detail: (companyId: string, id: string) =>
      ['pay-elements', companyId, 'detail', id] as const,
  },

  taxRuleSets: {
    all: () => ['tax-rule-sets'] as const,
    list: (asOfDate?: string) => ['tax-rule-sets', 'list', asOfDate ?? null] as const,
    detail: (id: string) => ['tax-rule-sets', 'detail', id] as const,
  },

  fnpfSchemes: {
    all: () => ['fnpf-schemes'] as const,
    list: (asOfDate?: string) => ['fnpf-schemes', 'list', asOfDate ?? null] as const,
  },

  payFrequencies: (companyId: string) => ['pay-frequencies', companyId] as const,
  payPeriods: (companyId: string, params?: ListParams) =>
    ['pay-periods', companyId, params ?? {}] as const,

  departments: (companyId: string) => ['departments', companyId] as const,
  offices: (companyId: string) => ['offices', companyId] as const,
  companyLookups: (resource: string, companyId: string) =>
    ['company-lookups', resource, companyId] as const,
  occupations: () => ['occupations'] as const,
  provinces: () => ['provinces'] as const,
  ethnicOrigins: () => ['ethnic-origins'] as const,

  // Employee-config lookups (Sprint 2 Epic 1) — tenant-wide, so no companyId in the key.
  contractTypes: () => ['contract-types'] as const,
  employmentStages: () => ['employment-stages'] as const,
  exitReasons: () => ['exit-reasons'] as const,
  tenantConfigLookups: (resource: string) => ['tenant-config-lookups', resource] as const,

  employees: {
    all: (companyId: string) => ['employees', companyId] as const,
    list: (companyId: string, params?: ListParams) =>
      ['employees', companyId, 'list', params ?? {}] as const,
    detail: (companyId: string, id: string) => ['employees', companyId, 'detail', id] as const,
    // Epic 4 lifecycle sub-resources — under detail so invalidating the employee subtree
    // refreshes them with it.
    engagements: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'engagements'] as const,
    contractTerms: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'contract-terms'] as const,
    stageHistory: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'stage-history'] as const,
    contractTypeHistory: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'contract-type-history'] as const,
    suspensionHistory: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'suspension-history'] as const,
    positionHistory: (companyId: string, id: string) =>
      ['employees', companyId, 'detail', id, 'position-history'] as const,
  },
} as const;
