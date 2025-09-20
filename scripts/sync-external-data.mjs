#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { eq } from 'drizzle-orm';
import { pgTable, text, integer, jsonb, timestamp, boolean, uuid, decimal } from 'drizzle-orm/pg-core';

// Define schemas directly since we can't import TS files
const locations = pgTable('locations', {
  id: uuid('id').primaryKey(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  startDate: timestamp('start_date').notNull(),
  endDate: timestamp('end_date').notNull(),
  nights: integer('nights').notNull().default(2),
  description: text('description').notNull(),
  accommodation: text('accommodation').notNull(),
  accommodationWebsite: text('accommodation_website'),
  accommodationImageUrl: text('accommodation_image_url'),
  accommodationPrice: decimal('accommodation_price'),
  accommodationCurrency: text('accommodation_currency'),
  accommodationInclusiveServices: jsonb('accommodation_inclusive_services'),
  accommodationAmenities: jsonb('accommodation_amenities'),
  accommodationCheckinTime: timestamp('accommodation_checkin_time'),
  accommodationCheckoutTime: timestamp('accommodation_checkout_time'),
  distance: integer('distance'),
  imageUrl: text('image_url').notNull(),
  mapImageUrl: text('map_image_url'),
  coordinates: jsonb('coordinates'),
  activities: jsonb('activities'),
  restaurants: jsonb('restaurants'),
  experiences: jsonb('experiences'),
  highlights: jsonb('highlights'),
  funFacts: jsonb('fun_facts'),
  routeHighlights: jsonb('route_highlights'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const heroImages = pgTable('hero_images', {
  id: uuid('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  title: text('title').notNull(),
  description: text('description'),
  sortOrder: integer('sort_order').notNull().default(0),
  objectPath: text('object_path'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const scenicContent = pgTable('scenic_content', {
  id: uuid('id').primaryKey(),
  title: text('title').notNull(),
  subtitle: text('subtitle'),
  galleries: jsonb('galleries'),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

const dbUrl = process.env.DATABASE_URL;
if (!dbUrl) {
  throw new Error('DATABASE_URL is required');
}

const sql = neon(dbUrl);
const db = drizzle(sql);

const EXTERNAL_API_BASE = 'https://kanadareise.replit.app/api';

async function fetchExternalData(endpoint) {
  try {
    const response = await fetch(`${EXTERNAL_API_BASE}${endpoint}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${endpoint}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${endpoint}:`, error);
    throw error;
  }
}

function parseDate(dateString) {
  // Handle both formats: "20.09.2025" and "2025-09-20T14:18"
  if (dateString.includes('.')) {
    const [day, month, year] = dateString.split('.');
    return new Date(`${year}-${month}-${day}`);
  }
  return new Date(dateString);
}

async function syncLocations() {
  console.log('🔄 Syncing locations...');
  
  const externalLocations = await fetchExternalData('/locations');
  
  for (const extLocation of externalLocations) {
    try {
      // Parse dates properly
      const startDate = parseDate(extLocation.startDate);
      const endDate = parseDate(extLocation.endDate);
      
      // Calculate nights based on actual dates
      const timeDiff = endDate.getTime() - startDate.getTime();
      const nights = Math.ceil(timeDiff / (1000 * 3600 * 24));
      
      const locationData = {
        id: extLocation.id,
        name: extLocation.name,
        slug: extLocation.slug,
        startDate: startDate,
        endDate: endDate,
        nights: nights, // Use calculated nights instead of default 2
        description: extLocation.description,
        accommodation: extLocation.accommodation,
        accommodationWebsite: extLocation.accommodationWebsite || '',
        accommodationImageUrl: extLocation.accommodationImageUrl || '',
        accommodationPrice: extLocation.accommodationPrice,
        accommodationCurrency: extLocation.accommodationCurrency || 'CAD',
        accommodationInclusiveServices: [],
        accommodationAmenities: [],
        accommodationCheckinTime: null,
        accommodationCheckoutTime: null,
        distance: extLocation.distance || 0,
        imageUrl: extLocation.imageUrl,
        mapImageUrl: extLocation.mapImageUrl || '',
        coordinates: extLocation.coordinates,
        activities: extLocation.activities || [],
        restaurants: extLocation.restaurants || [],
        experiences: extLocation.experiences || [],
        highlights: extLocation.highlights || [],
        funFacts: extLocation.funFacts || [],
        routeHighlights: extLocation.routeHighlights || [],
        updatedAt: new Date().toISOString()
      };

      // Check if location exists
      const existing = await db.select().from(locations).where(eq(locations.id, extLocation.id));
      
      if (existing.length > 0) {
        // Update existing location
        await db.update(locations)
          .set(locationData)
          .where(eq(locations.id, extLocation.id));
        console.log(`  ✅ Updated location: ${extLocation.name} (${nights} nights)`);
      } else {
        // Insert new location
        await db.insert(locations).values({
          ...locationData,
          createdAt: new Date().toISOString()
        });
        console.log(`  🆕 Created location: ${extLocation.name} (${nights} nights)`);
      }
    } catch (error) {
      console.error(`  ❌ Error syncing location ${extLocation.name}:`, error);
    }
  }
}

async function syncHeroImages() {
  console.log('🔄 Syncing hero images...');
  
  const externalHeroImages = await fetchExternalData('/hero-images');
  
  // Clear existing hero images
  await db.delete(heroImages);
  console.log('  🗑️ Cleared existing hero images');
  
  for (const extHeroImage of externalHeroImages) {
    try {
      const heroImageData = {
        id: extHeroImage.id,
        imageUrl: extHeroImage.imageUrl,
        title: extHeroImage.title,
        description: extHeroImage.description,
        sortOrder: extHeroImage.sortOrder,
        objectPath: extHeroImage.objectPath,
        createdAt: new Date(extHeroImage.createdAt),
        updatedAt: new Date(extHeroImage.updatedAt)
      };

      await db.insert(heroImages).values(heroImageData);
      console.log(`  ✅ Synced hero image: ${extHeroImage.title}`);
    } catch (error) {
      console.error(`  ❌ Error syncing hero image ${extHeroImage.title}:`, error);
    }
  }
}

async function syncScenicContent() {
  console.log('🔄 Syncing scenic content...');
  
  const externalScenicContent = await fetchExternalData('/scenic-content');
  
  try {
    // Clear existing scenic content
    await db.delete(scenicContent);
    console.log('  🗑️ Cleared existing scenic content');
    
    const scenicContentData = {
      id: externalScenicContent.id,
      title: externalScenicContent.title,
      subtitle: externalScenicContent.subtitle,
      galleries: externalScenicContent.galleries || [],
      isActive: externalScenicContent.isActive,
      createdAt: new Date(externalScenicContent.createdAt),
      updatedAt: new Date(externalScenicContent.updatedAt)
    };

    await db.insert(scenicContent).values(scenicContentData);
    console.log(`  ✅ Synced scenic content: ${externalScenicContent.title}`);
    console.log(`  📸 Imported ${externalScenicContent.galleries?.length || 0} gallery images`);
  } catch (error) {
    console.error(`  ❌ Error syncing scenic content:`, error);
  }
}

async function main() {
  try {
    console.log('🚀 Starting data sync from https://kanadareise.replit.app...\n');
    
    await syncLocations();
    console.log('');
    
    await syncHeroImages();
    console.log('');
    
    await syncScenicContent();
    console.log('');
    
    console.log('✅ Data sync completed successfully!');
    console.log('📊 Summary:');
    console.log('   - Updated location data with proper nights calculation');
    console.log('   - Synced hero images for homepage');
    console.log('   - Synced scenic gallery content');
    
  } catch (error) {
    console.error('❌ Data sync failed:', error);
    process.exit(1);
  }
}

main();