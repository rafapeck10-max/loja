# Mobi storefront

This folder contains source recovered from the active Vercel deployment and the category/filter corrections published on 2026-09-19.

## Category audit

`src/lib/constants.ts` defines departments and subgroups. `src/lib/products.functions.ts` applies the same matching rules to home navigation and category pages. Product records and prices remain in Supabase.

The audit snapshot and regression check are in `tests/`. Run `npm run test:categories` to verify every catalog category is reachable and category totals remain consistent.

The database has no inventory/stock field, so filters can verify a positive sale price and an image, but cannot determine physical stock.
