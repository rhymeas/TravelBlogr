/**
 * Generate favicon.ico from PNG files
 * 
 * Usage: node scripts/generate-ico.js
 */

const fs = require('fs');
const path = require('path');

// Check if to-ico is installed
let toIco;
try {
  toIco = require('to-ico');
} catch (error) {
  console.error('❌ to-ico is not installed. Installing now...');
  const { execSync } = require('child_process');
  try {
    execSync('npm install to-ico --save-dev', { stdio: 'inherit' });
    toIco = require('to-ico');
    console.log('✅ to-ico installed successfully');
  } catch (installError) {
    console.error('❌ Failed to install to-ico:', installError.message);
    console.log('\n📝 Manual installation:');
    console.log('   npm install to-ico --save-dev');
    console.log('   node scripts/generate-ico.js');
    process.exit(1);
  }
}

const publicDir = path.join(__dirname, '..', 'apps', 'web', 'public');

async function generateIco() {
  console.log('🎨 Generating favicon.ico...\n');

  try {
    // Read PNG files
    const sizes = [16, 32, 48];
    const buffers = sizes.map(size => {
      const filePath = path.join(publicDir, `favicon-${size}x${size}.png`);
      if (!fs.existsSync(filePath)) {
        throw new Error(`Missing file: favicon-${size}x${size}.png`);
      }
      return fs.readFileSync(filePath);
    });

    // Generate ICO
    const icoBuffer = await toIco(buffers);

    // Write to file
    const outputPath = path.join(publicDir, 'favicon.ico');
    fs.writeFileSync(outputPath, icoBuffer);

    console.log('✅ Generated: favicon.ico');
    console.log(`   Location: ${outputPath}`);
    console.log(`   Sizes: 16x16, 32x32, 48x48`);
    console.log('\n🎉 Favicon.ico generation complete!');
    console.log('\n📝 Next steps:');
    console.log('   1. Clear browser cache (Ctrl+Shift+Delete)');
    console.log('   2. Hard refresh (Ctrl+Shift+R)');
    console.log('   3. Check favicon in browser tab');
  } catch (error) {
    console.error('❌ Error generating favicon.ico:', error.message);
    console.log('\n💡 Alternative: Use https://realfavicongenerator.net/');
    process.exit(1);
  }
}

generateIco();

