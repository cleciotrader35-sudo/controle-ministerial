-- Controle Ministerial - Recepção | Supabase
-- Execute no Supabase: SQL Editor > New Query > Run

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  role text not null default 'usuario',
  needs_change boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  lider text,
  contato text,
  instagram text,
  indicacao text,
  data_nascimento date,
  endereco text,
  data_entrada date not null,
  data_saida date,
  observacoes text,
  created_at timestamptz not null default now()
);

-- Migração segura para quem já tinha versão anterior
alter table public.membros add column if not exists instagram text;
alter table public.membros add column if not exists indicacao text;
alter table public.profiles add column if not exists role text not null default 'usuario';

create table if not exists public.eventos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  titulo text not null,
  data_evento date not null,
  horario text,
  local text,
  descricao text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.membros enable row level security;
alter table public.eventos enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "membros_select_own" on public.membros;
drop policy if exists "membros_insert_own" on public.membros;
drop policy if exists "membros_update_own" on public.membros;
drop policy if exists "membros_delete_own" on public.membros;
drop policy if exists "eventos_select_own" on public.eventos;
drop policy if exists "eventos_insert_own" on public.eventos;
drop policy if exists "eventos_update_own" on public.eventos;
drop policy if exists "eventos_delete_own" on public.eventos;

create policy "profiles_select_own" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "membros_select_own" on public.membros for select using (auth.uid() = user_id);
create policy "membros_insert_own" on public.membros for insert with check (auth.uid() = user_id);
create policy "membros_update_own" on public.membros for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "membros_delete_own" on public.membros for delete using (auth.uid() = user_id);

create policy "eventos_select_own" on public.eventos for select using (auth.uid() = user_id);
create policy "eventos_insert_own" on public.eventos for insert with check (auth.uid() = user_id);
create policy "eventos_update_own" on public.eventos for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "eventos_delete_own" on public.eventos for delete using (auth.uid() = user_id);
