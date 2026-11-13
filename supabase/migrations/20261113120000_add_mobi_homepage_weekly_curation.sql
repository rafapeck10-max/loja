CREATE TABLE public.mobi_homepage_weekly_curation (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  weekly_ids text[] NOT NULL DEFAULT '{}'::text[],
  source_revision bigint,
  updated_at timestamptz NOT NULL DEFAULT pg_catalog.now()
);

ALTER TABLE public.mobi_homepage_weekly_curation ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON TABLE public.mobi_homepage_weekly_curation FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT ON TABLE public.mobi_homepage_weekly_curation TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.mobi_homepage_weekly_curation TO service_role;

CREATE POLICY "Public can read the weekly product selection"
  ON public.mobi_homepage_weekly_curation
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Seed the current live order without modifying any product, price, cost, or supplier row.
INSERT INTO public.mobi_homepage_weekly_curation (id, weekly_ids)
SELECT
  true,
  COALESCE(
    pg_catalog.array_agg(current_selection.id ORDER BY current_selection.vitrine_semana_ordem, current_selection.id),
    '{}'::text[]
  )
FROM (
  SELECT product.id, product.vitrine_semana_ordem
  FROM public.produtos AS product
  WHERE product.vitrine_semana_ordem IS NOT NULL
  ORDER BY product.vitrine_semana_ordem, product.id
  LIMIT 4
) AS current_selection;

CREATE OR REPLACE FUNCTION public.mobi_homepage_weekly_apply(
  p_expected_workspace_version bigint,
  p_revision_id bigint,
  p_weekly_ids text[]
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = ''
AS $$
DECLARE
  v_workspace jsonb;
  v_server_version bigint;
  v_latest_pages_revision jsonb;
  v_unique_count integer;
  v_eligible_count integer;
BEGIN
  IF p_weekly_ids IS NULL OR pg_catalog.cardinality(p_weekly_ids) > 4 THEN
    RAISE EXCEPTION 'Seleção semanal inválida.';
  END IF;

  IF pg_catalog.array_position(p_weekly_ids, NULL) IS NOT NULL THEN
    RAISE EXCEPTION 'A seleção contém um produto inválido.';
  END IF;

  SELECT pg_catalog.count(DISTINCT selected.id)::integer
  INTO v_unique_count
  FROM pg_catalog.unnest(p_weekly_ids) AS selected(id);

  IF v_unique_count <> pg_catalog.cardinality(p_weekly_ids) THEN
    RAISE EXCEPTION 'A seleção contém produtos repetidos.';
  END IF;

  SELECT workspace, server_version
  INTO v_workspace, v_server_version
  FROM public.mobi_studio_workspace
  WHERE id = true
  FOR UPDATE;

  IF NOT FOUND OR v_server_version IS DISTINCT FROM p_expected_workspace_version THEN
    RAISE EXCEPTION 'A revisão do painel mudou. Reabra o painel e confira antes de aplicar.';
  END IF;

  SELECT item
  INTO v_latest_pages_revision
  FROM pg_catalog.jsonb_array_elements(v_workspace->'history') AS revisions(item)
  WHERE item->>'scope' = 'pages'
  ORDER BY (item->>'id')::bigint DESC
  LIMIT 1;

  IF v_latest_pages_revision IS NULL
     OR (v_latest_pages_revision->>'id')::bigint IS DISTINCT FROM p_revision_id
     OR v_latest_pages_revision->>'status' IS DISTINCT FROM 'reviewed' THEN
    RAISE EXCEPTION 'Salve e revise a seleção mais recente antes de aplicar.';
  END IF;

  IF v_workspace->'entries'->'pages' IS DISTINCT FROM v_latest_pages_revision->'after'
     OR v_latest_pages_revision->'after'->'curation'->'weeklyIds' IS DISTINCT FROM pg_catalog.to_jsonb(p_weekly_ids) THEN
    RAISE EXCEPTION 'A seleção revisada não corresponde ao rascunho salvo.';
  END IF;

  SELECT pg_catalog.count(*)::integer
  INTO v_eligible_count
  FROM public.produtos AS product
  WHERE product.id = ANY (p_weekly_ids)
    AND product.preco_atual > 0
    AND product.preco_atacado > 0
    AND product.url_imagem ~* '^https?://'
    AND NOT (
      (COALESCE(product.descricao, '') || ' ' || COALESCE(pg_catalog.array_to_string(product.cores, ' '), ''))
      ~* '(indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel)'
    );

  IF v_eligible_count <> pg_catalog.cardinality(p_weekly_ids) THEN
    RAISE EXCEPTION 'Há produto sem preço, imagem ou disponibilidade válida. Revise a seleção.';
  END IF;

  INSERT INTO public.mobi_homepage_weekly_curation (id, weekly_ids, source_revision, updated_at)
  VALUES (true, p_weekly_ids, p_revision_id, pg_catalog.now())
  ON CONFLICT (id) DO UPDATE
  SET weekly_ids = EXCLUDED.weekly_ids,
      source_revision = EXCLUDED.source_revision,
      updated_at = EXCLUDED.updated_at;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.mobi_homepage_weekly_apply(bigint, bigint, text[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobi_homepage_weekly_apply(bigint, bigint, text[]) TO service_role;
