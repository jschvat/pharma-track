/**
 * PharmaNotificationSystem - Advanced Notification Management
 * 
 * A comprehensive notification system designed for pharmacy operations
 * with support for multiple notification types, priorities, persistence,
 * and pharmacy-specific alert patterns.
 * 
 * Features:
 * - Multiple notification types and priorities
 * - Toast notifications with auto-dismiss
 * - Persistent notification center
 * - Real-time updates and WebSocket support
 * - Pharmacy-specific notification templates
 * - Sound alerts and desktop notifications
 * - Notification grouping and filtering
 * - Action buttons and callbacks
 * - Accessibility and screen reader support
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useCallback, useEffect, useRef, createContext, useContext } from 'react';
import { Toast, ToastContainer, Badge, Button, Offcanvas, ListGroup, Form } from 'react-bootstrap';
import { PharmaButton, PharmaCard, PharmaAlert, PharmaProgressBar } from './PharmaComponents';
import '../../css/pharma-components.css';

// Notification Context
const NotificationContext = createContext();

// Notification types and configurations
const NOTIFICATION_TYPES = {
  info: {
    icon: 'ℹ️',
    variant: 'info',
    sound: null,
    defaultDuration: 5000
  },
  success: {
    icon: '✅',
    variant: 'success',
    sound: 'success',
    defaultDuration: 4000
  },
  warning: {
    icon: '⚠️',
    variant: 'warning',
    sound: 'warning',
    defaultDuration: 7000
  },
  error: {
    icon: '❌',
    variant: 'danger',
    sound: 'error',
    defaultDuration: 0 // Don't auto-dismiss errors
  },
  prescription: {
    icon: '💊',
    variant: 'primary',
    sound: 'prescription',
    defaultDuration: 6000
  },
  inventory: {
    icon: '📦',
    variant: 'warning',
    sound: 'inventory',
    defaultDuration: 8000
  },
  expiration: {
    icon: '📅',
    variant: 'danger',
    sound: 'urgent',
    defaultDuration: 0 // Critical - don't auto-dismiss
  },
  system: {
    icon: '🔧',
    variant: 'secondary',
    sound: null,
    defaultDuration: 5000
  }
};

// Priority levels
const PRIORITY_LEVELS = {
  low: { order: 1, badge: 'secondary' },
  normal: { order: 2, badge: 'primary' },
  high: { order: 3, badge: 'warning' },
  urgent: { order: 4, badge: 'danger' }
};

// Notification Provider Component
export const NotificationProvider = ({ children, enableSounds = true, enableDesktop = true }) => {
  const [notifications, setNotifications] = useState([]);
  const [showCenter, setShowCenter] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(enableSounds);
  const [desktopEnabled, setDesktopEnabled] = useState(enableDesktop);
  const [filters, setFilters] = useState({ type: 'all', priority: 'all', read: 'all' });
  
  const notificationIdCounter = useRef(0);
  const soundsRef = useRef({});
  const webSocketRef = useRef(null);
  
  // Initialize sounds
  useEffect(() => {
    if (soundEnabled) {
      soundsRef.current = {
        success: new Audio('/sounds/success.mp3'),
        warning: new Audio('/sounds/warning.mp3'),
        error: new Audio('/sounds/error.mp3'),
        prescription: new Audio('/sounds/prescription.mp3'),
        inventory: new Audio('/sounds/inventory.mp3'),
        urgent: new Audio('/sounds/urgent.mp3')
      };
    }
  }, [soundEnabled]);
  
  // Request desktop notification permission
  useEffect(() => {
    if (desktopEnabled && 'Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, [desktopEnabled]);
  
  // Play notification sound
  const playSound = useCallback((soundType) => {
    if (soundEnabled && soundsRef.current[soundType]) {
      soundsRef.current[soundType].play().catch(console.warn);
    }
  }, [soundEnabled]);
  
  // Show desktop notification
  const showDesktopNotification = useCallback((notification) => {
    if (desktopEnabled && 'Notification' in window && Notification.permission === 'granted') {
      const desktopNotif = new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id
      });
      
      desktopNotif.onclick = () => {
        window.focus();
        if (notification.onClick) {
          notification.onClick(notification);
        }
      };
      
      setTimeout(() => desktopNotif.close(), notification.duration || 5000);
    }
  }, [desktopEnabled]);
  
  // Add notification
  const addNotification = useCallback((notificationData) => {
    const id = `notif-${++notificationIdCounter.current}-${Date.now()}`;
    const type = notificationData.type || 'info';
    const config = NOTIFICATION_TYPES[type] || NOTIFICATION_TYPES.info;
    
    const notification = {
      id,
      type,
      title: notificationData.title || 'Notification',
      message: notificationData.message || '',
      priority: notificationData.priority || 'normal',
      duration: notificationData.duration !== undefined ? notificationData.duration : config.defaultDuration,
      persistent: notificationData.persistent || false,
      read: false,
      timestamp: new Date(),
      icon: notificationData.icon || config.icon,
      variant: config.variant,
      actions: notificationData.actions || [],
      onClick: notificationData.onClick,
      onClose: notificationData.onClose,
      data: notificationData.data || {},
      category: notificationData.category || 'general'
    };
    
    setNotifications(prev => [notification, ...prev]);
    
    // Play sound
    if (config.sound) {
      playSound(config.sound);
    }
    
    // Show desktop notification
    if (!notification.persistent) {
      showDesktopNotification(notification);
    }
    
    // Auto-dismiss if duration is set
    if (notification.duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
    
    return id;
  }, [playSound, showDesktopNotification]);
  
  // Remove notification
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);
  
  // Mark notification as read
  const markAsRead = useCallback((id) => {
    setNotifications(prev => prev.map(n => 
      n.id === id ? { ...n, read: true } : n
    ));
  }, []);
  
  // Mark all as read
  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);
  
  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);
  
  // Clear read notifications
  const clearRead = useCallback(() => {
    setNotifications(prev => prev.filter(n => !n.read));
  }, []);
  
  // Filter notifications
  const filteredNotifications = notifications.filter(notification => {
    if (filters.type !== 'all' && notification.type !== filters.type) return false;
    if (filters.priority !== 'all' && notification.priority !== filters.priority) return false;
    if (filters.read === 'unread' && notification.read) return false;
    if (filters.read === 'read' && !notification.read) return false;
    return true;
  });
  
  // Get unread count
  const unreadCount = notifications.filter(n => !n.read).length;
  
  // Pharmacy-specific notification helpers
  const showPrescriptionAlert = useCallback((prescriptionData) => {
    return addNotification({
      type: 'prescription',
      title: 'Prescription Alert',
      message: `Prescription ${prescriptionData.number} requires attention`,
      priority: 'high',
      data: prescriptionData,
      actions: [
        {
          label: 'View Prescription',
          onClick: () => console.log('View prescription', prescriptionData)
        }
      ]
    });
  }, [addNotification]);
  
  const showInventoryAlert = useCallback((inventoryData) => {
    return addNotification({
      type: 'inventory',
      title: 'Inventory Alert',
      message: `${inventoryData.drugName} is running low (${inventoryData.quantity} remaining)`,
      priority: inventoryData.quantity === 0 ? 'urgent' : 'high',
      data: inventoryData,
      actions: [
        {
          label: 'Reorder',
          onClick: () => console.log('Reorder', inventoryData)
        },
        {
          label: 'View Inventory',
          onClick: () => console.log('View inventory', inventoryData)
        }
      ]
    });
  }, [addNotification]);
  
  const showExpirationAlert = useCallback((expirationData) => {
    return addNotification({
      type: 'expiration',
      title: 'Expiration Alert',
      message: `${expirationData.drugName} expires in ${expirationData.daysUntil} days`,
      priority: expirationData.daysUntil <= 7 ? 'urgent' : 'high',
      persistent: expirationData.daysUntil <= 7,
      data: expirationData,
      actions: [
        {
          label: 'Mark for Disposal',
          onClick: () => console.log('Mark for disposal', expirationData)
        },
        {
          label: 'View Details',
          onClick: () => console.log('View expiration details', expirationData)
        }
      ]
    });
  }, [addNotification]);
  
  const contextValue = {
    notifications,
    filteredNotifications,
    unreadCount,
    showCenter,
    setShowCenter,
    soundEnabled,
    setSoundEnabled,
    desktopEnabled,
    setDesktopEnabled,
    filters,
    setFilters,
    addNotification,
    removeNotification,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    // Pharmacy-specific helpers
    showPrescriptionAlert,
    showInventoryAlert,
    showExpirationAlert
  };
  
  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
      <NotificationToastContainer />
      <NotificationCenter />
    </NotificationContext.Provider>
  );
};

// Toast Container Component
const NotificationToastContainer = () => {
  const { notifications, removeNotification, markAsRead } = useContext(NotificationContext);
  
  const toastNotifications = notifications
    .filter(n => !n.persistent)
    .sort((a, b) => PRIORITY_LEVELS[b.priority].order - PRIORITY_LEVELS[a.priority].order)
    .slice(0, 5); // Show max 5 toasts
  
  return (
    <ToastContainer position="top-end" className="pharma-toast-container">
      {toastNotifications.map(notification => (
        <NotificationToast
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
          onShow={() => markAsRead(notification.id)}
        />
      ))}
    </ToastContainer>
  );
};

// Individual Toast Component
const NotificationToast = ({ notification, onClose, onShow }) => {
  const [show, setShow] = useState(true);
  
  const handleClose = useCallback(() => {
    setShow(false);
    setTimeout(onClose, 300); // Allow animation to complete
  }, [onClose]);
  
  const handleClick = useCallback(() => {
    if (notification.onClick) {
      notification.onClick(notification);
    }
    onShow();
  }, [notification, onShow]);
  
  useEffect(() => {
    onShow();
  }, [onShow]);
  
  return (
    <Toast 
      show={show} 
      onClose={handleClose}
      className={`pharma-notification-toast pharma-notification-${notification.type}`}
      onClick={handleClick}
    >
      <Toast.Header closeButton={true}>
        <span className="me-2">{notification.icon}</span>
        <strong className="me-auto">{notification.title}</strong>
        <Badge bg={PRIORITY_LEVELS[notification.priority].badge} className="me-2">
          {notification.priority}
        </Badge>
        <small className="text-muted">
          {notification.timestamp.toLocaleTimeString()}
        </small>
      </Toast.Header>
      
      <Toast.Body>
        {notification.message}
        
        {notification.actions.length > 0 && (
          <div className="pharma-notification-actions mt-2">
            {notification.actions.map((action, index) => (
              <PharmaButton
                key={index}
                variant="outline-primary"
                size="sm"
                className="me-2"
                onClick={(e) => {
                  e.stopPropagation();
                  action.onClick(notification);
                }}
              >
                {action.label}
              </PharmaButton>
            ))}
          </div>
        )}
      </Toast.Body>
    </Toast>
  );
};

// Notification Center Component
const NotificationCenter = () => {
  const {
    showCenter,
    setShowCenter,
    filteredNotifications,
    unreadCount,
    filters,
    setFilters,
    markAsRead,
    markAllAsRead,
    clearAll,
    clearRead,
    removeNotification
  } = useContext(NotificationContext);
  
  const renderNotificationItem = (notification) => (
    <ListGroup.Item
      key={notification.id}
      className={`pharma-notification-item ${!notification.read ? 'unread' : ''}`}
      onClick={() => {
        markAsRead(notification.id);
        if (notification.onClick) {
          notification.onClick(notification);
        }
      }}
    >
      <div className="d-flex align-items-start">
        <div className="pharma-notification-icon me-3">
          {notification.icon}
        </div>
        
        <div className="flex-grow-1">
          <div className="d-flex justify-content-between align-items-start">
            <h6 className="pharma-notification-title mb-1">
              {notification.title}
              {!notification.read && <Badge bg="primary" className="ms-2">New</Badge>}
            </h6>
            
            <div className="pharma-notification-meta">
              <Badge bg={PRIORITY_LEVELS[notification.priority].badge} className="me-2">
                {notification.priority}
              </Badge>
              <small className="text-muted">
                {notification.timestamp.toLocaleString()}
              </small>
            </div>
          </div>
          
          <p className="pharma-notification-message mb-2">
            {notification.message}
          </p>
          
          {notification.actions.length > 0 && (
            <div className="pharma-notification-actions">
              {notification.actions.map((action, index) => (
                <PharmaButton
                  key={index}
                  variant="outline-primary"
                  size="sm"
                  className="me-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    action.onClick(notification);
                  }}
                >
                  {action.label}
                </PharmaButton>
              ))}
            </div>
          )}
        </div>
        
        <PharmaButton
          variant="outline-danger"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            removeNotification(notification.id);
          }}
        >
          ×
        </PharmaButton>
      </div>
    </ListGroup.Item>
  );
  
  return (
    <Offcanvas 
      show={showCenter} 
      onHide={() => setShowCenter(false)}
      placement="end"
      className="pharma-notification-center"
    >
      <Offcanvas.Header closeButton>
        <Offcanvas.Title>
          Notifications
          {unreadCount > 0 && (
            <Badge bg="primary" className="ms-2">{unreadCount}</Badge>
          )}
        </Offcanvas.Title>
      </Offcanvas.Header>
      
      <Offcanvas.Body>
        {/* Filters */}
        <PharmaCard title="Filters" className="mb-3">
          <div className="row g-2">
            <div className="col-md-4">
              <Form.Select
                size="sm"
                value={filters.type}
                onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value }))}
              >
                <option value="all">All Types</option>
                {Object.keys(NOTIFICATION_TYPES).map(type => (
                  <option key={type} value={type}>
                    {NOTIFICATION_TYPES[type].icon} {type}
                  </option>
                ))}
              </Form.Select>
            </div>
            
            <div className="col-md-4">
              <Form.Select
                size="sm"
                value={filters.priority}
                onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value }))}
              >
                <option value="all">All Priorities</option>
                {Object.keys(PRIORITY_LEVELS).map(priority => (
                  <option key={priority} value={priority}>
                    {priority}
                  </option>
                ))}
              </Form.Select>
            </div>
            
            <div className="col-md-4">
              <Form.Select
                size="sm"
                value={filters.read}
                onChange={(e) => setFilters(prev => ({ ...prev, read: e.target.value }))}
              >
                <option value="all">All</option>
                <option value="unread">Unread</option>
                <option value="read">Read</option>
              </Form.Select>
            </div>
          </div>
        </PharmaCard>
        
        {/* Actions */}
        <div className="d-flex justify-content-between mb-3">
          <div>
            <PharmaButton
              variant="outline-primary"
              size="sm"
              onClick={markAllAsRead}
              disabled={unreadCount === 0}
            >
              Mark All Read
            </PharmaButton>
          </div>
          
          <div>
            <PharmaButton
              variant="outline-secondary"
              size="sm"
              onClick={clearRead}
              className="me-2"
            >
              Clear Read
            </PharmaButton>
            <PharmaButton
              variant="outline-danger"
              size="sm"
              onClick={clearAll}
            >
              Clear All
            </PharmaButton>
          </div>
        </div>
        
        {/* Notifications List */}
        {filteredNotifications.length > 0 ? (
          <ListGroup variant="flush">
            {filteredNotifications.map(renderNotificationItem)}
          </ListGroup>
        ) : (
          <div className="text-center py-4 text-muted">
            <div style={{ fontSize: '3rem' }}>🔔</div>
            <div className="mt-2">No notifications to display</div>
          </div>
        )}
      </Offcanvas.Body>
    </Offcanvas>
  );
};

// Notification Bell Component
export const NotificationBell = ({ className = '' }) => {
  const { unreadCount, setShowCenter } = useContext(NotificationContext);
  
  return (
    <PharmaButton
      variant="outline-secondary"
      className={`pharma-notification-bell ${className}`}
      onClick={() => setShowCenter(true)}
    >
      🔔
      {unreadCount > 0 && (
        <Badge bg="danger" className="pharma-notification-badge">
          {unreadCount > 99 ? '99+' : unreadCount}
        </Badge>
      )}
    </PharmaButton>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return context;
};

export default NotificationProvider;