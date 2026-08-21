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

## Prisma and MySQL
Prisma 7.9.1 is configured with the local MySQL database through
`prisma/prisma.config.ts`. Prisma Client is generated, the schema is
synchronized with MySQL, and API repositories use `PrismaService` as the
persistence layer. Run these commands after pulling schema changes:
```
npx prisma generate --schema=prisma/schema.prisma
npx prisma db push --schema=prisma/schema.prisma
npx ts-node prisma/seed.ts
```

## What's real vs. what's still a stub
Real and database-backed: catalog, brands, categories, inventory, coupons,
orders, payments, reviews, users, refresh tokens, and password-reset tokens.
Create/update operations use Prisma and generated IDs, and related writes use
transactions where needed.

Still stub/pending: payment gateway integration remains a mock provider, some
storefront/admin features are incomplete, and CI pipeline configuration is
still pending.
