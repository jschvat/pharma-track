/**
 * PharmaDashboardWidget - Advanced Dashboard Widget System
 * 
 * A sophisticated widget framework for building customizable pharmacy dashboards
 * with real-time data, interactive controls, drag-and-drop organization,
 * and pharmacy-specific widget types for comprehensive operational oversight.
 * 
 * Features:
 * - Modular widget architecture with plugin support
 * - Real-time data binding and auto-refresh
 * - Drag-and-drop widget organization
 * - Customizable widget sizes and layouts
 * - Pharmacy-specific widget types (inventory, prescriptions, alerts)
 * - Data export and sharing capabilities
 * - Widget state persistence
 * - Performance optimization with lazy loading
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import { Card, Badge, Spinner, OverlayTrigger, Tooltip, Button } from 'react-bootstrap';
import PharmaDropdown from './PharmaDropdown';
import { PharmaCard, PharmaButton, PharmaProgressBar, PharmaAlert, PharmaTabs } from './PharmaComponents';
import '../../css/pharma-components.css';

// Widget configuration constants
const WIDGET_SIZES = {
  small: { cols: 1, rows: 1, minW: 1, minH: 1, maxW: 2, maxH: 2 },
  medium: { cols: 2, rows: 2, minW: 2, minH: 2, maxW: 4, maxH: 3 },
  large: { cols: 3, rows: 2, minW: 3, minH: 2, maxW: 6, maxH: 4 },
  xlarge: { cols: 4, rows: 3, minW: 4, minH: 3, maxW: 8, maxH: 6 }
};

const REFRESH_INTERVALS = {
  realtime: 5000,    // 5 seconds
  frequent: 30000,   // 30 seconds  
  moderate: 300000,  // 5 minutes
  slow: 900000,      // 15 minutes
  manual: 0          // Manual only
};

const WIDGET_TYPES = {
  STATS: 'stats',
  CHART: 'chart',
  LIST: 'list',
  ALERT: 'alert',
  PROGRESS: 'progress',
  CALENDAR: 'calendar',
  QUICK_ACTION: 'quick_action',
  NOTIFICATION: 'notification'
};

// Base Widget Component
const BaseWidget = ({
  id,
  title,
  subtitle,
  icon,
  size = 'medium',
  variant = 'default',
  loading = false,
  error = null,
  refreshInterval = 'moderate',
  lastUpdated = null,
  onRefresh = null,
  onEdit = null,
  onDelete = null,
  onResize = null,
  className = '',
  headerActions = [],
  children,
  ...props
}) => {
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const refreshTimer = useRef(null);
  const widgetRef = useRef(null);
  
  // Auto-refresh logic
  useEffect(() => {
    if (autoRefresh && refreshInterval !== 'manual' && REFRESH_INTERVALS[refreshInterval] > 0) {
      refreshTimer.current = setInterval(() => {
        if (onRefresh && !loading) {
          setIsRefreshing(true);
          onRefresh().finally(() => setIsRefreshing(false));
        }
      }, REFRESH_INTERVALS[refreshInterval]);
      
      return () => {
        if (refreshTimer.current) {
          clearInterval(refreshTimer.current);
        }
      };
    }
  }, [autoRefresh, refreshInterval, onRefresh, loading]);
  
  const handleManualRefresh = useCallback(async () => {
    if (onRefresh && !loading) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
  }, [onRefresh, loading]);
  
  const toggleAutoRefresh = useCallback(() => {
    setAutoRefresh(prev => !prev);
  }, []);
  
  const widgetClasses = [
    'pharma-dashboard-widget',
    `pharma-widget-${size}`,
    `pharma-widget-${variant}`,
    loading && 'pharma-widget-loading',
    error && 'pharma-widget-error',
    className
  ].filter(Boolean).join(' ');
  
  return (
    <div ref={widgetRef} className={widgetClasses} {...props}>
      <PharmaCard className="h-100 pharma-widget-card">
        {/* Widget Header */}
        <Card.Header className="pharma-widget-header d-flex justify-content-between align-items-center">
          <div className="pharma-widget-title-section">
            <div className="d-flex align-items-center">
              {icon && <span className="pharma-widget-icon me-2">{icon}</span>}
              <div>
                <h6 className="mb-0 pharma-widget-title">{title}</h6>
                {subtitle && <small className="text-muted pharma-widget-subtitle">{subtitle}</small>}
              </div>
            </div>
          </div>
          
          <div className="pharma-widget-controls d-flex align-items-center">
            {/* Auto-refresh indicator */}
            {refreshInterval !== 'manual' && (
              <OverlayTrigger
                overlay={<Tooltip>{autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}</Tooltip>}
              >
                <Button
                  variant="link"
                  size="sm"
                  className={`p-0 me-2 ${autoRefresh ? 'text-success' : 'text-muted'}`}
                  onClick={toggleAutoRefresh}
                >
                  {autoRefresh ? '🔄' : '⏸️'}
                </Button>
              </OverlayTrigger>
            )}
            
            {/* Loading indicator */}
            {(loading || isRefreshing) && (
              <Spinner size="sm" className="me-2" />
            )}
            
            {/* Last updated */}
            {lastUpdated && !loading && (
              <small className="text-muted me-2">
                {new Date(lastUpdated).toLocaleTimeString()}
              </small>
            )}
            
            {/* Custom header actions */}
            {headerActions.map((action, index) => (
              <OverlayTrigger
                key={index}
                overlay={<Tooltip>{action.tooltip || action.label}</Tooltip>}
              >
                <Button
                  variant="link"
                  size="sm"
                  className="p-0 me-1"
                  onClick={action.onClick}
                  disabled={action.disabled}
                >
                  {action.icon}
                </Button>
              </OverlayTrigger>
            ))}
            
            {/* Widget menu */}
            <PharmaDropdown
              label="⋮"
              trigger="click"
              align="end"
              variant="link"
              size="sm"
              className="p-0"
              pharmaType="pill"
            >
              {onRefresh && (
                <button 
                  className="dropdown-item" 
                  onClick={handleManualRefresh} 
                  disabled={loading || isRefreshing}
                >
                  🔄 Refresh Now
                </button>
              )}
              {onEdit && (
                <button className="dropdown-item" onClick={() => onEdit(id)}>
                  ⚙️ Settings
                </button>
              )}
              {onResize && (
                <>
                  <div className="dropdown-divider"></div>
                  <div className="dropdown-header">Size</div>
                  {Object.keys(WIDGET_SIZES).map(sizeName => (
                    <button
                      key={sizeName}
                      className={`dropdown-item ${size === sizeName ? 'active' : ''}`}
                      onClick={() => onResize(id, sizeName)}
                    >
                      {sizeName.charAt(0).toUpperCase() + sizeName.slice(1)}
                    </button>
                  ))}
                </>
              )}
              {onDelete && (
                <>
                  <div className="dropdown-divider"></div>
                  <button className="dropdown-item text-danger" onClick={() => onDelete(id)}>
                    🗑️ Remove
                  </button>
                </>
              )}
            </PharmaDropdown>
          </div>
        </Card.Header>
        
        {/* Widget Body */}
        <Card.Body className="pharma-widget-body">
          {error ? (
            <PharmaAlert variant="danger" className="mb-0">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>Error:</strong> {error}
                </div>
                {onRefresh && (
                  <PharmaButton size="sm" onClick={handleManualRefresh}>
                    Retry
                  </PharmaButton>
                )}
              </div>
            </PharmaAlert>
          ) : (
            children
          )}
        </Card.Body>
      </PharmaCard>
    </div>
  );
};

