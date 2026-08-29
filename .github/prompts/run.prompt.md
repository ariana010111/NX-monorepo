---
description: "Actually start and verify the repository application, API, routes, and smoke tests."
name: "Run"
agent: "Runner Verifier"
---
Discover and execute the repository's real startup and smoke-test commands.

Prefer Nx-first runtime checks in this repository:
1) `npx nx run api:serve`
2) `npx nx run storefront:serve`
3) `npx nx run admin:serve`

Then execute focused health checks for touched areas and include concrete URLs observed from logs.

If API contracts were touched, include:
1) `npx ts-node -O '{"module":"commonjs","types":["node"]}' apps/api/scripts/generate-openapi-spec.ts`
2) `./node_modules/.bin/orval --config libs/shared/api-client/orval.config.ts`

Report `PASS` only from observed output. On failure report status, step, error, and suggested action. Record evidence; do not invent an application for an empty repository.
