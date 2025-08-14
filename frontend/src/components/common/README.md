# Common Components

This directory contains reusable UI components used throughout the PharmaTraK application.

## Available Components

### Navigation & UI Elements
- **NavIcon** - Flexible icon component supporting PNG icons with FontAwesome fallbacks
- **StatusBadge** - Consistent status displays for various entity types
- **TransactionBadge** - Specialized badges for transaction types with icons and colors

### Layout & State Components  
- **LoadingSpinner** - Loading indicators with multiple layout options
- **EmptyState** - Professional "no data" displays with optional actions
- **AlertMessage** - Error/success messages with auto-hide functionality

### Formatting Components
- **FormattedDate** - Consistent date/time formatting with multiple display options

### Transaction Components
- **TransactionRow** - Specialized components for transaction displays (in parent directory)

## Icon System

The NavIcon component provides professional PNG icon support with automatic FontAwesome fallbacks:

### Features
- Automatic PNG to FontAwesome fallback
- Responsive sizing for collapsed/expanded states
- Loading states and error handling
- Consistent styling across all navigation elements

### Usage
```jsx
import NavIcon from './common/NavIcon';

<NavIcon 
  iconKey="dashboard" 
  fallbackIcon="fas fa-tachometer-alt" 
  collapsed={isCollapsed}
  size="md"
/>
```

### Adding New Icons
1. Add PNG file to `/public/icons/` directory
2. Update icon configuration in `NavIcon.js`
3. Icons will automatically load with FontAwesome fallback

## Component Guidelines

1. **Consistency** - All components follow the same prop patterns and API design
2. **Accessibility** - Components include proper ARIA labels and keyboard support
3. **Responsiveness** - Components adapt to different screen sizes and states
4. **Theming** - Components support light/dark themes where applicable
5. **Performance** - Components are optimized for minimal re-renders

## Import Patterns

```jsx
// Individual component imports (recommended)
import StatusBadge from './common/StatusBadge';
import LoadingSpinner from './common/LoadingSpinner';
import NavIcon from './common/NavIcon';

// Usage
<StatusBadge type="active" value={user.active} />
<LoadingSpinner centered message="Loading data..." />
<NavIcon iconKey="dashboard" collapsed={false} />
```