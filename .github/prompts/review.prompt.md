---
description: "Review the active work against approved requirements, decisions, contracts, and risks."
name: "Review"
agent: "Engineering Orchestrator"
---
Determine the review type from the active task and invoke the relevant architecture, backend, frontend, API, UX, or QA review behavior.

Compare implementation with approved requirements and decisions.

Return exactly `APPROVED` or `CHANGES_REQUESTED` with concrete evidence, affected files, and required follow-up.

Prioritize findings and regressions first; summaries are secondary.

Update active task and progress; do not silently fix a rejected design during review.
