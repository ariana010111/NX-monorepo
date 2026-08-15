# Validation Report — Beauty Platform Architecture

Everything below was run against the real Nx v23.1.1 / Angular / NestJS / Prisma
toolchain in a clean workspace, not asserted from the hand-written scaffold.
Every fix listed was a genuine failure the tooling produced.

## 1. Nx workspace — PASS
- Real `create-nx-workspace`, `@nx/angular`, `@nx/nest` added via `nx add`.
- Three real apps (`api`, `storefront` w/ SSR, `admin` CSR-only) + 8 real libs,
  all generated via actual Nx generators, not hand-written project.json files.
- `nx show projects` correctly lists all 11 projects.
- TypeScript path aliases resolve correctly (auto-derived as
  `@beauty-platform-validated/*` — see "Problems found," item 7).
- `nx graph` loads cleanly; no circular dependencies.
- `nx affected` correctly scoped to exactly the right projects (proven in
  section 5).

## 2. Dependency boundaries — PASS, all six cases individually proven
Each of these was tested by actually adding the forbidden import, running
`nx lint`, confirming a real error, then reverting:

| Forbidden import | Result |
|---|---|
| storefront → admin | ✅ blocked — `@nx/enforce-module-boundaries` error |
| admin → storefront | ✅ blocked — caught by the `type:data-access` constraint even before the scope constraint |
| shared/ui → feature | ✅ blocked — scope:shared cannot depend on scope:storefront |
| feature → unrelated feature | ✅ blocked, **after a real fix** — see "Problems found," item 8 |
| Prisma → controller | ✅ blocked — `no-restricted-imports`, confirmed exact error message |
| Prisma ← repository (should be allowed) | ✅ correctly exempted, confirmed 0 errors |

`npx nx run-many -t lint --all` → **11/11 projects pass.**

## 3. API contract pipeline — PASS, end to end, against real generated code
1. `apps/api/scripts/generate-openapi-spec.ts` boots Nest in `app.init()`
   document-mode (no server, no networking) and writes a real `openapi.json`.
2. Confirmed real paths (`/products`, `/products/{slug}`) and real schemas
   (`ProductResponseDto`, `CreateProductDto`) in the generated spec.
3. `orval` generates a real, correct Angular `HttpClient` + RxJS client
   (`BeautyPlatformAPIService` with `productsControllerList`,
   `productsControllerGetBySlug`, `productsControllerCreate`).
4. `libs/storefront/data-access`'s `ProductsApiService` wraps that real
   generated client — confirmed by building the whole storefront app
   successfully against it.

## 4. Prisma — PARTIAL, blocked by sandbox network policy, not a design issue
- `prisma/schema.prisma` is in place (your approved schema, copied verbatim).
- `npx prisma validate` and `npx prisma generate` **both fail** with
  `403 Forbidden` fetching engine binaries from `binaries.prisma.sh`.
  Confirmed directly with `curl -I https://binaries.prisma.sh` →
  `x-deny-reason: host_not_allowed`. This is a sandbox egress restriction —
  any normal machine or CI runner reaches this domain fine.
- Repository → service → controller pattern is real and proven, using an
  `abstract ProductsRepository` contract with a temporary
  `InMemoryProductsRepository` so the rest of the pipeline could be validated
  without Prisma. The Prisma-backed implementation is a drop-in replacement.
- No controller or service imports Prisma directly — enforced by the
  `no-restricted-imports` rule (section 2), not just by convention.
- **Action required on your side**: run `npx prisma generate --schema=prisma/schema.prisma`
  locally, then swap `InMemoryProductsRepository` for a `PrismaService`-backed
  implementation of the same `ProductsRepository` contract.

## 5. Angular state architecture — PASS
- `CartFacade`: real `signal()`, real `computed()` for `itemCount`/`subtotal`,
  provided at the route level (`providers: [CartFacade]` in
  `app.routes.ts`), not `providedIn: 'root'`.
- 4 real unit tests pass: starts empty, computes itemCount/subtotal correctly,
  merges quantity on duplicate `addItem`, removes by `variantId`.
- Data-access separation confirmed: `CartFacade` never imports the generated
  client directly; `ProductsApiService` sits between them.
- No `AppStateService` anywhere in the workspace.
- `nx affected` test (section 1) confirms `CartFacade` changes only ripple
  into `storefront` and `storefront-e2e` — not `admin`, not `api`.

## 6. CI-quality health check — PASS
```
npx nx run-many -t lint test build --projects=api,storefront,admin,shared-api-client,shared-ui,shared-util,storefront-data-access,storefront-feature-cart
```
Real run: **all 8 targeted projects pass lint, test, and build.**
`npx nx affected -t lint test build --base=<commit>` is the incremental
version for CI, confirmed to scope correctly (section 1).

---

## Problems the real toolchain found, and what I changed

1. **Wrong ESLint config format entirely.** My hand-written `.eslintrc.json`
   doesn't exist in Nx v23 — it uses flat config (`eslint.config.mjs`). All
   boundary rules had to be rewritten in the real format.
2. **Positional args to `nx g @nx/angular:library` were silently ignored**
   in one case, producing an inconsistent project name. Fixed; always pass
   `--name` explicitly going forward.