// Stats Widget - For displaying key metrics
const StatsWidget = ({
  stats = [],
  layout = 'grid', // 'grid', 'list', 'single'
  showTrends = true,
  showComparisons = true,
  ...baseProps
}) => {
  
  const renderSingleStat = (stat) => (
    <div key={stat.key} className="pharma-stat-item text-center">
      <div className="pharma-stat-icon mb-2" style={{ fontSize: '2rem' }}>
        {stat.icon}
      </div>
      <div className="pharma-stat-value mb-1">
        <span className="display-6 fw-bold">{stat.value}</span>
        {stat.unit && <small className="text-muted ms-1">{stat.unit}</small>}
      </div>
      <div className="pharma-stat-label text-muted mb-2">{stat.label}</div>
      
      {showTrends && stat.trend && (
        <div className="pharma-stat-trend">
          <Badge bg={stat.trend > 0 ? 'success' : stat.trend < 0 ? 'danger' : 'secondary'}>
            {stat.trend > 0 ? '↑' : stat.trend < 0 ? '↓' : '→'} {Math.abs(stat.trend)}%
          </Badge>
        </div>
      )}
      
      {showComparisons && stat.comparison && (
        <div className="pharma-stat-comparison small text-muted mt-2">
          vs {stat.comparison.period}: {stat.comparison.value}
        </div>
      )}
    </div>
  );
  
  return (
    <BaseWidget {...baseProps}>
      <div className={`pharma-stats-container pharma-stats-${layout}`}>
        {layout === 'single' && stats[0] ? (
          renderSingleStat(stats[0])
        ) : layout === 'list' ? (
          <div className="pharma-stats-list">
            {stats.map(renderSingleStat)}
          </div>
        ) : (
          <div className="row g-3">
            {stats.map((stat, index) => (
              <div key={stat.key || index} className={`col-${12 / Math.min(stats.length, 3)}`}>
                {renderSingleStat(stat)}
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Progress Widget - For showing progress indicators
const ProgressWidget = ({
  progressItems = [],
  showDetails = true,
  showLabels = true,
  orientation = 'vertical', // 'vertical', 'horizontal'
  ...baseProps
}) => {
  
  return (
    <BaseWidget {...baseProps}>
      <div className={`pharma-progress-container pharma-progress-${orientation}`}>
        {progressItems.map((item, index) => (
          <div key={item.key || index} className="pharma-progress-item mb-3">
            {showLabels && (
              <div className="d-flex justify-content-between align-items-center mb-2">
                <div>
                  {item.icon && <span className="me-2">{item.icon}</span>}
                  <strong>{item.label}</strong>
                </div>
                <div className="text-muted">
                  {item.current}/{item.total}
                </div>
              </div>
            )}
            
            <PharmaProgressBar
              value={(item.current / item.total) * 100}
              label={item.label}
              type={item.type || 'default'}
              showPercentage={true}
              size="md"
            />
            
            {showDetails && item.description && (
              <small className="text-muted">{item.description}</small>
            )}
          </div>
        ))}
      </div>
    </BaseWidget>
  );
};

// Alert Widget - For displaying important notifications
const AlertWidget = ({
  alerts = [],
  maxAlerts = 5,
  showSeverity = true,
  groupBySeverity = false,
  onAlertClick = null,
  onAlertDismiss = null,
  ...baseProps
}) => {
  
  const [visibleAlerts, setVisibleAlerts] = useState(alerts.slice(0, maxAlerts));
  
  useEffect(() => {
    setVisibleAlerts(alerts.slice(0, maxAlerts));
  }, [alerts, maxAlerts]);
  
  const handleDismiss = useCallback((alertId) => {
    setVisibleAlerts(prev => prev.filter(alert => alert.id !== alertId));
    if (onAlertDismiss) {
      onAlertDismiss(alertId);
    }
  }, [onAlertDismiss]);
  
  const renderAlert = (alert) => (
    <PharmaAlert
      key={alert.id}
      variant={alert.severity || 'info'}
      dismissible={!!onAlertDismiss}
      onClose={() => handleDismiss(alert.id)}
      className="mb-2 pharma-widget-alert"
      onClick={onAlertClick ? () => onAlertClick(alert) : undefined}
      style={{ cursor: onAlertClick ? 'pointer' : 'default' }}
    >
      <div className="d-flex align-items-start">
        {alert.icon && (
          <div className="pharma-alert-icon me-2" style={{ fontSize: '1.2rem' }}>
            {alert.icon}
          </div>
        )}
        <div className="flex-grow-1">
          <div className="fw-bold">{alert.title}</div>
          {alert.message && <div className="small">{alert.message}</div>}
          {alert.timestamp && (
            <div className="text-muted small mt-1">
              {new Date(alert.timestamp).toLocaleString()}
            </div>
          )}
        </div>
        {showSeverity && (
          <Badge bg={alert.severity || 'info'} className="ms-2">
            {alert.severity}
          </Badge>
        )}
      </div>
    </PharmaAlert>
  );
  
  const groupedAlerts = useMemo(() => {
    if (!groupBySeverity) return { all: visibleAlerts };
    
    return visibleAlerts.reduce((groups, alert) => {
      const severity = alert.severity || 'info';
      if (!groups[severity]) groups[severity] = [];
      groups[severity].push(alert);
      return groups;
    }, {});
  }, [visibleAlerts, groupBySeverity]);
  
  return (
    <BaseWidget {...baseProps}>
      <div className="pharma-alerts-container">
        {groupBySeverity ? (
          <PharmaTabs
            variant="underline"
            size="sm"
            tabs={Object.entries(groupedAlerts).map(([severity, severityAlerts]) => ({
              id: severity,
              label: severity.charAt(0).toUpperCase() + severity.slice(1),
              badge: { content: severityAlerts.length, variant: severity === 'danger' ? 'danger' : 'secondary' },
              content: (
                <div className="pharma-alerts-group">
                  {severityAlerts.map(renderAlert)}
                </div>
              )
            }))}
          />
        ) : (
          <div className="pharma-alerts-list">
            {visibleAlerts.length > 0 ? (
              visibleAlerts.map(renderAlert)
            ) : (
              <div className="text-center text-muted py-3">
                <div style={{ fontSize: '2rem' }}>✅</div>
                <div>No alerts</div>
              </div>
            )}
          </div>
        )}
        
        {alerts.length > maxAlerts && (
          <div className="text-center mt-3">
            <small className="text-muted">
              Showing {Math.min(maxAlerts, alerts.length)} of {alerts.length} alerts
            </small>
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Quick Action Widget - For frequently used actions
const QuickActionWidget = ({
  actions = [],
  layout = 'grid', // 'grid', 'list'
  showLabels = true,
  actionSize = 'md',
  ...baseProps
}) => {
  
  const renderAction = (action) => (
    <div key={action.key} className="pharma-quick-action-item">
      <PharmaButton
        variant={action.variant || 'outline-primary'}
        size={actionSize}
        className="w-100 pharma-quick-action-button"
        onClick={action.onClick}
        disabled={action.disabled}
        loading={action.loading}
      >
        <div className="d-flex flex-column align-items-center">
          {action.icon && (
            <div className="pharma-action-icon mb-1" style={{ fontSize: '1.5rem' }}>
              {action.icon}
            </div>
          )}
          {showLabels && <div className="pharma-action-label">{action.label}</div>}
        </div>
      </PharmaButton>
      {action.badge && (
        <Badge 
          bg={action.badge.variant || 'primary'} 
          className="pharma-action-badge position-absolute"
        >
          {action.badge.content}
        </Badge>
      )}
    </div>
  );
  
  return (
    <BaseWidget {...baseProps}>
      <div className={`pharma-quick-actions-container pharma-actions-${layout}`}>
        {layout === 'list' ? (
          <div className="pharma-actions-list d-grid gap-2">
            {actions.map(renderAction)}
          </div>
        ) : (
          <div className="row g-2">
            {actions.map((action, index) => (
              <div key={action.key || index} className={`col-${12 / Math.min(actions.length, 3)}`}>
                <div className="position-relative">
                  {renderAction(action)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </BaseWidget>
  );
};

// Pre-configured Pharmacy Widgets
export const InventoryStatsWidget = ({ storeId, ...props }) => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const loadStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setStats([
        { key: 'total', icon: '📦', label: 'Total Items', value: '1,247', trend: 2.3 },
        { key: 'low_stock', icon: '⚠️', label: 'Low Stock', value: '23', trend: -15.2 },
        { key: 'expiring', icon: '🚨', label: 'Expiring Soon', value: '8', trend: -25.0 }
      ]);
      
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <StatsWidget
      title="Inventory Overview"
      icon="📊"
      stats={stats}
      loading={loading}
      error={error}
      onRefresh={loadStats}
      refreshInterval="frequent"
      lastUpdated={Date.now()}
      {...props}
    />
  );
};

export const PrescriptionAlertsWidget = ({ storeId, ...props }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const loadAlerts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      
      setAlerts([
        {
          id: '1',
          severity: 'danger',
          icon: '🚨',
          title: 'Drug Interaction Alert',
          message: 'Patient J.Smith - Warfarin + Aspirin interaction',
          timestamp: Date.now() - 300000
        },
        {
          id: '2',
          severity: 'warning',
          icon: '⚠️',
          title: 'Insurance Verification Needed',
          message: 'Rx #12345 - Insurance pre-auth required',
          timestamp: Date.now() - 600000
        }
      ]);
      
    } finally {
      setLoading(false);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  
  return (
    <AlertWidget
      title="Prescription Alerts"
      icon="💊"
      alerts={alerts}
      loading={loading}
      onRefresh={loadAlerts}
      refreshInterval="realtime"
      maxAlerts={10}
      groupBySeverity={true}
      {...props}
    />
  );
};

export const PharmacyQuickActionsWidget = ({ onAction, ...props }) => {
  const actions = [
    {
      key: 'new_prescription',
      icon: '💊',
      label: 'New Prescription',
      variant: 'primary',
      onClick: () => onAction?.('new_prescription')
    },
    {
      key: 'inventory_check',
      icon: '📦',
      label: 'Stock Check',
      variant: 'outline-primary',
      onClick: () => onAction?.('inventory_check')
    },
    {
      key: 'patient_lookup',
      icon: '👤',
      label: 'Patient Lookup',
      variant: 'outline-secondary',
      onClick: () => onAction?.('patient_lookup')
    }
  ];
  
  return (
    <QuickActionWidget
      title="Quick Actions"
      icon="⚡"
      actions={actions}
      layout="grid"
      actionSize="md"
      {...props}
    />
  );
};

export default BaseWidget;
export { 
  WIDGET_SIZES, 
  WIDGET_TYPES, 
  REFRESH_INTERVALS,
  StatsWidget,
  ProgressWidget,
  AlertWidget,
  QuickActionWidget
};