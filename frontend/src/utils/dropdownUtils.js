/**
 * Dropdown Utilities
 * 
 * JavaScript utilities to enhance dropdown behavior across the application.
 * Provides consistent hiding/showing behavior for all dropdown types.
 */

/**
 * Initialize Bootstrap dropdown enhancements
 * This function should be called when the app loads to set up global dropdown behavior
 */
export const initializeDropdownBehavior = () => {
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupDropdownListeners);
  } else {
    setupDropdownListeners();
  }
};

/**
 * Set up global dropdown event listeners
 */
const setupDropdownListeners = () => {
  // Handle Bootstrap dropdown events
  document.addEventListener('shown.bs.dropdown', (event) => {
    const dropdown = event.target;
    dropdown.setAttribute('aria-expanded', 'true');
    
    // Add class for styling
    dropdown.classList.add('dropdown-open');
    
    // Focus first menu item for accessibility
    const firstMenuItem = dropdown.querySelector('.dropdown-item');
    if (firstMenuItem) {
      setTimeout(() => firstMenuItem.focus(), 100);
    }
  });

  document.addEventListener('hidden.bs.dropdown', (event) => {
    const dropdown = event.target;
    dropdown.setAttribute('aria-expanded', 'false');
    dropdown.classList.remove('dropdown-open');
  });

  // Handle custom nav dropdowns
  document.addEventListener('click', (event) => {
    const dropdownToggle = event.target.closest('.nav-dropdown-toggle');
    
    if (dropdownToggle) {
      event.preventDefault();
      const dropdown = dropdownToggle.closest('.nav-dropdown');
      
      if (dropdown) {
        // Close other open dropdowns first
        closeAllNavDropdowns(dropdown);
        
        // Toggle this dropdown
        dropdown.classList.toggle('open');
        
        // Update aria attributes
        const isOpen = dropdown.classList.contains('open');
        dropdownToggle.setAttribute('aria-expanded', isOpen);
        
        // Focus first menu item if opening
        if (isOpen) {
          const firstMenuItem = dropdown.querySelector('.nav-dropdown-item');
          if (firstMenuItem) {
            setTimeout(() => firstMenuItem.focus(), 100);
          }
        }
      }
    }
  });

  // Close dropdowns when clicking outside (but not on select elements)
  document.addEventListener('click', (event) => {
    const isDropdownClick = event.target.closest('.dropdown, .nav-dropdown');
    const isSelectElement = event.target.tagName === 'SELECT' || event.target.closest('select');
    
    if (!isDropdownClick && !isSelectElement) {
      closeAllDropdowns();
    }
  });

  // Close dropdowns on Escape key
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeAllDropdowns();
      
      // Return focus to the toggle button if it exists
      const activeDropdown = document.querySelector('.dropdown.show, .nav-dropdown.open');
      if (activeDropdown) {
        const toggle = activeDropdown.querySelector('.dropdown-toggle, .nav-dropdown-toggle');
        if (toggle) {
          toggle.focus();
        }
      }
    }
  });

  // Close dropdowns when window loses focus (disabled - too aggressive)
  /*
  window.addEventListener('blur', () => {
    closeAllDropdowns();
  });
  */

  // Handle keyboard navigation within dropdowns
  document.addEventListener('keydown', (event) => {
    const activeElement = document.activeElement;
    const dropdown = activeElement.closest('.dropdown-menu, .nav-dropdown-menu');
    
    if (dropdown && (event.key === 'ArrowDown' || event.key === 'ArrowUp')) {
      event.preventDefault();
      
      const items = dropdown.querySelectorAll('.dropdown-item, .nav-dropdown-item');
      const currentIndex = Array.from(items).indexOf(activeElement);
      
      let nextIndex;
      if (event.key === 'ArrowDown') {
        nextIndex = currentIndex < items.length - 1 ? currentIndex + 1 : 0;
      } else {
        nextIndex = currentIndex > 0 ? currentIndex - 1 : items.length - 1;
      }
      
      items[nextIndex].focus();
    }
  });
};

