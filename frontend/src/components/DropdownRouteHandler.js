/**
 * DropdownRouteHandler Component
 * 
 * Handles closing dropdowns when the route changes.
 * This ensures dropdowns don't stay open when navigating between pages.
 */

import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { closeAllDropdowns } from '../utils/dropdownUtils';

const DropdownRouteHandler = () => {
  const location = useLocation();

  useEffect(() => {
    // Close all dropdowns when route changes
    closeAllDropdowns();
  }, [location.pathname]);

  // This component doesn't render anything
  return null;
};

export default DropdownRouteHandler;