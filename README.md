# Beauty Platform — VALIDATED Architecture Scaffold

Every claim in this README was proven against the real Nx/Angular/Nest toolchain,
not hand-written. See VALIDATION_REPORT.md for the full pass/fail log and every
bug the tooling caught along the way.

## Quick start
```
npm install
npx nx run-many -t lint test build --projects=api,storefront,admin,shared-api-client,shared-ui,shared-util,storefront-data-access,storefront-feature-cart
```
That command is the answer to "is the architecture currently healthy?" — real,
green, as of this scaffold.

## Regenerating the API contract
```
npx ts-node -O '{"module":"commonjs","types":["node"]}' apps/api/scripts/generate-openapi-spec.ts
./node_modules/.bin/orval --config libs/shared/api-client/orval.config.ts
```
First command boots Nest in document-mode (no server, no networking) and writes
libs/shared/api-client/openapi.json. Second command regenerates the Angular
client from it. Run both after any DTO/controller change.

## Prisma — action required before continuing
`prisma/schema.prisma` is in place (your approved schema) but `prisma validate`
/ `prisma generate` could NOT be run in the sandbox this was built in — the
engine binaries are hosted at binaries.prisma.sh, which that sandbox's network
policy blocks (confirmed: 403 host_not_allowed). Locally, run:
```
npx prisma generate --schema=prisma/schema.prisma
npx prisma migrate dev --schema=prisma/schema.prisma --name init
```
apps/api/src/app/catalog/products.repository.ts currently uses an
InMemoryProductsRepository so the rest of the pipeline could be validated
without Prisma. Once `prisma generate` succeeds locally, swap it for a
PrismaService-backed implementation using the same ProductsRepository
abstract contract — the service/controller/DTOs don't change.

## What's real vs. what's still a stub
Real and tested: Nx workspace + all 11 projects, the enforced module
boundaries (six forbidden-import cases individually proven — see report),
the full OpenAPI→Orval→Angular pipeline against a live Nest boot, the
CartFacade signals/computed pattern with unit tests, SSR build+prerender
for storefront, CSR build for admin.

Still stub/pending: every Nest module other than catalog, every storefront
feature other than cart, all admin features, the real Prisma-backed
repository (blocked on local `prisma generate`), CI pipeline config.
