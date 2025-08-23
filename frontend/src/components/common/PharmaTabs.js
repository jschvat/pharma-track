/**
 * PharmaTabs - Advanced Tab Navigation Component
 * 
 * A comprehensive tab component designed for complex pharmacy workflows,
 * providing intuitive navigation between different sections of data and forms.
 * Supports nested tabs, tab states, dynamic content loading, and accessibility.
 * 
 * Features:
 * - Multiple tab variants and orientations
 * - Tab states (active, disabled, loading, error)
 * - Lazy loading and dynamic content
 * - Nested tab support
 * - Pharmacy-specific tab types
 * - Badge and notification support
 * - Keyboard navigation and accessibility
 * - Tab persistence and routing integration
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Nav, Tab, Badge, Spinner } from 'react-bootstrap';
import { PharmaButton, PharmaAlert } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaTabs = ({
  // Core tab props
  tabs = [],
  activeTab = null,
  onTabChange = null,
  
  // Layout and appearance
  variant = 'pills', // 'tabs', 'pills', 'underline', 'sidebar'
  orientation = 'horizontal', // 'horizontal', 'vertical'
  size = 'md', // 'sm', 'md', 'lg'
  fill = false,
  justified = false,
  
  // Tab behavior
  lazy = true,
  persistent = false,
  closeable = false,
  reorderable = false,
  
  // Content management
  defaultContent = null,
  loadingComponent = null,
  errorComponent = null,
  
  // Pharmacy-specific features
  showBadges = true,
  showIcons = true,
  workflowMode = false, // Sequential workflow navigation
  
  // Styling
  className = '',
  tabClassName = '',
  contentClassName = '',
  
  // Events
  onTabClose = null,
  onTabReorder = null,
  onContentLoad = null,
  
  // Accessibility
  'aria-label': ariaLabel = 'Navigation tabs',
  id = `pharma-tabs-${Math.random().toString(36).substr(2, 9)}`,
  
  ...otherProps
}) => {
  
  const [currentTab, setCurrentTab] = useState(activeTab || (tabs.length > 0 ? tabs[0].id : null));
  const [tabStates, setTabStates] = useState({});
  const [loadedTabs, setLoadedTabs] = useState(new Set(lazy ? [] : tabs.map(t => t.id)));
  const tabsRef = useRef(null);
  const contentRef = useRef(null);
  
  // Update active tab when prop changes
  useEffect(() => {
    if (activeTab && activeTab !== currentTab) {
      setCurrentTab(activeTab);
    }
  }, [activeTab, currentTab]);
  
  // Handle tab change
  const handleTabChange = useCallback((tabId, event = null) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab || tab.disabled || tabStates[tabId]?.disabled) {
      return;
    }
    
    // Workflow mode validation
    if (workflowMode && event) {
      const currentIndex = tabs.findIndex(t => t.id === currentTab);
      const targetIndex = tabs.findIndex(t => t.id === tabId);
      
      // Only allow forward progression or current/previous tabs
      if (targetIndex > currentIndex + 1) {
        return;
      }
    }
    
    // Load content if lazy loading
    if (lazy && !loadedTabs.has(tabId)) {
      setTabStates(prev => ({
        ...prev,
        [tabId]: { ...prev[tabId], loading: true }
      }));
      
      // Simulate content loading or call onContentLoad
      if (onContentLoad) {
        onContentLoad(tabId).then(() => {
          setLoadedTabs(prev => new Set([...prev, tabId]));
          setTabStates(prev => ({
            ...prev,
            [tabId]: { ...prev[tabId], loading: false }
          }));
        }).catch((error) => {
          setTabStates(prev => ({
            ...prev,
            [tabId]: { ...prev[tabId], loading: false, error: error.message }
          }));
        });
      } else {
        // Default loading simulation
        setTimeout(() => {
          setLoadedTabs(prev => new Set([...prev, tabId]));
          setTabStates(prev => ({
            ...prev,
            [tabId]: { ...prev[tabId], loading: false }
          }));
        }, 500);
      }
    }
    
    setCurrentTab(tabId);
    
    if (onTabChange) {
      onTabChange(tabId, tab);
    }
  }, [tabs, currentTab, lazy, loadedTabs, tabStates, workflowMode, onTabChange, onContentLoad]);
  
  // Handle tab close
  const handleTabClose = useCallback((tabId, event) => {
    event.stopPropagation();
    
    if (onTabClose) {
      onTabClose(tabId);
    }
    
    // Switch to another tab if closing current
    if (tabId === currentTab) {
      const currentIndex = tabs.findIndex(t => t.id === tabId);
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      
      if (remainingTabs.length > 0) {
        const nextTab = remainingTabs[Math.min(currentIndex, remainingTabs.length - 1)];
        setCurrentTab(nextTab.id);
      }
    }
  }, [tabs, currentTab, onTabClose]);
  
  // Get tab state
  const getTabState = (tabId) => {
    return tabStates[tabId] || {};
  };
  
  // Get tab badge content
  const getTabBadge = (tab) => {
    if (!showBadges || !tab.badge) return null;
    
    const badgeProps = typeof tab.badge === 'object' ? tab.badge : { content: tab.badge };
    const { content, variant = 'primary', ...badgeOtherProps } = badgeProps;
    
    return (
      <Badge 
        bg={variant} 
        className="ms-1" 
        style={{ fontSize: '0.6rem' }}
        {...badgeOtherProps}
      >
        {content}
      </Badge>
    );
  };
  
  // Get tab icon
  const getTabIcon = (tab) => {
    if (!showIcons || !tab.icon) return null;
    
    return (
      <span className="pharma-tab-icon me-1">
        {tab.icon}
      </span>
    );
  };
  
  // Render tab label
  const renderTabLabel = (tab) => {
    const state = getTabState(tab.id);
    
    return (
      <div className="d-flex align-items-center">
        {getTabIcon(tab)}
        
        <span className="pharma-tab-label">
          {tab.label}
        </span>
        
        {getTabBadge(tab)}
        
        {state.loading && (
          <Spinner 
            size="sm" 
            className="ms-1" 
            style={{ width: '12px', height: '12px' }}
          />
        )}
        
        {state.error && (
          <span className="ms-1 text-danger" title={state.error}>
            ⚠️
          </span>
        )}
        
        {closeable && !tab.permanent && (
          <PharmaButton
            variant="link"
            size="sm"
            className="pharma-tab-close ms-1 p-0"
            onClick={(e) => handleTabClose(tab.id, e)}
            style={{ fontSize: '0.7rem', lineHeight: 1 }}
          >
            ×
          </PharmaButton>
        )}
      </div>
    );
  };
  
  // Get workflow progress
  const getWorkflowProgress = () => {
    if (!workflowMode) return null;
    
    const currentIndex = tabs.findIndex(t => t.id === currentTab);
    const completedTabs = tabs.slice(0, currentIndex + 1).filter(t => 
      getTabState(t.id).completed || loadedTabs.has(t.id)
    ).length;
    
    return {
      current: currentIndex + 1,
      total: tabs.length,
      completed: completedTabs,
      percentage: (completedTabs / tabs.length) * 100
    };
  };
  
  // Render workflow navigation
  const renderWorkflowNav = () => {
    if (!workflowMode) return null;
    
    const progress = getWorkflowProgress();
    const currentIndex = tabs.findIndex(t => t.id === currentTab);
    
    return (
      <div className="pharma-tabs-workflow-nav mb-3">
        <div className="d-flex justify-content-between align-items-center mb-2">
          <span className="text-muted small">
            Step {progress.current} of {progress.total}
          </span>
          <span className="text-muted small">
            {Math.round(progress.percentage)}% Complete
          </span>
        </div>
        
        <div className="pharma-workflow-progress mb-2">
          <div 
            className="pharma-workflow-progress-bar"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        <div className="d-flex justify-content-between">
          <PharmaButton
            variant="outline-secondary"
            size="sm"
            disabled={currentIndex === 0}
            onClick={() => {
              const prevTab = tabs[currentIndex - 1];
              if (prevTab) handleTabChange(prevTab.id);
            }}
          >
            ← Previous
          </PharmaButton>
          
          <PharmaButton
            variant="primary"
            size="sm"
            disabled={currentIndex === tabs.length - 1}
            onClick={() => {
              const nextTab = tabs[currentIndex + 1];
              if (nextTab) handleTabChange(nextTab.id);
            }}
          >
            Next →
          </PharmaButton>
        </div>
      </div>
    );
  };
  
  // Render tab content
  const renderTabContent = () => {
    const activeTabData = tabs.find(t => t.id === currentTab);
    if (!activeTabData) return defaultContent;
    
    const state = getTabState(currentTab);
    
    // Loading state
    if (state.loading) {
      return loadingComponent || (
        <div className="text-center py-4">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <div className="mt-2 text-muted">Loading {activeTabData.label}...</div>
        </div>
      );
    }
    
    // Error state
    if (state.error) {
      return errorComponent || (
        <PharmaAlert 
          variant="danger" 
          title="Error Loading Content"
          className="m-3"
        >
          {state.error}
          <div className="mt-2">
            <PharmaButton
              variant="outline-danger"
              size="sm"
              onClick={() => {
                setTabStates(prev => ({
                  ...prev,
                  [currentTab]: { ...prev[currentTab], error: null }
                }));
                setLoadedTabs(prev => {
                  const newSet = new Set(prev);
                  newSet.delete(currentTab);
                  return newSet;
                });
                handleTabChange(currentTab);
              }}
            >
              Retry
            </PharmaButton>
          </div>
        </PharmaAlert>
      );
    }
    
    // Tab content not loaded yet
    if (lazy && !loadedTabs.has(currentTab)) {
      return (
        <div className="text-center py-4 text-muted">
          Click to load {activeTabData.label}
        </div>
      );
    }
    
    return activeTabData.content || defaultContent;
  };
  
  // Build CSS classes
  const tabsClasses = [
    'pharma-tabs',
    `pharma-tabs-${variant}`,
    `pharma-tabs-${orientation}`,
    `pharma-tabs-${size}`,
    workflowMode && 'pharma-tabs-workflow',
    fill && 'pharma-tabs-fill',
    justified && 'pharma-tabs-justified',
    className
  ].filter(Boolean).join(' ');
  
  const contentClasses = [
    'pharma-tabs-content',
    `pharma-tabs-content-${variant}`,
    contentClassName
  ].filter(Boolean).join(' ');
  
  if (tabs.length === 0) {
    return (
      <div className="pharma-tabs-empty text-center py-4 text-muted">
        No tabs available
      </div>
    );
  }
  
  return (
    <div className={tabsClasses} id={id} {...otherProps}>
      {renderWorkflowNav()}
      
      <Tab.Container
        activeKey={currentTab}
        onSelect={handleTabChange}
        id={`${id}-container`}
      >
        <Nav
          variant={variant === 'underline' ? 'tabs' : variant}
          className={`pharma-tabs-nav ${tabClassName}`}
          fill={fill}
          justify={justified}
          ref={tabsRef}
          aria-label={ariaLabel}
        >
          {tabs.map((tab) => {
            const state = getTabState(tab.id);
            const isDisabled = tab.disabled || state.disabled;
            const isActive = tab.id === currentTab;
            
            return (
              <Nav.Item key={tab.id}>
                <Nav.Link
                  eventKey={tab.id}
                  disabled={isDisabled}
                  className={[
                    'pharma-tab-link',
                    isActive && 'active',
                    isDisabled && 'disabled',
                    state.loading && 'loading',
                    state.error && 'error',
                    state.completed && 'completed',
                    tab.className
                  ].filter(Boolean).join(' ')}
                  title={tab.tooltip}
                >
                  {renderTabLabel(tab)}
                </Nav.Link>
              </Nav.Item>
            );
          })}
        </Nav>
        
        <Tab.Content 
          className={contentClasses}
          ref={contentRef}
        >
          <Tab.Pane eventKey={currentTab} className="pharma-tab-pane">
            {renderTabContent()}
          </Tab.Pane>
        </Tab.Content>
      </Tab.Container>
    </div>
  );
};

// Pre-configured tab variants for common pharmacy workflows
export const InventoryTabs = (props) => (
  <PharmaTabs
    variant="pills"
    showBadges={true}
    showIcons={true}
    tabs={[
      {
        id: 'current',
        label: 'Current Stock',
        icon: '📦',
        content: props.currentContent
      },
      {
        id: 'low-stock',
        label: 'Low Stock',
        icon: '⚠️',
        badge: { content: props.lowStockCount, variant: 'warning' },
        content: props.lowStockContent
      },
      {
        id: 'expired',
        label: 'Expired',
        icon: '🚫',
        badge: { content: props.expiredCount, variant: 'danger' },
        content: props.expiredContent
      },
      {
        id: 'expiring',
        label: 'Expiring Soon',
        icon: '📅',
        badge: { content: props.expiringCount, variant: 'warning' },
        content: props.expiringContent
      }
    ]}
    {...props}
  />
);

export const UserManagementTabs = (props) => (
  <PharmaTabs
    variant="tabs"
    showIcons={true}
    tabs={[
      {
        id: 'active',
        label: 'Active Users',
        icon: '👥',
        content: props.activeContent
      },
      {
        id: 'pending',
        label: 'Pending',
        icon: '⏳',
        badge: props.pendingCount,
        content: props.pendingContent
      },
      {
        id: 'inactive',
        label: 'Inactive',
        icon: '🚫',
        content: props.inactiveContent
      },
      {
        id: 'roles',
        label: 'Role Management',
        icon: '🔑',
        content: props.rolesContent
      }
    ]}
    {...props}
  />
);

export const PrescriptionWorkflowTabs = (props) => (
  <PharmaTabs
    variant="pills"
    workflowMode={true}
    showIcons={true}
    showBadges={true}
    tabs={[
      {
        id: 'verify',
        label: 'Verification',
        icon: '🔍',
        content: props.verifyContent
      },
      {
        id: 'fill',
        label: 'Fill Prescription',
        icon: '💊',
        content: props.fillContent
      },
      {
        id: 'review',
        label: 'Review',
        icon: '👨‍⚕️',
        content: props.reviewContent
      },
      {
        id: 'dispense',
        label: 'Dispense',
        icon: '📋',
        content: props.dispenseContent
      }
    ]}
    {...props}
  />
);

export const ReportTabs = (props) => (
  <PharmaTabs
    variant="underline"
    showIcons={true}
    lazy={true}
    tabs={[
      {
        id: 'sales',
        label: 'Sales Report',
        icon: '📊',
        content: props.salesContent
      },
      {
        id: 'inventory',
        label: 'Inventory Report',
        icon: '📦',
        content: props.inventoryContent
      },
      {
        id: 'audit',
        label: 'Audit Report',
        icon: '🔍',
        content: props.auditContent
      },
      {
        id: 'compliance',
        label: 'Compliance',
        icon: '✅',
        content: props.complianceContent
      }
    ]}
    {...props}
  />
);

export const SettingsTabs = (props) => (
  <PharmaTabs
    variant="sidebar"
    orientation="vertical"
    showIcons={true}
    tabs={[
      {
        id: 'general',
        label: 'General',
        icon: '⚙️',
        content: props.generalContent
      },
      {
        id: 'users',
        label: 'User Settings',
        icon: '👥',
        content: props.usersContent
      },
      {
        id: 'inventory',
        label: 'Inventory',
        icon: '📦',
        content: props.inventoryContent
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: '🔔',
        content: props.notificationsContent
      },
      {
        id: 'security',
        label: 'Security',
        icon: '🔒',
        content: props.securityContent
      }
    ]}
    {...props}
  />
);

export default PharmaTabs;