3. **Generated apps had empty `tags: []`** — boundaries can't enforce
   anything until every project (including apps, not just libs) is tagged.
4. **Prisma engine binaries blocked by sandbox network policy** — see
   section 4. Real limitation, not a schema or architecture flaw.
5. **Nest's webpack build type-checks the entire `src` tree** regardless of
   what's wired into `AppModule` — an unwired `PrismaService` file still
   broke the build. Moved out of the compiled path pending Prisma generate.
6. **Orval path resolution is relative to the config file's directory, not
   cwd** — silent `ENOENT` until corrected. Also hit an `npx`-vs-local-binary
   version mismatch; fixed by invoking `./node_modules/.bin/orval` directly.
7. **Nx auto-derives the npm scope from the workspace directory name**
   (`@beauty-platform-validated/*`), not the `@beauty/*` shorthand I'd used
   in the earlier hand-written scaffold. Worth deciding your real workspace's
   name deliberately before the real `create-nx-workspace` run, since this
   sets the scope for every generated path alias.
8. **My original `type:feature` boundary rule allowed feature→feature
   imports within the same scope** — technically satisfying five of your six
   requested constraints but not the "feature → unrelated feature" one.
   Fixed by removing `type:feature` from its own allowed list entirely:
   features may only depend on `data-access`/`ui`/`util`, never each other.
   This is stricter and better than my original design, found only because
   I actually tested the specific case you asked for.
9. **A background server + curl combination didn't persist a written file
   across tool calls** in this environment, for reasons I couldn't fully
   pin down even after correctly reaping the child process. Routed around
   it by generating the OpenAPI spec via Nest's `app.init()` document-mode
   boot instead of a running server — no networking involved, and cleaner
   architecturally besides.
10. **This Angular version is zoneless by default** (no `zone.js` in
    `package.json` at all, uses `provideBrowserGlobalErrorListeners`). I'd
    manually added `provideZoneChangeDetection`, which requires zone.js and
    isn't loaded — broke SSR prerendering with `NG0908`. Removed it; this is
    actually the better fit for an all-signals architecture anyway.
11. **Angular's default component-selector convention (`lib-*` prefix)**
    conflicted with the `beauty-*` prefix used in the reference components —
    a real lint error, fixed by setting the convention consistently in each
    lib's `eslint.config.mjs` rather than fighting it per-component.
12. **Placeholder spec files get deleted along with placeholder components**
    — replacing generated placeholders with real components left three
    projects with zero tests, which `nx test` correctly flagged as failures
    (`No test files found`) rather than silently passing. Added real tests
    for all three.

## Exact commands to run locally, in order

```bash
npm install
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/schema.prisma --name init
npx nx run-many -t lint test build --projects=api,storefront,admin,shared-api-client,shared-ui,shared-util,storefront-data-access,storefront-feature-cart
npx ts-node -O '{"module":"commonjs","types":["node"]}' apps/api/scripts/generate-openapi-spec.ts
./node_modules/.bin/orval --config libs/shared/api-client/orval.config.ts
```

---

## Catalog vertical slice — session 2

Extended the validated foundation with a real, full-stack catalog slice:
Product/Category/Brand → repository → service → controller → OpenAPI →
Orval → Angular client → storefront data-access → catalog listing → PDP
with shade/size variant selection → CartFacade.addItem().

**All 9 meaningful projects pass `lint test build`, for real, as of this commit.**

### New real problems found and fixed while building this slice

1. **A genuine architecture bug caught by the boundary rules working as
   designed**: `CartFacade` was placed inside `feature-cart` (`type:feature`).
   When `feature-catalog` needed it for "Add to Bag," `nx lint` correctly
   rejected the import — `type:feature` cannot depend on `type:feature`.
   This exposed an inconsistency in the original design: I'd documented
   cart as a legitimate `providedIn: 'root'` exception one turn earlier,
   but then implemented it as a route-scoped facade anyway. Fixed by moving
   `CartFacade` into `storefront-data-access` (`type:data-access`, which
   both features may depend on) and making it genuinely root-provided.
   Proven with a real test: adding an item via one component instance and
   reading it back via a second, independently-created component instance.

2. **`@Query()` params without `@ApiQuery()` decorators produce non-optional
   types in the generated client** — a real `TS2769` broke the storefront
   build. Nest's Swagger integration can't infer optionality from plain
   `@Query('foo') foo?: string` alone; it needs explicit `@ApiQuery({
   required: false })`. Fixed on the controller, regenerated the spec and
   client, confirmed the fix in the actual generated `.d.ts` output before
   rebuilding.

3. **SSR prerendering a route that fetches live data fails at build time**,
   because no backend is running during `nx build` — the request hangs and
   times out, which tears down the entire prerender worker pool (collateral-
   damaging unrelated routes like `/cart` in the same build). Fixed by
   setting `RenderMode.Server` (render per real request) instead of
   `RenderMode.Prerender` (bake into the build) for both the catalog listing
   and the PDP — the correct choice architecturally anyway, since product
   data changes independently of deploys.

4. **Deleting/moving a component's spec file during refactors silently
   drops a project's test coverage to zero** — `nx test` correctly caught
   this as a hard failure (`No test files found`) for `feature-cart` after
   `CartFacade`'s spec moved with it to `data-access`. Added a real
   replacement test for `CartPageComponent`.
