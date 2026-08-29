---
description: "Run real focused tests, lint, typecheck, build, and E2E checks for the active task."
name: "Test"
agent: "Engineering Orchestrator"
---
Discover real repository test, lint, typecheck, build, and E2E commands from package/configuration files.

Select checks relevant to the active task, execute them, and record exact commands, timestamps, results, and failures in progress/evidence.

For this repository, include at least one Nx lint/build/test command targeting the touched projects.

Never report a check as passing if it was not run. On failure, reproduce and create a regression test before retesting where applicable.
