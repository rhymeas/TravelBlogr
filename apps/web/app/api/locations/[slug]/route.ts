import { NextResponse } from 'next/server'
import { getLocationBySlug } from '@/lib/data/locationsData'

interface RouteParams {
  params: {
    slug: string
  }
}

// GET /api/locations/[slug] - Get location by slug
export async function GET(request: Request, { params }: RouteParams) {
  try {
    const location = getLocationBySlug(params.slug)
    
    if (!location) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      data: location
    })
  } catch (error) {
    console.error('Error fetching location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch location' },
      { status: 500 }
    )
  }
}

// PUT /api/locations/[slug] - Update location (for CMS integration)
export async function PUT(request: Request, { params }: RouteParams) {
  try {
    const body = await request.json()
    const existingLocation = getLocationBySlug(params.slug)
    
    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    // In a real app, this would update in Supabase
    // For now, we'll just return the updated data
    const updatedLocation = {
      ...existingLocation,
      ...body,
      id: existingLocation.id, // Preserve original ID
      slug: existingLocation.slug, // Preserve original slug
      updated_at: new Date().toISOString()
    }

    return NextResponse.json({
      success: true,
      data: updatedLocation,
      message: 'Location updated successfully'
    })
  } catch (error) {
    console.error('Error updating location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update location' },
      { status: 500 }
    )
  }
}

// DELETE /api/locations/[slug] - Delete location (for CMS integration)
export async function DELETE(request: Request, { params }: RouteParams) {
  try {
    const existingLocation = getLocationBySlug(params.slug)
    
    if (!existingLocation) {
      return NextResponse.json(
        { success: false, error: 'Location not found' },
        { status: 404 }
      )
    }

    // In a real app, this would delete from Supabase
    // For now, we'll just return success
    return NextResponse.json({
      success: true,
      message: 'Location deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting location:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete location' },
      { status: 500 }
    )
  }
}
