import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { PostItContainer } from './PostItNote';
import PostItNotesSection from './PostItNotesSection';
import { 
  PharmaCard, 
  PharmaAlert, 
  PharmaButton, 
  StatsCard, 
  PharmaTable,
  PharmaTabs,
  InventoryProgress,
  PharmaDataGrid
} from './common/PharmaComponents';
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
            <PharmaAlert variant="danger" dismissible onClose={() => setError('')}>
              {error}
            </PharmaAlert>
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

      {/* Enhanced Inventory Stats with Progress Indicators */}
      {stats.inventory && (
        <Row className="mb-4">
          <Col md={3}>
            <PharmaCard variant="primary" className="h-100">
              <div className="text-center">
                <div className="display-6 fw-bold text-primary mb-2">
                  📦 {stats.inventory.total_items}
                </div>
                <div className="small text-muted mb-3">Total Items</div>
                <InventoryProgress 
                  value={Math.min((stats.inventory.active_items / stats.inventory.total_items) * 100, 100)}
                  label="Active Stock Ratio"
                  size="sm"
                />
              </div>
            </PharmaCard>
          </Col>
          <Col md={3}>
            <PharmaCard variant="success" className="h-100">
              <div className="text-center">
                <div className="display-6 fw-bold text-success mb-2">
                  ✅ {stats.inventory.active_items}
                </div>
                <div className="small text-muted mb-3">Active Items</div>
                <InventoryProgress 
                  value={85} // Example threshold value
                  label="Inventory Health"
                  size="sm"
                />
              </div>
            </PharmaCard>
          </Col>
          <Col md={3}>
            <PharmaCard variant="warning" className="h-100">
              <div className="text-center">
                <div className="display-6 fw-bold text-warning mb-2">
                  ⚠️ {stats.inventory.low_stock_items}
                </div>
                <div className="small text-muted mb-3">Low Stock</div>
                <InventoryProgress 
                  value={Math.max(100 - (stats.inventory.low_stock_items / stats.inventory.total_items) * 100, 0)}
                  label="Stock Level Health"
                  size="sm"
                />
              </div>
            </PharmaCard>
          </Col>
          <Col md={3}>
            <PharmaCard variant="danger" className="h-100">
              <div className="text-center">
                <div className="display-6 fw-bold text-danger mb-2">
                  🚨 {stats.inventory.expiring_items}
                </div>
                <div className="small text-muted mb-3">Expiring Soon</div>
                <InventoryProgress 
                  value={Math.max(100 - (stats.inventory.expiring_items / stats.inventory.total_items) * 100, 0)}
                  label="Freshness Score"
                  size="sm"
                />
              </div>
            </PharmaCard>
          </Col>
        </Row>
      )}

      {/* Admin Stats */}
      {isAdmin() && (stats.drugStats || stats.storeStats) && (
        <Row className="mb-4">
          <Col md={6}>
            {stats.storeStats && (
              <PharmaCard
                title="System Overview"
                headerIcon="🏪"
                variant="info"
                shadow="md"
              >
                <Row>
                  <Col>
                    <strong>Total Stores:</strong> {stats.storeStats.total_stores}
                  </Col>
                  <Col>
                    <strong>States:</strong> {stats.storeStats.unique_states}
                  </Col>
                </Row>
              </PharmaCard>
            )}
          </Col>
          <Col md={6}>
            {stats.drugStats && (
              <PharmaCard
                title="Drug Database"
                headerIcon="💊"
                variant="primary"
                shadow="md"
              >
                <Row>
                  <Col>
                    <strong>Total Drugs:</strong> {stats.drugStats.total_drugs}
                  </Col>
                  <Col>
                    <strong>Active:</strong> {stats.drugStats.active_drugs}
                  </Col>
                </Row>
              </PharmaCard>
            )}
          </Col>
        </Row>
      )}

      {/* Enhanced Inventory Alerts with PharmaTabs */}
      <Row className="mb-4">
        <Col>
          <PharmaTabs
            variant="pills"
            showBadges={true}
            showIcons={true}
            tabs={[
              {
                id: 'low-stock',
                label: 'Low Stock',
                icon: '⚠️',
                badge: { content: stats.lowStock.length, variant: 'warning' },
                content: (
                  <PharmaCard variant="warning">
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Items needing reorder</h6>
                      <PharmaButton 
                        variant="outline-warning" 
                        size="sm"
                        onClick={() => window.location.href = '/inventory?filter=low_stock'}
                      >
                        View All
                      </PharmaButton>
                    </div>
                    {stats.lowStock.length > 0 ? (
                      <div className="row g-2">
                        {stats.lowStock.slice(0, 8).map((item, index) => (
                          <div key={index} className="col-md-6">
                            <div className="border rounded p-2 bg-light">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <strong className="small">{item.generic_name}</strong>
                                  {item.brand_name && <div className="text-muted dashboard-brand-name">{item.brand_name}</div>}
                                  <div className="text-muted dashboard-reorder-info">
                                    Reorder at: {item.reorder_level}
                                  </div>
                                </div>
                                <Badge bg="warning" className="ms-2">{item.quantity_on_hand}</Badge>
                              </div>
                              <InventoryProgress 
                                value={(item.quantity_on_hand / item.reorder_level) * 100}
                                size="sm"
                                showLabel={false}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-muted">
                        <div className="dashboard-empty-icon">✅</div>
                        <div>All items are well stocked!</div>
                      </div>
                    )}
                  </PharmaCard>
                )
              },
              {
                id: 'expiring',
                label: 'Expiring Soon',
                icon: '🚨',
                badge: { content: stats.expiring.length, variant: 'danger' },
                content: (
                  <PharmaCard variant="danger">
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Items expiring within 30 days</h6>
                      <PharmaButton 
                        variant="outline-danger" 
                        size="sm"
                        onClick={() => window.location.href = '/inventory?filter=expiring'}
                      >
                        View All
                      </PharmaButton>
                    </div>
                    {stats.expiring.length > 0 ? (
                      <div className="row g-2">
                        {stats.expiring.slice(0, 8).map((item, index) => (
                          <div key={index} className="col-md-6">
                            <div className="border rounded p-2 bg-light">
                              <div className="d-flex justify-content-between align-items-start">
                                <div className="flex-grow-1">
                                  <strong className="small">{item.generic_name}</strong>
                                  {item.brand_name && <div className="text-muted dashboard-brand-name">{item.brand_name}</div>}
                                  <div className="text-muted dashboard-reorder-info">
                                    Expires: {new Date(item.expiration_date).toLocaleDateString()}
                                  </div>
                                </div>
                                <Badge bg="danger" className="ms-2">{item.days_until_expiration}d</Badge>
                              </div>
                              <InventoryProgress 
                                type="expiration"
                                value={(item.days_until_expiration / 30) * 100}
                                size="sm"
                                showLabel={false}
                                className="mt-2"
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-3 text-muted">
                        <div className="dashboard-empty-icon">🗓️</div>
                        <div>No items expiring soon</div>
                      </div>
                    )}
                  </PharmaCard>
                )
              },
              {
                id: 'recent',
                label: 'Recent Activity',
                icon: '📊',
                badge: { content: stats.recentTransactions.length, variant: 'info' },
                content: (
                  <PharmaCard variant="info">
                    <div className="mb-3 d-flex justify-content-between align-items-center">
                      <h6 className="mb-0">Latest inventory transactions</h6>
                      <PharmaButton 
                        variant="outline-info" 
                        size="sm"
                        onClick={() => window.location.href = '/audit/transactions'}
                      >
                        View All
                      </PharmaButton>
                    </div>
                    {stats.recentTransactions.length > 0 ? (
                      <PharmaDataGrid
                        data={stats.recentTransactions.slice(0, 6)}
                        columns={[
                          {
                            field: 'transaction_date',
                            label: 'Date',
                            type: 'date',
                            render: (value) => new Date(value).toLocaleDateString()
                          },
                          {
                            field: 'transaction_type',
                            label: 'Type',
                            render: (value) => (
                              <Badge 
                                bg={
                                  value === 'prescription_fill' ? 'primary' :
                                  value === 'return_to_stock' ? 'success' :
                                  value === 'expire' ? 'danger' :
                                  'secondary'
                                }
                                className="dashboard-transaction-details"
                              >
                                {value.replace('_', ' ')}
                              </Badge>
                            )
                          },
                          {
                            field: 'generic_name',
                            label: 'Drug'
                          },
                          {
                            field: 'quantity_change',
                            label: 'Change',
                            render: (value) => (
                              <span className={value < 0 ? 'text-danger fw-bold' : 'text-success fw-bold'}>
                                {value > 0 ? '+' : ''}{value}
                              </span>
                            )
                          }
                        ]}
                        paginated={false}
                        searchable={false}
                        filterable={false}
                        size="sm"
                        className="compact-grid"
                      />
                    ) : (
                      <div className="text-center py-3 text-muted">
                        <div className="dashboard-empty-icon">📋</div>
                        <div>No recent activity</div>
                      </div>
                    )}
                  </PharmaCard>
                )
              }
            ]}
            className="dashboard-alerts-tabs"
          />
        </Col>
      </Row>


      {/* Quick Actions */}
      <Row>
        <Col>
          <PharmaCard
            title="Quick Actions"
            headerIcon="⚡"
            variant="secondary"
          >
            <Row>
              <Col md={3} className="mb-2">
                <PharmaButton 
                  as={Link} 
                  to="/inventory/add" 
                  variant="primary" 
                  className="w-100"
                  icon="📦"
                >
                  Add Inventory
                </PharmaButton>
              </Col>
              <Col md={3} className="mb-2">
                <PharmaButton 
                  as={Link} 
                  to="/drugs/search" 
                  variant="outline-primary" 
                  className="w-100"
                  icon="🔍"
                >
                  Search FDA
                </PharmaButton>
              </Col>
              <Col md={3} className="mb-2">
                <PharmaButton 
                  as={Link} 
                  to="/audit/ndc" 
                  variant="outline-secondary" 
                  className="w-100"
                  icon="📋"
                >
                  NDC Report
                </PharmaButton>
              </Col>
              <Col md={3} className="mb-2">
                <PharmaButton 
                  as={Link} 
                  to="/inventory/transactions" 
                  variant="outline-success" 
                  className="w-100"
                  icon="📊"
                >
                  Transactions
                </PharmaButton>
              </Col>
            </Row>
          </PharmaCard>
        </Col>
      </Row>
    </Container>
    
    {/* Post-it Notes Container */}
    <PostItContainer onNotesUpdate={setNotesData} />
  </>
  );
};

export default Dashboard;