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

---

## Coupons + order ownership: verified end to end over real HTTP

Two real gaps closed together, since coupons only matter once checkout is
trustworthy end to end:

**Coupons**: `CouponsModule` — `GET /coupons/:code/validate?subtotal=X`
(public, preview-only) and real server-side re-validation inside
`OrdersService.create` (never trusts a discount amount the client merely
displayed). Seeded with `WELCOME10` (10% off), `FLAT5` ($5 off $30+), and
`EXPIRED10` (seeded already-expired, specifically to exercise that path).
Storefront checkout has a real coupon input wired to `CheckoutFacade`,
showing the live discount preview and the specific rejection reason
(expired / minimum not met / not found) rather than a generic error.

**Order ownership**: `OptionalJwtAuthGuard` — a new guard pattern
(`handleRequest` never throws, so a route stays reachable by guests while
still populating `req.user` when a valid token is present). Order creation
and the storefront's own order history both use it. `GET /orders/me`
requires real auth and filters server-side by the authenticated user's id.

**Verified for real, twice** — not just built:
1. First pass: coupon math and rejection paths (`WELCOME10` on $100 → 
   exactly $10 off; `EXPIRED10` → 400 with "expired" in the message;
   `FLAT5` below its $30 minimum → 400), plus the actual ownership
   isolation test — two real registered customers, two real orders, and
   confirmed via `GET /orders/me` that customer A sees only their own
   order and never customer B's, and vice versa, with an unauthenticated
   request to the same endpoint correctly getting 401.
2. Second pass, the full realistic loop in one run: admin creates a
   product → anonymous customer browses it → a newly-registered customer
   checks out with a coupon → the order appears in that customer's own
   `/orders/me` → the admin sees it in the admin queue → the admin updates
   its status → **the customer is correctly blocked (403) from updating
   the status themselves**. All 8 checks passed on the real running server.

All 14 real projects pass `lint` + `test` + `build` as of this commit.

---

## Reviews — the last missing MVP feature, verified end to end over real HTTP

