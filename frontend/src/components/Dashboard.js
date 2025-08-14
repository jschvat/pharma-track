import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Alert, Button, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { inventoryAPI, auditAPI, drugAPI, storeAPI } from '../services/api';
import { Link } from 'react-router-dom';
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

  useEffect(() => {
    loadDashboardData();
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const promises = [];

      // Get inventory stats
      if (user.store_id) {
        promises.push(
          inventoryAPI.getStats(user.store_id),
          inventoryAPI.getLowStock(user.store_id, { limit: 5 }),
          inventoryAPI.getExpiring(user.store_id, { days: 30, limit: 5 }),
          auditAPI.getStoreHistory(user.store_id, { limit: 5 })
        );
      }

      // Admin gets additional stats
      if (isAdmin()) {
        promises.push(
          drugAPI.getStats(),
          storeAPI.getStats(),
          auditAPI.getRecentTransactions({ limit: 10 })
        );
      }

      const results = await Promise.allSettled(promises);
      
      let resultIndex = 0;
      const newStats = { ...stats };

      if (user.store_id) {
        newStats.inventory = results[resultIndex]?.value?.data?.stats || null;
        resultIndex++;
        newStats.lowStock = results[resultIndex]?.value?.data?.low_stock || [];
        resultIndex++;
        newStats.expiring = results[resultIndex]?.value?.data?.expiring || [];
        resultIndex++;
        newStats.recentTransactions = results[resultIndex]?.value?.data?.history || [];
        resultIndex++;
      }

      if (isAdmin()) {
        newStats.drugStats = results[resultIndex]?.value?.data?.stats || null;
        resultIndex++;
        newStats.storeStats = results[resultIndex]?.value?.data?.stats || null;
        resultIndex++;
        if (results[resultIndex]?.value?.data?.recent_transactions) {
          newStats.recentTransactions = results[resultIndex].value.data.recent_transactions;
        }
      }

      setStats(newStats);
    } catch (err) {
      console.error('Dashboard loading error:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
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
  );
};

export default Dashboard;