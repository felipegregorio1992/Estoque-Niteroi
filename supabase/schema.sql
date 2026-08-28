-- ============================================================
-- Estoque Niteroi - Schema Supabase
-- Rode este arquivo no SQL Editor do Supabase (uma vez).
-- Depois rode seed.sql para popular a base inicial.
-- ============================================================

-- ---------- Extensoes ----------
create extension if not exists "pgcrypto";

-- ============================================================
-- profiles: 1 linha por usuario (espelha auth.users) com o papel
-- ============================================================
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

-- ============================================================
-- positions: estoque por SKU + localizacao
-- min_alert: limite proprio do item. Se NULL, usa o padrao global.
-- ============================================================
create table if not exists public.positions (
  id uuid primary key default gen_random_uuid(),
  sku text not null,
  description text,
  location text not null,
  quantity integer not null default 0 check (quantity >= 0),
  min_alert integer check (min_alert >= 0),
  last_counted_at timestamptz,
  updated_at timestamptz not null default now(),
  unique (sku, location)
);

create index if not exists positions_sku_idx on public.positions (sku);
create index if not exists positions_quantity_idx on public.positions (quantity);

-- ============================================================
-- count_sessions: historico de contagens aplicadas
-- ============================================================
create table if not exists public.count_sessions (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  applied_at timestamptz not null default now(),
  applied_by uuid references auth.users(id) on delete set null,
  items jsonb not null default '[]'::jsonb
);

create index if not exists count_sessions_applied_at_idx on public.count_sessions (applied_at desc);

-- ============================================================
-- app_settings: configuracoes globais (linha unica id=1)
-- default_min_alert: limite global padrao
-- resend_api_key / alert_emails: para envio de email (cadastrar depois)
-- ============================================================
create table if not exists public.app_settings (
  id integer primary key default 1 check (id = 1),
  default_min_alert integer not null default 10 check (default_min_alert >= 0),
  email_enabled boolean not null default false,
  resend_api_key text,
  alert_from text,
  alert_emails text[] not null default '{}',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id) values (1)
on conflict (id) do nothing;

-- ============================================================
-- Funcao helper: is_admin()
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- ============================================================
-- Trigger: cria profile automaticamente ao criar usuario
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Trigger: mantem updated_at
-- ============================================================
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists positions_touch on public.positions;
create trigger positions_touch before update on public.positions
  for each row execute function public.touch_updated_at();

drop trigger if exists app_settings_touch on public.app_settings;
create trigger app_settings_touch before update on public.app_settings
  for each row execute function public.touch_updated_at();

-- ============================================================
-- Row Level Security
-- ============================================================
alter table public.profiles enable row level security;
alter table public.positions enable row level security;
alter table public.count_sessions enable row level security;
alter table public.app_settings enable row level security;

-- profiles: usuario ve o proprio; admin ve todos
drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_admin_update on public.profiles;
create policy profiles_admin_update on public.profiles
  for update using (public.is_admin());

-- positions: qualquer usuario autenticado le e escreve
drop policy if exists positions_select on public.positions;
create policy positions_select on public.positions
  for select using (auth.uid() is not null);

drop policy if exists positions_write on public.positions;
create policy positions_write on public.positions
  for all using (auth.uid() is not null) with check (auth.uid() is not null);

-- count_sessions: autenticado le e insere
drop policy if exists sessions_select on public.count_sessions;
create policy sessions_select on public.count_sessions
  for select using (auth.uid() is not null);

drop policy if exists sessions_insert on public.count_sessions;
create policy sessions_insert on public.count_sessions
  for insert with check (auth.uid() is not null);

-- app_settings: SOMENTE admin le a tabela base (contem a resend_api_key secreta).
-- Usuarios comuns leem o limite global pela view publica abaixo.
drop policy if exists settings_admin_select on public.app_settings;
create policy settings_admin_select on public.app_settings
  for select using (public.is_admin());

drop policy if exists settings_admin_update on public.app_settings;
create policy settings_admin_update on public.app_settings
  for update using (public.is_admin());

-- View publica sem segredos: expoe apenas o limite global e se email esta ligado.
create or replace view public.settings_public
with (security_invoker = false) as
  select default_min_alert, email_enabled
  from public.app_settings
  where id = 1;

grant select on public.settings_public to anon, authenticated;
