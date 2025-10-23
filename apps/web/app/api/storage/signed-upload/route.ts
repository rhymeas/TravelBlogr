import { NextResponse } from 'next/server'
import { createServerSupabase, createServiceSupabase } from '@/lib/supabase-server'
import { nanoid } from 'nanoid'

function sanitizeFolder(folder: string) {
  return folder.replace(/[^a-zA-Z0-9-_\/]/g, '_')
}

function buildPath(userId: string, folder: string, fileName: string) {
  const safeFolder = sanitizeFolder(folder || 'uploads')
  const ext = (fileName.split('.').pop() || 'jpg').toLowerCase()
  return `${userId}/${safeFolder}/${Date.now()}_${nanoid(12)}.${ext}`
}

const ALLOWED_BUCKETS = new Set(['location-images', 'trip-images', 'profile-avatars', 'images'])

export async function POST(req: Request) {
  try {
    const { bucket, folder, fileName } = await req.json()
    if (!bucket || !fileName) {
      return NextResponse.json({ error: 'bucket and fileName are required' }, { status: 400 })
    }
    if (!ALLOWED_BUCKETS.has(bucket)) {
      return NextResponse.json({ error: 'Bucket not allowed' }, { status: 400 })
    }

    const supabaseServer = await createServerSupabase()
    const { data: { user }, error: userErr } = await supabaseServer.auth.getUser()
    if (userErr || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const path = buildPath(user.id, folder || 'uploads', fileName)

    const service = createServiceSupabase()
    const { data, error } = await service.storage.from(bucket).createSignedUploadUrl(path)
    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Failed to create signed URL' }, { status: 500 })
    }

    return NextResponse.json({ success: true, bucket, path, token: data.token })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Unexpected error' }, { status: 500 })
  }
}

