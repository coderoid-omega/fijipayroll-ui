# API Contract (pointer)

The **canonical** Sprint 1 API contract lives in the backend repo (the API owns the contract):

- Spec: `../../fijipayroll-api/docs/api-contract/openapi.yaml` (OpenAPI 3.1)
- Conventions: `../../fijipayroll-api/docs/api-contract/README.md`

**Use it like this in this UI repo:**
1. Generate TypeScript types from the spec (e.g. `openapi-typescript`) into `src/types/`.
2. Build **MSW** handlers in `src/mocks/` that satisfy the spec (seed realistic data — pay groups,
   default pay codes, a demo company, a tax rule set, an FNPF scheme).
3. Write React Query hooks against the generated types — **not** against the mock.
4. As each real endpoint lands, turn its MSW route off; UI code is unchanged.

Conventions to honour (full list in the backend README): JWT bearer auth, login by **`loginCode`**
(not email), `X-Company-Id` header on company-scoped calls, RFC 7807 `ProblemDetails` errors with
`errorCode`, `{items,total,page,pageSize}` paging, FJD money (server-authoritative) and
DD-MM-YYYY date display.

**Do not edit the contract here.** Any shape change is a PR to the canonical `openapi.yaml`,
agreed by UI + API owners, then implemented on both sides.
