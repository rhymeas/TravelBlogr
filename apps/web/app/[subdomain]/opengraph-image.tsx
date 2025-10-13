import { ImageResponse } from 'next/og'
import { createServerSupabase } from '@/lib/supabase-server'

export const runtime = 'edge'
export const alt = 'Trip Cover Image'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: { subdomain: string } }) {
  const supabase = await createServerSupabase()

  // Fetch trip data
  const { data: shareLink } = await supabase
    .from('share_links')
    .select(`
      title,
      description,
      trip:trips (
        title,
        description,
        cover_image,
        user:users (
          full_name,
          avatar_url
        )
      )
    `)
    .eq('subdomain', params.subdomain)
    .eq('is_active', true)
    .single()

  if (!shareLink?.trip) {
    return new ImageResponse(
      (
        <div
          style={{
            fontSize: 128,
            background: 'linear-gradient(to bottom right, #1e40af, #7c3aed)',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
          }}
        >
          TravelBlogr
        </div>
      ),
      {
        ...size,
      }
    )
  }

  const trip = shareLink.trip as any

  return new ImageResponse(
    (
      <div
        style={{
          fontSize: 60,
          background: 'white',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px',
        }}
      >
        {/* Cover Image */}
        {trip.cover_image && (
          <img
            src={trip.cover_image}
            alt={trip.title}
            style={{
              width: '100%',
              height: '400px',
              objectFit: 'cover',
              borderRadius: '20px',
            }}
          />
        )}

        {/* Trip Title */}
        <div
          style={{
            fontSize: 72,
            fontWeight: 'bold',
            marginTop: '30px',
            textAlign: 'center',
          }}
        >
          {trip.title}
        </div>

        {/* Author */}
        <div
          style={{
            fontSize: 36,
            color: '#666',
            marginTop: '20px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {trip.user?.avatar_url && (
            <img
              src={trip.user.avatar_url}
              alt={trip.user.full_name}
              style={{
                width: '50px',
                height: '50px',
                borderRadius: '50%',
                marginRight: '15px',
              }}
            />
          )}
          by {trip.user?.full_name || 'Anonymous'}
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}

