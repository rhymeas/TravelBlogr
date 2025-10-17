# Favicon Generation Guide

## Files Created

### SVG Files (Vector - Best Quality)
- ✅ `favicon.svg` - 32x32 favicon (modern browsers)
- ✅ `favicon-16.svg` - 16x16 favicon (small size)
- ✅ `apple-touch-icon.svg` - 180x180 iOS icon
- ✅ `icons/icon-144.svg` - 144x144 PWA icon

### Logo Updates
- ✅ `components/ui/Logo.tsx` - Rotated plane by 160 degrees

## How to Generate PNG/ICO Files

### Option 1: Online Converter (Easiest)
1. Go to https://realfavicongenerator.net/
2. Upload `favicon.svg`
3. Download the generated package
4. Replace files in `apps/web/public/`

### Option 2: Using ImageMagick (Command Line)
```bash
# Install ImageMagick
brew install imagemagick  # macOS
# or
sudo apt-get install imagemagick  # Linux

# Convert SVG to PNG
convert favicon.svg -resize 16x16 favicon-16x16.png
convert favicon.svg -resize 32x32 favicon-32x32.png
convert favicon.svg -resize 48x48 favicon-48x48.png

# Convert to ICO (multi-size)
convert favicon-16x16.png favicon-32x32.png favicon-48x48.png favicon.ico

# Apple Touch Icon
convert apple-touch-icon.svg -resize 180x180 apple-touch-icon.png

# PWA Icons
convert icons/icon-144.svg -resize 144x144 icons/icon-144x144.png
convert icons/icon-144.svg -resize 192x192 icons/icon-192x192.png
convert icons/icon-144.svg -resize 512x512 icons/icon-512x512.png
```

### Option 3: Using Node.js (sharp library)
```bash
npm install sharp

# Create convert.js
node convert.js
```

## Files to Generate

### Required Files
- [ ] `favicon.ico` - Multi-size ICO (16x16, 32x32, 48x48)
- [ ] `favicon-16x16.png` - 16x16 PNG
- [ ] `apple-touch-icon.png` - 180x180 PNG
- [ ] `icons/icon-144x144.png` - 144x144 PNG
- [ ] `icons/icon-192x192.png` - 192x192 PNG
- [ ] `icons/icon-512x512.png` - 512x512 PNG

## Current Status

✅ **SVG files created** - Modern browsers will use these
✅ **Logo rotated 160 degrees** - Updated in Logo.tsx
⏳ **PNG/ICO conversion needed** - Use one of the methods above

## Testing

After generating the files:

1. **Clear browser cache** (Ctrl+Shift+Delete)
2. **Hard refresh** (Ctrl+Shift+R)
3. **Check favicon** in browser tab
4. **Test on mobile** - Add to home screen
5. **Verify PWA icons** in manifest

## Design Details

- **Color**: `#2C5F6F` (Teal from brand)
- **Icon**: Paper plane rotated 160 degrees
- **Style**: Minimalist, clean lines
- **Background**: Solid teal circle/rounded square
- **Foreground**: White plane outline

