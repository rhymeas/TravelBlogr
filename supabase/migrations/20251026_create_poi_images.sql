-- Create table to cache POI/Activity images for reuse across users
create table if not exists public.poi_images (
  id uuid primary key default gen_random_uuid(),
  poi_name text not null,
  location text not null,
  category text,
  image_url text not null,
  source text default 'brave',
  created_at timestamptz default now(),
  unique (poi_name, location)
);

-- Index for quick lookups
create index if not exists idx_poi_images_lookup on public.poi_images (poi_name, location);

-- RLS: images are public cache; allow read for anon, insert/update only for service role
alter table public.poi_images enable row level security;

do $$ begin
  create policy poi_images_read on public.poi_images
    for select
    to public
    using (true);
exception when duplicate_object then null; end $$;

-- No public insert/update/delete policies; APIs will use service role

