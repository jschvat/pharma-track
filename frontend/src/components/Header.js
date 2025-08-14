import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Dropdown } from 'react-bootstrap';
import StoreSelector from './StoreSelector';
import '../css/components.css';

const Header = ({ title, subtitle, onMenuToggle, onSidebarToggle }) => {
  const { user, isAdmin } = useAuth();
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  const [showStoreSelector, setShowStoreSelector] = useState(false);

  const getPageInfo = () => {
    const path = window.location.pathname;
    
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard', subtitle: 'Welcome back to PharmaTraK' };
      case '/inventory':
        return { title: 'Inventory Management', subtitle: 'Manage your medication inventory' };
      case '/inventory/state-count':
        return { title: 'Inventory State Count', subtitle: 'Complete inventory status and valuation report' };
      case '/drugs':
        return { title: 'Browse Drugs', subtitle: 'View all drugs in the system database' };
      case '/drugs/search':
        return { title: 'FDA Drug Search', subtitle: 'Search and add drugs from FDA database' };
      case '/audit/ndc':
        return { title: 'NDC Audit Reports', subtitle: 'Generate detailed NDC reports' };
      case '/admin/stores':
        return { title: 'Store Management', subtitle: 'Manage pharmacy locations' };
      case '/admin/users':
        return { title: 'User Management', subtitle: 'Manage store users and permissions' };
      default:
        return { title: title || 'PharmaTraK', subtitle: subtitle || 'Professional Pharmacy Management' };
    }
  };

  const pageInfo = getPageInfo();
  const userInitials = user?.name ? 
    user.name.split(' ').map(n => n[0]).join('').toUpperCase() : 
    'U';

  return (
    <div className="main-header">
      <div className="header-content">
        {/* Left Side - Page Title */}
        <div className="d-flex align-items-center">
          {/* Page Title */}
          <div>
            <h1 className="page-title">{pageInfo.title}</h1>
            <p className="page-subtitle">
              {pageInfo.subtitle}
              {isAdmin() && (
                <span className="ms-4">
                  <span className={`badge ${(user?.active_store_name || user?.store_name) ? 'bg-primary' : 'bg-warning'}`}>
                    <i className="fas fa-store me-1"></i>
                    {user?.active_store_name || user?.store_name || 'No Store Selected'}
                    <button 
                      className="btn btn-link btn-sm p-1 ms-2 text-white header-store-switcher"
                      onClick={() => setShowStoreSelector(true)}
                      title="Switch to Different Store"
                      aria-label="Switch Store"
                    >
                      <i className="fas fa-exchange-alt"></i>
                    </button>
                  </span>
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Right Side - User Info and Actions */}
        <div className="user-menu">
          {/* Theme Switcher */}
          <div className="d-none d-md-flex align-items-center me-3">
            <Dropdown>
              <Dropdown.Toggle 
                variant="outline-primary" 
                size="sm" 
                className="header-theme-toggle"
                title="Change Application Theme"
                aria-label="Theme Selector"
              >
                <i className="fas fa-palette me-2"></i>
                <span className="d-none d-lg-inline">Theme</span>
              </Dropdown.Toggle>
              
              <Dropdown.Menu align="end">
                <Dropdown.Header>Choose Theme</Dropdown.Header>
                {availableThemes.map((theme) => (
                  <Dropdown.Item
                    key={theme.value}
                    active={currentTheme === theme.value}
                    onClick={() => changeTheme(theme.value)}
                  >
                    {theme.label}
                  </Dropdown.Item>
                ))}
              </Dropdown.Menu>
            </Dropdown>
          </div>

          {/* Notifications and Quick Actions */}
          <div className="d-none d-sm-flex align-items-center me-3">
            <button 
              className="btn btn-outline-primary me-2 header-notification-btn"
              title="View Notifications (3 unread)"
              aria-label="Notifications"
            >
              <i className="fas fa-bell me-1"></i>
              <span className="d-none d-lg-inline">Alerts</span>
              <span className="badge badge-danger header-notification-badge">
                3
              </span>
            </button>
            <button 
              className="btn btn-outline-primary header-search-btn"
              title="Quick Search"
              aria-label="Quick Search"
            >
              <i className="fas fa-search me-1"></i>
              <span className="d-none d-lg-inline">Search</span>
            </button>
          </div>

          {/* User Info */}
          <div className="user-info">
            <div className="user-avatar">
              {userInitials}
            </div>
            <div className="user-details d-none d-sm-block">
              <h6>{user?.name}</h6>
              <small>
                {isAdmin() && <span className="badge badge-success me-1">Admin</span>}
                {user?.email}
              </small>
            </div>
          </div>
        </div>
      </div>

      {/* Breadcrumb Navigation (Optional) */}
      <div className="d-none d-lg-block mt-2">
        <nav aria-label="breadcrumb">
          <ol className="breadcrumb mb-0 header-breadcrumb">
            <li className="breadcrumb-item">
              <a href="/dashboard" className="header-breadcrumb-link">
                <i className="fas fa-home me-1"></i>
                Home
              </a>
            </li>
            {window.location.pathname !== '/dashboard' && (
              <li className="breadcrumb-item active header-breadcrumb-active" aria-current="page">
                {pageInfo.title}
              </li>
            )}
          </ol>
        </nav>
      </div>

      {/* Store Selector Modal */}
      {isAdmin() && (
        <StoreSelector
          show={showStoreSelector}
          onClose={() => setShowStoreSelector(false)}
          onStoreSelected={() => {
            setShowStoreSelector(false);
            // The page will refresh due to user context update
          }}
        />
      )}
    </div>
  );
};

export default Header;