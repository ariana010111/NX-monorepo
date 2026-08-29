---
description: "Advance the next unblocked engineering task through human approval, delegation, review, testing, and verification."
name: "Continue"
agent: "Engineering Orchestrator"
argument-hint: "Optional instruction or approved decision"
---
Load project state, dependency graph, active task, decisions, and progress. If `.agentic/state/` is missing, bootstrap minimal state files first and continue.

Select the next unblocked task.

If a consequential decision is needed, present alternatives with pros, cons, risks, complexity, recommendation, and ask the human to choose; set status to `WAITING_FOR_DECISION` and stop.

Otherwise delegate to the appropriate custom agent using `.agentic/templates/handoff.md`, then require review, focused tests, runner verification where applicable, evidence capture, and state updates.

When user input is only "continue" or "try again", perform one concrete fix cycle and report deltas:
1) blocker summary,
2) fix applied,
3) checks run,
4) remaining issue or done.

Keep baseline and advanced work separate. Never claim an action occurred unless it was executed.
