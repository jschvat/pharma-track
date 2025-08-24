import React from 'react';
import { Navbar, Nav, Container, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import PharmaDropdown from './common/PharmaDropdown';

const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();

  const handleLogout = () => {
    logout();
  };

  if (!user) {
    return null;
  }

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="mb-4">
      <Container>
        <LinkContainer to="/dashboard">
          <Navbar.Brand>
            <i className="fas fa-pills me-2"></i>
            PharmaTraK
          </Navbar.Brand>
        </LinkContainer>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <LinkContainer to="/dashboard">
              <Nav.Link>Dashboard</Nav.Link>
            </LinkContainer>
            
            <LinkContainer to="/inventory">
              <Nav.Link>Inventory</Nav.Link>
            </LinkContainer>
            
            <div className="nav-item dropdown">
              <PharmaDropdown
                label="Drugs"
                trigger="hover"
                variant="nav"
                className="nav-link"
                pharmaType="pill"
              >
                <LinkContainer to="/drugs">
                  <button className="dropdown-item">Browse Drugs</button>
                </LinkContainer>
                <LinkContainer to="/drugs/search">
                  <button className="dropdown-item">Search FDA</button>
                </LinkContainer>
              </PharmaDropdown>
            </div>
            
            <div className="nav-item dropdown">
              <PharmaDropdown
                label="Reports"
                trigger="hover"
                variant="nav"
                className="nav-link"
                pharmaType="pill"
              >
                <LinkContainer to="/audit/inventory">
                  <button className="dropdown-item">Inventory Audit</button>
                </LinkContainer>
                <LinkContainer to="/audit/ndc">
                  <button className="dropdown-item">NDC Reports</button>
                </LinkContainer>
                <LinkContainer to="/audit/transactions">
                  <button className="dropdown-item">Recent Transactions</button>
                </LinkContainer>
              </PharmaDropdown>
            </div>

            {isAdmin() && (
              <div className="nav-item dropdown">
                <PharmaDropdown
                  label="Admin"
                  trigger="hover"
                  variant="nav"
                  className="nav-link"
                  pharmaType="pill"
                >
                  <LinkContainer to="/admin/stores">
                    <button className="dropdown-item">Stores</button>
                  </LinkContainer>
                  <LinkContainer to="/admin/users">
                    <button className="dropdown-item">Users</button>
                  </LinkContainer>
                  <div className="dropdown-divider"></div>
                  <LinkContainer to="/admin/analytics">
                    <button className="dropdown-item">Analytics</button>
                  </LinkContainer>
                </PharmaDropdown>
              </div>
            )}
          </Nav>
          
          <Nav>
            <div className="nav-item dropdown">
              <PharmaDropdown
                label={
                  <span>
                    <i className="fas fa-user me-1"></i>
                    {user.name}
                    {user.role === 'admin' && (
                      <Badge bg="success" className="ms-1">Admin</Badge>
                    )}
                  </span>
                }
                trigger="click"
                variant="nav"
                className="nav-link"
                align="end"
                pharmaType="pill"
              >
                <div className="dropdown-item-text">
                  <strong>{user.name}</strong><br />
                  <small className="text-muted">{user.email}</small>
                </div>
                <div className="dropdown-divider"></div>
                <LinkContainer to="/profile">
                  <button className="dropdown-item">Profile</button>
                </LinkContainer>
                <div className="dropdown-divider"></div>
                <button className="dropdown-item" onClick={handleLogout}>
                  <i className="fas fa-sign-out-alt me-1"></i>
                  Logout
                </button>
              </PharmaDropdown>
            </div>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;