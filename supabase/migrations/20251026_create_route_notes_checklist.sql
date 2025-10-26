-- Route notes & checklist tables
-- Created: 2025-10-26

create table if not exists public.route_notes (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude decimal(10,8) not null,
  longitude decimal(11,8) not null,
  distance_from_start decimal(10,2), -- km
  note_text text not null,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.route_notes enable row level security;

create table if not exists public.route_checklist_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  latitude decimal(10,8) not null,
  longitude decimal(11,8) not null,
  distance_from_start decimal(10,2), -- km
  item_text text not null,
  completed boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.route_checklist_items enable row level security;

-- Indexes
create index if not exists idx_route_notes_trip on public.route_notes(trip_id);
create index if not exists idx_route_checklist_trip on public.route_checklist_items(trip_id);

-- Policies: only owner of trip can CRUD
create policy if not exists "route_notes_select_own_trip"
  on public.route_notes
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = route_notes.trip_id and t.user_id = auth.uid()
    )
  );

create policy if not exists "route_notes_modify_own_trip"
  on public.route_notes
  for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = route_notes.trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = route_notes.trip_id and t.user_id = auth.uid()
    )
  );

create policy if not exists "route_checklist_select_own_trip"
  on public.route_checklist_items
  for select
  using (
    exists (
      select 1 from public.trips t
      where t.id = route_checklist_items.trip_id and t.user_id = auth.uid()
    )
  );

create policy if not exists "route_checklist_modify_own_trip"
  on public.route_checklist_items
  for all
  using (
    exists (
      select 1 from public.trips t
      where t.id = route_checklist_items.trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = route_checklist_items.trip_id and t.user_id = auth.uid()
    )
  );

