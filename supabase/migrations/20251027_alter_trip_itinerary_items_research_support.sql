-- Research support: enable UPDATE, add metadata index, and guard metadata.research shape

-- 1) Owners can UPDATE their itinerary items (needed to write research metadata)
drop policy if exists "trip_itinerary_items_update_owners" on public.trip_itinerary_items;
create policy "trip_itinerary_items_update_owners"
  on public.trip_itinerary_items
  for update
  using (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.trips t
      where t.id = trip_id and t.user_id = auth.uid()
    )
  );

-- 2) GIN index on metadata for efficient JSONB containment lookups (@>, ? operators)
create index if not exists idx_trip_itinerary_items_metadata on public.trip_itinerary_items using gin (metadata jsonb_path_ops);

-- 3) Optional: ensure metadata.research (when present) is an object
--    Allows flexible schema but prevents accidental scalar writes
alter table public.trip_itinerary_items
  add constraint if not exists trip_itinerary_items_metadata_research_object
  check (
    not (metadata ? 'research')
    or jsonb_typeof(metadata -> 'research') = 'object'
  );

-- 4) Helpful composite index for common queries (trip/day ordering)
create index if not exists idx_trip_itinerary_items_trip_day_created_at
  on public.trip_itinerary_items (trip_id, day_index, created_at desc);

