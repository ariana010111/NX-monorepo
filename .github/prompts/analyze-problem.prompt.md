---
description: "Analyze the supplied competition PDF before coding and identify requirements, risks, dependencies, and decisions."
name: "Analyze Problem"
agent: "Engineering Orchestrator"
argument-hint: "Path or attachment for the competition PDF"
---
Read the competition PDF supplied by the human and inspect the repository. Do not implement code.

If `.agentic/state/` does not exist, bootstrap it before writing outputs.

Extract only observed requirements, constraints, evaluation criteria, acceptance criteria, ambiguities, assumptions, risks, failure modes, dependencies, and consequential decisions.

Write the analysis to `.agentic/state/project-state.md`, initial risks to `.agentic/state/progress.md`, and proposed work to `.agentic/state/dependency-graph.md`.

Use `.agentic/templates/decomposition.md`.

End in `WAITING_FOR_DECISION` when a meaningful choice is required, and summarize the evidence and approvals still needed.
