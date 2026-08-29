---
description: "Show global project state and the current dependency-aware task."
name: "Status"
agent: "Engineering Orchestrator"
---
If `.agentic/state/` exists, read all files under it. If it does not exist, report that state is not initialized and provide the minimal bootstrap file list.

Report GLOBAL PROJECT sections for Requirements, Architecture, Data, Backend, API, Frontend, QA, Baseline, Advanced, Evidence, and Submission.

Then report CURRENT TASK with task, owner, status, dependencies, risks, evidence, and next step.

Use actual state only; do not infer success from missing entries.