/**
 * Close all open dropdowns
 */
export const closeAllDropdowns = () => {
  // Close Bootstrap dropdowns
  const bootstrapDropdowns = document.querySelectorAll('.dropdown.show');
  bootstrapDropdowns.forEach(dropdown => {
    const dropdownInstance = window.bootstrap?.Dropdown?.getInstance(dropdown.querySelector('.dropdown-toggle'));
    if (dropdownInstance) {
      dropdownInstance.hide();
    } else {
      dropdown.classList.remove('show');
      const menu = dropdown.querySelector('.dropdown-menu');
      if (menu) {
        menu.classList.remove('show');
      }
    }
  });

  // Close custom nav dropdowns
  closeAllNavDropdowns();
};

/**
 * Close all custom navigation dropdowns
 * @param {Element} except - Dropdown to exclude from closing
 */
export const closeAllNavDropdowns = (except = null) => {
  const navDropdowns = document.querySelectorAll('.nav-dropdown.open');
  
  navDropdowns.forEach(dropdown => {
    if (dropdown !== except) {
      dropdown.classList.remove('open');
      
      const toggle = dropdown.querySelector('.nav-dropdown-toggle');
      if (toggle) {
        toggle.setAttribute('aria-expanded', 'false');
      }
    }
  });
};

/**
 * Enhanced select element behavior
 * Adds proper focus/blur handling for better UX
 */
export const enhanceSelectElements = () => {
  const selectElements = document.querySelectorAll('select, .form-select');
  
  selectElements.forEach(select => {
    // Add focus class for styling
    select.addEventListener('focus', () => {
      select.classList.add('select-focused');
      select.parentElement?.classList.add('select-parent-focused');
    });

    select.addEventListener('blur', () => {
      select.classList.remove('select-focused');
      select.parentElement?.classList.remove('select-parent-focused');
    });

    // Close on Escape key
    select.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        select.blur();
      }
    });

    // Prevent form submission on Enter for select elements
    select.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' && select.tagName === 'SELECT') {
        event.preventDefault();
      }
    });
  });
};

/**
 * Setup dropdown auto-close on route change
 * Call this in your router or main component
 */
export const setupDropdownRouteHandler = () => {
  // Listen for popstate (back/forward navigation)
  window.addEventListener('popstate', closeAllDropdowns);
  
  // For React Router, you might want to call this in useEffect
  // when location changes
};

/**
 * Debounce function for performance optimization
 */
const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

/**
 * Performance-optimized scroll handler for dropdowns
 * DISABLED: Too aggressive for normal use
 */
export const setupDropdownScrollHandler = () => {
  // Disabled for now - scroll-based closing is too aggressive
  // Users should be able to scroll while dropdowns are open
  /*
  const debouncedCloseDropdowns = debounce(() => {
    const scrollThreshold = 100;
    if (Math.abs(window.scrollY - (window.lastScrollY || 0)) > scrollThreshold) {
      closeAllDropdowns();
    }
    window.lastScrollY = window.scrollY;
  }, 300);

  window.addEventListener('scroll', debouncedCloseDropdowns, { passive: true });
  */
};

/**
 * Initialize all dropdown enhancements (SIMPLIFIED)
 * Call this once when your app starts
 */
export const initializeAllDropdownEnhancements = () => {
  initializeDropdownBehavior();
  setupDropdownRouteHandler();
  // Removed: enhanceSelectElements() - let native behavior work
  // Removed: setupDropdownScrollHandler() - too aggressive
  // Removed: MutationObserver - not needed for basic functionality
};

export default {
  initializeDropdownBehavior,
  closeAllDropdowns,
  closeAllNavDropdowns,
  enhanceSelectElements,
  setupDropdownRouteHandler,
  setupDropdownScrollHandler,
  initializeAllDropdownEnhancements
};