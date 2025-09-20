import fs from 'fs';
import fetch from 'node-fetch';
import FormData from 'form-data';

const API_BASE = 'http://localhost:5000';

// Read the external trip photos data
const tripPhotosData = JSON.parse(fs.readFileSync('/tmp/external_trip_photos.json', 'utf8'));

// Creator ID mapping (external -> local)
const creatorMap = {
  'ffdbc2a8-e2c0-4d66-a431-39b9f9f359ed': 'fd818dbe-08c7-4c53-a077-3b951c2fbd23', // Rimas
  '5410a5e9-1b02-4b48-bbd6-0c5152382f24': 'ef7d684f-cfe0-4045-b115-eb92b609e04e', // Helmut
  'acc14110-b2ce-4e14-a18b-25966ab4a991': 'f80d7444-bdae-46fb-a004-d4225d713565', // Susanne
  '2956d66f-ed71-4b95-8370-c12dd368a195': '0d95cdfe-f71c-42a1-944b-a282d55da99f', // Ursula
};

async function importPhoto(photo, index) {
  console.log(`📷 ${index + 1}/21: ${photo.caption || 'No caption'}`);
  
  try {
    // Download image from external URL
    const response = await fetch(photo.imageUrl);
    if (!response.ok) {
      throw new Error(`Failed to download: ${response.statusText}`);
    }
    
    const imageBuffer = await response.buffer();
    
    // Create form data for upload
    const formData = new FormData();
    formData.append('image', imageBuffer, {
      filename: `photo-${index + 1}.jpg`,
      contentType: 'image/jpeg'
    });
    
    if (photo.caption) {
      formData.append('caption', photo.caption);
    }
    
    const localCreatorId = creatorMap[photo.creatorId];
    if (localCreatorId) {
      formData.append('creatorId', localCreatorId);
    }
    
    // Upload to our API (use Penticton location ID)
    const uploadResponse = await fetch(`${API_BASE}/api/locations/f6c4fd75-ad76-4060-92f6-b53bf9444264/trip-photos`, {
      method: 'POST',
      body: formData
    });
    
    if (uploadResponse.ok) {
      console.log(`    ✅ Uploaded successfully`);
      return true;
    } else {
      const error = await uploadResponse.text();
      console.log(`    ❌ Upload failed: ${error}`);
      return false;
    }
    
  } catch (error) {
    console.log(`    ❌ Error: ${error.message}`);
    return false;
  }
}

async function importAllPhotos() {
  console.log('🚀 Starting photo import...');
  console.log(`📊 Found ${tripPhotosData.length} photos to import\n`);
  
  let successCount = 0;
  
  // Import photos with interesting captions first
  const interestingPhotos = tripPhotosData.filter(p => p.caption && p.caption.trim());
  const regularPhotos = tripPhotosData.filter(p => !p.caption || !p.caption.trim());
  
  console.log('📸 Importing photos with captions first...');
  for (let i = 0; i < interestingPhotos.length; i++) {
    const success = await importPhoto(interestingPhotos[i], i);
    if (success) successCount++;
    // Small delay to avoid overwhelming the server
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📸 Importing remaining photos...');
  for (let i = 0; i < Math.min(5, regularPhotos.length); i++) { // Limit to 5 for now
    const success = await importPhoto(regularPhotos[i], interestingPhotos.length + i);
    if (success) successCount++;
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log(`\n🎉 Import completed! ${successCount} photos imported successfully.`);
}

importAllPhotos().catch(console.error);