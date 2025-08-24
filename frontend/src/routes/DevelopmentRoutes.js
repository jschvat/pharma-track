import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Container, Alert, Badge } from 'react-bootstrap';
import ComponentGallerySimple from '../pages/ComponentGallerySimple';
import ComponentGalleryDemo from '../pages/ComponentGalleryDemo';

/**
 * Development-only routes for testing and component showcasing
 * These routes are automatically disabled in production builds
 */
const DevelopmentRoutes = () => {
  // Completely disable in production
  if (process.env.NODE_ENV === 'production') {
    return (
      <Container className="py-5">
        <Alert variant="danger">
          <Alert.Heading>Access Denied</Alert.Heading>
          <p>Development routes are not available in production mode.</p>
        </Alert>
      </Container>
    );
  }

  return (
    <div className="development-routes">
      {/* Development banner */}
      <div className="bg-warning text-dark py-2 text-center">
        <small>
          <i className="fas fa-code me-2"></i>
          <strong>Development Mode</strong> - These pages are not available in production
          <Badge bg="dark" className="ms-2">DEV ONLY</Badge>
        </small>
      </div>

      <Routes>
        {/* Component Gallery */}
        <Route path="/components" element={<ComponentGallerySimple />} />
        
        {/* Component Gallery Demo with Real Examples */}
        <Route path="/components/demo" element={<ComponentGalleryDemo />} />
        
        {/* Accessibility Testing */}
        <Route 
          path="/accessibility" 
          element={<AccessibilityTestPage />} 
        />
        
        {/* API Testing */}
        <Route 
          path="/api-test" 
          element={<APITestPage />} 
        />
        
        {/* Performance Testing */}
        <Route 
          path="/performance" 
          element={<PerformanceTestPage />} 
        />
        
        {/* Development Dashboard */}
        <Route 
          path="/" 
          element={<DevelopmentDashboard />} 
        />
        
        {/* Redirect unknown dev routes to dashboard */}
        <Route path="/*" element={<Navigate to="/dev" replace />} />
      </Routes>
    </div>
  );
};

/**
 * Development Dashboard - Overview of all development tools
 */
