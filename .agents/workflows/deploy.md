---
description: Publish this Mobi storefront through the connected GitHub and Vercel project.
---

# /deploy — Mobi storefront

Use [DEPLOYMENT.md](../../DEPLOYMENT.md) as the project-specific release procedure. Ignore generic checklist commands in this file if they do not match the scripts defined by `package.json`.

## Quick flow

1. Start from the latest `main` and create a focused branch.
2. Keep the change within the user's request. Product prices, installment data, and catalog images live in Supabase; do not alter them for a visual request.
3. Open a pull request and use its Vercel preview to check the affected route.
4. Run only relevant checks:
   - Build: `npm run build` (also run by the Vercel preview).
   - Lint: `npm run lint` when code changes warrant it.
   - Category regression: `npm run test:categories` when category matching or navigation changes.
   - There is no `npm test` script.
5. For ordinary visual changes and simple bug fixes, the request authorizes publication after the preview passes. Do not ask for duplicate approval.
6. For price, 10x installment, catalog/stock, or commercial/legal-copy changes, present before-and-after details and wait for explicit approval. One approval for the reviewed version is sufficient.
7. Merge through GitHub and let Vercel deploy the commit. Prefer a merge commit; do not rewrite published branch history. Confirm production is `READY` and check the affected route.

## User-facing result

Give a short summary, the preview or production URL, deployment status, and the exact 10x comparison when payment was involved. The user does not need to click through GitHub settings or perform deployment steps.
