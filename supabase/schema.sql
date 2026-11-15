-- Run once in Supabase SQL editor.
create table if not exists public.danang_progress (
  user_id uuid primary key references auth.users on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);
alter table public.danang_progress enable row level security;
create policy "danang own progress" on public.danang_progress
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Community photos (run once). Bucket is public-read; only logged-in users can upload/insert.
insert into storage.buckets (id, name, public) values ('danang-photos', 'danang-photos', true)
  on conflict (id) do nothing;
create policy "photos upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'danang-photos' and (storage.foldername(name))[1] = auth.uid()::text);
create table if not exists public.danang_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  spot_id text not null,
  spot_name text not null,
  caption text,
  path text not null,
  created_at timestamptz not null default now()
);
alter table public.danang_photos enable row level security;
create policy "photos read all" on public.danang_photos for select using (true);
create policy "photos insert own" on public.danang_photos for insert to authenticated
  with check (auth.uid() = user_id);
create policy "photos delete own" on public.danang_photos for delete to authenticated
  using (auth.uid() = user_id);
