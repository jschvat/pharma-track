/**
 * PharmaCard - Standardized Card Component
 * 
 * A comprehensive card component that standardizes all card layouts
 * throughout the PharmaTraK application. Provides consistent structure,
 * loading states, action buttons, and accessibility features.
 * 
 * Features:
 * - Pre-configured layouts (simple, stats, dashboard, settings)
 * - Loading states with skeleton animations
 * - Action buttons in header with consistent spacing
 * - Collapse/expand functionality
 * - Consistent shadows and styling
 * - Status indicators and badges
 * - Gradient header support
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback } from 'react';
import { Card, Collapse, Badge, Spinner } from 'react-bootstrap';
import PharmaButton from './PharmaButton';
import '../../css/pharma-components.css';

const PharmaCard = ({
  // Core content
  title,
  subtitle,
  children,
  footer = null,
  
  // Layout and styling
  layout = 'simple', // 'simple', 'stats', 'dashboard', 'settings', 'gradient', 'medication-planner'
  variant = 'default', // 'default', 'primary', 'success', 'warning', 'danger', 'info'
  theme = 'default', // 'default', 'counting-tray'
  
  // Medication planner specific props
  plannerSize = 'medium', // 'small', 'medium', 'large' - for medication-planner layout
  plannerCompartments = [], // Array of compartment data for medication-planner layout
  
  // Header configuration
  showHeader = true,
  headerActions = [], // Array of action buttons
  headerBadge = null,
  headerIcon = null,
  
  // Collapse functionality
  collapsible = false,
  defaultExpanded = true,
  
  // Loading states
  loading = false,
  loadingRows = 3,
  
  // Status and indicators
  status = null, // 'active', 'inactive', 'warning', 'error'
  statusText = null,
  
  // Statistics (for stats layout)
  stats = [], // Array of { label, value, icon?, color?, trend? }
  
  // Styling
  className = '',
  headerClassName = '',
  bodyClassName = '',
  footerClassName = '',
  
  // Card properties
  border = null, // 'primary', 'success', etc.
  shadow = 'sm', // 'none', 'sm', 'md', 'lg'
  
  // Events
  onHeaderClick = null,
  onCollapse = null,
  
  // Accessibility
  'aria-label': ariaLabel,
  id,
  
  ...otherProps
}) => {
  
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  
  // Handle collapse toggle
  const handleToggle = useCallback(() => {
    const newExpanded = !isExpanded;
    setIsExpanded(newExpanded);
    if (onCollapse) {
      onCollapse(newExpanded);
    }
  }, [isExpanded, onCollapse]);
  
  // Handle header click
  const handleHeaderClick = useCallback((event) => {
    if (collapsible) {
      handleToggle();
    }
    if (onHeaderClick) {
      onHeaderClick(event);
    }
  }, [collapsible, handleToggle, onHeaderClick]);
  
  // Render status indicator
  const renderStatusIndicator = () => {
    if (!status) return null;
    
    const statusColors = {
      active: 'success',
      inactive: 'secondary',
      warning: 'warning',
      error: 'danger'
    };
    
    return (
      <div className="pharma-card-status">
        <Badge 
          bg={statusColors[status] || 'secondary'} 
          className="me-2"
        >
          {statusText || status}
        </Badge>
      </div>
    );
  };
  
  // Render header actions
  const renderHeaderActions = () => {
    if (headerActions.length === 0) return null;
    
    return (
      <div className="pharma-card-actions">
        {headerActions.map((action, index) => (
          <PharmaButton
            key={index}
            size="sm"
            variant={action.variant || 'outline-secondary'}
            className={`ms-2 ${action.className || ''}`}
            onClick={action.onClick}
            disabled={action.disabled || loading}
            {...action}
          >
            {action.icon && <span className="me-1">{action.icon}</span>}
            {action.label}
          </PharmaButton>
        ))}
        
        {collapsible && (
          <PharmaButton
            size="sm"
            variant="outline-secondary"
            className="ms-2"
            onClick={handleToggle}
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? '−' : '+'}
          </PharmaButton>
        )}
      </div>
    );
  };
  
  // Render statistics (for stats layout)
  const renderStats = () => {
    if (layout !== 'stats' || !stats.length) return null;
    
    return (
      <div className="pharma-card-stats">
        <div className="row">
          {stats.map((stat, index) => (
            <div key={index} className={`col-${12 / Math.min(stats.length, 4)}`}>
              <div className="pharma-card-stat">
                {stat.icon && (
                  <div className="pharma-card-stat-icon" style={{ color: stat.color }}>
                    {stat.icon}
                  </div>
                )}
                <div className="pharma-card-stat-content">
                  <div className="pharma-card-stat-value" style={{ color: stat.color }}>
                    {stat.value}
                    {stat.trend && (
                      <span className={`pharma-card-stat-trend ${stat.trend > 0 ? 'positive' : 'negative'}`}>
                        {stat.trend > 0 ? '↗' : '↘'}
                      </span>
                    )}
                  </div>
                  <div className="pharma-card-stat-label">{stat.label}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  // Render medication planner compartments (for medication-planner layout)
  const renderMedicationPlanner = () => {
    if (layout !== 'medication-planner') return null;
    
    return (
      <div className="planner-compartments">
        {plannerCompartments.map((compartment, index) => (
          <div 
            key={index} 
            className="planner-compartment"
            onClick={compartment.onClick}
            style={compartment.style}
          >
            {compartment.icon && <span className="me-1">{compartment.icon}</span>}
            <div className="planner-compartment-content">
              {compartment.value && <div className="planner-compartment-value">{compartment.value}</div>}
              {compartment.label && <div className="planner-compartment-label">{compartment.label}</div>}
              {compartment.time && <div className="planner-compartment-time">{compartment.time}</div>}
            </div>
          </div>
        ))}
        
        {/* Fill remaining compartments if needed for planning grid */}
        {plannerCompartments.length < 12 && Array.from(
          { length: Math.max(0, 12 - plannerCompartments.length) }, 
          (_, index) => (
            <div key={`empty-${index}`} className="planner-compartment planner-compartment-empty">
              <span className="text-muted">+</span>
            </div>
          )
        )}
      </div>
    );
  };
  
  // Render loading skeleton
  const renderLoadingSkeleton = () => {
    if (!loading) return null;
    
    return (
      <div className="pharma-card-loading">
        {Array.from({ length: loadingRows }, (_, index) => (
          <div key={index} className="pharma-card-loading-row">
            <div className="pharma-card-loading-bar" style={{ width: `${Math.random() * 40 + 60}%` }} />
          </div>
        ))}
      </div>
    );
  };
  
  // Build CSS classes
  const cardClasses = [
    'pharma-card',
    `pharma-card-${layout}`,
    `pharma-card-${variant}`,
    `pharma-card-theme-${theme}`,
    layout === 'medication-planner' && `planner-size-${plannerSize}`,
    shadow && `pharma-card-shadow-${shadow}`,
    status && `pharma-card-status-${status}`,
    loading && 'pharma-card-loading-state',
    collapsible && 'pharma-card-collapsible',
    className
  ].filter(Boolean).join(' ');
  
  const headerClasses = [
    'pharma-card-header',
    layout === 'gradient' && 'pharma-card-header-gradient',
    collapsible && 'pharma-card-header-clickable',
    headerClassName
  ].filter(Boolean).join(' ');
  
  // Get gradient style for gradient layout
  const getGradientStyle = () => {
    if (layout !== 'gradient') return {};
    
    const gradients = {
      primary: 'linear-gradient(135deg, #0d6efd 0%, #0b5ed7 100%)',
      success: 'linear-gradient(135deg, #198754 0%, #157347 100%)',
      warning: 'linear-gradient(135deg, #ffc107 0%, #ffca2c 100%)',
      danger: 'linear-gradient(135deg, #dc3545 0%, #bb2d3b 100%)',
      info: 'linear-gradient(135deg, #0dcaf0 0%, #31d2f2 100%)',
      default: 'linear-gradient(135deg, #6c757d 0%, #5c636a 100%)'
    };
    
    return {
      background: gradients[variant] || gradients.default,
      color: 'white',
      borderBottom: '2px solid rgba(0,0,0,0.1)'
    };
  };
  
  return (
    <Card 
      className={cardClasses}
      border={border}
      id={id}
      aria-label={ariaLabel}
      {...otherProps}
    >
      {/* Header */}
      {showHeader && (title || headerActions.length > 0 || headerBadge || headerIcon) && (
        <Card.Header 
          className={headerClasses}
          style={getGradientStyle()}
          onClick={collapsible ? handleHeaderClick : onHeaderClick}
          role={collapsible ? 'button' : undefined}
          tabIndex={collapsible ? 0 : undefined}
          onKeyDown={collapsible ? (e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleToggle();
            }
          } : undefined}
        >
          <div className="pharma-card-header-content">
            <div className="pharma-card-header-main">
              {headerIcon && (
                <span className="pharma-card-header-icon me-2">{headerIcon}</span>
              )}
              
              {title && (
                <div className="pharma-card-header-text">
                  <Card.Title className="pharma-card-title mb-0">
                    {title}
                  </Card.Title>
                  {subtitle && (
                    <div className="pharma-card-subtitle">{subtitle}</div>
                  )}
                </div>
              )}
              
              {headerBadge && (
                <span className="ms-2">{headerBadge}</span>
              )}
            </div>
            
            <div className="pharma-card-header-right">
              {renderStatusIndicator()}
              {renderHeaderActions()}
            </div>
          </div>
        </Card.Header>
      )}
      
      {/* Body */}
      <Collapse in={!collapsible || isExpanded}>
        <div>
          <Card.Body className={`pharma-card-body ${bodyClassName}`}>
            {/* Planner label for medication planner layout */}
            {layout === 'medication-planner' && (
              <div className="planner-label">Med Planner</div>
            )}
            
            {loading ? renderLoadingSkeleton() : (
              <>
                {renderStats()}
                {renderMedicationPlanner()}
                {children}
              </>
            )}
          </Card.Body>
          
          {/* Footer */}
          {footer && (
            <Card.Footer className={`pharma-card-footer ${footerClassName}`}>
              {footer}
            </Card.Footer>
          )}
        </div>
      </Collapse>
    </Card>
  );
};

// Pre-configured card variants for common use cases
export const StatsCard = (props) => (
  <PharmaCard 
    layout="stats"
    shadow="md"
    {...props} 
  />
);

export const DashboardCard = (props) => (
  <PharmaCard 
    layout="dashboard"
    variant="primary"
    shadow="md"
    {...props} 
  />
);

export const SettingsCard = (props) => (
  <PharmaCard 
    layout="settings"
    collapsible={true}
    {...props} 
  />
);

export const GradientCard = (props) => (
  <PharmaCard 
    layout="gradient"
    shadow="lg"
    {...props} 
  />
);

export const LoadingCard = (props) => (
  <PharmaCard 
    loading={true}
    showHeader={false}
    {...props} 
  />
);

export const AlertCard = ({ variant = 'warning', ...props }) => (
  <PharmaCard 
    variant={variant}
    border={variant}
    {...props} 
  />
);

export const MedicationPlannerCard = (props) => (
  <PharmaCard 
    layout="medication-planner"
    shadow="md"
    {...props} 
  />
);

export const CountingTrayCard = (props) => (
  <PharmaCard 
    theme="counting-tray"
    shadow="lg"
    {...props} 
  />
);

export default PharmaCard;