import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { GenerateplanUseCase } from '@/lib/itinerary/application/use-cases/GenerateItineraryUseCase'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerSupabase()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const collectionId = params.id
    const body = await req.json().catch(() => ({}))
    const days: number = Math.max(2, Math.min(30, Number(body?.days) || 7))
    const budget: 'budget' | 'moderate' | 'luxury' = body?.budget || 'moderate'
    const transportMode: 'car' | 'train' | 'bike' | 'flight' | 'bus' | 'mixed' = body?.transportMode || 'car'
    const tripType: 'road-trip' | 'bike' | 'family' | 'adventure' | 'luxury' | 'city' | 'solo' | 'wellness' | 'specific' | 'journey' | 'multi-destination' = body?.tripType || 'road-trip'

    // Verify collection ownership
    const { data: collection, error: colErr } = await supabase
      .from('wishlist_collections')
      .select('id, name, user_id')
      .eq('id', collectionId)
      .single()
    if (colErr || !collection || collection.user_id !== user.id) {
      return NextResponse.json({ error: 'Collection not found' }, { status: 404 })
    }

    // Get location ids in the order they were added
    const { data: links, error: linksErr } = await supabase
      .from('collection_locations')
      .select('location_id, added_at')
      .eq('collection_id', collectionId)
      .order('added_at', { ascending: true })
    if (linksErr) throw linksErr

    const ids = (links || []).map(l => l.location_id)
    if (ids.length === 0) {
      return NextResponse.json({ error: 'This collection has no locations' }, { status: 400 })
    }

    // Fetch locations and preserve order
    const { data: locs, error: locErr } = await supabase
      .from('locations')
      .select('id, slug, name, country')
      .in('id', ids)
    if (locErr) throw locErr

    const orderMap = new Map(ids.map((id, idx) => [id, idx]))
    const ordered = (locs || []).sort((a, b) => (orderMap.get(a.id) ?? 0) - (orderMap.get(b.id) ?? 0))

    // Build route inputs
    const selected = ordered.slice(0, Math.min(10, ordered.length))
    const from = selected[0]
    const to = selected[selected.length - 1]
    const stops = selected.slice(1, selected.length - 1)

    // Dates (today + 21 days, for UI clarity)
    const start = new Date()
    start.setDate(start.getDate() + 21)
    const end = new Date(start)
    end.setDate(start.getDate() + (days - 1))

    // Call planning use case (ensures itinerary exists for editor)
    const useCase = new GenerateplanUseCase()
    const result = await useCase.execute({
      from: from.slug || from.name,
      to: to.slug || to.name,
      stops: stops.map(s => s.slug || s.name),
      startDate: start.toISOString().slice(0, 10),
      endDate: end.toISOString().slice(0, 10),
      budget,
      transportMode,
      tripType,
      proMode: false
    })

    if (!result.success) {
      console.warn('Itinerary generation failed:', result.error)
      // continue anyway - user can edit later
    }

    // Create trip record so it appears in My Trips and editor
    const title = `Trip from ${collection.name}`
    const { data: trip, error: tripErr } = await supabase
      .from('trips')
      .insert({
        user_id: user.id,
        title,
        description: `Auto-generated from collection "${collection.name}"` + (result?.plan?.summary ? ` — ${result.plan.summary}` : ''),
        slug: `${title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${Math.random().toString(36).slice(2, 10)}`,
        status: 'draft',
        start_date: start.toISOString().slice(0, 10),
        end_date: end.toISOString().slice(0, 10),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select('id, slug')
      .single()

    if (tripErr) throw tripErr

    return NextResponse.json({ success: true, tripId: trip.id, tripSlug: trip.slug })
  } catch (e: any) {
    console.error('generate-trip error', e)
    return NextResponse.json({ error: e?.message || 'Failed to generate trip' }, { status: 500 })
  }
}

