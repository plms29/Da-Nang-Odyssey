-- Run once in Supabase SQL editor.
create table if not exists public.danang_progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.danang_progress enable row level security;
create policy "danang own progress" on public.danang_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
