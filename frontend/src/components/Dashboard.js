import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { PostItContainer } from './PostItNote';
import PostItNotesSection from './PostItNotesSection';
import '../css/components.css';

const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    inventory: null,
    recentTransactions: [],
    lowStock: [],
    expiring: [],
    drugStats: null,
    storeStats: null
  });
  const [error, setError] = useState('');
  const [notePositions, setNotePositions] = useState(new Map()); // Store previous positions
  const [notesData, setNotesData] = useState({ notes: [], loading: true }); // Shared notes data
  const notesContainerRef = useRef(null);

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Use consolidated dashboard API call instead of multiple calls
      const response = await dashboardAPI.getDashboardData();
      const dashboardData = response.data.data;

      const newStats = {
        inventory: dashboardData.inventory_stats,
        lowStock: dashboardData.low_stock || [],
        expiring: dashboardData.expiring || [],
        recentTransactions: dashboardData.recent_transactions || [],
        drugStats: dashboardData.drug_stats,
        storeStats: dashboardData.store_stats
      };

      setStats(newStats);
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  // Note management functions
  const moveAllNotesToCard = () => {
    const notes = document.querySelectorAll('[data-note-id]');
    const cardElement = document.querySelector('[data-notes-card]');
    
    if (!cardElement) return;
    
    const cardRect = cardElement.getBoundingClientRect();
    
    notes.forEach((note, index) => {
      const noteId = note.getAttribute('data-note-id');
      const currentPos = {
        x: note.style.left ? parseInt(note.style.left) : 0,
        y: note.style.top ? parseInt(note.style.top) : 0
      };
      
      // Store current position for restoration
      setNotePositions(prev => new Map(prev.set(noteId, currentPos)));
      
      // Calculate position within card
      const newX = cardRect.left + 20 + (index % 3) * 120;
      const newY = cardRect.top + 80 + Math.floor(index / 3) * 100;
      
      note.style.left = `${newX}px`;
      note.style.top = `${newY}px`;
      note.style.zIndex = '999';
      
      // Trigger update event to save new position
      window.dispatchEvent(new CustomEvent('updateNotePosition', {
        detail: { noteId, position: { x: newX, y: newY } }
      }));
    });
  };

  const restoreNotesToPreviousPositions = () => {
    const notes = document.querySelectorAll('[data-note-id]');
    
    notes.forEach(note => {
      const noteId = note.getAttribute('data-note-id');
      const savedPosition = notePositions.get(noteId);
      
      if (savedPosition) {
        note.style.left = `${savedPosition.x}px`;
        note.style.top = `${savedPosition.y}px`;
        
        // Trigger update event
        window.dispatchEvent(new CustomEvent('updateNotePosition', {
          detail: { noteId, position: savedPosition }
        }));
      }
    });
  };

  const bringAllNotesForward = () => {
    const notes = document.querySelectorAll('[data-note-id]');
    const maxZIndex = Math.max(...Array.from(notes).map(n => parseInt(n.style.zIndex) || 1000));
    
    notes.forEach(note => {
      note.style.zIndex = `${maxZIndex + 100}`;
    });
  };

  const moveAllNotesBehind = () => {
    const notes = document.querySelectorAll('[data-note-id]');
    
    notes.forEach(note => {
      note.style.zIndex = '500'; // Behind most content but visible
    });
  };

  const addNewNote = () => {
    window.dispatchEvent(new CustomEvent('addPostItNote'));
  };

  if (loading) {
    return (
      <div className="dashboard-loading">
        <div className="spinner-border text-primary" role="status">
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <>
    <Container className="dashboard-container">
      <Row className="mb-4">
        <Col>
          <h2>
            Welcome back, {user.name}!
            {user.role === 'admin' && <Badge bg="success" className="ms-2">Administrator</Badge>}
          </h2>
          <p className="text-muted">
            {user.store_name ? `Store: ${user.store_name}` : 'System Overview'}
          </p>
        </Col>
      </Row>

      {error && (
        <Row className="mb-4">
          <Col>
            <Alert variant="danger">{error}</Alert>
          </Col>
        </Row>
      )}

      {/* Post-it Notes Section - Moved to Top */}
      {user?.store_id && (
        <Row className="mb-4">
          <Col>
            <div data-notes-card>
              <PostItNotesSection 
                notesData={notesData}
                actionBarProps={{
                  addNewNote,
                  moveAllNotesToCard,
                  restoreNotesToPreviousPositions,
                  bringAllNotesForward,
                  moveAllNotesBehind
                }}
              />
            </div>
          </Col>
        </Row>
      )}

      {/* Inventory Stats */}
      {stats.inventory && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="h-100 border-primary">
              <Card.Body className="text-center">
                <h3 className="text-primary">{stats.inventory.total_items}</h3>
                <p className="text-muted mb-0">Total Items</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-success">
              <Card.Body className="text-center">
                <h3 className="text-success">{stats.inventory.active_items}</h3>
                <p className="text-muted mb-0">Active Items</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-warning">
              <Card.Body className="text-center">
                <h3 className="text-warning">{stats.inventory.low_stock_items}</h3>
                <p className="text-muted mb-0">Low Stock</p>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="h-100 border-danger">
              <Card.Body className="text-center">
                <h3 className="text-danger">{stats.inventory.expiring_items}</h3>
                <p className="text-muted mb-0">Expiring Soon</p>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Admin Stats */}
      {isAdmin() && (stats.drugStats || stats.storeStats) && (
        <Row className="mb-4">
          <Col md={6}>
            {stats.storeStats && (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">System Overview</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <strong>Total Stores:</strong> {stats.storeStats.total_stores}
                    </Col>
                    <Col>
                      <strong>States:</strong> {stats.storeStats.unique_states}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>
          <Col md={6}>
            {stats.drugStats && (
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Drug Database</h5>
                </Card.Header>
                <Card.Body>
                  <Row>
                    <Col>
                      <strong>Total Drugs:</strong> {stats.drugStats.total_drugs}
                    </Col>
                    <Col>
                      <strong>Active:</strong> {stats.drugStats.active_drugs}
                    </Col>
                  </Row>
                </Card.Body>
              </Card>
            )}
          </Col>
        </Row>
      )}

      <Row>
        {/* Low Stock Items */}
        {stats.lowStock.length > 0 && (
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Low Stock Alert</h5>
                <Link to="/inventory?filter=low_stock" className="btn btn-sm btn-outline-warning">
                  View All
                </Link>
              </Card.Header>
              <Card.Body>
                {stats.lowStock.slice(0, 5).map((item, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{item.generic_name}</strong>
                      {item.brand_name && <div className="small text-muted">{item.brand_name}</div>}
                    </div>
                    <Badge bg="warning">{item.quantity_on_hand} left</Badge>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Expiring Items */}
        {stats.expiring.length > 0 && (
          <Col md={6} className="mb-4">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Expiring Soon</h5>
                <Link to="/inventory?filter=expiring" className="btn btn-sm btn-outline-danger">
                  View All
                </Link>
              </Card.Header>
              <Card.Body>
                {stats.expiring.slice(0, 5).map((item, index) => (
                  <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                    <div>
                      <strong>{item.generic_name}</strong>
                      <div className="small text-muted">
                        Expires: {new Date(item.expiration_date).toLocaleDateString()}
                      </div>
                    </div>
                    <Badge bg="danger">{item.days_until_expiration} days</Badge>
                  </div>
                ))}
              </Card.Body>
            </Card>
          </Col>
        )}

        {/* Recent Transactions */}
        {stats.recentTransactions.length > 0 && (
          <Col md={12} className="mb-4">
            <Card>
              <Card.Header className="d-flex justify-content-between align-items-center">
                <h5 className="mb-0">Recent Transactions</h5>
                <Link to="/audit/transactions" className="btn btn-sm btn-outline-primary">
                  View All
                </Link>
              </Card.Header>
              <Card.Body>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Type</th>
                        <th>Drug</th>
                        <th>Quantity</th>
                        <th>User</th>
                        {isAdmin() && <th>Store</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {stats.recentTransactions.slice(0, 8).map((transaction, index) => (
                        <tr key={index}>
                          <td className="small">
                            {new Date(transaction.transaction_date).toLocaleDateString()}
                          </td>
                          <td>
                            <Badge 
                              bg={
                                transaction.transaction_type === 'prescription_fill' ? 'primary' :
                                transaction.transaction_type === 'return_to_stock' ? 'success' :
                                transaction.transaction_type === 'expire' ? 'danger' :
                                'secondary'
                              }
                              className="small"
                            >
                              {transaction.transaction_type.replace('_', ' ')}
                            </Badge>
                          </td>
                          <td className="small">
                            {transaction.generic_name}
                            {transaction.brand_name && (
                              <div className="text-muted">{transaction.brand_name}</div>
                            )}
                          </td>
                          <td>
                            <span className={transaction.quantity_change < 0 ? 'text-danger' : 'text-success'}>
                              {transaction.quantity_change > 0 ? '+' : ''}{transaction.quantity_change}
                            </span>
                          </td>
                          <td className="small">{transaction.performed_by_name}</td>
                          {isAdmin() && <td className="small">{transaction.store_name}</td>}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card.Body>
            </Card>
          </Col>
        )}
      </Row>

      {/* Quick Actions */}
      <Row>
        <Col>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Quick Actions</h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={3} className="mb-2">
                  <Button as={Link} to="/inventory/add" variant="primary" className="w-100">
                    Add Inventory
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button as={Link} to="/drugs/search" variant="outline-primary" className="w-100">
                    Search FDA
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button as={Link} to="/audit/ndc" variant="outline-secondary" className="w-100">
                    NDC Report
                  </Button>
                </Col>
                <Col md={3} className="mb-2">
                  <Button as={Link} to="/inventory/transactions" variant="outline-success" className="w-100">
                    Transactions
                  </Button>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
    
    {/* Post-it Notes Container */}
    <PostItContainer onNotesUpdate={setNotesData} />
  </>
  );
};

export default Dashboard;