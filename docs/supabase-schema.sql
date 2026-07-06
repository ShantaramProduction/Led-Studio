-- SHANTARAM Studio MVP database schema
-- Run this in Supabase SQL Editor when you are ready to enable cloud saving.

create table if not exists public.projects (
  id text primary key,
  name text not null,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.projects enable row level security;

-- MVP open policy for early private testing.
-- Later we will replace this with auth.uid()-based owner rules.
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'projects'
      and policyname = 'Allow public MVP project access'
  ) then
    create policy "Allow public MVP project access"
      on public.projects
      for all
      using (true)
      with check (true);
  end if;
end $$;
