# Navigation Icons

This directory contains professional PNG icons for the PharmaTraK navigation sidebar.

## Icon Specifications

- **Format**: PNG with transparent background
- **Size**: 32x32px (will be scaled responsively)
- **Style**: Modern, flat design with subtle shadows
- **Colors**: Should work well on both light and dark backgrounds
- **Naming**: Use exact filenames as specified below

## Required Icons

### Brand
- `brand.png` - PharmaTraK logo/brand icon for sidebar header

### Main Navigation
- `dashboard.png` - Speedometer/gauge icon for Dashboard
- `inventory.png` - Boxes/warehouse icon for Inventory  
- `state-count.png` - Clipboard with checkmark for State Count
- `drugs.png` - Pills/medicine icon for Drugs
- `reports.png` - Chart/analytics icon for Reports
- `admin.png` - Users with gear icon for Administration

### User Menu
- `profile.png` - User profile icon
- `settings.png` - Gear/cog icon for Settings
- `theme.png` - Palette icon for Theme selection

## Icon Guidelines

1. **Consistency**: All icons should follow the same visual style
2. **Clarity**: Icons should be clearly recognizable at small sizes (16px-30px)
3. **Professional**: Clean, modern design suitable for business application
4. **Accessibility**: High contrast and clear shapes for accessibility

## Fallback Behavior

If any PNG icon fails to load, the system will automatically fall back to FontAwesome icons:
- Brand: `fas fa-pills`
- Dashboard: `fas fa-tachometer-alt`
- Inventory: `fas fa-boxes`
- State Count: `fas fa-clipboard-list`
- Drugs: `fas fa-pills`
- Reports: `fas fa-chart-line`
- Administration: `fas fa-users-cog`
- Profile: `fas fa-user`
- Settings: `fas fa-cog`
- Theme: `fas fa-palette`

## Integration

Icons are automatically loaded by the `NavIcon` component. Simply place the PNG files in this directory with the correct filenames, and they will be used immediately.