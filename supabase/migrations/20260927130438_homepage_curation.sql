begin;

alter table public.produtos
  add column if not exists vitrine_semana_ordem smallint,
  add column if not exists vitrine_novidade text not null default 'automatico',
  add column if not exists vitrine_sala text not null default 'automatico',
  add column if not exists vitrine_descoberta boolean not null default true;

alter table public.produtos
  add constraint produtos_vitrine_semana_ordem_check
    check (vitrine_semana_ordem is null or vitrine_semana_ordem between 1 and 4),
  add constraint produtos_vitrine_novidade_check
    check (vitrine_novidade in ('automatico', 'incluir', 'ocultar')),
  add constraint produtos_vitrine_sala_check
    check (vitrine_sala in ('automatico', 'incluir', 'ocultar'));

create table if not exists public.homepage_banners (
  position smallint primary key check (position between 1 and 3),
  image_url text not null check (image_url ~* '^https?://'),
  eyebrow text not null default '',
  title text not null check (char_length(title) between 1 and 120),
  subtitle text not null default '',
  cta_label text not null default '',
  cta_href text not null default '/',
  active boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.homepage_banners enable row level security;
revoke all on table public.homepage_banners from public, anon, authenticated;
grant all on table public.homepage_banners to service_role;

insert into public.homepage_banners (
  position, image_url, eyebrow, title, subtitle, cta_label, cta_href, active
) values
  (1, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80', 'COLEÇÃO MOBI', 'Ambientes que fazem sentido.', 'Móveis que combinam com a sua vida.', 'Encontre seu próximo móvel', '/?all=true#catalogo', true),
  (2, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80', 'COLEÇÃO MOBI', 'Um novo jeito de morar.', 'Móveis que combinam com a sua vida.', 'Encontre seu próximo móvel', '/?all=true#catalogo', true),
  (3, 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1400&q=80', 'COLEÇÃO MOBI', 'Seu lar, com mais estilo.', 'Móveis que combinam com a sua vida.', 'Encontre seu próximo móvel', '/?all=true#catalogo', true)
on conflict (position) do nothing;

create unique index if not exists produtos_vitrine_semana_ordem_unique
  on public.produtos (vitrine_semana_ordem)
  where vitrine_semana_ordem is not null;

with initial_weekly(slug, position) as (
  values
    ('sr-poltrona-jamile-veludo-suede-azul-marinho', 1),
    ('sr-aparador-adega-new-odin-off-white-freijo-ej-moveis', 2),
    ('tropical-cozinha-cristal-valdemoveis-964-7', 3),
    ('tropical-mesa-magic-vieiro-298-mesa-jantar-13', 4)
)
update public.produtos as product
set vitrine_semana_ordem = initial_weekly.position
from initial_weekly
where product.slug = initial_weekly.slug
  and coalesce(product.preco_atual, 0) > 0
  and coalesce(product.preco_atacado, 0) > 0
  and coalesce(product.url_imagem, '') ~* '^https?://'
  and (
    coalesce(product.descricao, '') || ' ' ||
    array_to_string(coalesce(product.cores, array[]::text[]), ' ')
  ) !~* '(indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel)';

create or replace function public.save_homepage_curation(
  p_weekly_ids text[],
  p_home_settings jsonb
)
returns void
language plpgsql
security invoker
set search_path = ''
as $function$
declare
  v_updated_count integer;
  v_settings_count integer;
begin
  if p_weekly_ids is null then
    p_weekly_ids := array[]::text[];
  end if;

  if cardinality(p_weekly_ids) > 4 then
    raise exception 'Escolha no máximo quatro produtos para a semana.';
  end if;

  if cardinality(p_weekly_ids) <> (
    select count(distinct requested.product_id)
    from unnest(p_weekly_ids) as requested(product_id)
  ) then
    raise exception 'Um produto foi selecionado mais de uma vez.';
  end if;

  if exists (
    select 1
    from unnest(p_weekly_ids) as requested(product_id)
    left join public.produtos as product on product.id = requested.product_id
    where product.id is null
      or coalesce(product.preco_atual, 0) <= 0
      or coalesce(product.preco_atacado, 0) <= 0
      or coalesce(product.url_imagem, '') !~* '^https?://'
      or (
        coalesce(product.descricao, '') || ' ' ||
        array_to_string(coalesce(product.cores, array[]::text[]), ' ')
      ) ~* '(indispon[ií]vel|esgotad[oa]|sem estoque|n[aã]o temos dispon[ií]vel)'
  ) then
    raise exception 'Escolha somente produtos publicados e disponíveis.';
  end if;

  if p_home_settings is null or jsonb_typeof(p_home_settings) <> 'array' then
    raise exception 'As opções da vitrine estão em formato inválido.';
  end if;

  if exists (
    select 1
    from jsonb_to_recordset(p_home_settings) as setting(
      id text,
      novidade text,
      sala text,
      descoberta boolean
    )
    where setting.id is null
      or setting.id = ''
      or setting.novidade is null
      or setting.novidade not in ('automatico', 'incluir', 'ocultar')
      or setting.sala is null
      or setting.sala not in ('automatico', 'incluir', 'ocultar')
      or setting.descoberta is null
  ) then
    raise exception 'Uma das opções da vitrine está inválida.';
  end if;

  select count(*) into v_settings_count from jsonb_array_elements(p_home_settings);
  if v_settings_count <> (
    select count(distinct setting.id)
    from jsonb_to_recordset(p_home_settings) as setting(
      id text,
      novidade text,
      sala text,
      descoberta boolean
    )
  ) then
    raise exception 'Há produtos repetidos nas opções da vitrine.';
  end if;

  update public.produtos as product
  set vitrine_novidade = setting.novidade,
      vitrine_sala = setting.sala,
      vitrine_descoberta = setting.descoberta
  from jsonb_to_recordset(p_home_settings) as setting(
    id text,
    novidade text,
    sala text,
    descoberta boolean
  )
  where product.id = setting.id;

  get diagnostics v_updated_count = row_count;
  if v_updated_count <> v_settings_count then
    raise exception 'A lista de produtos mudou. Atualize o painel e tente novamente.';
  end if;

  update public.produtos set vitrine_semana_ordem = null
  where vitrine_semana_ordem is not null;

  update public.produtos as product
  set vitrine_semana_ordem = requested.position::smallint
  from unnest(p_weekly_ids) with ordinality as requested(product_id, position)
  where product.id = requested.product_id;
end;
$function$;

revoke all on function public.save_homepage_curation(text[], jsonb) from public, anon, authenticated;
grant execute on function public.save_homepage_curation(text[], jsonb) to service_role;

commit;
