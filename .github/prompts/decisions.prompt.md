---
description: "Review immutable human decisions and record a new consequential choice."
name: "Decisions"
agent: "Engineering Orchestrator"
---
If `.agentic/state/` does not exist, bootstrap minimal state files first.

Read `.agentic/state/decisions.md` and report historical decisions without rewriting them.

For a new consequential decision, use `.agentic/templates/decision.md`, record the human choice before implementation, and reference its evidence and expected impact.

Unresolved choices remain `WAITING_FOR_DECISION`.
