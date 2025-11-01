import { notFound } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { createServerSupabase } from '@/lib/supabase-server'

export const dynamic = 'force-dynamic'

interface Profile {
  id: string
  username: string | null
  full_name: string | null
  avatar_url: string | null
  bio: string | null
}

interface TripImageItem {
  id: string
  image_url: string
  caption: string | null
  created_at: string
  trip?: { slug?: string | null; title?: string | null }
}

interface ActivityItem {
  id: string
  type: string
  data: any
  created_at: string
}

export default async function UserProfilePage({ params }: { params: { username: string } }) {
  const supabase = await createServerSupabase()
  const username = params.username

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('id, username, full_name, avatar_url, bio')
    .eq('username', username)
    .single<Profile>()

  if (profileError || !profile) {
    return notFound()
  }

  // Public trip images only (respect trip privacy)
  const { data: tripImages } = await supabase
    .from('trip_feed_images')
    .select(`
      id,
      image_url,
      caption,
      created_at,
      trips!inner (
        slug,
        title,
        privacy
      )
    ` as any)
    .eq('user_id', profile.id)
    .eq('trips.privacy', 'public')
    .order('created_at', { ascending: false })
    .limit(60)

  // Public standalone activity posts (photos/videos). We only show items that contain images (no private trip binding here)
  const { data: activities } = await supabase
    .from('activity_feed')
    .select('id, type, data, created_at')
    .eq('user_id', profile.id)
    .order('created_at', { ascending: false })
    .limit(60)

  const activityItems: TripImageItem[] = (activities || [])
    .filter((a: ActivityItem) => a?.data?.images?.length || a?.data?.image_url)
    .map((a: ActivityItem) => ({
      id: a.id,
      image_url: (a.data?.images?.[0]?.url || a.data?.image_url) as string,
      caption: (a.data?.caption ?? null) as string | null,
      created_at: a.created_at,
    }))

  const tripItems: TripImageItem[] = (tripImages || []).map((t: any) => ({
    id: t.id,
    image_url: t.image_url,
    caption: t.caption,
    created_at: t.created_at,
    trip: { slug: t.trips?.slug, title: t.trips?.title },
  }))

  const items = [...activityItems, ...tripItems].sort((a, b) => (a.created_at > b.created_at ? -1 : 1))

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={profile.avatar_url || '/avatars/default.png'} alt={profile.username || 'User'} className="w-full h-full object-cover" />
        </div>
        <div>
          <div className="text-xl font-semibold">{profile.username}</div>
          {profile.full_name && <div className="text-gray-600">{profile.full_name}</div>}
          {profile.bio && <div className="text-sm text-gray-600 mt-1 max-w-2xl">{profile.bio}</div>}
        </div>
      </div>

      {/* Grid */}
      {items.length === 0 ? (
        <div className="text-sm text-gray-500">No public posts yet.</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {items.map((it) => {
            const href = it.trip?.slug ? `/trips/${it.trip.slug}` : undefined
            const content = (
              <div className="group relative aspect-square overflow-hidden rounded-lg bg-gray-100">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={it.image_url} alt={it.caption || 'Moment'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
                {it.caption && (
                  <div className="absolute inset-x-0 bottom-0 p-2 text-[11px] text-white/90 opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {it.caption}
                  </div>
                )}
              </div>
            )
            return href ? (
              <Link href={href} key={it.id} prefetch={false} aria-label={it.trip?.title || 'Trip'}>
                {content}
              </Link>
            ) : (
              <div key={it.id}>{content}</div>
            )
          })}
        </div>
      )}
    </div>
  )
}

