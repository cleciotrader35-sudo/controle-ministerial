-- Execute este arquivo no Supabase em: SQL Editor > New query > Run

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null default '',
  needs_change boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.membros (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  nome text not null,
  contato text,
  data_nascimento date,
  lider text,
  endereco text,
  data_entrada date not null,
  data_saida date,
  observacoes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.membros enable row level security;

drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "membros_select_own" on public.membros;
drop policy if exists "membros_insert_own" on public.membros;
drop policy if exists "membros_update_own" on public.membros;
drop policy if exists "membros_delete_own" on public.membros;

create policy "profiles_select_own" on public.profiles
for select using (auth.uid() = id);

create policy "profiles_insert_own" on public.profiles
for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
for update using (auth.uid() = id) with check (auth.uid() = id);

create policy "membros_select_own" on public.membros
for select using (auth.uid() = user_id);

create policy "membros_insert_own" on public.membros
for insert with check (auth.uid() = user_id);

create policy "membros_update_own" on public.membros
for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "membros_delete_own" on public.membros
for delete using (auth.uid() = user_id);
