/**
 * SVG to PNG Conversion Script
 * 
 * Converts downloaded SVG icons to high-quality PNG format
 * with proper sizing and professional appearance.
 */

const fs = require('fs');
const path = require('path');

// Check if sharp is available for high-quality conversion
let sharp;
try {
  sharp = require('sharp');
} catch (e) {
  console.log('📦 Sharp not found. Install with: npm install sharp');
  console.log('📦 Alternative: Using Canvas-based conversion');
}

// Fallback to canvas if sharp is not available
let Canvas;
if (!sharp) {
  try {
    Canvas = require('canvas');
  } catch (e) {
    console.log('📦 Canvas not found. Install with: npm install canvas');
  }
}

const iconMapping = require('./download-icons').iconMapping;

const INPUT_DIR = path.join(__dirname, '..', 'public', 'icons');
const OUTPUT_DIR = INPUT_DIR; // Same directory
const ICON_SIZE = 32; // 32x32 PNG icons
const ICON_COLOR = '#ffffff'; // White for dark sidebar background

/**
 * Convert SVG to PNG using Sharp (preferred method)
 */
async function convertWithSharp(svgPath, pngPath) {
  try {
    // Read SVG content
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    
    // Modify SVG for better PNG output
    svgContent = svgContent.replace(/fill="currentColor"/g, `fill="${ICON_COLOR}"`);
    svgContent = svgContent.replace(/fill="none"/g, `fill="${ICON_COLOR}"`);
    svgContent = svgContent.replace(/fill="#[0-9A-Fa-f]{6}"/g, `fill="${ICON_COLOR}"`);
    
    // Replace existing width/height or add them
    if (svgContent.includes('width=') && svgContent.includes('height=')) {
      svgContent = svgContent.replace(/width="[^"]*"/g, `width="${ICON_SIZE}"`);
      svgContent = svgContent.replace(/height="[^"]*"/g, `height="${ICON_SIZE}"`);
    } else {
      svgContent = svgContent.replace(/<svg/, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}"`);
    }
    // Convert to PNG
    await sharp(Buffer.from(svgContent))
      .resize(ICON_SIZE, ICON_SIZE)
      .png({
        quality: 100,
        compressionLevel: 0,
        adaptiveFiltering: false
      })
      .toFile(pngPath);
      
    return true;
  } catch (error) {
    console.error(`❌ Sharp conversion failed for ${path.basename(svgPath)}:`, error.message);
    return false;
  }
}

/**
 * Convert SVG to PNG using Canvas (fallback method)
 */
async function convertWithCanvas(svgPath, pngPath) {
  if (!Canvas) {
    console.error('❌ Canvas not available for conversion');
    return false;
  }
  
  try {
    const { createCanvas, loadImage } = Canvas;
    
    // Read and modify SVG
    let svgContent = fs.readFileSync(svgPath, 'utf8');
    svgContent = svgContent.replace(/fill="currentColor"/g, `fill="${ICON_COLOR}"`);
    svgContent = svgContent.replace(/<svg/, `<svg width="${ICON_SIZE}" height="${ICON_SIZE}"`);
    
    // Create canvas
    const canvas = createCanvas(ICON_SIZE, ICON_SIZE);
    const ctx = canvas.getContext('2d');
    
    // Create data URL from SVG
    const svgDataUrl = `data:image/svg+xml;base64,${Buffer.from(svgContent).toString('base64')}`;
    
    // Load and draw image
    const image = await loadImage(svgDataUrl);
    ctx.drawImage(image, 0, 0, ICON_SIZE, ICON_SIZE);
    
    // Save as PNG
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(pngPath, buffer);
    
    return true;
  } catch (error) {
    console.error(`❌ Canvas conversion failed for ${path.basename(svgPath)}:`, error.message);
    return false;
  }
}

/**
 * Fallback: Create a simple script to manually convert icons
 */
function createManualConversionGuide() {
  const guide = `# Manual Icon Conversion Guide

Since automated conversion libraries aren't available, here are manual options:

## Option 1: Online Converter
1. Visit https://cloudconvert.com/svg-to-png
2. Upload each SVG file from the icons directory
3. Set size to 32x32 pixels
4. Download PNG files and save with same names

## Option 2: Using Browser
1. Open each SVG file in a browser
2. Right-click and "Save image as" PNG
3. Use browser dev tools to set proper size if needed

## Option 3: Design Tools
- **Figma**: Import SVG, export as PNG (32x32)
- **Canva**: Upload SVG, resize, download PNG
- **GIMP**: Open SVG, scale to 32x32, export PNG

## Files to Convert:
${Object.keys(iconMapping).map(key => `- ${key}.svg → ${key}.png`).join('\n')}

## Quality Settings:
- Size: 32x32 pixels
- Format: PNG with transparency
- Color: Professional dark gray (#374151)
- Background: Transparent

Place converted PNG files in the same directory as SVG files.
The NavIcon component will automatically use PNG files when available.
`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'CONVERSION_GUIDE.md'), guide);
  console.log('📄 Created CONVERSION_GUIDE.md with manual conversion instructions');
}

/**
 * Convert all SVG files to PNG
 */
async function convertAllIcons() {
  console.log('🎨 Converting SVG icons to PNG...\n');
  
  // Check if input directory exists
  if (!fs.existsSync(INPUT_DIR)) {
    console.error('❌ Icons directory not found. Run download-icons.js first.');
    return;
  }
  
  const svgFiles = fs.readdirSync(INPUT_DIR).filter(file => file.endsWith('.svg'));
  
  if (svgFiles.length === 0) {
    console.log('⚠️  No SVG files found. Run download-icons.js first.');
    return;
  }
  
  let successCount = 0;
  const conversionMethod = sharp ? 'Sharp' : Canvas ? 'Canvas' : 'Manual';
  
  console.log(`🔧 Using conversion method: ${conversionMethod}\n`);
  
  if (!sharp && !Canvas) {
    console.log('⚠️  No automated conversion libraries available.');
    createManualConversionGuide();
    return;
  }
  
  for (const svgFile of svgFiles) {
    const svgPath = path.join(INPUT_DIR, svgFile);
    const pngFile = svgFile.replace('.svg', '.png');
    const pngPath = path.join(OUTPUT_DIR, pngFile);
    
    console.log(`🔄 Converting: ${svgFile} → ${pngFile}`);
    
    let success = false;
    if (sharp) {
      success = await convertWithSharp(svgPath, pngPath);
    } else if (Canvas) {
      success = await convertWithCanvas(svgPath, pngPath);
    }
    
    if (success) {
      successCount++;
      console.log(`✓ Created: ${pngFile}`);
    }
  }
  
  console.log(`\n✅ Conversion complete! ${successCount}/${svgFiles.length} icons converted successfully.`);
  
  if (successCount > 0) {
    console.log('\n🎯 Your icons are ready! The NavIcon component will now use PNG files.');
    console.log('🔄 Restart your development server to see the new icons.');
  }
}

// Run the script
if (require.main === module) {
  convertAllIcons();
}

module.exports = { convertAllIcons };