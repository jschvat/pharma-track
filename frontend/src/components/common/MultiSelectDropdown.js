/**
 * PharmaTraK Multi-Select Dropdown Component
 * 
 * A robust, reusable multi-select dropdown that solves all the positioning,
 * clipping, and UX issues we encountered in the transaction register.
 * 
 * Features:
 * - Multi-select with checkboxes
 * - No positioning jumps or clipping issues  
 * - Proper viewport boundary detection
 * - Customizable styling and behavior
 * - Smart display text (single, multiple, all)
 * - Clear all functionality
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
// UPDATED: Using consolidated dropdown styles
import '../../css/dropdown.css';

const MultiSelectDropdown = ({
  // Required props
  options = [], // Array of option objects: [{ value: 'val', label: 'Label' }]
  selectedValues = [], // Array of currently selected values
  onSelectionChange, // Function(newSelectedValues) - called when selection changes
  
  // Display props
  placeholder = "Select options...",
  allSelectedText = "All selected",
  noneSelectedText = "None selected",
  header = null, // Optional header text for dropdown menu
  
  // Styling props
  variant = "outline-secondary",
  size = "sm",
  minWidth = "120px",
  maxMenuHeight = "300px",
  maxMenuWidth = "400px", // Increased default max width
  autoSize = true, // Enable auto-sizing by default
  
  // Behavior props
  autoClose = false, // Keep dropdown open during multi-select
  disabled = false,
  closeOnTableScroll = true, // Close dropdown when parent table scrolls
  
  // Advanced props
  showClearAll = true,
  allowEmpty = true, // Allow clearing all selections
  customDisplayFormatter = null, // Function(selectedValues, options) - custom display text
  customOptionRenderer = null, // Function(option, isSelected) - custom option rendering
  
  // CSS classes
  className = "",
  menuClassName = "",
  
  // Accessibility
  id = null,
  'aria-label': ariaLabel = "Multi-select dropdown"
}) => {
  
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
    
    // Measure all option labels (including header if present)
    if (header) {
      const headerWidth = context.measureText(header).width;
      maxTextWidth = Math.max(maxTextWidth, headerWidth);
    }
    
    options.forEach(option => {
      const textWidth = context.measureText(option.label).width;
      maxTextWidth = Math.max(maxTextWidth, textWidth);
    });
    
    // Add padding for Bootstrap dropdown item styling + checkbox (~90px total)
    // Account for: padding (48px) + checkbox (20px) + margins (22px)
    const calculatedWidth = maxTextWidth + 90;
    
    // Calculate height based on number of items
    const itemHeight = size === 'sm' ? 32 : 38;
    const headerHeight = header ? 35 : 0;
    const clearAllHeight = showClearAll ? 35 : 0;
    const totalItems = options.length;
    const contentHeight = headerHeight + clearAllHeight + (totalItems * itemHeight);
    
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
  }, [options, autoSize, maxMenuWidth, maxMenuHeight, minWidth, size, header, showClearAll]);
  
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
  }, [autoSize, options, maxMenuWidth, maxMenuHeight, minWidth, size, header, showClearAll]);
  
  /**
   * Get display text for the dropdown button
   */
  const getDisplayText = () => {
    if (customDisplayFormatter) {
      return customDisplayFormatter(selectedValues, options);
    }
    
    if (selectedValues.length === 0) {
      return noneSelectedText;
    }
    
    if (selectedValues.length === options.length) {
      return allSelectedText;
    }
    
    if (selectedValues.length === 1) {
      const selectedOption = options.find(opt => opt.value === selectedValues[0]);
      return selectedOption ? selectedOption.label : selectedValues[0];
    }
    
    return `${selectedValues.length} selected`;
  };
  
  /**
   * Handle individual option selection/deselection
   */
  const handleOptionToggle = (value) => {
    const newSelection = selectedValues.includes(value)
      ? selectedValues.filter(val => val !== value) // Remove if selected
      : [...selectedValues, value]; // Add if not selected
    
    onSelectionChange(newSelection);
  };
  
  /**
   * Handle clear all selections
   */
  const handleClearAll = () => {
    if (allowEmpty) {
      onSelectionChange([]);
    }
  };
  
  /**
   * Handle select all options
   */
  const handleSelectAll = () => {
    const allValues = options.map(opt => opt.value);
    onSelectionChange(allValues);
  };
  
  /**
   * Simple position calculation
   */
  const updateMenuPosition = () => {
    if (!toggleRef.current) return;
    
    const rect = toggleRef.current.getBoundingClientRect();
    
    // Simple positioning - just below the button
    setMenuPosition({
      top: rect.bottom + 4,
      left: rect.left
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
    const menuHeight = autoSize && calculatedMenuHeight ? calculatedMenuHeight : 
                      (autoSize ? 'auto' : effectiveMenuHeight);
    
    return createPortal(
      <div
        className={`dropdown-menu show dropdown-menu-escape ${menuClassName}`}
        style={{
          position: 'fixed', // Use fixed instead of absolute
          top: `${menuPosition.top}px`,
          left: `${menuPosition.left}px`,
          minWidth: autoSize ? `${parseInt(minWidth) || 120}px` : effectiveMenuWidth,
          width: menuWidth,
          maxWidth: 'none', // Remove max-width constraint entirely
          height: menuHeight,
          maxHeight: needsScroll || !autoSize ? `${parseInt(maxMenuHeight) || 300}px` : 'none',
          overflowY: needsScroll || !autoSize ? "auto" : "visible",
          overflowX: "hidden",
          zIndex: 999999, // Very high z-index
          visibility: 'visible',
          transform: 'none',
          contain: 'none',
          isolation: 'auto',
          willChange: 'auto',
          boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(0, 0, 0, 0.175)',
          borderRadius: '0.375rem',
          backgroundColor: '#fff',
          // Force escape from any parent constraints
          margin: 0,
          padding: 0,
          clip: 'auto',
          clipPath: 'none'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {header && (
          <>
            <h6 className="dropdown-header">{header}</h6>
            <div className="dropdown-divider"></div>
          </>
        )}
        
        {showClearAll && (
          <>
            <button
              className="dropdown-item"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleClearAll();
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues.length === 0}
                readOnly
                className="me-2"
              />
              Clear All
            </button>
            
            <button
              className="dropdown-item"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleSelectAll();
              }}
            >
              <input
                type="checkbox"
                checked={selectedValues.length === options.length && options.length > 0}
                readOnly
                className="me-2"
              />
              Select All
            </button>
            
            <div className="dropdown-divider"></div>
          </>
        )}
        
        {options.length === 0 ? (
          <span className="dropdown-item-text">No options available</span>
        ) : (
          options.map((option) => {
            const isSelected = selectedValues.includes(option.value);
            
            if (customOptionRenderer) {
              return customOptionRenderer(option, isSelected);
            }
            
            return (
              <button
                key={option.value}
                className={`dropdown-item ${isSelected ? 'active' : ''}`}
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOptionToggle(option.value);
                }}
              >
                <input
                  type="checkbox"
                  checked={isSelected}
                  readOnly
                  className="me-2"
                  style={{ pointerEvents: 'none' }}
                />
                {option.label}
              </button>
            );
          })
        )}
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
        const isOutsideMenu = !event.target.closest('.dropdown-menu-escape');
        
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
          whiteSpace: 'nowrap'
        }}
      >
        {getDisplayText()}
      </button>
      
      <CustomMenu />
    </>
  );
};

export default MultiSelectDropdown;