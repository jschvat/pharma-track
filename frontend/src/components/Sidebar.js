import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import HamburgerMenu from './HamburgerMenu';
import NavIcon from './common/NavIcon';
import DevelopmentNavItem from './DevelopmentNavItem';
import '../css/components.css';
import '../css/nav-icons.css';

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { currentTheme, changeTheme, availableThemes } = useTheme();
  const [openDropdowns, setOpenDropdowns] = useState({});

  // Auto-open dropdowns when on a child page
  React.useEffect(() => {
    const currentPath = location.pathname;
    const newOpenDropdowns = {};
    
    // Auto-open drugs dropdown if on any drugs page
    if (currentPath.startsWith('/drugs')) {
      newOpenDropdowns.drugs = true;
    }
    
    // Auto-open admin dropdown if on any admin page
    if (currentPath.startsWith('/admin')) {
      newOpenDropdowns.admin = true;
    }
    
    // Auto-open reports dropdown if on any reports/audit page
    if (currentPath.startsWith('/audit') || currentPath.startsWith('/reports')) {
      newOpenDropdowns.reports = true;
    }
    
    setOpenDropdowns(newOpenDropdowns);
  }, [location.pathname]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Navigate to login even if logout API fails
      navigate('/login');
    }
  };

  const sidebarRef = useRef(null);

  const toggleDropdown = (key) => {
    if (collapsed) return; // Don't allow dropdowns in collapsed mode
    // console.log('Toggling dropdown:', key); // Debug log
    setOpenDropdowns(prev => {
      const newState = {
        ...prev,
        [key]: !prev[key]
      };
      // console.log('New dropdown state:', newState); // Debug log
      return newState;
    });
  };

  const closeAllDropdowns = () => {
    setOpenDropdowns({});
  };

  // Close specific dropdowns that shouldn't remain open based on current route
  const closeNonActiveDropdowns = () => {
    const currentPath = location.pathname;
    setOpenDropdowns(prev => {
      const newState = { ...prev };
      
      // Keep drugs dropdown open if on any drugs page
      if (!currentPath.startsWith('/drugs')) {
        delete newState.drugs;
      }
      
      // Keep admin dropdown open if on any admin page
      if (!currentPath.startsWith('/admin')) {
        delete newState.admin;
      }
      
      // Keep reports dropdown open if on any reports/audit page
      if (!currentPath.startsWith('/audit') && !currentPath.startsWith('/reports')) {
        delete newState.reports;
      }
      
      // Always close user and theme dropdowns when clicking outside
      delete newState.user;
      delete newState.theme;
      
      return newState;
    });
  };

  // Close dropdowns when clicking outside sidebar
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (sidebarRef.current && !sidebarRef.current.contains(event.target)) {
        closeNonActiveDropdowns();
      }
    };

    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        closeAllDropdowns();
      }
    };

    // Close dropdowns when window loses focus
    const handleWindowBlur = () => {
      closeNonActiveDropdowns();
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscapeKey);
    window.addEventListener('blur', handleWindowBlur);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscapeKey);
      window.removeEventListener('blur', handleWindowBlur);
    };
  }, [location.pathname]);

  // Close all dropdowns when sidebar collapses
  useEffect(() => {
    if (collapsed) {
      closeAllDropdowns();
    }
  }, [collapsed]);

  // Close all dropdowns when mobile menu closes
  useEffect(() => {
    if (!mobileOpen) {
      closeAllDropdowns();
    }
  }, [mobileOpen]);

  const isActive = (path) => {
    // Exact match for the current path
    if (location.pathname === path) {
      return true;
    }
    
    // Special handling for nested routes to avoid conflicts
    // Only highlight parent if we're not on a more specific sub-route
    if (path === '/inventory' && location.pathname.startsWith('/inventory/')) {
      return false; // Don't highlight inventory when on inventory sub-pages
    }
    
    // For dropdown items, don't highlight parent when on child pages
    // The drugs dropdown should not be highlighted when on /drugs, /drugs/search, etc.
    if (path === '/drugs' && location.pathname.startsWith('/drugs')) {
      return false; // Don't highlight drugs dropdown parent when on any drugs page
    }
    
    // For other paths, use startsWith but exclude dashboard
    return path !== '/dashboard' && location.pathname.startsWith(path);
  };

  const navigationItems = [
    {
      section: 'Main',
      items: [
        {
          key: 'dashboard',
          icon: 'fas fa-tachometer-alt',
          label: 'Dashboard',
          path: '/dashboard'
        }
      ]
    },
    {
      section: 'Inventory',
      items: [
        {
          key: 'inventory',
          icon: 'fas fa-boxes',
          label: 'Inventory',
          path: '/inventory'
        },
        {
          key: 'state-count',
          icon: 'fas fa-clipboard-list',
          label: 'State Count',
          path: '/inventory/state-count'
        }
      ]
    },
    {
      section: 'Drugs',
      items: [
        {
          key: 'drugs',
          icon: 'fas fa-pills',
          label: 'Drugs',
          dropdown: true,
          items: [
            { label: 'Browse Drugs', path: '/drugs' },
            { label: 'Search FDA', path: '/drugs/search' },
            { label: 'Add Drug', path: '/drugs/add' }
          ]
        }
      ]
    },
    {
      section: 'Reports',
      items: [
        {
          key: 'reports',
          icon: 'fas fa-chart-line',
          label: 'Reports',
          dropdown: true,
          items: [
            { label: 'Inventory Audit', path: '/audit/inventory' },
            { label: 'NDC Reports', path: '/audit/ndc' },
            { label: 'Recent Transactions', path: '/audit/transactions' },
            { label: 'Analytics', path: '/reports/analytics' }
          ]
        }
      ]
    }
  ];

  if (isAdmin()) {
    navigationItems.push({
      section: 'Administration',
      items: [
        {
          key: 'admin',
          icon: 'fas fa-users-cog',
          label: 'Administration',
          dropdown: true,
          items: [
            { label: 'Manage Stores', path: '/admin/stores' },
            { label: 'Manage Users', path: '/admin/users' },
            { label: 'System Settings', path: '/admin/settings' }
          ]
        }
      ]
    });
  }

  const NavLink = ({ item, isDropdownItem = false }) => {
    if (item.dropdown) {
      return (
        <div className={`nav-dropdown ${openDropdowns[item.key] ? 'open' : ''}`} data-debug={`${item.key}: ${openDropdowns[item.key] ? 'OPEN' : 'CLOSED'}`}>
          <button
            type="button"
            className="nav-link"
            onClick={() => toggleDropdown(item.key)}
          >
            <div className="nav-dropdown-toggle">
              <span>
                <NavIcon 
                  iconKey={item.key} 
                  fallbackIcon={item.icon} 
                  collapsed={collapsed}
                  size="md"
                />
                <span className="nav-link-text">{item.label}</span>
              </span>
              <i className="fas fa-chevron-down nav-dropdown-icon"></i>
            </div>
          </button>
          <div className="nav-dropdown-menu">
            {item.items.map((subItem, index) => (
              <div key={index} className="nav-item">
                <a
                  href={subItem.path}
                  className={`nav-link nav-dropdown-item ${isActive(subItem.path) ? 'active' : ''}`}
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(subItem.path);
                  }}
                >
                  <span className="nav-link-text">{subItem.label}</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return (
      <a
        href={item.path}
        className={`nav-link ${isActive(item.path) ? 'active' : ''} ${isDropdownItem ? 'nav-dropdown-item' : ''}`}
        onClick={(e) => {
          e.preventDefault();
          navigate(item.path);
          if (mobileOpen) {
            onMobileToggle();
          }
        }}
      >
        <NavIcon 
          iconKey={item.key} 
          fallbackIcon={item.icon} 
          collapsed={collapsed}
          size="md"
        />
        <span className="nav-link-text">{item.label}</span>
      </a>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div 
        className={`sidebar-overlay ${mobileOpen ? 'show' : ''}`} 
        onClick={onMobileToggle}
      ></div>

      {/* Sidebar */}
      <div 
        ref={sidebarRef}
        className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}
      >
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-header-content">
            {/* Hamburger Menu Button - Mobile */}
            <HamburgerMenu
              className="d-md-none"
              onClick={onMobileToggle}
              title="Toggle Menu"
              ariaLabel="Toggle Menu"
              isOpen={mobileOpen}
            />
            
            {/* Hamburger Menu Button - Desktop */}
            <HamburgerMenu
              className="d-none d-md-flex"
              onClick={onToggle}
              title="Toggle Sidebar"
              ariaLabel="Toggle Sidebar"
              isOpen={collapsed}
            />
            
            <a href="/dashboard" className="sidebar-brand">
              <NavIcon 
                iconKey="brand" 
                fallbackIcon="fas fa-pills" 
                collapsed={collapsed}
                size="lg"
              />
              <span className="sidebar-brand-text">PharmaTraK</span>
            </a>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <div className="sidebar-nav">
          {navigationItems.map((section, sectionIndex) => (
            <div key={sectionIndex} className="nav-section">
              <div className="nav-section-title">{section.section}</div>
              {section.items.map((item, itemIndex) => (
                <div key={itemIndex} className="nav-item">
                  <NavLink item={item} />
                </div>
              ))}
            </div>
          ))}

          {/* Theme Section - Only show on mobile */}
          <div className="nav-section d-md-none sidebar-nav-section">
            <div className="nav-section-title">Appearance</div>
            <div className="nav-item">
              <div className={`nav-dropdown ${openDropdowns.theme ? 'open' : ''}`}>
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => toggleDropdown('theme')}
                >
                  <div className="nav-dropdown-content">
                    <span>
                      <NavIcon 
                        iconKey="theme" 
                        fallbackIcon="fas fa-palette" 
                        collapsed={collapsed}
                        size="md"
                      />
                      <span className="nav-link-text">Theme</span>
                    </span>
                    <i className="fas fa-chevron-down nav-dropdown-icon"></i>
                  </div>
                </button>
                <div className="nav-dropdown-menu">
                  {availableThemes.map((theme) => (
                    <div key={theme.value} className="nav-item">
                      <button
                        type="button"
                        className={`nav-link nav-dropdown-item ${currentTheme === theme.value ? 'active' : ''}`}
                        onClick={() => {
                          changeTheme(theme.value);
                          if (mobileOpen) {
                            onMobileToggle();
                          }
                        }}
                      >
                        <span className="nav-link-text">{theme.label}</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Development Section - Only in development mode */}
          <DevelopmentNavItem />

          {/* User Section */}
          <div className="nav-section sidebar-user-section">
            <div className="nav-section-title">Account</div>
            <div className="nav-item">
              <div className={`nav-dropdown ${openDropdowns.user ? 'open' : ''}`}>
                <button
                  type="button"
                  className="nav-link"
                  onClick={() => toggleDropdown('user')}
                >
                  <div className="nav-dropdown-toggle">
                    <span>
                      <NavIcon 
                        iconKey="profile" 
                        fallbackIcon="fas fa-user" 
                        collapsed={collapsed}
                        size="md"
                      />
                      <span className="nav-link-text">{user.name}</span>
                    </span>
                    <i className="fas fa-chevron-down nav-dropdown-icon"></i>
                  </div>
                </button>
                <div className="nav-dropdown-menu">
                  <div className="nav-item">
                    <a
                      href="/profile"
                      className={`nav-link nav-dropdown-item ${isActive('/profile') ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/profile');
                      }}
                    >
                      <span className="nav-link-text">Profile</span>
                    </a>
                  </div>
                  <div className="nav-item">
                    <a
                      href="/settings"
                      className={`nav-link nav-dropdown-item ${isActive('/settings') ? 'active' : ''}`}
                      onClick={(e) => {
                        e.preventDefault();
                        navigate('/settings');
                      }}
                    >
                      <span className="nav-link-text">Settings</span>
                    </a>
                  </div>
                  <div className="nav-item">
                    <button
                      type="button"
                      className="nav-link nav-dropdown-item"
                      onClick={() => handleLogout()}
                    >
                      <span className="nav-link-text">Logout</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;