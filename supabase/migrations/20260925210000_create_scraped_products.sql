CREATE TABLE IF NOT EXISTS public.scraped_products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier text NOT NULL,
  name text NOT NULL,
  category text,
  supplier_price numeric(10,2),
  price_variations jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text,
  sku text,
  reference text,
  colors text,
  availability jsonb NOT NULL DEFAULT '[]'::jsonb,
  measurements text,
  description text,
  image_urls text[] NOT NULL DEFAULT '{}',
  source_url text,
  scraped_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'imported')),
  product_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (supplier, name)
);

CREATE INDEX IF NOT EXISTS scraped_products_status_created_idx
  ON public.scraped_products (status, created_at DESC);

ALTER TABLE public.scraped_products ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.scraped_products FROM anon, authenticated;
GRANT ALL ON public.scraped_products TO service_role;
