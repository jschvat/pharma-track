import React from 'react';
import { useAuth } from '../contexts/AuthContext';

const Header = ({ title, subtitle, onMenuToggle, onSidebarToggle }) => {
  const { user, isAdmin } = useAuth();

  const getPageInfo = () => {
    const path = window.location.pathname;
    
    switch (path) {
      case '/dashboard':
        return { title: 'Dashboard', subtitle: 'Welcome back to PharmaTraK' };
      case '/inventory':
        return { title: 'Inventory Management', subtitle: 'Manage your medication inventory' };
      case '/drugs/search':
        return { title: 'FDA Drug Search', subtitle: 'Search and add drugs from FDA database' };
      case '/audit/ndc':
        return { title: 'NDC Audit Reports', subtitle: 'Generate detailed NDC reports' };
      case '/admin/stores':
        return { title: 'Store Management', subtitle: 'Manage pharmacy locations' };
      case '/admin/users':
        return { title: 'User Management', subtitle: 'Manage system users' };
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
        {/* Left Side - Title and Mobile Menu */}
        <div className="d-flex align-items-center">
          {/* Mobile Menu Button */}
          <button 
            className="btn btn-outline-primary d-md-none me-3"
            onClick={onMenuToggle}
            style={{ padding: '0.5rem', border: 'none', background: 'none' }}
          >
            <i className="fas fa-bars" style={{ color: 'var(--granite-dark)' }}></i>
          </button>

          {/* Desktop Sidebar Toggle */}
          <button 
            className="btn btn-outline-primary d-none d-md-inline-flex me-3"
            onClick={onSidebarToggle}
            style={{ padding: '0.5rem', border: '1px solid var(--border-light)' }}
          >
            <i className="fas fa-bars"></i>
          </button>

          {/* Page Title */}
          <div>
            <h1 className="page-title">{pageInfo.title}</h1>
            <p className="page-subtitle">{pageInfo.subtitle}</p>
          </div>
        </div>

        {/* Right Side - User Info and Actions */}
        <div className="user-menu">
          {/* Notifications */}
          <div className="d-none d-sm-flex align-items-center me-3">
            <button className="btn btn-outline-primary me-2" style={{ padding: '0.5rem', position: 'relative' }}>
              <i className="fas fa-bell"></i>
              <span 
                className="badge badge-danger" 
                style={{ 
                  position: 'absolute', 
                  top: '-5px', 
                  right: '-5px', 
                  fontSize: '0.6rem',
                  minWidth: '18px',
                  height: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '50%'
                }}
              >
                3
              </span>
            </button>
            <button className="btn btn-outline-primary" style={{ padding: '0.5rem' }}>
              <i className="fas fa-search"></i>
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
          <ol className="breadcrumb mb-0" style={{ background: 'none', padding: 0 }}>
            <li className="breadcrumb-item">
              <a href="/dashboard" style={{ color: 'var(--granite-accent)', textDecoration: 'none' }}>
                <i className="fas fa-home me-1"></i>
                Home
              </a>
            </li>
            {window.location.pathname !== '/dashboard' && (
              <li className="breadcrumb-item active" aria-current="page" style={{ color: 'var(--text-secondary)' }}>
                {pageInfo.title}
              </li>
            )}
          </ol>
        </nav>
      </div>
    </div>
  );
};

export default Header;