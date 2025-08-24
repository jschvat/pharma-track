import React, { useState } from 'react';
import { Nav, Badge, Collapse } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';

/**
 * Development navigation item - only shows in development mode
 * Adds a development section to the sidebar for dev tools
 */
const DevelopmentNavItem = () => {
  const [isOpen, setIsOpen] = useState(false);

  // Don't render in production
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  const developmentItems = [
    {
      path: '/dev',
      label: 'Dev Dashboard',
      icon: 'fas fa-tools'
    },
    {
      path: '/dev/components',
      label: 'Component Gallery',
      icon: 'fas fa-palette',
      badge: { text: 'NEW', variant: 'success' },
      description: 'PharmaToast, PharmaOffcanvas, PharmaBadge & PharmaSpinner'
    },
    {
      path: '/dev/components/demo',
      label: 'Workflow Demos',
      icon: 'fas fa-laptop-code'
    },
    {
      path: '/dev/accessibility',
      label: 'Accessibility',
      icon: 'fas fa-universal-access'
    },
    {
      path: '/dev/api-test',
      label: 'API Testing',
      icon: 'fas fa-code'
    },
    {
      path: '/dev/performance',
      label: 'Performance',
      icon: 'fas fa-tachometer-alt'
    }
  ];

  return (
    <div className="development-nav-section mt-4 pt-3 border-top border-warning">
      <div className="px-3 mb-2">
        <small className="text-warning fw-bold">
          <i className="fas fa-code me-2"></i>
          DEVELOPMENT
          <Badge bg="warning" text="dark" className="ms-2 small">DEV</Badge>
        </small>
      </div>
      
      <Nav.Link
        className="nav-link d-flex align-items-center justify-content-between text-warning"
        onClick={() => setIsOpen(!isOpen)}
        style={{ cursor: 'pointer' }}
      >
        <span>
          <i className="fas fa-tools me-2"></i>
          Dev Tools
        </span>
        <i className={`fas fa-chevron-${isOpen ? 'down' : 'right'} small`}></i>
      </Nav.Link>

      <Collapse in={isOpen}>
        <div className="ps-3">
          {developmentItems.map((item, index) => (
            <LinkContainer key={index} to={item.path}>
              <Nav.Link className="py-2 text-muted small">
                <div className="d-flex align-items-start">
                  <div className="flex-grow-1">
                    <div className="d-flex align-items-center">
                      <i className={`${item.icon} me-2`}></i>
                      {item.label}
                      {item.badge && (
                        <Badge 
                          bg={item.badge.variant} 
                          className="ms-2 small"
                          style={{ fontSize: '0.6em' }}
                        >
                          {item.badge.text}
                        </Badge>
                      )}
                    </div>
                    {item.description && (
                      <div className="text-muted" style={{ fontSize: '0.75em', lineHeight: '1.2', marginTop: '2px', marginLeft: '1.2em' }}>
                        {item.description}
                      </div>
                    )}
                  </div>
                </div>
              </Nav.Link>
            </LinkContainer>
          ))}
        </div>
      </Collapse>

      <div className="px-3 mt-2">
        <div className="alert alert-info py-2 px-2 mb-2" style={{ fontSize: '0.75em' }}>
          <i className="fas fa-star me-1 text-warning"></i>
          <strong>NEW:</strong> Updated Component Gallery with PharmaToast, PharmaOffcanvas, PharmaBadge & PharmaSpinner demos!
        </div>
        <small className="text-muted">
          <i className="fas fa-info-circle me-1"></i>
          Development mode only
        </small>
      </div>
    </div>
  );
};

export default DevelopmentNavItem;