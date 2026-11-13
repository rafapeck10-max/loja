ALTER TABLE public.produtos
  ADD COLUMN IF NOT EXISTS compre_junto_ids text[] NOT NULL DEFAULT '{}'::text[];

COMMENT ON COLUMN public.produtos.compre_junto_ids IS
  'IDs de produtos escolhidos manualmente pela Mobi para a seção Compre junto.';
