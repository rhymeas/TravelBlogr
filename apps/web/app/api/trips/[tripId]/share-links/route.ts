import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'

// GET /api/trips/[tripId]/share-links - Get share links for a trip
export async function GET(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id')
      .eq('id', params.tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    // Get share links
    const { data: shareLinks, error } = await supabase
      .from('share_links')
      .select('*')
      .eq('trip_id', params.tripId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching share links:', error)
      return NextResponse.json({ error: 'Failed to fetch share links' }, { status: 500 })
    }

    return NextResponse.json({ shareLinks })
  } catch (error) {
    console.error('Error in share links GET:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/trips/[tripId]/share-links - Create new share link
export async function POST(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify trip ownership
    const { data: trip, error: tripError } = await supabase
      .from('trips')
      .select('id, user_id, title')
      .eq('id', params.tripId)
      .eq('user_id', user.id)
      .single()

    if (tripError || !trip) {
      return NextResponse.json({ error: 'Trip not found' }, { status: 404 })
    }

    const body = await request.json()
    const { subdomain, title, description, settings, customization, password } = body

    // Hash password if provided
    let processedSettings = settings || getDefaultSettings()
    if (password && password.trim()) {
      const bcrypt = await import('bcryptjs')
      const passwordHash = await bcrypt.hash(password, 10)
      processedSettings = {
        ...processedSettings,
        requirePassword: true,
        passwordHash
      }
    }

    // Validate subdomain
    if (!subdomain || typeof subdomain !== 'string') {
      return NextResponse.json({ error: 'Subdomain is required' }, { status: 400 })
    }

    // Sanitize subdomain (only alphanumeric and hyphens, lowercase)
    const cleanSubdomain = subdomain
      .toLowerCase()
      .replace(/[^a-z0-9-]/g, '')
      .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
      .slice(0, 63) // DNS subdomain limit

    if (cleanSubdomain.length < 3) {
      return NextResponse.json({ error: 'Subdomain must be at least 3 characters' }, { status: 400 })
    }

    // Check if subdomain is already taken
    const { data: existingLink } = await supabase
      .from('share_links')
      .select('id')
      .eq('subdomain', cleanSubdomain)
      .single()

    if (existingLink) {
      return NextResponse.json({ error: 'Subdomain already taken' }, { status: 409 })
    }

    // Generate unique token as backup
    const token = nanoid(16)

    // Create share link
    const { data: shareLink, error } = await supabase
      .from('share_links')
      .insert({
        trip_id: params.tripId,
        subdomain: cleanSubdomain,
        token,
        title: title || trip.title,
        description,
        settings: processedSettings,
        customization: customization || getDefaultCustomization(),
        is_active: true,
        view_count: 0,
        created_by: user.id
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating share link:', error)
      return NextResponse.json({ error: 'Failed to create share link' }, { status: 500 })
    }

    return NextResponse.json({ shareLink }, { status: 201 })
  } catch (error) {
    console.error('Error in share links POST:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// Helper function to get default settings
function getDefaultSettings() {
  return {
    showLocation: true,
    showDates: true,
    showPhotos: true,
    showComments: true,
    allowDownload: true,
    requirePassword: false,
    passwordHash: null,
    expiresAt: null,
    showPersonalInfo: true,
    showPrivateNotes: false,
    showExpenses: false,
    showContacts: true,
    watermarkPhotos: false,
    enableAnalytics: true,
    allowEmbedding: true,
    seoEnabled: true
  }
}

// Helper function to get default customization
function getDefaultCustomization() {
  return {
    theme: 'default',
    primaryColor: '#3b82f6',
    backgroundColor: '#ffffff',
    textColor: '#1f2937',
    fontFamily: 'Inter',
    showBranding: true,
    customMessage: '',
    customCSS: '',
    favicon: null,
    logo: null,
    socialLinks: {
      instagram: '',
      twitter: '',
      facebook: '',
      website: ''
    },
    metaTags: {
      title: '',
      description: '',
      image: ''
    }
  }
}

// PUT /api/trips/[tripId]/share-links/[linkId] - Update share link
export async function PUT(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { linkId, updates } = body

    // Verify ownership
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select(`
        *,
        trips!inner(user_id)
      `)
      .eq('id', linkId)
      .eq('trip_id', params.tripId)
      .single()

    if (linkError || !shareLink || shareLink.trips.user_id !== user.id) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    // Update share link
    const { data: updatedLink, error } = await supabase
      .from('share_links')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', linkId)
      .select()
      .single()

    if (error) {
      console.error('Error updating share link:', error)
      return NextResponse.json({ error: 'Failed to update share link' }, { status: 500 })
    }

    return NextResponse.json({ shareLink: updatedLink })
  } catch (error) {
    console.error('Error in share links PUT:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE /api/trips/[tripId]/share-links/[linkId] - Delete share link
export async function DELETE(
  request: NextRequest,
  { params }: { params: { tripId: string } }
) {
  try {
    const supabase = await createServerSupabase()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const url = new URL(request.url)
    const linkId = url.searchParams.get('linkId')

    if (!linkId) {
      return NextResponse.json({ error: 'Link ID required' }, { status: 400 })
    }

    // Verify ownership
    const { data: shareLink, error: linkError } = await supabase
      .from('share_links')
      .select(`
        *,
        trips!inner(user_id)
      `)
      .eq('id', linkId)
      .eq('trip_id', params.tripId)
      .single()

    if (linkError || !shareLink || shareLink.trips.user_id !== user.id) {
      return NextResponse.json({ error: 'Share link not found' }, { status: 404 })
    }

    // Delete share link
    const { error } = await supabase
      .from('share_links')
      .delete()
      .eq('id', linkId)

    if (error) {
      console.error('Error deleting share link:', error)
      return NextResponse.json({ error: 'Failed to delete share link' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in share links DELETE:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