const DevelopmentDashboard = () => {
  const devTools = [
    {
      title: 'Component Gallery',
      path: '/dev/components',
      icon: 'fas fa-palette',
      description: 'Interactive showcase of all PharmaTraK components with live examples. NOW WITH: PharmaToast, PharmaOffcanvas, PharmaBadge & PharmaSpinner!',
      status: 'stable',
      color: 'success',
      featured: true
    },
    {
      title: 'Workflow Demos',
      path: '/dev/components/demo',
      icon: 'fas fa-laptop-code',
      description: 'Real-world pharmacy workflow demonstrations with integrated components',
      status: 'stable',
      color: 'success'
    },
    {
      title: 'Accessibility Testing',
      path: '/dev/accessibility',
      icon: 'fas fa-universal-access',
      description: 'WCAG 2.1 AA compliance testing and accessibility audit tools',
      status: 'stable',
      color: 'success'
    },
    {
      title: 'API Testing',
      path: '/dev/api-test',
      icon: 'fas fa-code',
      description: 'Test API endpoints, validate responses, and mock data scenarios',
      status: 'beta',
      color: 'info'
    },
    {
      title: 'Performance Testing',
      path: '/dev/performance',
      icon: 'fas fa-tachometer-alt',
      description: 'Component performance monitoring and optimization tools',
      status: 'experimental',
      color: 'warning'
    }
  ];

  const getStatusBadge = (status) => {
    const variants = {
      stable: 'success',
      beta: 'warning',
      experimental: 'danger'
    };
    return <Badge bg={variants[status]}>{status}</Badge>;
  };

  return (
    <Container className="py-5">
      <div className="text-center mb-5">
        <h1 className="display-4">
          <i className="fas fa-tools me-3"></i>
          Development Tools
        </h1>
        <p className="lead text-muted">
          PharmaTraK development and testing utilities
        </p>
        <Badge bg="warning" className="fs-6">Development Environment Only</Badge>
      </div>

      <div className="row">
        {devTools.map((tool, index) => (
          <div key={index} className="col-md-6 col-lg-4 mb-4">
            <div className={`card h-100 border-${tool.color} ${tool.featured ? 'shadow-lg' : ''}`}>
              {tool.featured && (
                <div className="position-absolute top-0 end-0 m-2">
                  <Badge bg="warning" className="animate__animated animate__pulse animate__infinite">
                    <i className="fas fa-star me-1"></i>NEW
                  </Badge>
                </div>
              )}
              <div className={`card-header ${tool.featured ? `bg-${tool.color} text-white` : 'bg-light'}`}>
                <div className="d-flex justify-content-between align-items-center">
                  <h5 className="mb-0">
                    <i className={`${tool.icon} ${tool.featured ? 'text-white' : `text-${tool.color}`} me-2`}></i>
                    {tool.title}
                  </h5>
                  {!tool.featured && getStatusBadge(tool.status)}
                  {tool.featured && <Badge bg="light" text="dark">{tool.status}</Badge>}
                </div>
              </div>
              <div className="card-body">
                <p className="card-text">{tool.description}</p>
              </div>
              <div className="card-footer bg-transparent">
                <a href={tool.path} className={`btn btn-${tool.color} w-100 ${tool.featured ? 'btn-lg' : ''}`}>
                  {tool.featured ? (
                    <>
                      <i className="fas fa-rocket me-2"></i>
                      Launch Gallery
                      <i className="fas fa-external-link-alt ms-2"></i>
                    </>
                  ) : (
                    <>
                      Launch Tool
                      <i className="fas fa-external-link-alt ms-2"></i>
                    </>
                  )}
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row mt-5">
        <div className="col-12">
          <div className="card">
            <div className="card-header">
              <h5><i className="fas fa-info-circle me-2"></i>Development Information</h5>
            </div>
            <div className="card-body">
              <div className="row">
                <div className="col-md-6">
                  <h6>Environment Details</h6>
                  <ul className="list-unstyled">
                    <li><strong>Node Environment:</strong> {process.env.NODE_ENV}</li>
                    <li><strong>React Version:</strong> {React.version}</li>
                    <li><strong>Build Mode:</strong> Development</li>
                    <li><strong>Hot Reload:</strong> Enabled</li>
                  </ul>
                </div>
                <div className="col-md-6">
                  <h6>Available Scripts</h6>
                  <ul className="list-unstyled">
                    <li><code>npm run accessibility:audit</code> - Run accessibility audit</li>
                    <li><code>npm run test:accessibility</code> - Run accessibility tests</li>
                    <li><code>npm run docs:build</code> - Build documentation</li>
                    <li><code>npm run docs:serve</code> - Serve documentation</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="row mt-4">
        <div className="col-12">
          <Alert variant="info">
            <Alert.Heading>
              <i className="fas fa-lightbulb me-2"></i>
              Quick Tips
            </Alert.Heading>
            <ul className="mb-0">
              <li>Use the Component Gallery to test component variations and interactions</li>
              <li>Run accessibility audits regularly to maintain WCAG compliance</li>
              <li>Test API endpoints before implementing in production components</li>
              <li>Monitor component performance with large datasets</li>
              <li>All development routes are automatically disabled in production builds</li>
            </ul>
          </Alert>
        </div>
      </div>
    </Container>
  );
};

/**
 * Accessibility Testing Page
 */
const AccessibilityTestPage = () => {
  return (
    <Container className="py-5">
      <h2>
        <i className="fas fa-universal-access me-2"></i>
        Accessibility Testing
      </h2>
      <Alert variant="info">
        <p>This page would contain accessibility testing tools and reports.</p>
        <ul>
          <li>WCAG 2.1 AA compliance checker</li>
          <li>Color contrast analyzer</li>
          <li>Keyboard navigation tester</li>
          <li>Screen reader simulation</li>
          <li>Component accessibility scores</li>
        </ul>
      </Alert>
    </Container>
  );
};

/**
 * API Testing Page
 */
const APITestPage = () => {
  return (
    <Container className="py-5">
      <h2>
        <i className="fas fa-code me-2"></i>
        API Testing
      </h2>
      <Alert variant="info">
        <p>This page would contain API testing tools.</p>
        <ul>
          <li>Endpoint testing interface</li>
          <li>Response validation</li>
          <li>Mock data generation</li>
          <li>Error scenario testing</li>
          <li>Performance monitoring</li>
        </ul>
      </Alert>
    </Container>
  );
};

/**
 * Performance Testing Page
 */
const PerformanceTestPage = () => {
  return (
    <Container className="py-5">
      <h2>
        <i className="fas fa-tachometer-alt me-2"></i>
        Performance Testing
      </h2>
      <Alert variant="info">
        <p>This page would contain performance testing tools.</p>
        <ul>
          <li>Component render time analysis</li>
          <li>Memory usage monitoring</li>
          <li>Large dataset performance</li>
          <li>Bundle size analysis</li>
          <li>Performance benchmarks</li>
        </ul>
      </Alert>
    </Container>
  );
};

export default DevelopmentRoutes;