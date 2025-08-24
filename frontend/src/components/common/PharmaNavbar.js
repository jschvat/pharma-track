/**
 * PharmaNavbar - Pharmacy-Themed Navigation Bar Component
 * 
 * Enhanced Bootstrap Navbar with pharmacy-specific branding and theming.
 * Features pill/capsule/tablet design elements and pharmacy-specific
 * navigation patterns optimized for healthcare workflows.
 * 
 * Features:
 * - Pharmacy-themed branding with pill/capsule elements
 * - Healthcare-optimized navigation patterns
 * - User role-based navigation items
 * - Prescription and inventory quick access
 * - Real-time notifications integration
 * - Mobile-responsive design
 * 
 * @component
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState } from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge, Button, Form, InputGroup } from 'react-bootstrap';
import { PharmaBadge, PharmaSpinner } from './PharmaComponents';
import '../../css/pharma-components.css';

const PharmaNavbar = ({
  // Branding
  brand = 'PharmaTraK',
  brandLogo = null,
  pharmaTheme = 'capsule', // 'pill', 'capsule', 'tablet'
  
  // User information
  user = null,
  userRole = 'staff',
  
  // Navigation items
  navItems = [],
  rightNavItems = [],
  
  // Search functionality
  searchable = true,
  searchPlaceholder = 'Search drugs, patients, prescriptions...',
  onSearch = null,
  
  // Notifications
  notifications = [],
  unreadCount = 0,
  onNotificationClick = null,
  
  // Quick actions
  quickActions = [],
  
  // Events
  onBrandClick = null,
  onUserMenuClick = null,
  onLogout = null,
  
  // Styling
  variant = 'dark', // 'light', 'dark', 'primary'
  fixed = 'top', // 'top', 'bottom', null
  expand = 'lg',
  className = '',
  
  // Loading states
  loading = false,
  
  ...otherProps
}) => {
  
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  // Build CSS classes
  const navbarClasses = [
    'pharma-navbar',
    `pharma-navbar-${pharmaTheme}`,
    variant !== 'light' ? 'navbar-dark' : 'navbar-light',
    className
  ].filter(Boolean).join(' ');
  
  // Handle search submission
  const handleSearch = (e) => {
    e.preventDefault();
    if (onSearch && searchQuery.trim()) {
      onSearch(searchQuery.trim());
    }
  };
  
  // Render brand with pharmacy theming
  const renderBrand = () => (
    <Navbar.Brand 
      href="#" 
      onClick={onBrandClick}
      className="pharma-navbar-brand d-flex align-items-center"
    >
      {brandLogo ? (
        <img src={brandLogo} alt={brand} className="pharma-brand-logo me-2" />
      ) : (
        <div className={`pharma-brand-icon pharma-brand-${pharmaTheme} me-2`}>
          {pharmaTheme === 'pill' && <span className="pharma-icon-pill">💊</span>}
          {pharmaTheme === 'capsule' && <span className="pharma-icon-capsule">💊</span>}
          {pharmaTheme === 'tablet' && <span className="pharma-icon-tablet">⚪</span>}
        </div>
      )}
      <span className="pharma-brand-text">{brand}</span>
      {loading && <PharmaSpinner animation="pill" size="sm" className="ms-2" />}
    </Navbar.Brand>
  );
  
  // Render search bar
  const renderSearch = () => {
    if (!searchable) return null;
    
    return (
      <Form onSubmit={handleSearch} className="pharma-navbar-search d-flex">
        <InputGroup>
          <Form.Control
            type="search"
            placeholder={searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pharma-search-input"
          />
          <Button variant="outline-light" type="submit" className="pharma-search-btn">
            <i className="fas fa-search"></i>
          </Button>
        </InputGroup>
      </Form>
    );
  };
  
  // Render notifications dropdown
  const renderNotifications = () => {
    if (!notifications.length && !unreadCount) return null;
    
    return (
      <NavDropdown
        title={
          <span className="pharma-notification-bell">
            <i className="fas fa-bell"></i>
            {unreadCount > 0 && (
              <PharmaBadge 
                variant="danger" 
                pharmaType="pill" 
                size="sm" 
                className="pharma-notification-badge"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </PharmaBadge>
            )}
          </span>
        }
        id="pharma-notifications-dropdown"
        className="pharma-notifications"
      >
        {notifications.length > 0 ? (
          notifications.slice(0, 5).map((notification, index) => (
            <NavDropdown.Item
              key={index}
              onClick={() => onNotificationClick && onNotificationClick(notification)}
              className="pharma-notification-item"
            >
              <div className="pharma-notification-content">
                <small className="pharma-notification-title">{notification.title}</small>
                <div className="pharma-notification-message">{notification.message}</div>
                {notification.time && (
                  <small className="text-muted">{notification.time}</small>
                )}
              </div>
            </NavDropdown.Item>
          ))
        ) : (
          <NavDropdown.Item disabled>No new notifications</NavDropdown.Item>
        )}
        <NavDropdown.Divider />
        <NavDropdown.Item className="text-center">
          <small>View All Notifications</small>
        </NavDropdown.Item>
      </NavDropdown>
    );
  };
  
  // Render quick actions
  const renderQuickActions = () => {
    if (!quickActions.length) return null;
    
    return (
      <Nav className="pharma-quick-actions">
        {quickActions.map((action, index) => (
          <Nav.Link
            key={index}
            onClick={action.onClick}
            className="pharma-quick-action"
            title={action.tooltip}
          >
            <i className={action.icon}></i>
            {action.badge && (
              <PharmaBadge variant={action.badge.variant} size="sm" className="ms-1">
                {action.badge.text}
              </PharmaBadge>
            )}
          </Nav.Link>
        ))}
      </Nav>
    );
  };
  
  // Render user menu
  const renderUserMenu = () => {
    if (!user) return null;
    
    return (
      <NavDropdown
        title={
          <span className="pharma-user-menu">
            <i className="fas fa-user-circle me-1"></i>
            {user.name || user.email}
            <PharmaBadge variant="secondary" size="sm" className="ms-2">
              {userRole}
            </PharmaBadge>
          </span>
        }
        id="pharma-user-dropdown"
        className="pharma-user-dropdown"
        align="end"
      >
        <NavDropdown.Item onClick={() => onUserMenuClick && onUserMenuClick('profile')}>
          <i className="fas fa-user me-2"></i>Profile
        </NavDropdown.Item>
        <NavDropdown.Item onClick={() => onUserMenuClick && onUserMenuClick('settings')}>
          <i className="fas fa-cog me-2"></i>Settings
        </NavDropdown.Item>
        <NavDropdown.Divider />
        <NavDropdown.Item onClick={onLogout} className="text-danger">
          <i className="fas fa-sign-out-alt me-2"></i>Logout
        </NavDropdown.Item>
      </NavDropdown>
    );
  };
  
  return (
    <Navbar
      variant={variant}
      expand={expand}
      fixed={fixed}
      className={navbarClasses}
      {...otherProps}
    >
      <Container fluid>
        {renderBrand()}
        
        <Navbar.Toggle aria-controls="pharma-navbar-nav" />
        
        <Navbar.Collapse id="pharma-navbar-nav">
          {/* Main navigation items */}
          <Nav className="me-auto pharma-nav-main">
            {navItems.map((item, index) => (
              item.dropdown ? (
                <NavDropdown
                  key={index}
                  title={item.title}
                  id={`pharma-nav-dropdown-${index}`}
                  className="pharma-nav-dropdown"
                >
                  {item.items.map((subItem, subIndex) => (
                    <NavDropdown.Item
                      key={subIndex}
                      onClick={subItem.onClick}
                      href={subItem.href}
                      className="pharma-dropdown-item"
                    >
                      {subItem.icon && <i className={`${subItem.icon} me-2`}></i>}
                      {subItem.title}
                      {subItem.badge && (
                        <PharmaBadge 
                          variant={subItem.badge.variant} 
                          size="sm" 
                          className="ms-2"
                        >
                          {subItem.badge.text}
                        </PharmaBadge>
                      )}
                    </NavDropdown.Item>
                  ))}
                </NavDropdown>
              ) : (
                <Nav.Link
                  key={index}
                  onClick={item.onClick}
                  href={item.href}
                  className="pharma-nav-link"
                >
                  {item.icon && <i className={`${item.icon} me-1`}></i>}
                  {item.title}
                  {item.badge && (
                    <PharmaBadge 
                      variant={item.badge.variant} 
                      size="sm" 
                      className="ms-2"
                    >
                      {item.badge.text}
                    </PharmaBadge>
                  )}
                </Nav.Link>
              )
            ))}
          </Nav>
          
          {/* Search bar */}
          {searchable && (
            <div className="pharma-navbar-search-container me-3">
              {renderSearch()}
            </div>
          )}
          
          {/* Right side items */}
          <Nav className="pharma-nav-right">
            {renderQuickActions()}
            {renderNotifications()}
            {rightNavItems.map((item, index) => (
              <Nav.Link key={index} onClick={item.onClick} href={item.href}>
                {item.icon && <i className={`${item.icon} me-1`}></i>}
                {item.title}
              </Nav.Link>
            ))}
            {renderUserMenu()}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

