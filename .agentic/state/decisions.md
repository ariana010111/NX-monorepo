# Decision Log

## D1 - LLM provider, model, and credential handling
Problem: P1, P2 need an LLM to power both baseline and advanced agents. No provider SDK or API key currently exists in the repo (`.env` has only `DATABASE_URL`; `package.json` has no `openai`/`anthropic`/`langchain` dependency).
Context: Ground rules require credentials stay out of the submission and consequential/external-service dependencies get human approval.
Options:
- Option A: OpenAI API (e.g., `gpt-4o-mini` or similar) via `openai` npm package.
  Pros: Well-documented, cheap, fast, widely supported by eval/observability tooling.
  Cons: External paid dependency; requires an API key the user must supply and keep out of git.
  Risks: Cost/latency measurement depends on real account; rate limits.
  Complexity: Low.
- Option B: Anthropic Claude API.
  Pros: Strong reasoning/instruction-following; similar SDK ergonomics.
  Cons: Same external dependency concerns as Option A.
  Risks: Same as Option A.
  Complexity: Low.
- Option C: Local/self-hosted model (e.g., via Ollama).
  Pros: No external API key/cost; fully offline reproducibility.
  Cons: Requires local model download/hosting; judges must replicate environment; likely weaker quality for nuanced product matching/explanation.
  Risks: Reproducibility burden shifts to judges' machines; may hurt "Reproducibility" (15 pts) if setup is heavy.
  Complexity: Medium.
Recommendation: Option A (OpenAI), using an environment variable never committed, with the reproduction guide stating the required env var name only.
Reason: Matches PDF ground rules (credentials excluded, tools/components already known may be used), keeps cost/latency measurable and reproducible for judges with their own key.
Human Choice: PENDING
Reason: PENDING
Expected Impact: Unblocks P1/P2 implementation.
Actual Result: Pending
Evidence: Pending

## D2 - Structured product-attribute strategy for symptom/need matching
Problem: The PDF's flagship example ("oily skin, acne — what should I use?") requires matching customer-stated needs to product attributes. Current schema has `producttag`, `productingredient`, `category`, `brand` but no explicit "skin type" / "concern" taxonomy, and seed data richness for this is unknown/likely insufficient for a compelling demo.
Context: PDF ground rules require distinguishing pre-existing SaaS work from hackathon additions, and structured product data is explicitly listed as a validated advanced component in §8.
Options:
- Option A: Use existing `producttag`/`productingredient`/`category` fields as-is; seed a small number of tag/ingredient values (e.g., "oily-skin", "acne-prone", "salicylic-acid") sufficient for the demo/eval cases only.
  Pros: No schema migration; minimal, targeted change; keeps DB strategy unchanged per repo guardrails.
  Cons: Tag taxonomy is generic/free-text, not purpose-built; still workable for filtering.
  Risks: Low.
  Complexity: Low.
- Option B: Add a new structured schema field/model (e.g., `productattribute` key/value or `skinConcern` enum) via Prisma migration.
  Pros: Cleaner, more explicit structured data for advanced matching.
  Cons: Schema change requires migration + regenerated Prisma client + reseed; more surface area to validate in 3 days; conflicts with "keep existing schema" guidance unless explicitly approved.
  Risks: Migration/reproducibility overhead; must not break existing store features.
  Complexity: Medium.
Recommendation: Option A for the 3-day scope; revisit Option B only if evaluation results show Option A can't ground recommendations well enough.
Reason: Minimizes schema risk while satisfying "structured product attributes" as a validated (not just assumed) advanced component.
Human Choice: PENDING
Reason: PENDING
Expected Impact: Determines P2's retrieval/matching design and whether seed data needs new tag/ingredient values.
Actual Result: Pending
Evidence: Pending

## D3 - Retrieval mechanism for catalog search (DB filtering vs. vector/embeddings)
Problem: PDF §8 lists "catalog retrieval tool" as a potential advanced component but requires validating rather than adding for appearance. Need to decide whether product retrieval uses direct DB queries (SQL/Prisma filters on tags, category, keywords) or a vector/embedding-based semantic search.
Context: No vector store or embeddings pipeline exists today; adding one is a new external/infra dependency requiring approval per ground rules and repo guardrails (no new cloud/DB dependencies without explicit approval).
Options:
- Option A: Direct structured/DB-query retrieval (filter/rank via Prisma on tags, category, ingredients, keyword match on name/description).
  Pros: No new infra; fast to build in 3 days; fully within existing Prisma/MySQL persistence strategy.
  Cons: Less "semantic" than embeddings; relies on decent tag coverage from D2.
  Risks: Low, catalog likely small for hackathon demo so DB filtering is sufficient.
  Complexity: Low.
- Option B: Embedding-based semantic search (e.g., pgvector/local embeddings) over product descriptions.
  Pros: More robust to varied natural-language phrasing.
  Cons: New dependency/infra, indexing pipeline, added complexity and reproducibility burden — exactly what PDF §8 warns against adding without validated benefit.
  Risks: Medium-high for a 3-day scope; may not measurably outperform Option A at small catalog size.
  Complexity: High.
Recommendation: Option A, and only evaluate Option B in an Iteration if there's evidence structured filtering underperforms on the evaluation cases — document as a removed experiment if it doesn't help (satisfies §10/Hot-Take requirement either way).
Reason: Keeps within existing DB/persistence approval and the PDF's "purposeful, validated" component guidance.
Human Choice: PENDING
Reason: PENDING
Expected Impact: Determines P2 architecture and whether any new dependency needs approval.
Actual Result: Pending
Evidence: Pending
