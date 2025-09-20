const fs = require('fs');
const https = require('https');
const { storage } = require('../server/storage.ts');
const { ObjectStorageService } = require('../server/objectStorage.ts');

async function importLiveFeedData() {
  console.log('🚀 Starting live feed data import...');
  
  try {
    // Read the external data files
    const creatorsData = JSON.parse(fs.readFileSync('/tmp/external_creators.json', 'utf8'));
    const locationsData = JSON.parse(fs.readFileSync('/tmp/external_locations.json', 'utf8'));  
    const tripPhotosData = JSON.parse(fs.readFileSync('/tmp/external_trip_photos.json', 'utf8'));
    
    console.log(`📊 Data summary:`);
    console.log(`  - ${creatorsData.length} creators`);
    console.log(`  - ${locationsData.length} locations`);
    console.log(`  - ${tripPhotosData.length} trip photos`);
    
    // 1. Import creators (preserve IDs to maintain relationships)
    console.log('\n👥 Importing creators...');
    for (const creator of creatorsData) {
      try {
        await storage.createCreator({
          id: creator.id,
          name: creator.name
        });
        console.log(`  ✅ ${creator.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️ ${creator.name} (already exists)`);
        } else {
          console.error(`  ❌ ${creator.name}: ${error.message}`);
        }
      }
    }
    
    // 2. Import locations  
    console.log('\n🏔️ Importing locations...');
    for (const location of locationsData) {
      try {
        await storage.createLocation({
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
          distance: location.distance,
          imageUrl: location.imageUrl,
          mapImageUrl: location.mapImageUrl,
          coordinates: location.coordinates,
          activities: location.activities,
          restaurants: location.restaurants,
          experiences: location.experiences,
          highlights: location.highlights,
          funFacts: location.funFacts || [],
          routeHighlights: location.routeHighlights || []
        });
        console.log(`  ✅ ${location.name}`);
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`  ⚠️ ${location.name} (already exists)`);
        } else {
          console.error(`  ❌ ${location.name}: ${error.message}`);
        }
      }
    }
    
    // 3. Import trip photos (download images and store locally)
    console.log('\n📸 Importing trip photos...');
    const objectStorageService = new ObjectStorageService();
    
    for (let i = 0; i < tripPhotosData.length; i++) {
      const photo = tripPhotosData[i];
      console.log(`  📷 ${i + 1}/${tripPhotosData.length}: ${photo.caption || 'No caption'}`);
      
      try {
        // Download the image from the signed URL
        const response = await fetch(photo.imageUrl);
        if (!response.ok) {
          throw new Error(`Failed to download image: ${response.statusText}`);
        }
        
        const imageBuffer = await response.buffer();
        
        // Upload to our object storage
        const uploadResponse = await objectStorageService.uploadObject(imageBuffer, 'image/jpeg');
        
        // Create trip photo record with local object path
        await storage.createTripPhoto({
          id: photo.id,
          locationId: photo.locationId,
          creatorId: photo.creatorId,
          caption: photo.caption,
          objectPath: uploadResponse.objectPath,
          uploadedAt: photo.uploadedAt
        });
        
        console.log(`    ✅ Downloaded and stored`);
        
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`    ⚠️ Already exists`);
        } else {
          console.error(`    ❌ Error: ${error.message}`);
        }
      }
    }
    
    console.log('\n🎉 Import completed successfully!');
    console.log('🔄 Live feed should now show all imported photos and data.');
    
  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  }
}

// Run the import
importLiveFeedData().catch(console.error);