`ReviewsModule` — `GET /reviews/product/:productId` (public, approved-only),
`POST /reviews` (real auth required, review tied to the authenticated
user's id, never a client-supplied one), `GET /reviews` and
`PATCH /reviews/:id/moderate` (admin-only moderation queue).

**The interesting part**: real cross-module verified-purchase logic.
`ReviewsService` injects both `ProductsService` and `OrdersService` to
check whether the reviewing user has an order in a real fulfilled state
(`PAID`/`PROCESSING`/`SHIPPED`/`DELIVERED` — explicitly excluding
`PENDING_PAYMENT`, `CANCELLED`, `REFUNDED`) containing a variant that
belongs to *this specific product* — buying a different product doesn't
earn a verified badge on an unrelated review.

**Real bug caught by the verification script, not the app**: my first
end-to-end run showed `isVerifiedPurchase: false` for a customer who had
genuinely just bought the product. The review logic was correct — the
order was still sitting at `PENDING_PAYMENT` because there's no payment
gateway wired up yet, and nothing auto-advances an order's status. The fix
was to the *test*, not the app: advance the order to `PAID` via the admin
status-update endpoint first, exactly like a real payment webhook would.
Worth flagging because it's a preview of a real gap — right now, no order
ever becomes verified-purchase-eligible without an admin manually changing
its status, since there's no Stripe/payment integration yet.

**Verified for real, 13 checks, all passing**: a genuine buyer's review
correctly marked verified only after their order was advanced to `PAID`; a
non-buyer's review on the same product correctly NOT verified; a duplicate
review from the same user for the same product correctly rejected (409);
pending reviews correctly invisible on the public product endpoint;
admin's moderation queue correctly shows both; approving one makes it
correctly visible publicly while the still-pending one stays hidden; and a
customer is correctly blocked (403) from moderating.

**Also added 5 real unit tests** for `ReviewsService` (mocked
dependencies) covering the same edge cases at the service-logic level:
verified on a real paid order, not verified on pending payment, not
verified when the purchase was a *different* product, duplicate-review
rejection, and every new review starting `PENDING` regardless of verified
status. All 6 backend test suites (38 tests total) pass together.

All 14 real projects pass `lint` + `test` + `build` as of this commit.

### What's left from the original MVP scope
Nothing from the original feature list is entirely unbuilt on the backend
now — catalog, inventory, cart/checkout, orders, coupons, wishlist,
reviews, and auth/RBAC all have real, verified implementations. What
remains are the honesty-flagged gaps accumulated along the way: no
Prisma-backed repositories (blocked on `prisma generate` locally), no
payment gateway (orders never leave `PENDING_PAYMENT` on their own), no
refresh tokens/password reset, and the storefront-side reviews UI
(submission form, star display on PDP) hasn't been built — only the
backend and the API contract exist for it so far.

---

## Payments — the flagged gap closed, wired into checkout end to end

`PaymentsModule` — the real architectural piece is `PaymentProvider`, an
abstract interface any real gateway implements. `MockPaymentProvider` is
the only implementation right now (this sandbox has no network access to
`api.stripe.com` and no test API keys, so a real `StripePaymentProvider`
can't be built and verified here) — but it deliberately simulates a real
decline path (any email containing "declined" fails), not just an
always-succeeds stub, so the failure branch is genuinely exercisable.
Swapping in a real gateway later is one binding change in
`payments.module.ts` — nothing in `PaymentsService`, `OrdersService`, or
any controller changes.

`POST /payments/orders/:orderId/pay` is idempotent (a `PAID` order can't
be charged again — real risk with any client that retries a slow
response) and correctly leaves a declined order at `PENDING_PAYMENT` so
the customer can retry rather than losing the order entirely.

**Real bug caught during build, not by inspection**: `OrderResponseDto`
never actually exposed `currency`, despite it being on the approved
schema — a plain `TS2339` the moment `PaymentsService` tried to read
`order.currency`. Fixed by adding the field (and its default in the
repository) rather than working around it.

**Verified for real, 9 checks**, including one real bug in the
*verification script itself*, not the app: an email
`retry-not-declined@example.com` accidentally contained the substring
`"declined"`, so `MockPaymentProvider`'s simple `.includes()` check
correctly failed it — a good reminder that "contains" checks on free-text
fields are a real footgun even in a mock. Fixed the test email and re-ran:
order starts `PENDING_PAYMENT` → successful charge advances it to `PAID` →
a second payment attempt on the same order is correctly blocked (400) → a
declined charge returns 422 and leaves the order retryable → a retry with
a non-declining email succeeds → admin-only payment history correctly
shows the failed attempt → a customer (or guest) cannot view payment
history without admin auth.

**Wired into the real checkout flow**, not left as a dangling endpoint:
`CheckoutFacade.submit()` now calls `pay()` immediately after
`create()` succeeds, and distinguishes the two failure modes a customer
actually needs different messaging for — order creation failing entirely
(cart preserved, generic retry message) versus the order being created
but payment declined (cart preserved, the real order number surfaced so a
retry targets the same order rather than creating a duplicate). Updated
the existing Vitest suite for `CheckoutFacade`, which broke correctly
(not spuriously) the moment `pay()` was added and the old mock didn't
cover it — rewrote it with 2 new tests specifically for the decline path,
10/10 passing.

All 14 real projects pass `lint` + `test` + `build` as of this commit.

### Still true
No real gateway (documented above — this is a sandbox/credentials
limitation, not a design gap). Refresh tokens, password reset, and
Prisma-backed repositories remain the other open items.

---

## Remaining backend gaps closed + real frontend API wiring for everything built so far

Systematic audit, not guessing: checked every controller for missing CRUD
and every backend endpoint for zero frontend consumption. Found and fixed:

**1. Critical: admin-created products had no way to get variants.**
`create()` alone produced a product with an empty `variants` array —
nothing to select on a PDP, nothing addable to cart, no inventory row for
`reserveForOrder()` to find. A product created through the admin API was
permanently unpurchasable. Fixed with `POST /products/:id/variants`
(`ProductsService.addVariant`), which does two things atomically: adds the
variant AND calls `InventoryService.initializeForVariant()` to create a
real `InventoryItem` — cross-module DI, same pattern as
Orders→Inventory. Recomputes `fromPrice` from the new variant too.
**Verified with 12 real HTTP checks**, ending in the actual proof that
matters: a customer registers, orders the brand-new variant, pays for it,
and stock correctly decrements — the complete loop, for a product and
variant that didn't exist when the server started.

**2. Real latent bug fixed while in this code**: product ids were
generated from `products.length + 1`, which collides after any delete
(length drops, next create can reuse an id still held by another product).
Replaced with a monotonic counter.

**3. Product images**: `POST /products/:id/images`, URL-based rather than
file upload — no object storage (S3/Cloudinary) is wired into this
sandbox, which is the same architecture decision documented from the very
first planning conversation, not a new shortcut.

**4. Reviews had zero frontend wiring** (backend existed, nothing called
it). Added `ReviewsApiService` to `storefront-data-access` and wired real
fetch + submit calls into `ProductDetailComponent` — approved reviews
list, a Reactive Forms submission gated on `AuthFacade.isAuthenticated()`,
and real error surfacing (e.g. the backend's actual duplicate-review
message). Markup is deliberately minimal/unstyled per direct instruction.

**5. Categories and brands were create-only** — no way to fix a typo or
remove one without going around the API. Added full `update`/`delete` to
both, including the harder case for categories (a two-level tree, so
update/delete has to search both top-level and nested children — verified
directly, not assumed). Deleting a parent category orphans its children
rather than cascading, matching the schema's `onDelete: SetNull`.

**6. Admin frontend wired to all of the above**: `TaxonomyComponent` got
functional delete buttons for both categories (including nested children)
and brands. `ProductFormComponent` got a real variant-creation form and
image-URL form for edit mode — and the post-create navigation changed
from "back to the list" to "straight to the edit page for the new
product," since a brand-new product has zero variants and is
unpurchasable until at least one is added.

**Verified for real, 23 HTTP checks across two test runs**: the full
variant/inventory/purchase loop (12 checks, detailed above) and category/
brand CRUD including the nested-child path plus a customer correctly
blocked from any of it (11 checks). All passed. Existing test suites
re-run afterward — 38 backend tests, plus the frontend suites — all still
pass; the only one that touched changed code
(`product-form.component.spec.ts`) still passes unmodified since it only
exercises the invalid-empty-form path.

All 14 real projects pass `lint` + `test` + `build` together.

### What's genuinely left
Prisma-backed repositories (blocked on local `prisma generate`), refresh
tokens / password reset. Everything else audited in this pass — every
controller's CRUD completeness and every endpoint's frontend consumption —
is now either complete or was already complete.

---

## Refresh tokens + password reset — the last flagged auth gap, closed

**Refresh tokens**: opaque, server-side, revocable tokens (not signed
JWTs — a signed refresh JWT is valid until expiry regardless of what the
server "knows," so real revocation needs a denylist anyway; an opaque
token just gets deleted). Rotated on every use — the old token is revoked
the instant a new one is issued, so a stolen-but-unused refresh token
becomes worthless the moment the legitimate owner refreshes again.
`POST /auth/refresh`, `POST /auth/logout` (revokes immediately, not just
"expires eventually").

**Password reset**: `POST /auth/forgot-password` always returns the same
generic message whether or not the account exists — the alternative is a
textbook enumeration leak on a public endpoint. No email service exists in
this sandbox, so the reset token is returned directly in the response,
explicitly marked `devOnlyResetToken` and commented as something a real
deployment must never do. `POST /auth/reset-password` tokens are
single-use (30-minute expiry) and — the detail worth calling out — a
successful reset revokes **every** refresh token for that user, not just
the one tied to the reset flow, since a password reset is often triggered
by a suspected compromise and must kill every other active session too.

**Verified for real, 16 HTTP checks**, each one testing that the security
property is actually enforced, not just present: rotation genuinely
revokes the old token (reusing it after a refresh correctly fails);
logout genuinely kills the session server-side; forgot-password returns
byte-identical responses for a real vs. fake email; a garbage reset token
is rejected; a used reset token cannot be replayed; the old password stops
working and the new one works immediately after reset; and — the check
that would be easy to skip — a *different*, still-technically-valid
refresh token issued before the reset is confirmed dead afterward too.

**A real test failure caught correctly, not a regression**: adding two
new constructor dependencies to `AuthService` broke the existing
`auth.service.spec.ts` immediately (NestJS correctly refused to resolve
the test module). Rewrote it with mocks for both new repositories — 14
tests now, up from 4, covering register/login (unchanged) plus refresh
rotation, logout, forgot-password (including the no-enumeration check),
and reset-password (including the cross-session revocation). All 47
backend tests pass together.

**Frontend wired for real, not just data-model-complete**: both
`AuthFacade`s (storefront and admin) now store and use the refresh token,
and — the part that actually makes this useful day to day — both HTTP
interceptors catch a 401, attempt exactly one silent refresh, and retry
the original request before giving up. Without this, an expired 1-hour
access token would mean every request just fails until the user manually
logs back in, refresh token or not. Explicitly skips this retry for
`/auth/*` requests themselves, since retrying a failed login or a failed
refresh with another refresh call is either meaningless or an infinite
loop.

All 14 real projects pass `lint` + `test` + `build` as of this commit.

### What's genuinely left
Prisma-backed repositories remain the one structural gap (blocked on
`prisma generate` needing network access this sandbox doesn't have — see
earlier entries in this report for the exact commands to run locally).
Every backend/auth gap that's been flagged across this entire project has
now been closed and verified over real HTTP.
