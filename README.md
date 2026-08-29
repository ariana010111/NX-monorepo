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

**Note on caching**: when all targeted projects have already been run and their
inputs have not changed, Nx reports "No tasks were run" (100 % cache hits, not
an error). Use `--skip-nx-cache` to force a full re-execution, or run individual
projects with `npx nx run <project>:<target>`.

## Regenerating the API contract
```
npx ts-node -O '{"module":"commonjs","types":["node"]}' apps/api/scripts/generate-openapi-spec.ts
./node_modules/.bin/orval --config libs/shared/api-client/orval.config.ts
```
First command boots Nest in document-mode (no server, no networking) and writes
libs/shared/api-client/openapi.json. Second command regenerates the Angular
client from it. Run both after any DTO/controller change.

**Windows / PowerShell users**: PowerShell strips the single-quoted JSON argument
in the `ts-node -O` form above. Use cmd.exe instead:
```
cmd /c "npx ts-node -O \"{\"module\":\"commonjs\",\"types\":[\"node\"]}\" apps/api/scripts/generate-openapi-spec.ts"
```
Or, from a PowerShell prompt, invoke via `& $env:ComSpec /c '...'`.

## Prisma and MySQL
Prisma 7.9.1 is configured through `prisma/prisma.config.ts`, which reads
`DATABASE_URL` from `.env`. The schema path and migration directory are set
there, so the `--schema` flag is optional for CLI commands that auto-discover
`prisma.config.ts`.

**Prerequisites**: MySQL 8 running on `localhost:3306` with a database named
`beauty_marketplace` and credentials matching your `.env` `DATABASE_URL`.

Run these commands after pulling schema changes or on a fresh checkout:
```
# 1. Generate the Prisma Client (confirmed working with local MySQL)
npx prisma generate --schema=prisma/schema.prisma

# 2. Push the schema to the database (destructive on conflicts — dev only)
npx prisma db push --schema=prisma/schema.prisma --accept-data-loss

# 3. Seed reference data and the default super-admin account
npx ts-node prisma/seed.ts
```

The seed script uses the `@prisma/adapter-mariadb` driver adapter (already in
`node_modules`) and the `DATABASE_URL` from `.env`. Default seeded admin
credentials: `admin@beauty-platform.local` / `ChangeMe123!` — **change or
delete before any real deployment**.

If you prefer migration history over a raw schema push (recommended for teams):
```
npx prisma migrate dev --schema=prisma/schema.prisma --name init
```

## What's real vs. what's still a stub
Real and database-backed: catalog, brands, categories, inventory, coupons,
orders, payments, reviews, users, refresh tokens, and password-reset tokens.
Create/update operations use Prisma and generated IDs, and related writes use
transactions where needed.

Still stub/pending: payment gateway integration remains a mock provider (no
real Stripe wiring — the `MockPaymentProvider` simulates declines but issues no
real charges), some storefront/admin features are incomplete, and CI pipeline
configuration is still pending.
