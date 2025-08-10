import React from 'react';
import { Navbar, Nav, NavDropdown, Container, Badge } from 'react-bootstrap';
import { LinkContainer } from 'react-router-bootstrap';
import { useAuth } from '../contexts/AuthContext';

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
            
            <NavDropdown title="Drugs" id="drugs-dropdown">
              <LinkContainer to="/drugs">
                <NavDropdown.Item>Browse Drugs</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/drugs/search">
                <NavDropdown.Item>Search FDA</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>
            
            <NavDropdown title="Reports" id="reports-dropdown">
              <LinkContainer to="/audit/inventory">
                <NavDropdown.Item>Inventory Audit</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/audit/ndc">
                <NavDropdown.Item>NDC Reports</NavDropdown.Item>
              </LinkContainer>
              <LinkContainer to="/audit/transactions">
                <NavDropdown.Item>Recent Transactions</NavDropdown.Item>
              </LinkContainer>
            </NavDropdown>

            {isAdmin() && (
              <NavDropdown title="Admin" id="admin-dropdown">
                <LinkContainer to="/admin/stores">
                  <NavDropdown.Item>Stores</NavDropdown.Item>
                </LinkContainer>
                <LinkContainer to="/admin/users">
                  <NavDropdown.Item>Users</NavDropdown.Item>
                </LinkContainer>
                <NavDropdown.Divider />
                <LinkContainer to="/admin/analytics">
                  <NavDropdown.Item>Analytics</NavDropdown.Item>
                </LinkContainer>
              </NavDropdown>
            )}
          </Nav>
          
          <Nav>
            <NavDropdown
              title={
                <span>
                  <i className="fas fa-user me-1"></i>
                  {user.name}
                  {user.role === 'admin' && (
                    <Badge bg="success" className="ms-1">Admin</Badge>
                  )}
                </span>
              }
              id="user-dropdown"
              align="end"
            >
              <NavDropdown.Item>
                <strong>{user.name}</strong><br />
                <small className="text-muted">{user.email}</small>
              </NavDropdown.Item>
              <NavDropdown.Divider />
              <LinkContainer to="/profile">
                <NavDropdown.Item>Profile</NavDropdown.Item>
              </LinkContainer>
              <NavDropdown.Divider />
              <NavDropdown.Item onClick={handleLogout}>
                <i className="fas fa-sign-out-alt me-1"></i>
                Logout
              </NavDropdown.Item>
            </NavDropdown>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
};

export default Navigation;