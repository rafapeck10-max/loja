-- Storefront on-site order registration for Mobi (Google Merchant Center payment-on-delivery checkout).
-- Keeps existing public.produtos prices and stock untouched.

SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.pedidos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo text NOT NULL UNIQUE,
  cliente_nome text NOT NULL CHECK (char_length(btrim(cliente_nome)) BETWEEN 2 AND 120),
  cliente_telefone text NOT NULL CHECK (char_length(btrim(cliente_telefone)) BETWEEN 8 AND 30),
  endereco_rua text NOT NULL CHECK (char_length(btrim(endereco_rua)) BETWEEN 3 AND 220),
  endereco_bairro text NOT NULL CHECK (char_length(btrim(endereco_bairro)) BETWEEN 2 AND 120),
  endereco_cidade text NOT NULL CHECK (char_length(btrim(endereco_cidade)) BETWEEN 2 AND 120),
  endereco_cep text CHECK (endereco_cep IS NULL OR char_length(btrim(endereco_cep)) <= 16),
  forma_pagamento text NOT NULL CHECK (forma_pagamento IN ('PIX', 'Cartão na entrega', 'Dinheiro na entrega')),
  itens jsonb NOT NULL CHECK (jsonb_typeof(itens) = 'array' AND jsonb_array_length(itens) BETWEEN 1 AND 50),
  total_pix numeric(12,2) NOT NULL CHECK (total_pix > 0),
  total_cartao numeric(12,2) NOT NULL CHECK (total_cartao > 0),
  parcelas integer NOT NULL DEFAULT 10 CHECK (parcelas BETWEEN 1 AND 24),
  status text NOT NULL DEFAULT 'novo' CHECK (status IN ('novo', 'em_atendimento', 'concluido', 'cancelado')),
  observacoes text CHECK (observacoes IS NULL OR char_length(observacoes) <= 1000),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pedidos_created_at_idx ON public.pedidos (created_at DESC);
CREATE INDEX IF NOT EXISTS pedidos_status_created_at_idx ON public.pedidos (status, created_at DESC);

ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.pedidos FROM PUBLIC, anon, authenticated;
GRANT ALL ON TABLE public.pedidos TO service_role;
