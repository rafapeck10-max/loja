-- SQL candidate for isolated validation, NOT an applied/generated migration.
-- No product, price, supplier or published configuration is changed.
BEGIN;
SET LOCAL lock_timeout = '5s';
CREATE TABLE public.mobi_studio_workspace (
  id boolean PRIMARY KEY DEFAULT true CHECK (id),
  server_version bigint NOT NULL DEFAULT 0
    CHECK (server_version BETWEEN 0 AND 9007199254740991),
  workspace jsonb NOT NULL CHECK (
    jsonb_typeof(workspace) = 'object'
    AND workspace ?& ARRAY['schema','revision','entries','history']
    AND workspace->'schema' = '1'::jsonb
    AND jsonb_typeof(workspace->'revision') = 'number'
    AND (workspace->>'revision')::numeric >= 0
    AND (workspace->>'revision')::numeric = jsonb_array_length(workspace->'history')
    AND jsonb_typeof(workspace->'entries') = 'object'
    AND jsonb_typeof(workspace->'history') = 'array'
    AND octet_length(workspace::text) <= 3500000
  ),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.mobi_studio_workspace ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.mobi_studio_workspace FROM PUBLIC, anon, authenticated, service_role;
GRANT SELECT, UPDATE ON public.mobi_studio_workspace TO service_role;
INSERT INTO public.mobi_studio_workspace(id, workspace)
VALUES (true, '{"schema":1,"revision":0,"entries":{},"history":[]}'::jsonb);

CREATE FUNCTION public.mobi_studio_read() RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER SET search_path = '' AS $$
  SELECT jsonb_build_object('serverVersion', server_version, 'workspace', workspace)
  FROM public.mobi_studio_workspace WHERE id = true;
$$;

CREATE FUNCTION public.mobi_studio_compare_and_swap(
  p_expected_version bigint, p_workspace jsonb
) RETURNS boolean
LANGUAGE plpgsql SECURITY INVOKER SET search_path = '' AS $$
DECLARE changed_count integer;
BEGIN
  IF p_expected_version IS NULL OR p_expected_version < 0
    OR p_expected_version >= 9007199254740991 OR p_workspace IS NULL THEN
    RAISE EXCEPTION 'Invalid studio version or payload' USING ERRCODE = '22023';
  END IF;
  UPDATE public.mobi_studio_workspace
  SET workspace = p_workspace, server_version = server_version + 1, updated_at = now()
  WHERE id = true AND server_version = p_expected_version;
  GET DIAGNOSTICS changed_count = ROW_COUNT;
  RETURN changed_count = 1;
END;
$$;
REVOKE ALL ON FUNCTION public.mobi_studio_read() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mobi_studio_compare_and_swap(bigint,jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.mobi_studio_read() TO service_role;
GRANT EXECUTE ON FUNCTION public.mobi_studio_compare_and_swap(bigint,jsonb) TO service_role;
COMMIT;
