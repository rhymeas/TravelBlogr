import { NextResponse } from 'next/server'
import { locations } from '@/lib/data/locationsData'

// GET /api/locations - Get all locations
export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: locations,
      count: locations.length
    })
  } catch (error) {
    console.error('Error fetching locations:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch locations' },
      { status: 500 }
    )
  }
}

// POST /api/locations - Create new location (for CMS integration)
export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['name', 'slug', 'country', 'region', 'description']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { success: false, error: `Missing required field: ${field}` },
          { status: 400 }
        )
      }
    }

    // In a real app, this would save to Supabase
    // For now, we'll just return success
    const newLocation = {
      id: Date.now().toString(),
      name: body.name,
      slug: body.slug,
      country: body.country,
      region: body.region,
      description: body.description,
      featured_image: body.featured_image || 'https://picsum.photos/1200/800?random=999',
      rating: body.rating || 4.5,
      visit_count: body.visit_count || 0,
      is_featured: body.is_featured || false,
      created_at: new Date().toISOString(),
      images: body.images || [],
      posts: body.posts || []
    }

    return NextResponse.json({
      success: true,
      data: newLocation,
      message: 'Location created successfully'
    }, { status: 201 })
  } catch (error) {
    console.error('Error creating location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create location' },
      { status: 500 }
    )
  }
}
