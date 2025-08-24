/**
 * PharmaBreadcrumbs - Advanced Navigation Component
 * 
 * A sophisticated breadcrumb navigation system designed for pharmacy applications
 * with intelligent auto-generation, interactive navigation, contextual actions,
 * and pharmacy-specific routing patterns for complex medical workflows.
 * 
 * Features:
 * - Auto-generation from route patterns and user navigation
 * - Interactive breadcrumb segments with hover states and quick actions
 * - Contextual menus for related navigation options
 * - Pharmacy-specific navigation templates (prescriptions, inventory, patients)
 * - Overflow handling for long breadcrumb chains
 * - Keyboard navigation support
 * - History tracking and back/forward navigation
 * - Responsive design for mobile pharmacy workflows
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useRef, useEffect, useCallback, createContext, useContext } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import { PharmaButton, PharmaCard } from './PharmaComponents';
import PharmaDropdown from './PharmaDropdown';
import '../../css/pharma-components.css';

// Breadcrumb Context for navigation state management
const BreadcrumbContext = createContext();

// Breadcrumb types and configurations
const BREADCRUMB_TYPES = {
  default: {
    icon: '📁',
    className: 'pharma-breadcrumb-default',
    showActions: false
  },
  dashboard: {
    icon: '🏠',
    className: 'pharma-breadcrumb-dashboard',
    showActions: true
  },
  inventory: {
    icon: '📦',
    className: 'pharma-breadcrumb-inventory',
    showActions: true
  },
  prescriptions: {
    icon: '💊',
    className: 'pharma-breadcrumb-prescriptions',
    showActions: true
  },
  patients: {
    icon: '👤',
    className: 'pharma-breadcrumb-patients',
    showActions: true
  },
  drugs: {
    icon: '🧪',
    className: 'pharma-breadcrumb-drugs',
    showActions: true
  },
  reports: {
    icon: '📊',
    className: 'pharma-breadcrumb-reports',
    showActions: false
  },
  settings: {
    icon: '⚙️',
    className: 'pharma-breadcrumb-settings',
    showActions: false
  },
  users: {
    icon: '👥',
    className: 'pharma-breadcrumb-users',
    showActions: true
  },
  audit: {
    icon: '🔍',
    className: 'pharma-breadcrumb-audit',
    showActions: false
  }
};

// Route patterns for auto-generation
const ROUTE_PATTERNS = {
  '/dashboard': { label: 'Dashboard', type: 'dashboard' },
  '/inventory': { label: 'Inventory', type: 'inventory' },
  '/inventory/:id': { label: 'Inventory Details', type: 'inventory' },
  '/inventory/:id/edit': { label: 'Edit Inventory', type: 'inventory' },
  '/prescriptions': { label: 'Prescriptions', type: 'prescriptions' },
  '/prescriptions/:id': { label: 'Prescription Details', type: 'prescriptions' },
  '/prescriptions/new': { label: 'New Prescription', type: 'prescriptions' },
  '/patients': { label: 'Patients', type: 'patients' },
  '/patients/:id': { label: 'Patient Profile', type: 'patients' },
  '/drugs': { label: 'Drug Database', type: 'drugs' },
  '/drugs/:id': { label: 'Drug Details', type: 'drugs' },
  '/reports': { label: 'Reports', type: 'reports' },
  '/reports/:type': { label: 'Report', type: 'reports' },
  '/settings': { label: 'Settings', type: 'settings' },
  '/settings/:section': { label: 'Settings', type: 'settings' },
  '/users': { label: 'User Management', type: 'users' },
  '/users/:id': { label: 'User Profile', type: 'users' },
  '/audit': { label: 'Audit Logs', type: 'audit' },
  '/audit/:id': { label: 'Audit Details', type: 'audit' }
};

// Breadcrumb segment utilities
class BreadcrumbGenerator {
  static generateFromPath(pathname, routeData = {}) {
    const segments = pathname.split('/').filter(Boolean);
    const breadcrumbs = [
      { 
        label: 'Dashboard', 
        path: '/dashboard', 
        type: 'dashboard',
        isClickable: true 
      }
    ];

    let currentPath = '';
    
    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Check if this is a parameter (starts with :)
      const isParameter = /^\d+$/.test(segment) || segment.length > 10;
      
      if (isParameter && routeData[segment]) {
        // Use provided data for parameters
        breadcrumbs.push({
          label: routeData[segment].label || segment,
          path: currentPath,
          type: routeData[segment].type || 'default',
          isClickable: true,
          data: routeData[segment]
        });
      } else {
        // Find matching route pattern
        const pattern = this.findMatchingPattern(currentPath);
        if (pattern) {
          breadcrumbs.push({
            label: pattern.label,
            path: currentPath,
            type: pattern.type,
            isClickable: index < segments.length - 1
          });
        } else {
          // Default segment
          breadcrumbs.push({
            label: this.formatSegmentLabel(segment),
            path: currentPath,
            type: 'default',
            isClickable: index < segments.length - 1
          });
        }
      }
    });

    return breadcrumbs;
  }

  static findMatchingPattern(path) {
    // Direct match first
    if (ROUTE_PATTERNS[path]) {
      return ROUTE_PATTERNS[path];
    }

    // Pattern matching with parameters
    for (const [pattern, config] of Object.entries(ROUTE_PATTERNS)) {
      if (this.matchesPattern(path, pattern)) {
        return config;
      }
    }

    return null;
  }

  static matchesPattern(path, pattern) {
    const pathSegments = path.split('/').filter(Boolean);
    const patternSegments = pattern.split('/').filter(Boolean);

    if (pathSegments.length !== patternSegments.length) {
      return false;
    }

    return patternSegments.every((segment, index) => {
      return segment.startsWith(':') || segment === pathSegments[index];
    });
  }

  static formatSegmentLabel(segment) {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}

// Main PharmaBreadcrumbs Component
const PharmaBreadcrumbs = ({
  items = null, // Manual breadcrumb items
  autoGenerate = true, // Auto-generate from current route
  maxItems = 5, // Maximum visible items before overflow
  separator = '/',
  showHome = true,
  showActions = true,
  showOverflow = true,
  routeData = {}, // Additional data for route parameters
  onNavigate = null,
  className = '',
  variant = 'default', // 'default', 'compact', 'pills'
  size = 'md', // 'sm', 'md', 'lg'
  theme = 'light', // 'light', 'dark'
  interactive = true,
  ...props
}) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [overflowOpen, setOverflowOpen] = useState(false);
  const [activeActions, setActiveActions] = useState(null);
  const overflowRef = useRef(null);
  
  const { addBreadcrumb, removeBreadcrumb, clearBreadcrumbs } = useContext(BreadcrumbContext) || {};

  // Generate breadcrumbs
  const breadcrumbs = items || (autoGenerate ? 
    BreadcrumbGenerator.generateFromPath(location.pathname, routeData) : 
    []
  );

  // Handle overflow
  const visibleBreadcrumbs = breadcrumbs.length > maxItems ? 
    [
      ...breadcrumbs.slice(0, 1),
      { isOverflow: true, items: breadcrumbs.slice(1, -maxItems + 2) },
      ...breadcrumbs.slice(-maxItems + 2)
    ] : breadcrumbs;

  // Navigation handler
  const handleNavigate = useCallback((path, item) => {
    if (onNavigate) {
      onNavigate(path, item);
    } else {
      navigate(path);
    }
  }, [navigate, onNavigate]);

  // Generate contextual actions for breadcrumb segments
  const getContextualActions = useCallback((item) => {
    const actions = [];
    
    switch (item.type) {
      case 'inventory':
        actions.push(
          { label: 'Add New Item', action: () => navigate('/inventory/new'), icon: '➕' },
          { label: 'Import Items', action: () => navigate('/inventory/import'), icon: '📥' },
          { label: 'Export Data', action: () => {}, icon: '📤' }
        );
        break;
      case 'prescriptions':
        actions.push(
          { label: 'New Prescription', action: () => navigate('/prescriptions/new'), icon: '💊' },
          { label: 'Refill Requests', action: () => navigate('/prescriptions/refills'), icon: '🔄' },
          { label: 'Pending Approvals', action: () => navigate('/prescriptions/pending'), icon: '⏳' }
        );
        break;
      case 'patients':
        actions.push(
          { label: 'Add Patient', action: () => navigate('/patients/new'), icon: '👤' },
          { label: 'Patient Search', action: () => {}, icon: '🔍' },
          { label: 'Insurance Verification', action: () => navigate('/patients/insurance'), icon: '💳' }
        );
        break;
      case 'drugs':
        actions.push(
          { label: 'Add Drug', action: () => navigate('/drugs/new'), icon: '🧪' },
          { label: 'FDA Search', action: () => navigate('/drugs/fda-search'), icon: '🔍' },
          { label: 'Drug Interactions', action: () => navigate('/drugs/interactions'), icon: '⚠️' }
        );
        break;
      case 'users':
        actions.push(
          { label: 'Add User', action: () => navigate('/users/new'), icon: '👥' },
          { label: 'Role Management', action: () => navigate('/users/roles'), icon: '🔐' },
          { label: 'Access Logs', action: () => navigate('/users/logs'), icon: '📋' }
        );
        break;
    }
    
    return actions;
  }, [navigate]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!interactive) return;
      
      if (e.key === 'ArrowLeft' && e.altKey) {
        // Alt+Left: Go back one level
        const currentIndex = breadcrumbs.findIndex(item => 
          item.path === location.pathname
        );
        if (currentIndex > 0) {
          handleNavigate(breadcrumbs[currentIndex - 1].path, breadcrumbs[currentIndex - 1]);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [breadcrumbs, location.pathname, handleNavigate, interactive]);

  // Close overflow on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (overflowRef.current && !overflowRef.current.contains(event.target)) {
        setOverflowOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Render individual breadcrumb item
  const renderBreadcrumbItem = (item, index, isLast) => {
    if (item.isOverflow) {
      return (
        <div key="overflow" className="pharma-breadcrumb-overflow" ref={overflowRef}>
          <PharmaDropdown
            variant="link"
            className="pharma-breadcrumb-overflow-toggle p-0"
            trigger="click"
            align="start"
            pharmaType="pill"
            size="sm"
            label="..."
            show={overflowOpen}
            onToggle={setOverflowOpen}
            menuClassName="pharma-breadcrumb-overflow-menu"
          >
            {item.items.map((overflowItem, overflowIndex) => (
              <button
                key={overflowIndex}
                className="dropdown-item pharma-breadcrumb-overflow-item"
                onClick={() => handleNavigate(overflowItem.path, overflowItem)}
              >
                <span className="pharma-breadcrumb-icon me-2">
                  {BREADCRUMB_TYPES[overflowItem.type]?.icon}
                </span>
                {overflowItem.label}
              </button>
            ))}
          </PharmaDropdown>
        </div>
      );
    }

    const itemType = BREADCRUMB_TYPES[item.type] || BREADCRUMB_TYPES.default;
    const actions = showActions && itemType.showActions ? getContextualActions(item) : [];
    const hasActions = actions.length > 0;

    return (
      <div
        key={index}
        className={`pharma-breadcrumb-item ${itemType.className} ${
          isLast ? 'pharma-breadcrumb-current' : ''
        } ${item.isClickable && interactive ? 'pharma-breadcrumb-clickable' : ''}`}
      >
        <div className="pharma-breadcrumb-content">
          {/* Icon */}
          <span className="pharma-breadcrumb-icon me-1">
            {itemType.icon}
          </span>
          
          {/* Label */}
          <span 
            className="pharma-breadcrumb-label"
            onClick={item.isClickable && interactive ? 
              () => handleNavigate(item.path, item) : undefined
            }
            role={item.isClickable && interactive ? 'button' : undefined}
            tabIndex={item.isClickable && interactive ? 0 : undefined}
          >
            {item.label}
          </span>
          
          {/* Actions Dropdown */}
          {hasActions && (
            <PharmaDropdown
              variant="link"
              size="sm"
              className="pharma-breadcrumb-actions ms-1"
              trigger="click"
              align="start"
              pharmaType="capsule"
              label={<i className="fas fa-chevron-down"></i>}
              show={activeActions === index}
              onToggle={(show) => setActiveActions(show ? index : null)}
              menuClassName="pharma-breadcrumb-actions-menu"
            >
              {actions.map((action, actionIndex) => (
                <button
                  key={actionIndex}
                  className="dropdown-item pharma-breadcrumb-action-item"
                  onClick={action.action}
                >
                  <span className="me-2">{action.icon}</span>
                  {action.label}
                </button>
              ))}
            </PharmaDropdown>
          )}
        </div>
        
        {/* Separator */}
        {!isLast && (
          <span className="pharma-breadcrumb-separator mx-2">
            {separator}
          </span>
        )}
      </div>
    );
  };

  return (
    <nav
      className={`pharma-breadcrumbs pharma-breadcrumbs-${variant} pharma-breadcrumbs-${size} pharma-breadcrumbs-${theme} ${className}`}
      aria-label="Breadcrumb navigation"
      {...props}
    >
      <div className="pharma-breadcrumbs-container">
        {visibleBreadcrumbs.map((item, index) => 
          renderBreadcrumbItem(item, index, index === visibleBreadcrumbs.length - 1)
        )}
      </div>
    </nav>
  );
};

