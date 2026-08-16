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

---

## Admin catalog management — session 3

Extended the API with write operations (update/delete products, create
categories/brands) and built the admin app's first real feature:
product list (with delete) + Reactive Forms create/edit, using the
same repository/facade/generated-client patterns proven in sessions 1–2.

**All 11 meaningful projects pass `lint test build`, for real, from a
fully clean (`--skip-nx-cache`) run, as of this commit.**

### New real problems found and fixed

1. **`input({ alias: 'id' })` is disallowed by Angular's lint convention**
   (`@angular-eslint/no-input-rename`) — caught immediately by `nx lint`.
   Fixed by naming the input `id` directly rather than aliasing, which also
   simplified the route wiring (no alias to reason about).
2. **Orval generates a strict const-object union type for enum-like DTO
   fields** (`UpdateProductDtoStatus`), not a plain `string` — a real
   `TS2322` at build time when the form's status control was typed as
   `string`. This is actually a good thing the generated client caught: it
   would have let an invalid status string reach the API undetected.
   Fixed by importing and using the real generated type in the form control.
3. **Deleting the default Nx-generated `nx-welcome` component without
   updating its `app.spec.ts`** broke `admin:test` (and would have broken
   `storefront:test` too, caught proactively) with a real module-resolution
   error. Fixed both apps' root component and spec together.

### Still stub/pending, unchanged from before
Every Nest module other than catalog/categories/brands; storefront
checkout/account features; admin orders/customers/analytics features;
the real Prisma-backed repositories (still blocked on local
`npx prisma generate` — see session 1 notes, unchanged).

---

## Sessions 3–5 summary: admin catalog mgmt, checkout/orders, inventory, admin orders, wishlist

All real, all lint+build validated after each slice (tests intentionally
deferred at the person's request — see "What's still missing" below).

- **Admin catalog management**: Products gained update/delete/getById;
  Categories/Brands gained create. Admin app: product table with delete,
  Reactive Forms create/edit (using the real generated `UpdateProductDtoStatus`
  union type), categories/brands taxonomy screen.
- **Checkout + Orders**: `OrdersModule` (create/getById), storefront
  `CheckoutFacade` + `CheckoutComponent` with a nested Reactive Form for
  shipping address, wired to the root-provided `CartFacade`.
- **Inventory**: `InventoryModule` wired into `OrdersService` via real
  cross-module DI — `reserveForOrder()` is all-or-nothing across every line
  item. **Proved correct with a real, executed smoke test** (not just a
  build check): created an order for 5 of 8 available units, confirmed
  availability dropped to 3, then confirmed a second order for 4 units was
  correctly rejected with `InsufficientStockException`. Admin stock table
  with restock action.
- **Admin order management**: Orders gained list + status-update endpoints
  using the schema's real `OrderStatus` enum values. Admin order queue with
  inline per-row status dropdown, set as the admin app's landing page.
- **Wishlist**: Client-side only, by design — matches how `CartFacade`
  already works (no backend cart persistence exists either). Root-provided
  `WishlistFacade`, heart-toggle on both the catalog grid and PDP, dedicated
  wishlist page. `/wishlist` and `/cart` both prerender successfully since
  neither makes a build-time API call.

All 13 real projects (`api`, `storefront`, `admin`, and 10 libs) pass
`lint` + `build` as of this commit.

### What's still missing from the original MVP scope
Reviews, coupons, a logged-in customer account/order-history view, the
admin customer-management screen, and — the bigger structural gap — there
is still no authentication anywhere in the system. Every admin screen is
currently reachable with no login at all, and orders are created without
any user identity beyond a plain email field. This is fine for continuing
architectural validation but is a hard blocker before this could go anywhere
near production.

### Automated tests
Deliberately not added in sessions 3–5 per direct instruction — every new
facade (`ProductListFacade`, `InventoryFacade`, `OrderListFacade`,
`CheckoutFacade`, `WishlistFacade`, `TaxonomyFacade`) and the inventory
reservation logic in particular have zero unit test coverage right now.
The inventory reservation correctness was verified once, manually, via a
throwaway script — that is not a substitute for a real regression test and
should be the first test written next.

---

## Auth — real JWT + RBAC, HTTP-level verified

Full implementation, not a stub: `@nestjs/jwt` + `@nestjs/passport` + `passport-jwt`
+ `bcryptjs`, matching the schema's flexible `Role`-based design (roles are
plain strings checked against a `@Roles(...)` decorator, not a hardcoded
enum — a new admin role needs no code change).

