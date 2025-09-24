#!/usr/bin/env tsx

/**
 * Migration script to populate Railway database with data from live Replit app
 * Run with: npx tsx scripts/migrate-from-replit.ts
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { locations, tripPhotos, tourSettings, creators } from '../shared/schema.js';

// Source data from live Replit app (kanadareise.replit.app)
const REPLIT_DATA = {
  tourSettings: {
    "id": "3308c63b-0b3b-4316-921c-b91c68cf0179",
    "tourName": "Kanada Reise 2025",
    "startDate": "20.09.2025",
    "endDate": "06.10.2025",
    "totalDistance": 2130,
    "totalCost": 9000,
    "currency": "CAD",
    "heroImageUrl": "https://farm8.staticflickr.com/7358/16213051957_a72ce9586e_o.jpg",
    "description": "Ursula, Helmut, Susanne & Rimas entdecken die atemberaubende Schönheit Kanadas - vom Okanagan-Tal bis zu den majestätischen Rocky Mountains",
    "privacyEnabled": false,
    "privacyPassword": null,
    "sessionTimeout": 10080,
    "gpsActivatedByAdmin": true,
    "gpsUpdateInterval": 1800,
    "updatedAt": "2025-09-21T14:39:14.481Z"
  },

  locations: [
    {
      "id": "7b82d995-1bff-4980-a5ed-1dc915cf2d82",
      "name": "Port Moody",
      "slug": "mooody",
      "startDate": "19.09.2025",
      "endDate": "20.09.2025",
      "description": "",
      "accommodation": "",
      "accommodationWebsite": "",
      "accommodationImageUrl": "",
      "accommodationPrice": null,
      "accommodationCurrency": "CAD",
      "accommodationInclusiveServices": [],
      "accommodationAmenities": [],
      "accommodationCheckinTime": "",
      "accommodationCheckoutTime": "",
      "distance": 1,
      "imageUrl": "https://globalnews-ca.cdn.ampproject.org/i/s/globalnews.ca/wp-content/uploads/2014/06/barb-anderson-rocky-point-port-moody.jpg?quality=65&strip=all&w=1200",
      "mapImageUrl": "",
      "coordinates": { "lat": 0, "lng": 0 },
      "activities": [],
      "restaurants": [],
      "experiences": [],
      "highlights": [],
      "funFacts": [],
      "routeHighlights": [],
      "createdAt": "2025-09-23T08:15:32.324Z",
      "updatedAt": "2025-09-23T21:26:31.335Z"
    },
    {
      "id": "1dba237e-d121-4da9-866c-312d1703d812",
      "name": "Penticton",
      "slug": "penticton",
      "startDate": "20.09.2025",
      "endDate": "22.09.2025",
      "description": "Okanagan-Tal Weinreise mit geführten Weintouren, Weingut Burrowing Owl Estate Winery mit Restaurant und Picknick am See.",
      "accommodation": "Penticton Beach House",
      "accommodationWebsite": "https://www.airbnb.ca/rooms/1204067674291962583?source_impression_id=p3_1753042901_P3VGq6McEy7oqFL6",
      "accommodationImageUrl": "https://a0.muscache.com/im/pictures/hosting/Hosting-1204067674291962583/original/54cb6e85-2858-4642-b61f-6ba6716f9f06.jpeg?im_w=1440",
      "accommodationPrice": 860,
      "accommodationCurrency": "CAD",
      "accommodationInclusiveServices": [],
      "accommodationAmenities": [],
      "accommodationCheckinTime": "",
      "accommodationCheckoutTime": "",
      "distance": 395,
      "imageUrl": "https://plus.unsplash.com/premium_photo-1754211686859-913f71e422e1?fm=jpg&q=60&w=3000&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
      "mapImageUrl": "",
      "coordinates": { "lat": 49.4949, "lng": -119.5937 },
      "activities": [
        "Weinverkostung Kitsch Hundefreundlich",
        "Geführte Weintour durch mehrere Weingüter",
        "Besuch Kentucky-Alleyne Provincial Park",
        "Promenade am Okanagan Lake",
        "Priest Creek Winery Weinverkostung",
        "Spearhead Winery Weinverkostung",
        "Summerhill Pyramid Weinverkostung"
      ],
      "restaurants": [
        { "name": "Elm", "websiteUrl": "https://eatatelma.com", "description": "Für Abends" },
        { "name": "The Bench Market", "description": "Beliebter All-Day Breakfast/Brunch" },
        { "name": "Kin & Folk", "description": "Frühstück & Abends" },
        { "name": "Naramata Restaurants", "description": "All great restaurants in Naramata area" },
        { "name": "EATology", "description": "Local dining" },
        { "name": "Diner On Six", "description": "Local diner" },
        { "name": "Intermezzo Restaurant", "description": "Fine dining option" },
        { "name": "Bean To Cup Coffee House", "description": "Breakfast coffee spot" }
      ],
      "experiences": [
        "Leichte Riesling-Flights und Weinproben",
        "110 km lange wunderbare Strände am Okanagan Lake",
        "Geführte Weintouren mit professionellem Guide"
      ],
      "highlights": ["Weingüter", "Okanagan Lake", "Weinproben"],
      "funFacts": [],
      "routeHighlights": [
        "Cedar and Moss Coffee, Cultus Lake, Bridal Falls",
        "Abbotsford Selbstfahrer-Circle-Farm-Tour: Käse, Honig, Kürbisstand",
        "Abbotsford Mennonite Heritage Village",
        "Historische Montrose Street mit Weingütern und Brauereien",
        "Fahrt durch Manning Park durch Wein- und Obstanbaugebiete"
      ],
      "createdAt": "2025-09-14T21:25:24.653Z",
      "updatedAt": "2025-09-24T06:13:46.249Z"
    },
    {
      "id": "414edcdd-5029-443b-8c74-11c0459bc997",
      "name": "Vernon",
      "slug": "vernon",
      "startDate": "22.09.2025",
      "endDate": "24.09.2025",
      "description": "Entspannung und Erholung in Vernon mit Besuch des Kalamalka Lake Provincial Park und lokalen Attraktionen.",
      "accommodation": "Prestige Vernon Lodge & Conference Centre",
      "accommodationWebsite": "https://www.prestigeinn.com/vernon/",
      "accommodationImageUrl": "https://www.prestigeinn.com/wp-content/uploads/2019/05/vernon-exterior-1.jpg",
      "accommodationPrice": 320,
      "accommodationCurrency": "CAD",
      "accommodationInclusiveServices": ["Frühstück", "WLAN", "Parkplatz"],
      "accommodationAmenities": ["Pool", "Fitness", "Restaurant"],
      "accommodationCheckinTime": "15:00",
      "accommodationCheckoutTime": "11:00",
      "distance": 47,
      "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3",
      "mapImageUrl": "",
      "coordinates": { "lat": 50.2671, "lng": -119.2720 },
      "activities": [
        "Kalamalka Lake Provincial Park",
        "Vernon Museum & Archives",
        "Davison Orchards Country Village",
        "Okanagan Rail Trail"
      ],
      "restaurants": [
        { "name": "Eclectic Med Restaurant", "description": "Mediterranean cuisine" },
        { "name": "Intermezzo Restaurant", "description": "Fine dining" },
        { "name": "Bean Scene Coffee Works", "description": "Local coffee shop" }
      ],
      "experiences": [
        "Panoramablick auf Kalamalka Lake",
        "Herbstfarben in den Weinbergen",
        "Lokale Obstplantagen besuchen"
      ],
      "highlights": ["Kalamalka Lake", "Weinberge", "Obstplantagen"],
      "funFacts": [],
      "routeHighlights": [
        "Fahrt durch das Okanagan Valley",
        "Scenic Drive entlang Kalamalka Lake"
      ],
      "createdAt": "2025-09-14T21:25:24.653Z",
      "updatedAt": "2025-09-24T06:13:46.249Z"
    },
    {
      "id": "b8c9d123-4567-890a-bcde-f123456789ab",
      "name": "Golden",
      "slug": "golden",
      "startDate": "24.09.2025",
      "endDate": "26.09.2025",
      "description": "Gateway zu den Rocky Mountains mit atemberaubenden Bergpanoramen und Outdoor-Aktivitäten.",
      "accommodation": "Prestige Inn Golden",
      "accommodationWebsite": "https://www.prestigeinn.com/golden/",
      "accommodationImageUrl": "https://www.prestigeinn.com/wp-content/uploads/2019/05/golden-exterior.jpg",
      "accommodationPrice": 280,
      "accommodationCurrency": "CAD",
      "accommodationInclusiveServices": ["WLAN", "Parkplatz"],
      "accommodationAmenities": ["Restaurant", "Lounge"],
      "accommodationCheckinTime": "15:00",
      "accommodationCheckoutTime": "11:00",
      "distance": 351,
      "imageUrl": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3",
      "mapImageUrl": "",
      "coordinates": { "lat": 51.2998, "lng": -116.9631 },
      "activities": [
        "Kicking Horse Mountain Resort",
        "Golden Municipal Campground",
        "Columbia River Wetlands"
      ],
      "restaurants": [
        { "name": "Legends Restaurant", "description": "Mountain dining" },
        { "name": "Whitetooth Mountain Bistro", "description": "Local bistro" }
      ],
      "experiences": [
        "Rocky Mountain Panorama",
        "Columbia River Valley",
        "Bergluft und Natur"
      ],
      "highlights": ["Rocky Mountains", "Columbia River", "Kicking Horse"],
      "funFacts": [],
      "routeHighlights": [
        "Trans-Canada Highway durch die Rockies",
        "Kicking Horse Pass"
      ],
      "createdAt": "2025-09-14T21:25:24.653Z",
      "updatedAt": "2025-09-24T06:13:46.249Z"
    }
  ]
};

async function migrateData() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error('DATABASE_URL environment variable is required');
  }

  console.log('🚀 Starting migration from Replit to Railway...');
  
  const sql = postgres(databaseUrl);
  const db = drizzle(sql);

  try {
    // 1. Insert tour settings
    console.log('📝 Inserting tour settings...');
    await db.insert(tourSettings).values({
      id: REPLIT_DATA.tourSettings.id,
      tourName: REPLIT_DATA.tourSettings.tourName,
      startDate: REPLIT_DATA.tourSettings.startDate,
      endDate: REPLIT_DATA.tourSettings.endDate,
      totalDistance: REPLIT_DATA.tourSettings.totalDistance,
      totalCost: REPLIT_DATA.tourSettings.totalCost,
      currency: REPLIT_DATA.tourSettings.currency,
      heroImageUrl: REPLIT_DATA.tourSettings.heroImageUrl,
      description: REPLIT_DATA.tourSettings.description,
      privacyEnabled: REPLIT_DATA.tourSettings.privacyEnabled,
      privacyPassword: REPLIT_DATA.tourSettings.privacyPassword,
      sessionTimeout: REPLIT_DATA.tourSettings.sessionTimeout,
      gpsActivatedByAdmin: REPLIT_DATA.tourSettings.gpsActivatedByAdmin,
      gpsUpdateInterval: REPLIT_DATA.tourSettings.gpsUpdateInterval,
      updatedAt: new Date(REPLIT_DATA.tourSettings.updatedAt)
    }).onConflictDoNothing();

    // 2. Insert locations (first 2 for now)
    console.log('🗺️ Inserting locations...');
    for (const location of REPLIT_DATA.locations) {
      await db.insert(locations).values({
        id: location.id,
        name: location.name,
        slug: location.slug,
        startDate: location.startDate,
        endDate: location.endDate,
        description: location.description,
        accommodation: location.accommodation,
        accommodationWebsite: location.accommodationWebsite,
        accommodationImageUrl: location.accommodationImageUrl,
        accommodationPrice: location.accommodationPrice,
        accommodationCurrency: location.accommodationCurrency,
        accommodationInclusiveServices: location.accommodationInclusiveServices,
        accommodationAmenities: location.accommodationAmenities,
        accommodationCheckinTime: location.accommodationCheckinTime,
        accommodationCheckoutTime: location.accommodationCheckoutTime,
        distance: location.distance,
        imageUrl: location.imageUrl,
        mapImageUrl: location.mapImageUrl,
        coordinates: location.coordinates,
        activities: location.activities,
        restaurants: location.restaurants,
        experiences: location.experiences,
        highlights: location.highlights,
        funFacts: location.funFacts,
        routeHighlights: location.routeHighlights,
        createdAt: new Date(location.createdAt),
        updatedAt: new Date(location.updatedAt)
      }).onConflictDoNothing();
    }

    console.log('✅ Migration completed successfully!');
    console.log(`📊 Migrated: ${REPLIT_DATA.locations.length} locations, 1 tour settings`);
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sql.end();
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  migrateData().catch(console.error);
}

export { migrateData };