// Specialized navbar components
export const PharmacyNavbar = ({ ...props }) => (
  <PharmaNavbar
    pharmaTheme="capsule"
    navItems={[
      {
        title: 'Dashboard',
        icon: 'fas fa-tachometer-alt',
        href: '/dashboard'
      },
      {
        title: 'Inventory',
        icon: 'fas fa-boxes',
        dropdown: true,
        items: [
          { title: 'View Inventory', icon: 'fas fa-list', href: '/inventory' },
          { title: 'Add Stock', icon: 'fas fa-plus', href: '/inventory/add' },
          { title: 'Low Stock', icon: 'fas fa-exclamation-triangle', href: '/inventory/low-stock' }
        ]
      },
      {
        title: 'Prescriptions',
        icon: 'fas fa-prescription',
        href: '/prescriptions'
      },
      {
        title: 'Reports',
        icon: 'fas fa-chart-bar',
        href: '/reports'
      }
    ]}
    quickActions={[
      {
        icon: 'fas fa-plus-circle',
        tooltip: 'Quick Add Prescription',
        onClick: () => console.log('Quick add prescription')
      },
      {
        icon: 'fas fa-barcode',
        tooltip: 'Scan Barcode',
        onClick: () => console.log('Scan barcode')
      }
    ]}
    {...props}
  />
);

export const AdminNavbar = ({ ...props }) => (
  <PharmaNavbar
    pharmaTheme="tablet"
    variant="dark"
    navItems={[
      { title: 'Dashboard', icon: 'fas fa-tachometer-alt', href: '/admin' },
      { title: 'Users', icon: 'fas fa-users', href: '/admin/users' },
      { title: 'Stores', icon: 'fas fa-store', href: '/admin/stores' },
      { title: 'System', icon: 'fas fa-cogs', href: '/admin/system' }
    ]}
    {...props}
  />
);

export default PharmaNavbar;