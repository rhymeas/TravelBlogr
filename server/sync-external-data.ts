import type { IStorage } from './storage';
import type { Location, HeroImage, ScenicContent, ScenicGalleryItem, LocationImage } from '@shared/schema';

const EXTERNAL_API_BASE = 'https://kanadareise.replit.app/api';

// Helper function for flexible date parsing
function parseDateFlexible(dateString: string): Date {
  if (!dateString) throw new Error('Date string is required');
  
  // Handle DD.MM.YYYY format
  if (dateString.includes('.')) {
    const [day, month, year] = dateString.split('.');
    const date = new Date(Date.UTC(parseInt(year), parseInt(month) - 1, parseInt(day)));
    if (isNaN(date.getTime())) throw new Error(`Invalid date format: ${dateString}`);
    return date;
  }
  
  // Handle ISO-like formats (YYYY-MM-DD, YYYY-MM-DDTHH:mm, etc.)
  const date = new Date(dateString);
  if (isNaN(date.getTime())) throw new Error(`Invalid date format: ${dateString}`);
  return date;
}

// Convert Date to YYYY-MM-DD string format for storage
function toDateOnlyString(date: Date): string {
  return date.toISOString().split('T')[0];
}

// Calculate nights between two dates using UTC to avoid DST issues
function calculateNightsUTC(startDate: string, endDate: string): number {
  const start = parseDateFlexible(startDate);
  const end = parseDateFlexible(endDate);
  
  const startUTC = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUTC = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());
  
  const nights = Math.max(1, Math.ceil((endUTC - startUTC) / (1000 * 60 * 60 * 24)));
  return nights;
}

// Ensure URLs are absolute, resolve relative URLs against base
function ensureAbsoluteUrl(url: string, base: string = 'https://kanadareise.replit.app'): string {
  if (!url) return '';
  
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  
  // Relative URL, resolve against base
  if (url.startsWith('/')) {
    return new URL(url, base).toString();
  }
  
  // Handle other cases by treating as relative
  return new URL(`/${url}`, base).toString();
}

// Fetch data from external API with error handling
async function fetchExternalData<T>(endpoint: string): Promise<T> {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.status} ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

// Sync locations with proper date handling and nights calculation
async function syncLocations(storage: IStorage): Promise<void> {
  console.log('🔄 Syncing locations...');
  
  const externalLocations = await fetchExternalData<any[]>('/locations');
  
  for (const extLocation of externalLocations) {
    try {
      // Calculate nights from actual dates
      const nights = calculateNightsUTC(extLocation.startDate, extLocation.endDate);
      
      // Normalize dates to YYYY-MM-DD format for storage
      const startDate = toDateOnlyString(parseDateFlexible(extLocation.startDate));
      const endDate = toDateOnlyString(parseDateFlexible(extLocation.endDate));
      
      const locationData: Omit<Location, 'createdAt' | 'updatedAt'> = {
        id: extLocation.id,
        name: extLocation.name,
        slug: extLocation.slug,
        startDate,
        endDate,
        description: extLocation.description,
        accommodation: extLocation.accommodation || '',
        accommodationWebsite: extLocation.accommodationWebsite || '',
        accommodationImageUrl: ensureAbsoluteUrl(extLocation.accommodationImageUrl),
        accommodationPrice: extLocation.accommodationPrice || null,
        accommodationCurrency: extLocation.accommodationCurrency || 'CAD',
        accommodationInclusiveServices: extLocation.accommodationInclusiveServices || [],
        accommodationAmenities: extLocation.accommodationAmenities || [],
        accommodationCheckinTime: extLocation.accommodationCheckinTime || null,
        accommodationCheckoutTime: extLocation.accommodationCheckoutTime || null,
        distance: extLocation.distance || 0,
        imageUrl: ensureAbsoluteUrl(extLocation.imageUrl),
        mapImageUrl: ensureAbsoluteUrl(extLocation.mapImageUrl),
        coordinates: extLocation.coordinates || null,
        activities: extLocation.activities || [],
        restaurants: extLocation.restaurants || [],
        experiences: extLocation.experiences || [],
        highlights: extLocation.highlights || [],
        funFacts: extLocation.funFacts || [],
        routeHighlights: extLocation.routeHighlights || [],
      };

      // Resolve location by slug (handle ID mismatches)
      let resolvedLocationId: string;
      try {
        // Try to find existing location by slug first
        const existingBySlug = await storage.getLocationBySlug(extLocation.slug);
        if (existingBySlug) {
          resolvedLocationId = existingBySlug.id;
          // Exclude id from update payload to avoid primary key mutation
          const { id, ...updateData } = locationData;
          await storage.updateLocation(resolvedLocationId, updateData);
          console.log(`  ✅ Updated location by slug: ${extLocation.name} (${nights} nights)`);
        } else {
          const createdLocation = await storage.createLocation(locationData);
          resolvedLocationId = createdLocation.id; // Use actual created ID
          console.log(`  🆕 Created location: ${extLocation.name} (${nights} nights)`);
        }
      } catch (createError: any) {
        // If creation fails due to duplicate slug, find by slug and update
        if (createError.code === '23505') {
          try {
            const existingBySlug = await storage.getLocationBySlug(extLocation.slug);
            if (existingBySlug) {
              resolvedLocationId = existingBySlug.id;
              // Exclude id from update payload to avoid primary key mutation
              const { id, ...updateData } = locationData;
              await storage.updateLocation(resolvedLocationId, updateData);
              console.log(`  ✅ Updated existing location by slug: ${extLocation.name} (${nights} nights)`);
            } else {
              console.error(`  ❌ Duplicate error but no location found by slug ${extLocation.slug}`);
              continue;
            }
          } catch (updateError) {
            console.error(`  ❌ Failed to update location ${extLocation.name}:`, updateError);
            continue;
          }
        } else {
          throw createError;
        }
      }

      // EXACT MATCHING: Always clear and sync images (treat missing as empty)
      try {
        // Clear existing location images for exact matching (using resolved location ID)
        const existingImages = await storage.getLocationImages(resolvedLocationId);
        for (const existingImage of existingImages) {
          await storage.deleteLocationImage(existingImage.id);
        }
        if (existingImages.length > 0) {
          console.log(`    🗑️ Cleared ${existingImages.length} existing images for exact sync`);
        }

        // Add all external images (or none if missing - exact matching)
        const externalImages = extLocation.images || [];
        for (const extImage of externalImages) {
          try {
            const imageData: Omit<LocationImage, 'id' | 'createdAt'> = {
              locationId: resolvedLocationId,
              imageUrl: ensureAbsoluteUrl(extImage.imageUrl),
              caption: extImage.caption || '',
              isMain: extImage.isMain || false,
              objectPath: extImage.objectPath || null,
            };

            await storage.addLocationImage(imageData);
            console.log(`    📸 Synced image: ${extImage.caption || 'Untitled'}`);
          } catch (error) {
            console.error(`    ❌ Error syncing image for ${extLocation.name}:`, error);
          }
        }
        
        if (externalImages.length === 0) {
          console.log(`    ✅ No images to sync for ${extLocation.name} (exact match with external)`);
        }
      } catch (error) {
        console.error(`    ❌ Error clearing/syncing images for ${extLocation.name}:`, error);
      }
    } catch (error) {
      console.error(`  ❌ Error syncing location ${extLocation.name}:`, error);
    }
  }
}

