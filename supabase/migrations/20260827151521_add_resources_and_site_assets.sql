create table if not exists public.resources (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  url text not null,
  image_url text,
  resource_type text not null default 'tool' check (resource_type in ('tool','platform','creator','news','workflow','community','other')),
  tags text[] not null default '{}',
  is_featured boolean not null default false,
  is_published boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_assets (
  id uuid primary key default gen_random_uuid(),
  asset_key text not null unique,
  name text not null,
  asset_type text not null default 'image' check (asset_type in ('image','video','icon','document','other')),
  url text not null,
  alt_text text not null default '',
  notes text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.resources enable row level security;
alter table public.site_assets enable row level security;

grant select on public.resources to anon, authenticated;
grant insert, update, delete on public.resources to authenticated;
grant select on public.site_assets to anon, authenticated;
grant insert, update, delete on public.site_assets to authenticated;

create policy "published resources are public" on public.resources for select using (is_published or public.is_admin(auth.uid()));
create policy "admins manage resources" on public.resources for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "published assets are public" on public.site_assets for select using (is_published or public.is_admin(auth.uid()));
create policy "admins manage assets" on public.site_assets for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create trigger resources_touch_updated_at before update on public.resources for each row execute function public.touch_updated_at();
create trigger site_assets_touch_updated_at before update on public.site_assets for each row execute function public.touch_updated_at();
