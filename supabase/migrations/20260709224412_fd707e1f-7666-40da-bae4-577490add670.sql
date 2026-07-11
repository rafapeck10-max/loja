CREATE TABLE public.produtos (
  id text PRIMARY KEY,
  nome text NOT NULL,
  preco_antigo numeric(10,2) NOT NULL,
  preco_novo numeric(10,2) NOT NULL,
  imagem_url text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.produtos TO anon;
GRANT SELECT ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Produtos sao publicos para leitura"
ON public.produtos FOR SELECT
TO anon, authenticated
USING (true);