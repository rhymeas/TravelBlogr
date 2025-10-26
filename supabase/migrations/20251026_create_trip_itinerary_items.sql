-- Create trip_itinerary_items table
create table if not exists public.trip_itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_index integer not null check (day_index >= 0),
  title text not null,
  type text not null check (type in ('activity','meal','travel','note')),
  duration text,
  image_url text,
  metadata jsonb default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Helpful index
create index if not exists idx_trip_itinerary_items_trip_day on public.trip_itinerary_items (trip_id, day_index);

-- RLS
alter table public.trip_itinerary_items enable row level security;

-- Policy: owners can read their items
drop policy if exists "trip_itinerary_items_select_owners" on public.trip_itinerary_items;
create policy "trip_itinerary_items_select_owners"
  on public.trip_itinerary_items
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

-- Policy: owners can insert into their trips
drop policy if exists "trip_itinerary_items_insert_owners" on public.trip_itinerary_items;
create policy "trip_itinerary_items_insert_owners"
  on public.trip_itinerary_items
  for insert
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

-- Policy: owners can delete
drop policy if exists "trip_itinerary_items_delete_owners" on public.trip_itinerary_items;
create policy "trip_itinerary_items_delete_owners"
  on public.trip_itinerary_items
  for delete
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

-- Trigger to keep updated_at fresh
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_trip_itinerary_items_updated_at
before update on public.trip_itinerary_items
for each row execute function public.set_updated_at();

