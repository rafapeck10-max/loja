# Mobi storefront

This repository contains the storefront interface. Product records, prices, and product images are maintained in Supabase.

## Want something changed on the site?

You do not need to use GitHub or Vercel. Send the product link or a screenshot and say what you want changed. If a price or the 10x installment amount must stay the same, say so in the request.

Work starts locally or on an isolated GitHub branch. References are adapted to Mobi's own identity, code, data, and operation. Every production change requires Rafael's explicit approval of the reviewed version. Once that approval is given, do not ask for it again for the same version. Price, installment, catalog, stock, and business/legal changes must include the before-and-after values.

See [the short change and publishing process](DEPLOYMENT.md).

## Category audit

`src/lib/constants.ts` defines departments and subgroups. `src/lib/products.functions.ts` applies the same matching rules to home navigation and category pages. Product records and prices remain in Supabase.

The audit snapshot and regression check are in `tests/`. Run `npm run test:categories` when a change affects category matching or navigation. The database has no inventory/stock field, so filters cannot determine physical stock.