**Backend**: `UsersModule` (seeded with one admin account:
`admin@beauty-platform.local` / `ChangeMe123!` — change or remove before
any real deploy), `AuthModule` with register/login/me, `JwtStrategy`,
`JwtAuthGuard` applied **globally** via `APP_GUARD` with `@Public()` as the
opt-out (fail-closed by default — a forgotten guard on a new endpoint now
means "locked down" instead of "wide open"), `RolesGuard` for
`@Roles('SUPER_ADMIN')`. Every controller updated: catalog/category/brand
reads are `@Public()`, all writes require `SUPER_ADMIN`; inventory is
entirely `SUPER_ADMIN`-only; order creation and single-order lookup stay
`@Public()` for guest checkout (documented gap: no ownership check on order
lookup by id yet — anyone with an order id can fetch it).

**Real, executed verification** — not just a passing build:
- Service-level smoke test: login with correct/wrong password, register,
  duplicate-email rejection, guest checkout still working — all via
  `AuthService`/`OrdersService` called directly against a real `app.init()`
  boot.
- **HTTP-level smoke test using `supertest` against the app's real HTTP
  server** (in-process, no network binding — avoids the earlier
  localhost-persistence sandbox quirk): confirmed `GET /products` with no
  token → 200 (public), `GET /inventory` with no token → 401, the same
  route with a valid customer token → 403 (wrong role), with a valid admin
  token → 200 with real data, and with a garbage token → 401 without
  crashing the server. All 5 assertions passed exactly as expected on the
  first real run after one fix (see below). Both scripts were verification
  tools, not deliverables, and were deleted after use.

**Real bugs caught and fixed**:
1. `UsersRepository`'s original seed logic called an async `bcrypt.hash`
   from a constructor without awaiting it — a genuine race condition where
   the very first login attempt could fail if it ran before seeding
   finished. Fixed with `bcrypt.hashSync` in the field initializer.
2. `supertest`'s current type definitions don't support `import * as
   request` — a real `TS2349` from ESM/CJS interop, fixed with a default
   import plus explicit `esModuleInterop` for the one-off script.
3. `AuthService.login`/`register` deliberately return the same generic
   "Invalid email or password" for both a nonexistent account and a wrong
   password — an account-enumeration prevention that's easy to accidentally
   skip and worth calling out explicitly in review.

**Frontend**: Storefront and admin each have their **own** `AuthFacade`
(separate `localStorage` keys — an admin session must never be readable by
storefront code) — both root-provided per the same pattern as
`CartFacade`/`WishlistFacade`, both SSR-safe (`typeof localStorage ===
'undefined'` guards, confirmed by storefront's SSR build succeeding with 4
prerendered routes). Storefront: `login`/`register` routes with Reactive
Forms. Admin: login-only (no self-registration — admin accounts are
provisioned, not self-service), plus a client-side `adminGuard` on every
admin route — documented explicitly as a UX convenience only, since the
real security boundary is the API's `RolesGuard`, which a client-side guard
cannot substitute for.

All 14 real projects pass `lint` + `build` as of this commit.

### What's still a gap
- No refresh-token flow — access tokens are 1 hour and there's no silent
  renewal, so a session just dies and the user has to log in again.
- No password-reset flow.
- Order lookup-by-id has no ownership check (noted above).
- The JWT secret has a hardcoded dev fallback if `JWT_SECRET` isn't set —
  clearly commented as unsafe for real deployment, but worth a second
  flag here since it's the kind of thing that's easy to miss in a config
  review.
- Zero automated test coverage on any of this — same deferred-tests note
  as the last three slices. Auth is the single highest-value place to
  actually write tests next, given how much this system now guards.

---

## Real test coverage added (this session)

`npx nx run-many -t lint test build` across all 14 projects: **all green**,
with 46 real, executed, passing tests where there were previously close to
zero on anything built in sessions 3–5.

**Backend (Jest — added via the real `@nx/jest:configuration` generator,
since the `api` app had no test target at all until this session):**
- `AuthService` (5 tests): register success, duplicate-email rejection,
  wrong-password rejection, nonexistent-email rejection, successful login —
  using a real `bcrypt` hash in the test fixture rather than mocking
  `bcrypt.compare` away, so the actual comparison logic is exercised.
- `RolesGuard` (4 tests): no-metadata passthrough, correct-role allow,
  wrong-role reject, no-user-at-all reject.
