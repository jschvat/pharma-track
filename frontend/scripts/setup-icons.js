/**
 * Complete Icon Setup Script
 * 
 * Downloads Heroicons and converts them to PNG in one step.
 * This is the main script to run for setting up all icons.
 */

const { downloadAllIcons } = require('./download-icons');
const { convertAllIcons } = require('./svg-to-png');

async function setupIcons() {
  console.log('🚀 Setting up PharmaTraK Navigation Icons\n');
  console.log('📦 Using Heroicons (MIT License) from Tailwind Labs\n');
  
  try {
    // Step 1: Download SVG icons
    console.log('Step 1: Downloading SVG icons from Heroicons...');
    await downloadAllIcons();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Step 2: Convert to PNG
    console.log('Step 2: Converting SVG icons to PNG format...');
    await convertAllIcons();
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Final summary
    console.log('🎉 Icon setup complete!');
    console.log('\n📋 What happened:');
    console.log('• Downloaded professional icons from Heroicons');
    console.log('• Converted SVG files to 32x32 PNG format');
    console.log('• Icons are ready for use in your navigation');
    console.log('\n🔄 Next steps:');
    console.log('• Restart your development server');
    console.log('• PNG icons will automatically replace FontAwesome icons');
    console.log('• Check the icons directory for preview.html');
    
  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('• Make sure you have internet connection for downloads');
    console.log('• Install conversion libraries: npm install sharp (or canvas)');
    console.log('• Check the CONVERSION_GUIDE.md for manual alternatives');
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  setupIcons();
}

module.exports = { setupIcons };