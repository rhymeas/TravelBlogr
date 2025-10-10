/**
 * Gallery-DL Image Service
 * Professional image fetching with full metadata preservation
 * 
 * Uses gallery-dl to download high-quality images from 300+ sites:
 * - Instagram, Pinterest, Flickr, 500px, DeviantArt
 * - Reddit (r/itookapicture, r/photography, r/earthporn)
 * - Unsplash, Pexels (with full attribution)
 * - Twitter/X, Tumblr
 * 
 * Preserves:
 * - Original URLs
 * - Creator names
 * - Upload dates
 * - License info
 * - Platform source
 * - Full resolution
 */

import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

interface ImageMetadata {
  url: string
  originalUrl: string
  creator: string
  creatorProfile?: string
  uploadDate?: string
  license?: string
  platform: string
  title?: string
  description?: string
  tags?: string[]
  width?: number
  height?: number
  fileSize?: number
}

interface GalleryDLResult {
  images: ImageMetadata[]
  totalDownloaded: number
  errors: string[]
}

/**
 * Check if gallery-dl is installed
 */
export async function isGalleryDLInstalled(): Promise<boolean> {
  try {
    await execAsync('gallery-dl --version')
    return true
  } catch {
    return false
  }
}

/**
 * Install gallery-dl via pip
 */
export async function installGalleryDL(): Promise<void> {
  console.log('📦 Installing gallery-dl...')
  try {
    await execAsync('pip3 install -U gallery-dl')
    console.log('✅ gallery-dl installed successfully')
  } catch (error) {
    console.error('❌ Failed to install gallery-dl:', error)
    throw new Error('Please install gallery-dl manually: pip3 install -U gallery-dl')
  }
}

/**
 * Fetch images for a location using gallery-dl
 * 
 * Strategy:
 * 1. Search Reddit photography subreddits
 * 2. Search Unsplash with attribution
 * 3. Search Flickr for CC-licensed images
 * 4. Search Pinterest for inspiration
 * 
 * @param locationName - Location name (e.g., "East Timor", "Paris")
 * @param maxImages - Maximum number of images to fetch (default: 20)
 * @returns Array of images with full metadata
 */
export async function fetchImagesWithGalleryDL(
  locationName: string,
  maxImages: number = 20
): Promise<GalleryDLResult> {
  const result: GalleryDLResult = {
    images: [],
    totalDownloaded: 0,
    errors: []
  }

  // Check if gallery-dl is installed
  const installed = await isGalleryDLInstalled()
  if (!installed) {
    result.errors.push('gallery-dl not installed. Run: pip3 install -U gallery-dl')
    return result
  }

  // Create temporary download directory
  const tempDir = path.join(process.cwd(), 'temp', 'gallery-dl', locationName.toLowerCase().replace(/\s+/g, '-'))
  await fs.mkdir(tempDir, { recursive: true })

  try {
    // Strategy 1: Reddit photography subreddits
    await fetchFromReddit(locationName, tempDir, maxImages, result)

    // Strategy 2: Unsplash (via gallery-dl)
    if (result.images.length < maxImages) {
      await fetchFromUnsplash(locationName, tempDir, maxImages - result.images.length, result)
    }

    // Strategy 3: Flickr CC-licensed images
    if (result.images.length < maxImages) {
      await fetchFromFlickr(locationName, tempDir, maxImages - result.images.length, result)
    }

    // Strategy 4: Pinterest (for inspiration)
    if (result.images.length < maxImages) {
      await fetchFromPinterest(locationName, tempDir, maxImages - result.images.length, result)
    }

    console.log(`✅ Fetched ${result.images.length} images for ${locationName}`)
    return result

  } catch (error) {
    console.error(`❌ Error fetching images for ${locationName}:`, error)
    result.errors.push(error instanceof Error ? error.message : 'Unknown error')
    return result
  } finally {
    // Clean up temp directory
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  }
}

/**
 * Fetch images from Reddit photography subreddits
 */
async function fetchFromReddit(
  locationName: string,
  tempDir: string,
  maxImages: number,
  result: GalleryDLResult
): Promise<void> {
  const subreddits = [
    'r/itookapicture',
    'r/photography',
    'r/earthporn',
    'r/travelphotography',
    'r/cityporn'
  ]

  for (const subreddit of subreddits) {
    if (result.images.length >= maxImages) break

    try {
      const searchQuery = `${subreddit}/search?q=${encodeURIComponent(locationName)}&restrict_sr=1&sort=top`
      const command = `gallery-dl --limit ${maxImages - result.images.length} --write-metadata --download-archive archive.txt "https://reddit.com/${searchQuery}"`

      console.log(`🔍 Searching ${subreddit} for ${locationName}...`)
      const { stdout } = await execAsync(command, { cwd: tempDir })

      // Parse metadata files
      const files = await fs.readdir(tempDir)
      const metadataFiles = files.filter(f => f.endsWith('.json'))

      for (const metaFile of metadataFiles) {
        const metaPath = path.join(tempDir, metaFile)
        const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'))

        result.images.push({
          url: metadata.url || metadata.file_url,
          originalUrl: metadata.post_url || metadata.url,
          creator: metadata.author || 'Unknown',
          creatorProfile: `https://reddit.com/u/${metadata.author}`,
          uploadDate: metadata.date || metadata.created_utc,
          license: 'Reddit User Content',
          platform: 'Reddit',
          title: metadata.title,
          description: metadata.selftext,
          tags: metadata.subreddit ? [metadata.subreddit] : [],
          width: metadata.width,
          height: metadata.height
        })
      }

      console.log(`✅ Found ${metadataFiles.length} images from ${subreddit}`)
    } catch (error) {
      console.log(`⚠️ No results from ${subreddit}`)
      result.errors.push(`${subreddit}: ${error instanceof Error ? error.message : 'No results'}`)
    }
  }
}