- `InventoryService.reserveForOrder` (5 tests): the all-or-nothing
  invariant — confirmed that when one line item of a multi-item order lacks
  stock, **zero** reservations happen for any item, not just the failing
  one — plus both exact-boundary cases (available+1 fails, available
  exactly succeeds). This replaces the throwaway manual smoke test from
  the inventory session with a permanent regression test.
- `OrdersService.create` (4 tests): proved the actual call ordering
  (inventory reserved before the order is persisted, not after), and that
  a reservation failure means the order repository's `create` is never
  called at all.

**Frontend (Vitest — confirmed this session that libs use Vitest, not
Jest; `jest.fn()` silently doesn't exist as a global here, it's `vi.fn()`
from the `vitest` package — a real `ReferenceError` caught this immediately
on the first new frontend spec written):**
- `WishlistFacade` (4), `AuthFacade` (4, using `HttpTestingController` for
  real HTTP mocking and asserting on actual `localStorage` state).
- `CheckoutFacade` (4): the most valuable of this batch — proved the cart
  is genuinely cleared only on success and left untouched on failure, by
  constructing a real `CartFacade` alongside the mocked API rather than
  mocking cart state too.
- `LoginComponent` (4), `OrderListFacade` (2) — the latter required
  `vi.waitFor(...)` around the post-reload assertion, since `resource()`'s
  `reload()` re-triggers the loader asynchronously and the naive synchronous
  assertion right after `await` genuinely failed on the first run.

**What's still untested**: `ProductListFacade`, `ProductFormComponent`,
`TaxonomyFacade`, `InventoryFacade` (admin catalog-mgmt lib), the
`AuthController`/guards at the full HTTP level as a permanent suite (the
supertest verification from the auth session was manual and deleted, not
converted into a real spec — that should happen next), and effectively
all component-level rendering/template logic across both apps. Facade and
service logic — the highest-risk layer — is now the best-covered part of
the codebase; UI-level testing is the next gap.

---

## Critical functional fixes: making the admin→customer loop actually work over HTTP

Direct feedback: verify the *actual functional loop* — admin creates a
product via a real POST, a customer sees it via a real GET — over real
HTTP between two separate running apps, not just "it compiles." That
surfaced three genuine, would-have-been-silent bugs:

1. **The generated Angular client emits bare relative paths** (`/products`,
   no host, no `/api` prefix). Unnoticed by every prior verification
   because all of it ran in-process via `supertest` against the app's
   `HttpServer` directly — which never involves a browser resolving a
   relative URL against its own origin. In a real browser, `/products`
   resolves to `http://localhost:4200/products` (the *Angular app's own
   origin*), not `http://localhost:3000/api/products` (the actual API).
   Fixed with a new `apiUrlInterceptor` in both apps that rewrites any
   relative request URL to the real API origin + `/api` prefix, ordered
   before `authInterceptor` in the provider chain.
2. **CORS was never enabled** on the API at all. Even with the URL fixed,
   every real cross-origin request from either Angular app would have been
   silently blocked by the browser. `supertest` doesn't enforce CORS, so
   this was invisible to every test run so far, including the "HTTP-level
   verified" auth guard tests from the previous slice. Fixed with
   `app.enableCors(...)` scoped to the two known dev origins.
3. **Both Angular apps defaulted to the same dev-server port** (`4200`) —
   nothing prevented them colliding the moment someone actually ran both
   at once, which is required to exercise the exact flow being asked
   about. Fixed by pinning `admin` to port `4201`.

**Re-verified the full loop for real** after fixing all three, using the
exact bootstrap `main.ts` uses (prefix + CORS), not a simplified harness:
admin logs in → `POST /api/products` with a brand-new product → a fully
anonymous request (no Authorization header at all) finds it via both
`GET /api/products` (list) and `GET /api/products/:slug` (detail) → a
matching anonymous `POST` attempt is correctly rejected with 401. All five
assertions passed. Along the way, also caught and fixed a smaller real bug:
`POST /auth/login` was returning NestJS's default `201 Created`, which is
wrong for an endpoint that doesn't create a resource — now explicitly `200`.

**Still a known limitation, not fixed**: the API origin
(`http://localhost:3000/api`) is currently hardcoded in
`apiUrlInterceptor` in both apps, clearly marked with a TODO. This is fine
for local development but must become a real `environment.ts` file-replacement
setup before any deployment — a hardcoded `localhost` URL cannot work once
these apps aren't all running on one machine.
