# Dependency Graph

Work items for Customer Authentication & Purchase Flow on 2026-08-29.

## Project 1 — Storefront Header & Authentication Entry (Apple-inspired UX)
- **Task 1.1**: Header Authentication UI & Account Dropdown (Greeting "Hi, {name}" / "Welcome back", Sign In / Create Account quick access, Sign Out).
- **Task 1.2**: Return-URL & Context Preservation in Login and Register components (redirecting back to `/checkout`, product, or previous page instead of hardcoded `/`).

## Project 2 — Cart & Checkout Seamless Purchase Journey
- **Task 2.1**: Checkout Authentication Experience (unauthenticated customer sign-in/register prompt at checkout, auto-filling customer info when authenticated).
- **Task 2.2**: Cart & Storage Preservation across login/register/logout transitions.

## Project 3 — Customer Password Recovery Flow
- **Task 3.1**: Forgot Password Request Component (`/forgot-password`) with enumeration-safe messaging.
- **Task 3.2**: Reset Password Component (`/reset-password?token=...`) and route integration.

## Project 4 — Admin Panel Customer Visibility & Security Verification
- **Task 4.1**: Admin Customers view verification (confirm registered storefront customers are visible with `CUSTOMER` role, order count, and registration date).
- **Task 4.2**: Security boundary & IDOR test verification (confirm customers can only access their own orders and account data).

## Project 5 — End-to-End Verification & QA
- **Task 5.1**: Automated test execution across affected projects (storefront data-access, feature-account, feature-checkout, api).
- **Task 5.2**: Full manual/browser journey smoke test documentation.
