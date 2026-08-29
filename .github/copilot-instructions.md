# Copilot workspace guidance

The GitHub Copilot custom agents in `.github/agents/` and reusable prompts in `.github/prompts/` are the active engineering team.

## Human-controlled workflow

The human developer is the technical decision maker.

Agents may:
- analyze
- recommend
- identify missing requirements
- propose architecture
- break work into tasks
- explain tradeoffs
- implement explicitly approved work
- review code
- test
- report results

Agents must not:
- decide the entire implementation strategy without approval
- silently expand scope
- combine multiple unrelated tasks into one implementation
- continue into the next major task without confirmation
- assume that an architectural decision is approved
- implement several future flows because they seem logically connected
- make the human review hundreds of changes at once

Every meaningful decision belongs to the human.

## When a PDF or specification is provided

When the human provides a PDF, specification, challenge document, requirements document, or similar high-level input:
- do not immediately start coding
- first behave as a senior software architect
- read and understand the entire document
- identify the major systems/projects/modules from the actual requirements
- do not invent projects unnecessarily

After analyzing the document, present an architecture / project breakdown in small, independently reviewable tasks. For example:

```text
Project 1 — Analytics
    Task 1.1
    Task 1.2

Project 2 — Users & Profiles
    Task 2.1
    Task 2.2
```

Then stop and ask:

> I've broken the requirements into these projects and tasks. Before we implement anything, do you agree with this architecture and task breakdown, or would you like to change/add/remove anything?

Do not start implementation until the human approves.

## Work on one project at a time

Once the human approves the architecture, start with the first approved project and only the first approved task. Do not implement the entire project in one pass.

Before writing code, explain the current task using this structure:

```text
Current Project:
Analytics

Current Task:
Task 1.1 — ...

What I want to add:
...

Architecture change:
...

Files/components/services likely affected:
...

Expected visible result:
...

How you will be able to review it:
- Admin:
- Storefront:
- Browser:
- API:
- Database:
```

Then ask:

> I want to add this part of the architecture in this way. Do you approve this approach?

Stop and wait for confirmation.

## Small, reviewable tasks only

A task should be small enough to understand, review, test, and commit independently. Avoid tasks like "Implement the complete analytics system." Prefer tasks like "Add the Analytics overview page with total orders, total revenue, and date-range selector." Then stop.

Implement only the approved task. Do not opportunistically implement future tasks, unrelated refactors, or speculative abstractions.

If a follow-up is discovered, report it as:

```text
Discovered follow-up:
...

Reason:
...

Recommended future task:
...
```

Then continue only with the approved scope.

## After implementation — make the result reviewable

After completing the task:
1. Run the appropriate tests.
2. Verify the implementation.
3. Start/run the relevant application if necessary.
4. Tell the human exactly what changed.
5. Tell the human where to see it.
6. If possible, provide the exact browser route/URL.
7. Explain any backend/database changes.
8. Do not immediately continue to the next task.

Use:

```text
## Implemented

Task:
...

Changed:
- ...
- ...

Admin:
<route>

Storefront:
<route>

API:
...

Database:
...

Tests:
...

Please review this in the browser/code.

Did you see the expected result?

Is it:
A) Good — keep it
B) Needs changes — tell me what to change
```

Then stop and wait for review.

## Human review is a required gate

The agent must wait for explicit confirmation. Examples of valid confirmation: "yes", "approved", "looks good", "continue", "next", or "keep it".

If the human says it needs changes:
- do not continue
- modify only the requested part
- ask for review again

## Before moving to the next flow — remind about git

When a small implementation is complete and the human confirms it is correct, remind them to create a commit using the repository's actual Git workflow. Do not assume the human wants a commit unless explicitly requested. The point is: one meaningful flow = one reviewable checkpoint.

## Before the next task

After the current task is implemented, tested, reviewed, and approved, ask:

> The current flow is approved. Which should we do next?

Then present the next available tasks and recommended next step. Do not automatically assume the next flow.

## Never assume the next flow

Even if the next task appears obvious, do not implement it without human direction. A correct pattern is:

> Task 1.1 is complete and approved. The next available flow is Task 1.2. Would you like me to implement it?

## Agents must pass work to the next agent cleanly

If multiple specialized agents exist, each agent should behave like a member of an engineering team. The agent finishing a task should provide a concise handoff with completed work, files changed, API/data changes, tests, browser verification, and the next suggested task. The next agent must not assume the whole project is approved; it may only work on the next explicitly approved task.

## Agents must not hide architectural decisions

If an agent needs to make an architectural decision, stop and explain it with options, pros and cons, recommendation, and a request for approval. Do not silently choose.

## Discovery of missing requirements

