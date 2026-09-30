begin;

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

commit;

notify pgrst, 'reload schema';
