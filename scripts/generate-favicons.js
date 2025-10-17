/**
 * Generate favicon PNG files from SVG
 * 
 * Usage:
 * 1. Install sharp: npm install sharp
 * 2. Run: node scripts/generate-favicons.js
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is installed
let sharp;
try {
  sharp = require('sharp');
} catch (error) {
  console.error('❌ Sharp is not installed. Please run: npm install sharp');
  process.exit(1);
}

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');
const iconsDir = path.join(publicDir, 'icons');

// Ensure icons directory exists
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

const conversions = [
  // Favicon sizes
  { input: 'favicon.svg', output: 'favicon-16x16.png', size: 16 },
  { input: 'favicon.svg', output: 'favicon-32x32.png', size: 32 },
  { input: 'favicon.svg', output: 'favicon-48x48.png', size: 48 },
  
  // Apple Touch Icon
  { input: 'apple-touch-icon.svg', output: 'apple-touch-icon.png', size: 180 },
  
  // PWA Icons
  { input: 'icons/icon-144.svg', output: 'icons/icon-72x72.png', size: 72 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-96x96.png', size: 96 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-144x144.png', size: 144 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-192x192.png', size: 192 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-256x256.png', size: 256 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-384x384.png', size: 384 },
  { input: 'icons/icon-144.svg', output: 'icons/icon-512x512.png', size: 512 },
];

async function convertSvgToPng() {
  console.log('🎨 Starting favicon generation...\n');
  
  let successCount = 0;
  let errorCount = 0;

  for (const { input, output, size } of conversions) {
    const inputPath = path.join(publicDir, input);
    const outputPath = path.join(publicDir, output);

    try {
      // Check if input file exists
      if (!fs.existsSync(inputPath)) {
        console.error(`❌ Input file not found: ${input}`);
        errorCount++;
        continue;
      }

      // Convert SVG to PNG
      await sharp(inputPath)
        .resize(size, size)
        .png()
        .toFile(outputPath);

      console.log(`✅ Generated: ${output} (${size}x${size})`);
      successCount++;
    } catch (error) {
      console.error(`❌ Error converting ${input}:`, error.message);
      errorCount++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  
  if (successCount > 0) {
    console.log('\n🎉 Favicon generation complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Generate favicon.ico from the PNG files');
    console.log('   2. Use https://realfavicongenerator.net/ or ImageMagick');
    console.log('   3. Clear browser cache and test');
  }
}

// Run the conversion
convertSvgToPng().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

