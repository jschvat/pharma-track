/**
 * PharmaTraK Standard Dropdown Component
 * 
 * A robust, reusable single-select dropdown that solves positioning and clipping issues.
 * Companion to MultiSelectDropdown for simpler single-select use cases.
 * 
 * Features:
 * - Single select with proper positioning
 * - No positioning jumps or clipping issues
 * - Proper viewport boundary detection
 * - Customizable styling and behavior
 * - Search/filter capability (optional)
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Dropdown, Form } from 'react-bootstrap';
import '../../css/dropdown-escape.css';

const PharmaDropdown = ({
  // Required props
  options = [], // Array of option objects: [{ value: 'val', label: 'Label' }]
  selectedValue = null, // Currently selected value
  onSelectionChange, // Function(newValue) - called when selection changes
  
  // Display props
  placeholder = "Select an option...",
  
  // Styling props
  variant = "outline-secondary",
  size = "sm",
  minWidth = "120px",
  maxMenuHeight = "300px",
  maxMenuWidth = "400px", // Increased default max width
  autoSize = true, // New prop to enable auto-sizing
  
  // Behavior props
  disabled = false,
  searchable = false, // Enable search/filter functionality
  clearable = false, // Show clear option
  closeOnTableScroll = true, // Close dropdown when parent table scrolls
  
  // Advanced props
  customDisplayFormatter = null, // Function(selectedValue, options) - custom display text
  customOptionRenderer = null, // Function(option, isSelected) - custom option rendering
  
  // CSS classes
  className = "",
  menuClassName = "",
  
  // Accessibility
  id = null,
  'aria-label': ariaLabel = "Dropdown selection"
}) => {
  
  const [searchTerm, setSearchTerm] = useState('');
  const [calculatedMenuWidth, setCalculatedMenuWidth] = useState(null);
  const [calculatedMenuHeight, setCalculatedMenuHeight] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const toggleRef = useRef(null);
  
  /**
   * Calculate optimal menu dimensions based on content
   */
  const calculateMenuDimensions = () => {
    if (!autoSize) {
      return {
        width: maxMenuWidth,
        height: maxMenuHeight
      };
    }
    
    // Create a temporary element to measure text width
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = size === 'sm' ? '12px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' 
                                 : '14px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    
    let maxTextWidth = 0;
    
    // Filter options based on current search term (avoid circular dependency)
    const currentFilteredOptions = !searchable || !searchTerm.trim() ? 
      options : 
      options.filter(option => 
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (option.value && option.value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
      );
    
    // Measure all option labels
    currentFilteredOptions.forEach(option => {
      const textWidth = context.measureText(option.label).width;
      maxTextWidth = Math.max(maxTextWidth, textWidth);
    });
    
    // Add padding for Bootstrap dropdown item styling (approximately 90px total)
    // Account for: padding (48px) + margins (22px) + search/clear controls (20px)
    const calculatedWidth = maxTextWidth + 90;
    
    // Calculate height based on number of items
    const itemHeight = size === 'sm' ? 32 : 38; // Approximate Bootstrap dropdown item height
    const searchHeight = searchable ? 60 : 0; // Search input + divider height
    const clearHeight = (clearable && selectedValue !== null) ? 40 : 0; // Clear option height
    const totalItems = currentFilteredOptions.length + (clearable && selectedValue !== null ? 1 : 0);
    const contentHeight = searchHeight + clearHeight + (totalItems * itemHeight);
    
    // Ensure minimum width and respect screen constraints
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    
    const maxAllowedWidth = Math.min(
      parseInt(maxMenuWidth), 
      screenWidth * 0.8 // Never exceed 80% of screen width
    );
    const maxAllowedHeight = Math.min(
      parseInt(maxMenuHeight),
      screenHeight * 0.6, // Never exceed 60% of screen height
      contentHeight + 10 // Add small padding
    );
    
    const minAllowedWidth = parseInt(minWidth) || 120;
    const finalWidth = Math.max(minAllowedWidth, Math.min(calculatedWidth, maxAllowedWidth));
    
    // Only set a specific height if content fits, otherwise use maxHeight with scroll
    const needsScroll = contentHeight > maxAllowedHeight;
    const finalHeight = needsScroll ? maxAllowedHeight : contentHeight;
    
    return {
      width: `${finalWidth}px`,
      height: needsScroll ? `${finalHeight}px` : 'auto',
      needsScroll
    };
  };
  
  /**
   * Update calculated dimensions when options change
   */
  useEffect(() => {
    if (autoSize && options.length > 0) {
      // Use setTimeout to ensure DOM is ready
      setTimeout(() => {
        const dimensions = calculateMenuDimensions();
        setCalculatedMenuWidth(dimensions.width);
        setCalculatedMenuHeight(dimensions.height);
      }, 10);
    }
  }, [options, autoSize, maxMenuWidth, maxMenuHeight, minWidth, size, searchable, clearable, selectedValue, searchTerm]);
  
  /**
   * Handle window resize to recalculate menu dimensions
   */
  useEffect(() => {
    if (!autoSize) return;
    
    const handleResize = () => {
      if (options.length > 0) {
        const dimensions = calculateMenuDimensions();
        setCalculatedMenuWidth(dimensions.width);
        setCalculatedMenuHeight(dimensions.height);
      }
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [autoSize, options, maxMenuWidth, maxMenuHeight, minWidth, size, searchable, clearable, selectedValue, searchTerm]);
  
  /**
   * Get display text for the dropdown button
   */
  const getDisplayText = () => {
    if (customDisplayFormatter) {
      return customDisplayFormatter(selectedValue, options);
    }
    
    if (selectedValue === null || selectedValue === undefined || selectedValue === '') {
      return placeholder;
    }
    
    const selectedOption = options.find(opt => opt.value === selectedValue);
    return selectedOption ? selectedOption.label : selectedValue;
  };
  
  /**
   * Filter options based on search term
   */
  const getFilteredOptions = () => {
    if (!searchable || !searchTerm.trim()) {
      return options;
    }
    
    return options.filter(option => 
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (option.value && option.value.toString().toLowerCase().includes(searchTerm.toLowerCase()))
    );
  };
  
  /**
   * Handle option selection
   */
  const handleOptionSelect = (value) => {
    onSelectionChange(value);
    setSearchTerm(''); // Clear search when option selected
  };
  
  /**
   * Handle clear selection
   */
  const handleClear = () => {
    onSelectionChange(null);
    setSearchTerm('');
  };
  
  /**
   * Viewport-aware position and size calculation
   */
  const updateMenuPosition = () => {
    if (!toggleRef.current) return;
    
    const rect = toggleRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    
    // Calculate available space below and above
    const spaceBelow = viewportHeight - rect.bottom - 10; // 10px margin from bottom
    const spaceAbove = rect.top - 10; // 10px margin from top
    
    // Determine if dropdown should open above or below
    const shouldOpenAbove = spaceBelow < 150 && spaceAbove > spaceBelow;
    
    // Calculate optimal height based on available space
    const availableHeight = shouldOpenAbove ? spaceAbove : spaceBelow;
    const maxPossibleHeight = Math.min(availableHeight, parseInt(maxMenuHeight) || 300);
    
    // Update calculated menu height if autoSize is enabled
    if (autoSize) {
      // Get filtered options for calculation
      const currentFilteredOptions = getFilteredOptions();
      
      // For states dropdown, we want to show as many as possible
      const itemHeight = 32; // Approximate height per option
      const optimalItems = Math.floor(maxPossibleHeight / itemHeight);
      const optimalHeight = Math.min(optimalItems * itemHeight, currentFilteredOptions.length * itemHeight);
      
      setCalculatedMenuHeight(`${Math.max(100, optimalHeight)}px`); // Minimum 100px
    }
    
    // Set position
    const top = shouldOpenAbove 
      ? rect.top - (autoSize && calculatedMenuHeight ? parseInt(calculatedMenuHeight) : maxPossibleHeight) - 4
      : rect.bottom + 4;
    
    const left = Math.min(rect.left, viewportWidth - 300); // Ensure dropdown doesn't go off-screen horizontally
    
    setMenuPosition({
      top: Math.max(10, top), // Don't go above viewport
      left: Math.max(10, left) // Don't go outside left edge
    });
  };

  /**
   * Handle dropdown toggle
   */
  const handleToggle = (newIsOpen) => {
    setIsOpen(newIsOpen);
    
    if (newIsOpen) {
      if (autoSize) {
        // Recalculate dimensions when dropdown opens
        const dimensions = calculateMenuDimensions();
        setCalculatedMenuWidth(dimensions.width);
        setCalculatedMenuHeight(dimensions.height);
      }
      
      // Update position
      setTimeout(() => {
        updateMenuPosition();
      }, 10);
    } else {
      // Clear search when closing
      setSearchTerm('');
    }
  };

  /**
   * Handle window resize and optional table scroll detection
   */
  useEffect(() => {
    if (isOpen) {
      const handleResize = () => {
        updateMenuPosition();
      };
      
      const handleTableScroll = () => {
        if (closeOnTableScroll) {
          setIsOpen(false);
        }
      };
      
      // Listen to window resize
      window.addEventListener('resize', handleResize);
      
      // Listen to table scroll events if enabled
      if (closeOnTableScroll) {
        // Find all potential scrollable table containers
        const scrollableContainers = document.querySelectorAll(
          '.table-responsive, .overflow-auto, .overflow-scroll, [style*="overflow"]'
        );
        
        scrollableContainers.forEach(container => {
          container.addEventListener('scroll', handleTableScroll, { passive: true });
        });
        
        // Also listen to window scroll as fallback
        window.addEventListener('scroll', handleTableScroll, { passive: true });
      }
      
      // Update position once when opening
      setTimeout(() => updateMenuPosition(), 0);
      
      return () => {
        window.removeEventListener('resize', handleResize);
        if (closeOnTableScroll) {
          const scrollableContainers = document.querySelectorAll(
            '.table-responsive, .overflow-auto, .overflow-scroll, [style*="overflow"]'
          );
          scrollableContainers.forEach(container => {
            container.removeEventListener('scroll', handleTableScroll);
          });
          window.removeEventListener('scroll', handleTableScroll);
        }
      };
    }
  }, [isOpen, calculatedMenuWidth, calculatedMenuHeight, closeOnTableScroll]);
  
  /**
   * Render individual option
   */
  const renderOption = (option) => {
    const isSelected = selectedValue === option.value;
    
    if (customOptionRenderer) {
      return customOptionRenderer(option, isSelected);
    }
    
    return (
      <Dropdown.Item
        key={option.value}
        onClick={() => handleOptionSelect(option.value)}
        active={isSelected}
      >
        {option.label}
      </Dropdown.Item>
    );
  };
  
  const filteredOptions = getFilteredOptions();
  
  // Get effective menu dimensions (calculated or default)
  const effectiveMenuWidth = autoSize && calculatedMenuWidth ? calculatedMenuWidth : maxMenuWidth;
  const effectiveMenuHeight = autoSize && calculatedMenuHeight ? calculatedMenuHeight : maxMenuHeight;
  
  // Determine if scrolling is needed based on calculated height
  const needsScroll = autoSize ? 
    (calculatedMenuHeight && calculatedMenuHeight !== 'auto' && parseInt(calculatedMenuHeight) >= parseInt(maxMenuHeight)) :
    false;
  
  
  // Custom menu component that renders outside table constraints
  const CustomMenu = () => {
    if (!isOpen) return null;
    
    // Calculate effective dimensions
    const menuWidth = autoSize && calculatedMenuWidth ? calculatedMenuWidth : 
                     (autoSize ? 'max-content' : effectiveMenuWidth);
    
    // ENHANCED REAL-TIME height and position calculation
    let dynamicMaxHeight = parseInt(maxMenuHeight) || 300;
    let adjustedTop = menuPosition.top;
    
    if (autoSize && toggleRef.current) {
      const rect = toggleRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;
      
      // Calculate available space in all directions
      const spaceBelow = viewportHeight - rect.bottom - 10; // Reduced margin for more space
      const spaceAbove = rect.top - 10;
      const totalAvailableHeight = viewportHeight - 20; // Total usable viewport height
      
      // Determine optimal positioning and height
      const preferredHeight = Math.min(
        filteredOptions.length * 36 + 16, // 36px per item + 16px padding
        parseInt(maxMenuHeight) || 400
      );
      
      let finalHeight;
      let shouldOpenAbove = false;
      
      if (spaceBelow >= preferredHeight) {
        // Plenty of space below - use preferred height
        finalHeight = preferredHeight;
      } else if (spaceAbove >= preferredHeight && spaceAbove > spaceBelow) {
        // Better space above - open upward
        finalHeight = preferredHeight;
        shouldOpenAbove = true;
      } else if (spaceBelow >= 200) {
        // Decent space below - use what's available
        finalHeight = Math.max(200, spaceBelow - 5);
      } else if (spaceAbove >= 200) {
        // Better to open above
        finalHeight = Math.max(200, spaceAbove - 5);
        shouldOpenAbove = true;
      } else {
        // Limited space - use the larger of the two areas
        if (spaceAbove > spaceBelow) {
          finalHeight = Math.max(150, spaceAbove - 5);
          shouldOpenAbove = true;
        } else {
          finalHeight = Math.max(150, spaceBelow - 5);
        }
      }
      
      dynamicMaxHeight = Math.min(finalHeight, totalAvailableHeight * 0.8); // Never exceed 80% of viewport
      
      // Adjust position if opening above
      if (shouldOpenAbove) {
        adjustedTop = rect.top - dynamicMaxHeight - 4;
        // Ensure we don't go above viewport
        adjustedTop = Math.max(10, adjustedTop);
        // Recalculate height if we had to adjust position
        if (adjustedTop === 10) {
          dynamicMaxHeight = rect.top - 14; // 10px margin + 4px gap
        }
      }
      
      // Ensure horizontal positioning stays on screen
      const menuWidth = autoSize && calculatedMenuWidth ? parseInt(calculatedMenuWidth) : 200;
      if (menuPosition.left + menuWidth > viewportWidth - 10) {
        // Would go off screen - adjust left position
        // This will be handled in the style object below
      }
    }
    
    return createPortal(
      <div
        id="pharma-dropdown-menu"
        style={{
          position: 'fixed',
          top: `${adjustedTop}px`,
          left: `${Math.min(menuPosition.left, window.innerWidth - (autoSize && calculatedMenuWidth ? parseInt(calculatedMenuWidth) : 200) - 10)}px`,
          minWidth: menuWidth,
          width: menuWidth,
          maxHeight: `${dynamicMaxHeight}px`,
          height: filteredOptions.length * 36 + 16 <= dynamicMaxHeight ? 'auto' : `${dynamicMaxHeight}px`,
          zIndex: 2147483647,
          backgroundColor: '#ffffff',
          border: '1px solid #dee2e6',
          borderRadius: '0.375rem',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
          overflowY: filteredOptions.length * 36 + 16 > dynamicMaxHeight ? "auto" : "hidden",
          overflowX: "hidden",
          padding: 0,
          margin: 0,
          display: 'block',
          visibility: 'visible',
          opacity: 1,
          // Enhanced scrollbar styling
          scrollbarWidth: 'thin',
          scrollbarColor: '#6c757d #e9ecef',
          // Improved visual feedback
          transition: 'all 0.15s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onScroll={(e) => e.stopPropagation()}
      >
        {filteredOptions.map((option) => {
          const isSelected = selectedValue === option.value;
          
          return (
            <button
              key={option.value}
              className={`dropdown-item ${isSelected ? 'active' : ''}`}
              type="button"
              onClick={() => handleOptionSelect(option.value)}
              style={{
                display: 'block',
                width: '100%',
                padding: '0.375rem 1rem',
                clear: 'both',
                fontWeight: 400,
                color: isSelected ? '#fff' : '#212529',
                textAlign: 'left',
                textDecoration: 'none',
                backgroundColor: isSelected ? '#0d6efd' : '#ffffff',
                border: 0,
                borderRadius: 0,
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.target.style.backgroundColor = '#e9ecef';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.target.style.backgroundColor = '#ffffff';
                }
              }}
            >
              {option.label}
            </button>
          );
        })}
      </div>,
      document.body
    );
  };

  // Handle clicks outside to close dropdown
  useEffect(() => {
    if (isOpen) {
      const handleClickOutside = (event) => {
        // Check if click is outside both the toggle button and the dropdown menu
        const isOutsideToggle = toggleRef.current && !toggleRef.current.contains(event.target);
        const isOutsideMenu = !event.target.closest('#pharma-dropdown-menu') && 
                              !event.target.closest('.dropdown-menu-escape');
        
        if (isOutsideToggle && isOutsideMenu) {
          setIsOpen(false);
        }
      };
      
      document.addEventListener('mousedown', handleClickOutside);
      return () => {
        document.removeEventListener('mousedown', handleClickOutside);
      };
    }
  }, [isOpen]);


  return (
    <>
      <button
        ref={toggleRef}
        className={`btn dropdown-toggle ${variant ? `btn-${variant}` : 'btn-outline-secondary'} ${size ? `btn-${size}` : ''} ${className}`}
        type="button"
        disabled={disabled}
        id={id}
        aria-label={ariaLabel}
        aria-expanded={isOpen}
        onClick={() => handleToggle(!isOpen)}
        style={{ 
          fontSize: size === 'sm' ? '0.75rem' : '0.875rem',
          minWidth: minWidth,
          textAlign: "left",
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          // Override for compact state dropdown - SIMPLE HEIGHT FIX
          ...(className && className.includes('pharma-dropdown-states-compact') && {
            height: '38px',
            minHeight: '38px', 
            maxHeight: '38px',
            fontSize: '1rem',
            lineHeight: '1.5',
            padding: '6px 12px',
            border: '1px solid #ced4da',
            borderRadius: '0.375rem',
            backgroundColor: '#fff',
            color: '#495057',
            boxSizing: 'border-box',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          })
        }}
      >
        {getDisplayText()}
      </button>
      
      <CustomMenu />
    </>
  );
};

export default PharmaDropdown;