/**
 * Fetch images from Unsplash with full attribution
 */
async function fetchFromUnsplash(
  locationName: string,
  tempDir: string,
  maxImages: number,
  result: GalleryDLResult
): Promise<void> {
  try {
    const searchUrl = `https://unsplash.com/s/photos/${encodeURIComponent(locationName)}`
    const command = `gallery-dl --limit ${maxImages} --write-metadata "${searchUrl}"`

    console.log(`🔍 Searching Unsplash for ${locationName}...`)
    await execAsync(command, { cwd: tempDir })

    // Parse metadata
    const files = await fs.readdir(tempDir)
    const metadataFiles = files.filter(f => f.endsWith('.json'))

    for (const metaFile of metadataFiles) {
      const metaPath = path.join(tempDir, metaFile)
      const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'))

      result.images.push({
        url: metadata.urls?.full || metadata.urls?.raw,
        originalUrl: metadata.links?.html,
        creator: metadata.user?.name || 'Unknown',
        creatorProfile: metadata.user?.links?.html,
        uploadDate: metadata.created_at,
        license: 'Unsplash License (Free to use)',
        platform: 'Unsplash',
        title: metadata.description || metadata.alt_description,
        description: metadata.description,
        tags: metadata.tags?.map((t: any) => t.title) || [],
        width: metadata.width,
        height: metadata.height
      })
    }

    console.log(`✅ Found ${metadataFiles.length} images from Unsplash`)
  } catch (error) {
    console.log(`⚠️ No results from Unsplash`)
    result.errors.push(`Unsplash: ${error instanceof Error ? error.message : 'No results'}`)
  }
}

/**
 * Fetch CC-licensed images from Flickr
 */
async function fetchFromFlickr(
  locationName: string,
  tempDir: string,
  maxImages: number,
  result: GalleryDLResult
): Promise<void> {
  try {
    // Search for CC-licensed images only
    const searchUrl = `https://www.flickr.com/search/?text=${encodeURIComponent(locationName)}&license=2%2C3%2C4%2C5%2C6%2C9`
    const command = `gallery-dl --limit ${maxImages} --write-metadata "${searchUrl}"`

    console.log(`🔍 Searching Flickr for ${locationName}...`)
    await execAsync(command, { cwd: tempDir })

    // Parse metadata
    const files = await fs.readdir(tempDir)
    const metadataFiles = files.filter(f => f.endsWith('.json'))

    for (const metaFile of metadataFiles) {
      const metaPath = path.join(tempDir, metaFile)
      const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'))

      result.images.push({
        url: metadata.url_o || metadata.url_l || metadata.url_c,
        originalUrl: `https://www.flickr.com/photos/${metadata.owner}/${metadata.id}`,
        creator: metadata.ownername || 'Unknown',
        creatorProfile: `https://www.flickr.com/photos/${metadata.owner}`,
        uploadDate: metadata.dateupload,
        license: metadata.license || 'Creative Commons',
        platform: 'Flickr',
        title: metadata.title,
        description: metadata.description,
        tags: metadata.tags?.split(' ') || [],
        width: metadata.width_o || metadata.width_l,
        height: metadata.height_o || metadata.height_l
      })
    }

    console.log(`✅ Found ${metadataFiles.length} images from Flickr`)
  } catch (error) {
    console.log(`⚠️ No results from Flickr`)
    result.errors.push(`Flickr: ${error instanceof Error ? error.message : 'No results'}`)
  }
}

/**
 * Fetch images from Pinterest
 */
async function fetchFromPinterest(
  locationName: string,
  tempDir: string,
  maxImages: number,
  result: GalleryDLResult
): Promise<void> {
  try {
    const searchUrl = `https://www.pinterest.com/search/pins/?q=${encodeURIComponent(locationName)}`
    const command = `gallery-dl --limit ${maxImages} --write-metadata "${searchUrl}"`

    console.log(`🔍 Searching Pinterest for ${locationName}...`)
    await execAsync(command, { cwd: tempDir })

    // Parse metadata
    const files = await fs.readdir(tempDir)
    const metadataFiles = files.filter(f => f.endsWith('.json'))

    for (const metaFile of metadataFiles) {
      const metaPath = path.join(tempDir, metaFile)
      const metadata = JSON.parse(await fs.readFile(metaPath, 'utf-8'))

      result.images.push({
        url: metadata.images?.orig?.url || metadata.images?.['736x']?.url,
        originalUrl: `https://www.pinterest.com/pin/${metadata.id}`,
        creator: metadata.pinner?.username || 'Unknown',
        creatorProfile: metadata.pinner?.profile_url,
        uploadDate: metadata.created_at,
        license: 'Pinterest User Content',
        platform: 'Pinterest',
        title: metadata.title || metadata.grid_title,
        description: metadata.description,
        tags: metadata.hashtags || [],
        width: metadata.images?.orig?.width,
        height: metadata.images?.orig?.height
      })
    }

    console.log(`✅ Found ${metadataFiles.length} images from Pinterest`)
  } catch (error) {
    console.log(`⚠️ No results from Pinterest`)
    result.errors.push(`Pinterest: ${error instanceof Error ? error.message : 'No results'}`)
  }
}

