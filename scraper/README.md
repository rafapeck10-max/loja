# Mobi supplier scraper

An isolated Python worker for collecting supplier catalog data. The first adapter is for Tropical Móveis and uses the official [D4Vinci/Scrapling](https://github.com/D4Vinci/Scrapling) package pinned to `0.4.15` with its fetcher extras. The supplied URL is a Glide single-page app, so the adapter uses Scrapling's regular `DynamicFetcher` to render client-side content.

The worker renders the Glide app, reads its grouped product cards and optional detail pages, and writes normalized JSON Lines locally. It does not import the supplier's repository or write directly to Supabase; the admin panel reviews the JSONL before a product enters the catalog.

## Setup

Requires Python 3.10 or newer.

```powershell
cd scraper
python -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -e .
Copy-Item .env.example .env
```

Set `TROPICAL_MOVEIS_CATALOG_URL` in `.env` to the public Tropical Móveis app URL. For Scrapling's browser-backed fetcher, install its Chromium runtime once with:

```powershell
scrapling install
```

If Chrome is already installed on the machine, set `SCRAPER_USE_REAL_CHROME=1` before running the worker to use that browser instead.

Run the worker:

```powershell
mobi-scrape
```

For example, enrich the full 252-item catalog (the run may take several minutes) and then import the resulting file from the admin panel:

```powershell
mobi-scrape --details-limit 252 --output .\data\tropical-moveis.jsonl
```

Use `--url` and `--output` to override the environment values. `--details-limit N` enriches the first N products; repeat `--detail-name TEXT` to enrich matching products by name. The output file is JSONL: one product per line. Review the result before any future import into the storefront.

## Data and integration boundary

Each record includes supplier name, product name, category, and collection timestamp. The Glide list does not expose price, images, references, or a detail URL, so those fields remain `null` or empty in list-only runs. Use `--details-limit N` to open and enrich the first N product detail pages with references, SKU, color, availability, measurements, description, and images. Tropical Móveis encodes costs in its TROP references: `TROP 00423` means R$ 423. Each reference line is preserved as a separate `price_variations` entry, so a complete kitchen and its individual cabinets keep their own supplier costs. The sale price remains unset until you enter it in the admin panel.

The live smoke run on 2026-09-25 collected 252 unique names across 20 categories. The first product detail screen exposes color, per-piece availability, reference codes, measurements, and description. Its primary reference was `TROP 003320`, which the worker interprets as R$ 3,320. That count and detail layout can change as the supplier updates the app.

The admin panel accepts this JSONL into the private `scraped_products` review queue created by the new Supabase migration. It keeps supplier cost and every reference-specific cost separate from your sale prices. After you add the main photo and sale prices, completing the form creates or updates the storefront product; configured price options appear on the product page and carry their selected value into the cart. The scraping worker itself never receives Supabase credentials.

The current storefront expects rich `public.produtos` fields such as `preco_atual`, `url_imagem`, `fornecedor`, `sku`, and `url_fornecedor`. The checked-in legacy `supabase_schema.sql` and migration define a smaller, older `produtos` shape. The review-queue migration is independent, but verify that the live `produtos` schema matches `src/integrations/supabase/types.ts` before applying product imports. The branch does not apply migrations to the remote database or deploy the site.
