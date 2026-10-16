# Mobi storefront

This repository contains the storefront interface. Product records, prices, and product images are maintained in Supabase.

## Want something changed on the site?

You do not need to use GitHub or Vercel. Send the product link or a screenshot and say what you want changed. If a price or the 10x installment amount must stay the same, say so in the request.

For a simple visual change or bug fix, the preview is checked and the change is published without asking you to repeat approval. For changes to prices, installments, catalog data, stock, or business/legal statements, you will see the before-and-after values and approve before publication.

See [the short change and publishing process](DEPLOYMENT.md).

## Category audit

`src/lib/constants.ts` defines departments and subgroups. `src/lib/products.functions.ts` applies the same matching rules to home navigation and category pages. Product records and prices remain in Supabase.

The audit snapshot and regression check are in `tests/`. Run `npm run test:categories` when a change affects category matching or navigation. The database has no inventory/stock field, so filters cannot determine physical stock.