// Breadcrumb Provider for global state management
export const BreadcrumbProvider = ({ children }) => {
  const [customBreadcrumbs, setCustomBreadcrumbs] = useState([]);
  const [history, setHistory] = useState([]);

  const addBreadcrumb = useCallback((breadcrumb) => {
    setCustomBreadcrumbs(prev => [...prev, breadcrumb]);
    setHistory(prev => [...prev, breadcrumb]);
  }, []);

  const removeBreadcrumb = useCallback((index) => {
    setCustomBreadcrumbs(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clearBreadcrumbs = useCallback(() => {
    setCustomBreadcrumbs([]);
  }, []);

  const contextValue = {
    customBreadcrumbs,
    history,
    addBreadcrumb,
    removeBreadcrumb,
    clearBreadcrumbs
  };

  return (
    <BreadcrumbContext.Provider value={contextValue}>
      {children}
    </BreadcrumbContext.Provider>
  );
};

// Pre-configured breadcrumb variants
export const DashboardBreadcrumbs = (props) => (
  <PharmaBreadcrumbs
    autoGenerate={true}
    showActions={true}
    maxItems={4}
    variant="default"
    {...props}
  />
);

export const InventoryBreadcrumbs = ({ drugData, ...props }) => (
  <PharmaBreadcrumbs
    autoGenerate={true}
    routeData={drugData ? { [drugData.id]: { label: drugData.generic_name, type: 'drugs' } } : {}}
    showActions={true}
    maxItems={5}
    {...props}
  />
);

export const PrescriptionBreadcrumbs = ({ prescriptionData, patientData, ...props }) => (
  <PharmaBreadcrumbs
    autoGenerate={true}
    routeData={{
      ...(prescriptionData ? { [prescriptionData.id]: { label: `Rx #${prescriptionData.id}`, type: 'prescriptions' } } : {}),
      ...(patientData ? { [patientData.id]: { label: patientData.name, type: 'patients' } } : {})
    }}
    showActions={true}
    maxItems={6}
    {...props}
  />
);

export const CompactBreadcrumbs = (props) => (
  <PharmaBreadcrumbs
    variant="compact"
    size="sm"
    showActions={false}
    maxItems={3}
    separator="›"
    {...props}
  />
);

export const MobileBreadcrumbs = (props) => (
  <PharmaBreadcrumbs
    variant="pills"
    size="sm"
    showActions={false}
    maxItems={2}
    showOverflow={true}
    {...props}
  />
);

// Hook for using breadcrumb context
export const useBreadcrumbs = () => {
  const context = useContext(BreadcrumbContext);
  if (!context) {
    throw new Error('useBreadcrumbs must be used within BreadcrumbProvider');
  }
  return context;
};

// Breadcrumb utilities
export const BreadcrumbUtils = {
  generateFromPath: BreadcrumbGenerator.generateFromPath,
  formatLabel: BreadcrumbGenerator.formatSegmentLabel,
  addRoutePattern: (pattern, config) => {
    ROUTE_PATTERNS[pattern] = config;
  },
  addBreadcrumbType: (type, config) => {
    BREADCRUMB_TYPES[type] = config;
  }
};

export default PharmaBreadcrumbs;
export { BREADCRUMB_TYPES, ROUTE_PATTERNS, BreadcrumbGenerator };