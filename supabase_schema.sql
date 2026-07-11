-- Drop existing table if exists (warning: this will clear existing products data in development)
DROP TABLE IF EXISTS public.produtos CASCADE;

-- Create table public.produtos
CREATE TABLE public.produtos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  slug text NOT NULL UNIQUE,
  preco_antigo numeric(10,2) NOT NULL,
  preco_atual numeric(10,2) NOT NULL,
  categoria text NOT NULL,
  url_imagem text NOT NULL,
  ordem integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.produtos ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (anonymous or authenticated) can SELECT products
CREATE POLICY "Permitir leitura publica"
ON public.produtos FOR SELECT
TO anon, authenticated
USING (true);

-- 2. Only authenticated users or service_role can INSERT/UPDATE/DELETE products
CREATE POLICY "Permitir insercao apenas para autenticados"
ON public.produtos FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Permitir atualizacao apenas para autenticados"
ON public.produtos FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Permitir delecao apenas para autenticados"
ON public.produtos FOR DELETE
TO authenticated
USING (true);

-- Grants
GRANT SELECT ON public.produtos TO anon;
GRANT SELECT ON public.produtos TO authenticated;
GRANT ALL ON public.produtos TO service_role;

-- ----------------------------------------------------
-- Configuração do Supabase Storage para o produtos-bucket
-- ----------------------------------------------------

-- Criar o bucket publico 'produtos-bucket' se nao existir
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'produtos-bucket', 
  'produtos-bucket', 
  true, 
  5242880, -- limite de 5MB
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Politicas para o storage.objects do 'produtos-bucket'
-- 1. Permitir leitura publica de imagens no bucket
CREATE POLICY "Permitir visualizacao publica de imagens"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'produtos-bucket');

-- 2. Permitir insercao/upload para usuarios anonimos e autenticados
CREATE POLICY "Permitir upload de imagens publicas"
ON storage.objects FOR INSERT
TO public
WITH CHECK (bucket_id = 'produtos-bucket');

-- 3. Permitir atualizacao de imagens no bucket
CREATE POLICY "Permitir atualizacao de imagens"
ON storage.objects FOR UPDATE
TO public
USING (bucket_id = 'produtos-bucket')
WITH CHECK (bucket_id = 'produtos-bucket');

-- 4. Permitir delecao de imagens no bucket
CREATE POLICY "Permitir delecao de imagens"
ON storage.objects FOR DELETE
TO public
USING (bucket_id = 'produtos-bucket');
