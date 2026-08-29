# Project State

Status: ANALYZING → READY_FOR_TASK_BREAKDOWN
Checkpoint: Customer Authentication & Purchase Flow specification analyzed 2026-08-29.
Problem: Complete customer authentication and purchase flow for the storefront (inspired by Apple's online store UX), preserving cart and checkout context, supporting persistent sessions, forgot password, and admin customer visibility.
Source of truth: Customer Authentication & Purchase Flow specification supplied by the human.

## Requirements (observed from specification)
### 1. Customer Role & Privacy
- Every storefront-registered user gets `role = CUSTOMER` assigned by the backend.
- Storefront must NEVER display "Role: CUSTOMER" or internal RBAC info.
- Customer only sees customer-facing concepts ("My Account", "My Orders", "Profile", "Addresses", "Sign Out").
- Admin Panel identifies and manages customers with role `CUSTOMER`.
- Existing ADMIN users and permissions unchanged.

### 2. Storefront Header & Welcome Back Experience
- Anonymous visitor: Header shows "Sign In" with quick access to Sign In / Create Account.
- Authenticated customer: Header shows subtle greeting (e.g. "Hi, {firstName}" or "Welcome back, {firstName}") and account navigation (My Account, My Orders, Sign Out).
- Subtle, premium Apple-style experience without intrusive popups.

### 3. Registration & Login Flow with Context Preservation
- Registration: First Name, Last Name, Email, Password -> creates account, assigns CUSTOMER role, automatically authenticates, restores cart, and redirects back to prior context (e.g. `/checkout` or product page) without re-login.
- Login: Authenticates existing customer, restores cart, and redirects back to prior context (`returnUrl`).
- Cart preservation: Anonymous cart items must never be wiped upon login/register.
- Checkout context: If login/register is initiated from checkout, customer is returned directly to checkout.

### 4. Forgot Password Flow
- Forgot Password request (email) with generic enumeration-safe response.
- Password reset token entry & Set New Password page.
- Success confirmation leading to sign-in.

### 5. Persistent Session & Session Lifecycle
- Persistent session across browser reloads via token/refresh-token restoration.
- Graceful session expiry handling.
- Logout invalidates refresh token on backend, clears local auth state, returns storefront to anonymous state while keeping browsing smooth.

### 6. Checkout Authentication Experience
- Seamless checkout for authenticated customers (pre-filling name/email).
- For unauthenticated visitors at checkout, provide clear "Sign In" or "Create Account" paths preserving the in-progress cart and returning to checkout immediately upon authentication.

### 7. Security & IDOR Boundaries
- Server-authoritative role enforcement.
- Strict authorization: customers can only view/manage their own orders, addresses, and profile data.

## Repository Reality Check
- **Backend (apps/api)**: `AuthController` and `AuthService` already implement `register`, `login`, `refresh`, `logout`, `forgot-password`, `reset-password`, `me`. JWT and refresh token rotation with Prisma MySQL storage are already in place.
- **Admin (apps/admin & libs/admin)**: Admin customer list displays users with their roles (including `CUSTOMER`).
- **Storefront (apps/storefront & libs/storefront)**:
  - `AuthFacade` provides signals for authentication state, login, register, refresh, logout.
  - `Header` needs the Apple-style auth menu, name greeting, and sign-out integration.
  - `LoginComponent` and `RegisterComponent` need `returnUrl` query parameter handling to preserve checkout/browsing context.
  - `ForgotPasswordComponent` and `ResetPasswordComponent` need to be created and routed.
  - `CheckoutComponent` needs the unauthenticated sign-in/register prompt and authenticated customer auto-fill.
  - `CartFacade` local persistence and login merge verification.

## Data strategy
Approved (pre-existing, unchanged): Prisma + MariaDB/MySQL, repository-boundary persistence, existing schema/seed. For the agent: catalog retrieval must go through the existing repository/service layer (e.g. `ProductsService`/`ProductsRepository`), not raw Prisma from a new agent module — consistent with `.github` guardrails. No new database engine or vector store should be added without explicit human approval (see Decision D1 below).

## Baseline / Advanced (competition-required, both NOT_STARTED)
Baseline: NOT_STARTED. Simple LLM-prompt shopping assistant using catalog data fetched via existing product endpoints/services, no retrieval/ranking machinery.
Advanced: NOT_STARTED. Agentic workflow: needs-extraction step, catalog retrieval/filter tool, ranking, grounded explanation, verification against catalog, comparison support, safe fallback.
Both require identical fixed evaluation case sets and measured latency/cost — this is a hackathon rubric requirement, not a nice-to-have.

## Human approvals
None recorded yet for hackathon-specific work. Needed before implementation: LLM provider/model choice and credential handling, structured product-attribute/metadata strategy (e.g., ingredient/tag data richness for "oily skin/acne" style queries), retrieval mechanism (DB query filtering vs. embeddings/vector search), and evaluation-case authoring/rubric scoring approach. See Decision Log for the specific open decisions.

## Risks and blockers
- No LLM SDK/provider configured — a consequential dependency decision needed before any code (Decision D1).
- Catalog lacks rich structured attributes for symptom-based matching (e.g., skin-type/concern tags) beyond `producttag`/`productingredient`/`category` — may need seed data additions to make the acne/oily-skin example demoable and gradable (Decision D2).
- No existing chat/agent module or evaluation harness — all net-new engineering within a 3-day scope; must stay minimal per PDF guidance ("more components are not automatically better").
- Credentials: `.env` currently holds only `DATABASE_URL`; any LLM API key must be added without being committed to source control or the submission per ground rules.
- Because payment/checkout gaps exist per `VALIDATION_REPORT.md`, End-to-End Quality (20 pts) scoring depends on whether the "purchase flow" claim only needs to reach the product/checkout entry point (matches PDF's "clear next step toward the product/store page") rather than a fully completed payment — needs confirmation but is a low-risk reading of the PDF.

## Evidence links
`challenge.pdf`; `README.md`; `VALIDATION_REPORT.md`; `prisma/schema.prisma`; `prisma/seed.ts`; `apps/api/src/app/catalog/products.controller.ts`; `apps/api/src/app/catalog/products.repository.ts`; `package.json`; `.env`.
