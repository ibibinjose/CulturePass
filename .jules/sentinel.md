## 2026-05-08 - Stripe Webhook Error Exposure
**Vulnerability:** The Stripe webhook signature verification path returned raw verifier error text to clients, potentially exposing webhook validation internals.
**Learning:** Error-message passthrough was used in a few request-validation paths for convenience and leaked implementation details in a security-sensitive endpoint.
**Prevention:** For auth/signature failures, return stable generic client errors and keep detailed diagnostics only in server logs.
