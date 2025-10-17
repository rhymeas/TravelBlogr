/**
 * Get public URLs for uploaded hero videos
 *
 * Usage: npx tsx scripts/get-video-urls.ts
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import * as path from 'path'

// Load environment variables from .env.local
dotenv.config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials')
  console.error('Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function getVideoUrls() {
  console.log('🔍 Searching for videos in Supabase Storage...\n')

  try {
    // List all files in the images bucket uploads folder
    const { data: files, error } = await supabase.storage
      .from('images')
      .list('uploads', {
        limit: 100,
        offset: 0,
        sortBy: { column: 'name', order: 'asc' }
      })

    if (error) {
      console.error('❌ Error listing files:', error)
      return
    }

    if (!files || files.length === 0) {
      console.log('⚠️  No files found in images bucket')
      return
    }

    // Filter for video files
    const videoFiles = files.filter(file => 
      file.name.endsWith('.mp4') || 
      file.name.endsWith('.webm') ||
      file.name.endsWith('.mov')
    )

    if (videoFiles.length === 0) {
      console.log('⚠️  No video files found')
      console.log('\nAll files in bucket:')
      files.forEach(file => console.log(`   - ${file.name}`))
      return
    }

    console.log(`✅ Found ${videoFiles.length} video file(s):\n`)

    // Get public URLs for each video
    const videoUrls = videoFiles.map(file => {
      const { data } = supabase.storage
        .from('images')
        .getPublicUrl(`uploads/${file.name}`)

      return {
        name: file.name,
        url: data.publicUrl,
        size: (file.metadata?.size || 0) / 1024 / 1024, // Convert to MB
        created: file.created_at
      }
    })

    // Display results
    videoUrls.forEach((video, index) => {
      console.log(`${index + 1}. ${video.name}`)
      console.log(`   URL: ${video.url}`)
      console.log(`   Size: ${video.size.toFixed(2)} MB`)
      console.log(`   Created: ${video.created}`)
      console.log('')
    })

    // Generate configuration code
    console.log('─'.repeat(80))
    console.log('📋 Copy this configuration to apps/web/app/page.tsx:')
    console.log('─'.repeat(80))
    console.log('')

    // Try to match video names to themes
    const videoConfig = videoUrls.map(video => {
      const name = video.name.toLowerCase()
      
      // Try to detect theme from filename
      let id = 'unknown'
      let theme = 'travel'
      let credit = 'Pexels'

      if (name.includes('lagoon') || name.includes('forest')) {
        id = 'lagoon'
        theme = 'forest'
        credit = 'Taryn Elliott'
      } else if (name.includes('beach')) {
        id = 'beach'
        theme = 'beach'
        credit = 'Taryn Elliott'
      } else if (name.includes('caribbean') || name.includes('tropical')) {
        id = 'caribbean'
        theme = 'tropical'
        credit = 'Taryn Elliott'
      } else if (name.includes('city') || name.includes('urban')) {
        id = 'city'
        theme = 'urban'
        credit = 'Kelly'
      } else if (name.includes('snow') || name.includes('winter')) {
        id = 'snow'
        theme = 'winter'
        credit = 'Taryn Elliott'
      } else if (name.includes('desert')) {
        id = 'desert'
        theme = 'desert'
        credit = 'Taryn Elliott'
      } else {
        // Use filename as id
        id = name.replace(/\.(mp4|webm|mov)$/, '').replace(/[^a-z0-9]/g, '-')
      }

      return {
        id,
        url: video.url,
        // Use first frame as poster (you can upload actual posters later)
        poster: video.url.replace(/\.(mp4|webm|mov)$/, '.jpg'),
        fallbackImage: video.url.replace(/\.(mp4|webm|mov)$/, '.jpg'),
        credit,
        theme
      }
    })

    const configCode = `const HERO_VIDEOS = ${JSON.stringify(videoConfig, null, 2)}`
    console.log(configCode)
    console.log('')
    console.log('─'.repeat(80))

    // Save to file
    const fs = require('fs')
    const path = require('path')
    const configPath = path.join(__dirname, 'video-urls-config.json')
    fs.writeFileSync(configPath, JSON.stringify(videoConfig, null, 2))
    console.log(`\n💾 Configuration saved to: ${configPath}`)

  } catch (error) {
    console.error('❌ Error:', error)
  }
}

getVideoUrls()

