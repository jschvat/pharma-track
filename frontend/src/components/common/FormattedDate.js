/**
 * FormattedDate Component
 * 
 * Reusable date formatting component that provides consistent date/time display
 * across the application with various formatting options.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React from 'react';

/**
 * FormattedDate - Consistent date formatting component
 * 
 * @param {Object} props - Component props
 * @param {string|Date} props.date - Date to format (ISO string, Date object, or timestamp)
 * @param {string} props.format - Format type: 'date', 'time', 'datetime', 'relative', 'custom'
 * @param {string} props.customFormat - Custom format options for Intl.DateTimeFormat
 * @param {string} props.locale - Locale for formatting (default: user's locale)
 * @param {string} props.timezone - Timezone for formatting
 * @param {boolean} props.showTooltip - Show full datetime on hover
 * @param {string} props.className - Additional CSS classes
 * @param {string} props.fallback - Text to show if date is invalid (default: 'N/A')
 * @returns {JSX.Element} FormattedDate component
 */
const FormattedDate = ({ 
  date,
  format = 'datetime',
  customFormat,
  locale,
  timezone,
  showTooltip = false,
  className = '',
  fallback = 'N/A',
  ...props 
}) => {
  
  // Convert input to Date object
  const getDateObject = () => {
    if (!date) return null;
    
    if (date instanceof Date) {
      return date;
    }
    
    // Handle various string formats
    if (typeof date === 'string') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    // Handle timestamp
    if (typeof date === 'number') {
      const parsed = new Date(date);
      return isNaN(parsed.getTime()) ? null : parsed;
    }
    
    return null;
  };

  const dateObj = getDateObject();

  // Return fallback if date is invalid
  if (!dateObj) {
    return <span className={className} {...props}>{fallback}</span>;
  }

  // Get format options based on format type
  const getFormatOptions = () => {
    if (customFormat) {
      return customFormat;
    }

    const baseOptions = {
      timeZone: timezone
    };

    switch (format) {
      case 'date':
        return {
          ...baseOptions,
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        };
      
      case 'time':
        return {
          ...baseOptions,
          hour: '2-digit',
          minute: '2-digit'
        };
      
      case 'datetime':
        return {
          ...baseOptions,
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
      
      case 'short':
        return {
          ...baseOptions,
          year: '2-digit',
          month: 'numeric',
          day: 'numeric'
        };
      
      case 'long':
        return {
          ...baseOptions,
          year: 'numeric',
          month: 'long',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        };
      
      default:
        return baseOptions;
    }
  };

  // Format relative time (e.g., "2 hours ago")
  const getRelativeTime = () => {
    const now = new Date();
    const diffMs = now.getTime() - dateObj.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) {
      return 'Just now';
    } else if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      // Fall back to date format for older dates
      return dateObj.toLocaleDateString(locale, {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // Get the formatted text
  const getFormattedText = () => {
    if (format === 'relative') {
      return getRelativeTime();
    }

    try {
      const options = getFormatOptions();
      return dateObj.toLocaleDateString(locale, options);
    } catch (error) {
      console.warn('Date formatting error:', error);
      return dateObj.toLocaleDateString();
    }
  };

  const formattedText = getFormattedText();
  
  // Full datetime for tooltip
  const tooltipText = showTooltip ? dateObj.toLocaleString(locale, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZoneName: 'short'
  }) : null;

  return (
    <span 
      className={className}
      title={tooltipText}
      {...props}
    >
      {formattedText}
    </span>
  );
};

export default FormattedDate;