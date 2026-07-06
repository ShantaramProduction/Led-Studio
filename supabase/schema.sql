-- SHANTARAM Studio cloud schema
-- Run this in Supabase SQL Editor.

create extension if not exists "pgcrypto";

create table if not exists public.user_profiles (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text,
  company_name text,
  accepted_terms_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.projects (
  id text primary key,
  owner_id uuid references public.user_profiles(id) on delete set null,
  name text not null,
  description text default '',
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cabinet_library (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.user_profiles(id) on delete set null,
  name text not null,
  manufacturer text default '',
  width_mm integer not null default 500,
  height_mm integer not null default 500,
  pixels_x integer not null default 128,
  pixels_y integer not null default 128,
  weight_kg numeric not null default 0,
  avg_power_w numeric not null default 0,
  max_power_w numeric not null default 0,
  receiver_card text default '',
  config_file_name text default '',
  notes text default '',
  is_public boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.cabinet_files (
  id uuid primary key default gen_random_uuid(),
  cabinet_id uuid references public.cabinet_library(id) on delete cascade,
  owner_id uuid references public.user_profiles(id) on delete set null,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.project_files (
  id uuid primary key default gen_random_uuid(),
  project_id text references public.projects(id) on delete cascade,
  owner_id uuid references public.user_profiles(id) on delete set null,
  file_name text not null,
  file_type text not null,
  storage_path text not null,
  purpose text default 'reference',
  created_at timestamptz not null default now()
);

create table if not exists public.app_branding (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.user_profiles(id) on delete set null,
  logo_file_name text,
  logo_storage_path text,
  cabinet_palette jsonb not null default '["#d9dde4", "#cdd3dc", "#ff9a4d"]'::jsonb,
  cabinet_display jsonb not null default '{"showNumber":true,"showPort":false,"showPower":false,"showRx":false}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists projects_owner_id_idx on public.projects(owner_id);
create index if not exists cabinet_library_owner_id_idx on public.cabinet_library(owner_id);
create index if not exists cabinet_files_cabinet_id_idx on public.cabinet_files(cabinet_id);
create index if not exists project_files_project_id_idx on public.project_files(project_id);

-- Storage buckets to create in Supabase dashboard:
-- 1. cabinet-files
-- 2. project-files
-- 3. branding
