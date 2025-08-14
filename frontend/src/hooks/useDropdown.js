/**
 * useDropdown Hook
 * 
 * Custom React hook for managing dropdown state and outside click behavior.
 * Ensures dropdowns close when clicking outside or pressing Escape.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

export const useDropdown = (initialState = false) => {
  const [isOpen, setIsOpen] = useState(initialState);
  const dropdownRef = useRef(null);

  // Toggle dropdown state
  const toggle = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Open dropdown
  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  // Close dropdown
  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
      
      // Add aria attributes for accessibility
      if (dropdownRef.current) {
        dropdownRef.current.setAttribute('aria-expanded', 'true');
      }
    } else {
      // Remove aria attributes when closed
      if (dropdownRef.current) {
        dropdownRef.current.setAttribute('aria-expanded', 'false');
      }
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Auto-close on window blur (when user switches tabs/windows)
  useEffect(() => {
    const handleWindowBlur = () => {
      setIsOpen(false);
    };

    window.addEventListener('blur', handleWindowBlur);
    return () => window.removeEventListener('blur', handleWindowBlur);
  }, []);

  return {
    isOpen,
    toggle,
    open,
    close,
    dropdownRef
  };
};

/**
 * useSelectDropdown Hook
 * 
 * Specialized hook for select element dropdown behavior.
 * Handles focus/blur states for native and custom select elements.
 */
export const useSelectDropdown = () => {
  const [isFocused, setIsFocused] = useState(false);
  const selectRef = useRef(null);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const handleKeyDown = useCallback((event) => {
    // Close on Escape key
    if (event.key === 'Escape') {
      setIsFocused(false);
      if (selectRef.current) {
        selectRef.current.blur();
      }
    }
  }, []);

  return {
    isFocused,
    selectRef,
    selectProps: {
      onFocus: handleFocus,
      onBlur: handleBlur,
      onKeyDown: handleKeyDown,
      ref: selectRef
    }
  };
};

/**
 * useNavDropdown Hook
 * 
 * Specialized hook for navigation dropdown components.
 * Handles hover and click states with proper timing.
 */
export const useNavDropdown = (hoverDelay = 150) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const dropdownRef = useRef(null);
  const hoverTimeoutRef = useRef(null);

  const openDropdown = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    setIsOpen(true);
  }, []);

  const closeDropdown = useCallback(() => {
    if (hoverTimeoutRef.current) {
      clearTimeout(hoverTimeoutRef.current);
    }
    hoverTimeoutRef.current = setTimeout(() => {
      setIsOpen(false);
      setIsHovered(false);
    }, hoverDelay);
  }, [hoverDelay]);

  const handleMouseEnter = useCallback(() => {
    setIsHovered(true);
    openDropdown();
  }, [openDropdown]);

  const handleMouseLeave = useCallback(() => {
    setIsHovered(false);
    closeDropdown();
  }, [closeDropdown]);

  const handleClick = useCallback(() => {
    setIsOpen(prev => !prev);
  }, []);

  // Handle click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        setIsHovered(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscapeKey);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (hoverTimeoutRef.current) {
        clearTimeout(hoverTimeoutRef.current);
      }
    };
  }, []);

  return {
    isOpen,
    isHovered,
    dropdownRef,
    navDropdownProps: {
      onMouseEnter: handleMouseEnter,
      onMouseLeave: handleMouseLeave,
      onClick: handleClick,
      ref: dropdownRef,
      className: isOpen ? 'nav-dropdown open' : 'nav-dropdown'
    }
  };
};

export default useDropdown;