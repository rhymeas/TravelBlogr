/**
 * Upload hero videos to Supabase Storage
 * 
 * Usage:
 * 1. Place optimized videos in scripts/hero-videos/ folder
 * 2. Run: npx tsx scripts/upload-hero-videos.ts
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const BUCKET_NAME = 'hero-videos'
const VIDEOS_DIR = path.join(__dirname, 'hero-videos')

// Video metadata
const VIDEO_METADATA = [
  { filename: 'lagoon.mp4', id: 'lagoon', credit: 'Taryn Elliott', theme: 'forest' },
  { filename: 'beach.mp4', id: 'beach', credit: 'Taryn Elliott', theme: 'beach' },
  { filename: 'caribbean.mp4', id: 'caribbean', credit: 'Taryn Elliott', theme: 'tropical' },
  { filename: 'city.mp4', id: 'city', credit: 'Kelly', theme: 'urban' },
  { filename: 'snow.mp4', id: 'snow', credit: 'Taryn Elliott', theme: 'winter' },
  { filename: 'desert.mp4', id: 'desert', credit: 'Taryn Elliott', theme: 'desert' },
]

async function createBucket() {
  console.log('📦 Creating bucket...')
  
  const { data: buckets } = await supabase.storage.listBuckets()
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME)

  if (bucketExists) {
    console.log('✅ Bucket already exists')
    return
  }

  const { error } = await supabase.storage.createBucket(BUCKET_NAME, {
    public: true,
    fileSizeLimit: 10485760, // 10MB
    allowedMimeTypes: ['video/mp4', 'video/webm']
  })

  if (error) {
    console.error('❌ Error creating bucket:', error)
    throw error
  }

  console.log('✅ Bucket created successfully')
}

async function uploadVideo(metadata: typeof VIDEO_METADATA[0]) {
  const filePath = path.join(VIDEOS_DIR, metadata.filename)

  // Check if file exists
  if (!fs.existsSync(filePath)) {
    console.warn(`⚠️  File not found: ${metadata.filename}`)
    return null
  }

  // Read file
  const fileBuffer = fs.readFileSync(filePath)
  const fileSize = (fileBuffer.length / 1024 / 1024).toFixed(2)

  console.log(`📤 Uploading ${metadata.filename} (${fileSize}MB)...`)

  // Upload to Supabase
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(`${metadata.id}.mp4`, fileBuffer, {
      contentType: 'video/mp4',
      cacheControl: '31536000', // 1 year
      upsert: true // Overwrite if exists
    })

  if (error) {
    console.error(`❌ Error uploading ${metadata.filename}:`, error)
    return null
  }

  // Get public URL
  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(`${metadata.id}.mp4`)

  console.log(`✅ Uploaded: ${metadata.filename}`)
  console.log(`   URL: ${urlData.publicUrl}`)

  return {
    ...metadata,
    url: urlData.publicUrl,
    size: fileSize
  }
}

async function uploadPosterImages() {
  console.log('\n📸 Uploading poster images...')
  
  const postersDir = path.join(VIDEOS_DIR, 'posters')
  
  if (!fs.existsSync(postersDir)) {
    console.log('⚠️  No posters directory found, skipping...')
    return []
  }

  const posterResults = []

  for (const metadata of VIDEO_METADATA) {
    const posterFilename = `${metadata.id}.jpg`
    const posterPath = path.join(postersDir, posterFilename)

    if (!fs.existsSync(posterPath)) {
      console.warn(`⚠️  Poster not found: ${posterFilename}`)
      continue
    }

    const fileBuffer = fs.readFileSync(posterPath)
    const fileSize = (fileBuffer.length / 1024).toFixed(2)

    console.log(`📤 Uploading ${posterFilename} (${fileSize}KB)...`)

    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(`posters/${metadata.id}.jpg`, fileBuffer, {
        contentType: 'image/jpeg',
        cacheControl: '31536000',
        upsert: true
      })

    if (error) {
      console.error(`❌ Error uploading ${posterFilename}:`, error)
      continue
    }

    const { data: urlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(`posters/${metadata.id}.jpg`)

    console.log(`✅ Uploaded: ${posterFilename}`)
    posterResults.push({
      id: metadata.id,
      posterUrl: urlData.publicUrl
    })
  }

  return posterResults
}

async function generateConfig(uploadedVideos: any[], posters: any[]) {
  console.log('\n📝 Generating configuration...')

  const config = uploadedVideos.map(video => {
    const poster = posters.find(p => p.id === video.id)
    return {
      id: video.id,
      url: video.url,
      poster: poster?.posterUrl || video.url.replace('.mp4', '.jpg'),
      fallbackImage: poster?.posterUrl || video.url.replace('.mp4', '.jpg'),
      credit: video.credit,
      theme: video.theme
    }
  })

  const configCode = `// Auto-generated hero video configuration
// Generated: ${new Date().toISOString()}

export const HERO_VIDEOS = ${JSON.stringify(config, null, 2)}
`

  const configPath = path.join(__dirname, '..', 'apps', 'web', 'config', 'hero-videos.ts')
  
  // Create config directory if it doesn't exist
  const configDir = path.dirname(configPath)
  if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true })
  }

  fs.writeFileSync(configPath, configCode)

  console.log(`✅ Configuration saved to: ${configPath}`)
  console.log('\n📋 Copy this to your page.tsx:')
  console.log('─'.repeat(60))
  console.log(configCode)
  console.log('─'.repeat(60))
}

async function main() {
  console.log('🎥 Hero Video Upload Script\n')

  try {
    // Step 1: Create bucket
    await createBucket()

    // Step 2: Upload videos
    console.log('\n📹 Uploading videos...')
    const uploadedVideos = []
    
    for (const metadata of VIDEO_METADATA) {
      const result = await uploadVideo(metadata)
      if (result) {
        uploadedVideos.push(result)
      }
    }

    // Step 3: Upload poster images
    const posters = await uploadPosterImages()

    // Step 4: Generate configuration
    if (uploadedVideos.length > 0) {
      await generateConfig(uploadedVideos, posters)
    }

    // Summary
    console.log('\n📊 Summary:')
    console.log(`   ✅ Videos uploaded: ${uploadedVideos.length}/${VIDEO_METADATA.length}`)
    console.log(`   ✅ Posters uploaded: ${posters.length}/${VIDEO_METADATA.length}`)
    console.log(`   💾 Total size: ${uploadedVideos.reduce((sum, v) => sum + parseFloat(v.size), 0).toFixed(2)}MB`)
    
    console.log('\n🎉 Upload complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Update apps/web/app/page.tsx with the generated config')
    console.log('   2. Test the videos on your site')
    console.log('   3. Clear browser cache and verify loading speed')

  } catch (error) {
    console.error('\n❌ Upload failed:', error)
    process.exit(1)
  }
}

main()

