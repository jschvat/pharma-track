import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Sidebar = ({ collapsed, onToggle, mobileOpen, onMobileToggle }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const [openDropdowns, setOpenDropdowns] = useState({});

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

  const toggleDropdown = (key) => {
    if (collapsed) return; // Don't allow dropdowns in collapsed mode
    setOpenDropdowns(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const isActive = (path) => {
    return location.pathname === path || 
           (path !== '/dashboard' && location.pathname.startsWith(path));
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
          label: 'Admin',
          dropdown: true,
          items: [
            { label: 'Stores', path: '/admin/stores' },
            { label: 'Users', path: '/admin/users' },
            { label: 'System Settings', path: '/admin/settings' }
          ]
        }
      ]
    });
  }

  const NavLink = ({ item, isDropdownItem = false }) => {
    if (item.dropdown) {
      return (
        <div className={`nav-dropdown ${openDropdowns[item.key] ? 'open' : ''}`}>
          <a
            href="#"
            className="nav-link"
            onClick={(e) => {
              e.preventDefault();
              toggleDropdown(item.key);
            }}
          >
            <div className="nav-dropdown-toggle">
              <span>
                <i className={item.icon}></i>
                <span className="nav-link-text">{item.label}</span>
              </span>
              <i className="fas fa-chevron-down nav-dropdown-icon"></i>
            </div>
          </a>
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
        <i className={item.icon}></i>
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
      <div className={`sidebar ${collapsed ? 'collapsed' : ''} ${mobileOpen ? 'mobile-open' : ''}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <a href="/dashboard" className="sidebar-brand">
            <i className="fas fa-pills"></i>
            <span className="sidebar-brand-text">PharmaTraK</span>
          </a>
          <button 
            className="sidebar-toggle"
            onClick={onToggle}
          >
            <i className={`fas ${collapsed ? 'fa-angle-right' : 'fa-angle-left'}`}></i>
          </button>
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

          {/* User Section */}
          <div className="nav-section" style={{ marginTop: 'auto', paddingTop: '2rem' }}>
            <div className="nav-section-title">Account</div>
            <div className="nav-item">
              <div className={`nav-dropdown ${openDropdowns.user ? 'open' : ''}`}>
                <a
                  href="#"
                  className="nav-link"
                  onClick={(e) => {
                    e.preventDefault();
                    toggleDropdown('user');
                  }}
                >
                  <div className="nav-dropdown-toggle">
                    <span>
                      <i className="fas fa-user"></i>
                      <span className="nav-link-text">{user.name}</span>
                    </span>
                    <i className="fas fa-chevron-down nav-dropdown-icon"></i>
                  </div>
                </a>
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
                    <a
                      href="#"
                      className="nav-link nav-dropdown-item"
                      onClick={(e) => {
                        e.preventDefault();
                        handleLogout();
                      }}
                    >
                      <span className="nav-link-text">Logout</span>
                    </a>
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