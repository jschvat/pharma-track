/**
 * NavIcon Component
 * 
 * Flexible navigation icon component that supports both PNG icons and FontAwesome fallbacks.
 * Automatically handles loading states, error fallbacks, and responsive sizing.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect } from 'react';

/**
 * NavIcon - Flexible icon component with PNG and FontAwesome support
 * 
 * @param {Object} props - Component props
 * @param {string} props.iconKey - Icon identifier (e.g., 'dashboard', 'inventory')
 * @param {string} props.fallbackIcon - FontAwesome class as fallback (e.g., 'fas fa-tachometer-alt')
 * @param {string} props.size - Icon size: 'sm', 'md' (default), 'lg', 'xl'
 * @param {boolean} props.collapsed - Whether sidebar is collapsed (affects sizing)
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.alt - Alt text for PNG icons
 * @param {Function} props.onError - Callback when PNG fails to load
 * @param {Function} props.onLoad - Callback when PNG loads successfully
 * @returns {JSX.Element} NavIcon component
 */
const NavIcon = ({ 
  iconKey,
  fallbackIcon,
  size = 'md',
  collapsed = false,
  className = '',
  alt,
  onError,
  onLoad,
  ...props 
}) => {
  
  const [pngLoaded, setPngLoaded] = useState(false);
  const [pngError, setPngError] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Icon configuration mapping
  const iconConfig = {
    brand: {
      filename: 'brand.png',
      alt: 'PharmaTraK',
      fallback: 'fas fa-pills'
    },
    dashboard: {
      filename: 'dashboard.png',
      alt: 'Dashboard',
      fallback: 'fas fa-tachometer-alt'
    },
    inventory: {
      filename: 'inventory.png',
      alt: 'Inventory',
      fallback: 'fas fa-boxes'
    },
    'state-count': {
      filename: 'state-count.png',
      alt: 'State Count',
      fallback: 'fas fa-clipboard-list'
    },
    drugs: {
      filename: 'drugs.png',
      alt: 'Drugs',
      fallback: 'fas fa-pills'
    },
    reports: {
      filename: 'reports.png',
      alt: 'Reports',
      fallback: 'fas fa-chart-line'
    },
    admin: {
      filename: 'admin.png',
      alt: 'Administration',
      fallback: 'fas fa-users-cog'
    },
    profile: {
      filename: 'profile.png',
      alt: 'Profile',
      fallback: 'fas fa-user'
    },
    settings: {
      filename: 'settings.png',
      alt: 'Settings',
      fallback: 'fas fa-cog'
    },
    theme: {
      filename: 'theme.png',
      alt: 'Theme',
      fallback: 'fas fa-palette'
    }
  };

  // Get size dimensions
  const getSizeConfig = () => {
    const baseSize = collapsed ? 'collapsed' : 'expanded';
    
    const sizeConfigs = {
      sm: {
        collapsed: { width: 16, height: 16, fontSize: '0.875rem' },
        expanded: { width: 18, height: 18, fontSize: '0.875rem' }
      },
      md: {
        collapsed: { width: 20, height: 20, fontSize: '1rem' },
        expanded: { width: 22, height: 22, fontSize: '1rem' }
      },
      lg: {
        collapsed: { width: 24, height: 24, fontSize: '1.25rem' },
        expanded: { width: 26, height: 26, fontSize: '1.25rem' }
      },
      xl: {
        collapsed: { width: 28, height: 28, fontSize: '1.5rem' },
        expanded: { width: 30, height: 30, fontSize: '1.5rem' }
      }
    };

    return sizeConfigs[size][baseSize];
  };

  const config = iconConfig[iconKey];
  const sizeConfig = getSizeConfig();
  const finalFallbackIcon = fallbackIcon || config?.fallback || 'fas fa-question';
  const finalAlt = alt || config?.alt || iconKey;

  // PNG icon path
  const pngPath = config ? `/icons/${config.filename}` : null;

  // Handle PNG load success
  const handlePngLoad = () => {
    setIsLoading(false);
    setPngLoaded(true);
    setPngError(false);
    onLoad && onLoad();
  };

  // Handle PNG load error
  const handlePngError = () => {
    setIsLoading(false);
    setPngLoaded(false);
    setPngError(true);
    onError && onError();
  };

  // Reset state when iconKey changes
  useEffect(() => {
    if (pngPath) {
      setIsLoading(true);
      setPngLoaded(false);
      setPngError(false);
    } else {
      setIsLoading(false);
      setPngError(true);
    }
  }, [iconKey]);

  // Always show FontAwesome icons - simpler and more reliable
  return (
    <i 
      className={`${finalFallbackIcon} ${className}`.trim()}
      style={{ fontSize: sizeConfig.fontSize }}
      aria-label={finalAlt}
      {...props}
    />
  );
};

export default NavIcon;