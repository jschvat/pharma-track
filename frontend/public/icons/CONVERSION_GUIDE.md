# Manual Icon Conversion Guide

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
- brand.svg → brand.png
- dashboard.svg → dashboard.png
- inventory.svg → inventory.png
- state-count.svg → state-count.png
- drugs.svg → drugs.png
- reports.svg → reports.png
- admin.svg → admin.png
- profile.svg → profile.png
- settings.svg → settings.png
- theme.svg → theme.png

## Quality Settings:
- Size: 32x32 pixels
- Format: PNG with transparency
- Color: Professional dark gray (#374151)
- Background: Transparent

Place converted PNG files in the same directory as SVG files.
The NavIcon component will automatically use PNG files when available.
