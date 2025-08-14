/**
 * Heroicons Download Script
 * 
 * Downloads SVG icons from Heroicons and converts them to PNG format
 * for use in the PharmaTraK navigation system.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// Icon mapping: PharmaTraK icon key -> Heroicons name
const iconMapping = {
  'brand': 'beaker', // Using beaker as pharmacy symbol
  'dashboard': 'squares-2x2',
  'inventory': 'archive-box',
  'state-count': 'clipboard-document-check',
  'drugs': 'beaker',
  'reports': 'chart-bar',
  'admin': 'user-group',
  'profile': 'user',
  'settings': 'cog-6-tooth',
  'theme': 'swatch'
};

// Heroicons base URL for solid icons (24x24)
const HEROICONS_BASE_URL = 'https://raw.githubusercontent.com/tailwindlabs/heroicons/master/src/24/solid/';

// Output directory
const OUTPUT_DIR = path.join(__dirname, '..', 'public', 'icons');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

/**
 * Download SVG file from URL
 */
function downloadSVG(url, filename) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(path.join(OUTPUT_DIR, filename));
    
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
        return;
      }
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log(`✓ Downloaded: ${filename}`);
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(path.join(OUTPUT_DIR, filename), () => {}); // Delete partial file
        reject(err);
      });
    }).on('error', (err) => {
      reject(err);
    });
  });
}

/**
 * Process all icons
 */
async function downloadAllIcons() {
  console.log('🔽 Downloading Heroicons...\n');
  
  const downloads = [];
  
  for (const [pharmaKey, heroiconName] of Object.entries(iconMapping)) {
    const url = `${HEROICONS_BASE_URL}${heroiconName}.svg`;
    const filename = `${pharmaKey}.svg`;
    
    downloads.push(downloadSVG(url, filename));
  }
  
  try {
    await Promise.all(downloads);
    console.log(`\n✅ Successfully downloaded ${Object.keys(iconMapping).length} icons to ${OUTPUT_DIR}`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Run the conversion script to create PNG versions');
    console.log('2. Icons will automatically be used by the NavIcon component');
    
    // Create a simple HTML file to preview icons
    createPreviewFile();
    
  } catch (error) {
    console.error('❌ Error downloading icons:', error.message);
    process.exit(1);
  }
}

/**
 * Create a preview HTML file to see all downloaded icons
 */
function createPreviewFile() {
  const iconEntries = Object.entries(iconMapping);
  
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PharmaTraK Icons Preview</title>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .icon-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap: 20px; margin-top: 20px; }
        .icon-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .icon-svg { width: 48px; height: 48px; margin-bottom: 10px; }
        .icon-name { font-weight: bold; margin-bottom: 5px; }
        .icon-source { font-size: 12px; color: #666; }
        h1 { color: #333; margin-bottom: 10px; }
        .subtitle { color: #666; margin-bottom: 30px; }
    </style>
</head>
<body>
    <h1>PharmaTraK Navigation Icons</h1>
    <p class="subtitle">Downloaded from Heroicons - Preview of SVG files</p>
    
    <div class="icon-grid">
        ${iconEntries.map(([pharmaKey, heroiconName]) => `
        <div class="icon-card">
            <svg class="icon-svg" viewBox="0 0 24 24" fill="currentColor">
                <use href="#${pharmaKey}"></use>
            </svg>
            <div class="icon-name">${pharmaKey}.svg</div>
            <div class="icon-source">Source: ${heroiconName}</div>
        </div>
        `).join('')}
    </div>
    
    <p style="margin-top: 40px; color: #666; font-size: 14px;">
        <strong>Note:</strong> This preview shows the icon structure. 
        The actual SVG content will be loaded when you open this file in a browser.
    </p>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'preview.html'), html);
  console.log('📄 Created preview.html in icons directory');
}

// Run the script
if (require.main === module) {
  downloadAllIcons();
}

module.exports = { downloadAllIcons, iconMapping };