// Sync hero images with absolute URLs
async function syncHeroImages(storage: IStorage): Promise<void> {
  console.log('🔄 Syncing hero images...');
  
  const externalHeroImages = await fetchExternalData<any[]>('/hero-images');
  
  // Clear existing hero images for clean replacement
  const existingHeroImages = await storage.getHeroImages();
  for (const existing of existingHeroImages) {
    await storage.deleteHeroImage(existing.id);
  }
  console.log('  🗑️ Cleared existing hero images');
  
  for (const extHeroImage of externalHeroImages) {
    try {
      const heroImageData: Omit<HeroImage, 'id' | 'createdAt' | 'updatedAt'> = {
        imageUrl: ensureAbsoluteUrl(extHeroImage.imageUrl),
        title: extHeroImage.title,
        description: extHeroImage.description || '',
        sortOrder: extHeroImage.sortOrder || 0,
        objectPath: extHeroImage.objectPath || null,
      };

      await storage.createHeroImage(heroImageData);
      console.log(`  ✅ Synced hero image: ${extHeroImage.title}`);
    } catch (error) {
      console.error(`  ❌ Error syncing hero image ${extHeroImage.title}:`, error);
    }
  }
}

// Sync scenic content with gallery images
async function syncScenicContent(storage: IStorage): Promise<void> {
  console.log('🔄 Syncing scenic content...');
  
  const externalScenicContent = await fetchExternalData<any>('/scenic-content');
  
  try {
    // Normalize gallery images with absolute URLs
    const galleries: ScenicGalleryItem[] = (externalScenicContent.galleries || []).map((gallery: any) => ({
      id: gallery.id,
      title: gallery.title,
      description: gallery.description,
      imageUrl: ensureAbsoluteUrl(gallery.imageUrl),
      linkUrl: gallery.linkUrl || null,
      isLarge: gallery.isLarge || false,
      order: gallery.order || 0,
    }));

    const scenicContentData = {
      title: externalScenicContent.title,
      subtitle: externalScenicContent.subtitle,
      galleries,
      isActive: externalScenicContent.isActive !== false,
    };

    await storage.updateScenicContent(scenicContentData);
    console.log(`  ✅ Synced scenic content: ${externalScenicContent.title}`);
    console.log(`  📸 Imported ${galleries.length} gallery images`);
  } catch (error) {
    console.error(`  ❌ Error syncing scenic content:`, error);
  }
}

// Main sync function
export async function syncExternalData(storage: IStorage): Promise<void> {
  try {
    console.log('🚀 Starting data sync from https://kanadareise.replit.app...\n');
    
    await syncLocations(storage);
    console.log('');
    
    await syncHeroImages(storage);
    console.log('');
    
    await syncScenicContent(storage);
    console.log('');
    
    console.log('✅ Data sync completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Updated location data with proper nights calculation');
    console.log('   - Synced hero images for homepage');
    console.log('   - Synced scenic gallery content');
    console.log('   - Normalized all image URLs to absolute paths');
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    throw error;
  }
}

// Helper function to calculate nights from dates (for use in UI)
export function calculateNights(startDate: string, endDate: string): number {
  try {
    return calculateNightsUTC(startDate, endDate);
  } catch (error) {
    console.error('Error calculating nights:', error);
    return 1; // Default fallback
  }
}