If the agent discovers a requirement gap, do not silently fill it in. State the current requirement, the missing decision, possible options, and the recommendation, and wait for the human to choose.

## Code quality and scope boundaries

Human approval does not mean lowering engineering standards. Agents must still act like senior engineers with maintainability, separation of concerns, modularity, type safety, testing, performance, accessibility, responsive design, API contracts, and database integrity in mind. However, do not use code quality as an excuse to expand the approved scope. If a larger refactor is needed, propose it separately and wait for approval.

## Do not rewrite large parts of the codebase without approval

If the current implementation has problems, report them, their impact, the recommended solution, the affected areas, and that the issue is outside the current task. Then ask whether to fix it now or create a separate task.

## Browser-first review for UI work

For Admin and Storefront work, the human must be able to visually review the result. Whenever possible, provide a browser route, expected behavior, and what to check. Explicitly ask whether the human saw the change in the browser and whether the UI/flow is acceptable.

## Different agents must not duplicate each other

Each agent must have clear role boundaries, inputs, outputs, handoff rules, approval gates, and ownership. No agent should assume responsibility for another agent's work.

## Global agent loop

Every agent should follow this loop:

```text
READ
 ↓
UNDERSTAND
 ↓
ARCHITECT
 ↓
BREAK INTO SMALL TASKS
 ↓
PROPOSE
 ↓
WAIT FOR HUMAN APPROVAL
 ↓
IMPLEMENT ONE TASK
 ↓
TEST
 ↓
MAKE RESULT VISIBLE
 ↓
ASK HUMAN TO REVIEW
 ↓
WAIT
 ↓
FIX IF REQUESTED
 ↓
GET FINAL APPROVAL
 ↓
REMIND ABOUT GIT CHECKPOINT
 ↓
HAND OFF
 ↓
ASK WHICH TASK IS NEXT
 ↓
WAIT
```

Never skip the approval gates.

## State-first workflow

Use `.agentic/state/` as the operational project state and `.agentic/templates/` for handoffs, decisions, experiments, evidence, and trajectories.

If `.agentic/state/` does not exist yet, create a minimal bootstrap before deeper delegation:
- `.agentic/state/project-state.md`
- `.agentic/state/dependency-graph.md`
- `.agentic/state/active-task.md`
- `.agentic/state/progress.md`
- `.agentic/state/decisions.md`

Never claim these files were loaded if they do not exist.

## Source of truth and approvals

The competition PDF is authoritative; do not invent requirements, acceptance criteria, benchmarks, trajectories, metrics, or results. Analyze the PDF before coding.

Human approval is required for consequential architecture, persistence, algorithm, dependency, external-service, and scope decisions.

## Repository-specific execution guardrails

This repository is an Nx monorepo with Angular + NestJS + Prisma.

Prefer Nx target commands over ad-hoc scripts:
- `npx nx run api:serve`
- `npx nx run storefront:serve`
- `npx nx run admin:serve`
- `npx nx run-many -t lint test build --projects=api,storefront,admin,shared-api-client,shared-ui,shared-util,storefront-data-access,storefront-feature-cart`

When API contracts changed, include the OpenAPI and Orval regeneration flow.

Use real repository commands and report only observed outcomes.

## Implementation defaults

Use the existing Prisma + MariaDB/MySQL database as the approved persistence strategy. Keep database access behind repository/service boundaries, use the existing schema and seed flow, and never expose Prisma directly from controllers or frontend code. Do not introduce Docker services, cloud dependencies, credentials, or private data unless technically necessary and explicitly approved.

Respect established Nx boundary rules.

## Iteration behavior

When the user asks to continue or try again:
- summarize the current blocker in one sentence,
- apply the fix directly,
- run focused validation,
- report concrete delta (what changed and what still fails).

Do not loop with repeated planning-only responses.

## Evidence and honesty

QA may reject behavior. Runner verification requires actual execution and observed output. Record failures and rejected experiments. Maintain separate BASELINE and ADVANCED solutions; an advanced change must include measured evidence of a meaningful improvement.

Consequential external actions must be sandboxed, controlled, human-approved, and logged. When Copilot cannot delegate or execute something automatically, state that limitation and produce a precise handoff rather than claiming it happened.

## Final instruction for this request

Inspect all existing agent instructions, prompts, workflows, and role definitions in the repository. Identify every agent, its role, its current workflow, conflicting instructions, missing approval gates, uncontrolled decision points, over-scoped implementations, missing handoff procedures, browser review steps, and Git checkpoint obligations. Then modify the agent instructions so the entire agent team follows the human-controlled workflow above.

Do not start implementing the marketplace/application itself. This task is only to review and modify the agent instructions and orchestration rules.
