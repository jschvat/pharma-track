import React, { useState, useEffect } from 'react';
import { Modal, Card, Button, Spinner, Alert, Row, Col, Badge } from 'react-bootstrap';
import { useAuth } from '../contexts/AuthContext';
import { storeAccessAPI } from '../services/api';
import '../css/components.css';

const StoreSelector = ({ show, onStoreSelected, onClose }) => {
  const { user, refreshUser } = useAuth();
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selecting, setSelecting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (show) {
      loadUserStores();
    }
  }, [show]);

  const loadUserStores = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await storeAccessAPI.getMyStores();
      setStores(response.data.stores || []);
      
    } catch (err) {
      console.error('Failed to load stores:', err);
      setError('Failed to load accessible stores');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreSelection = async (storeId) => {
    try {
      setSelecting(true);
      setError('');
      
      await storeAccessAPI.setActiveStore(storeId);
      
      // Refresh user data to get updated active store
      await refreshUser();
      
      if (onStoreSelected) {
        onStoreSelected(storeId);
      }
      
    } catch (err) {
      console.error('Failed to set active store:', err);
      setError(err.response?.data?.error || 'Failed to set active store');
    } finally {
      setSelecting(false);
    }
  };

  const getAccessBadge = (accessLevel) => {
    return (
      <Badge 
        bg={accessLevel === 'admin' ? 'primary' : 'secondary'}
        className="ms-2"
      >
        {accessLevel.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Modal 
      show={show} 
      onHide={onClose}
      size="lg"
      centered
      backdrop="static"
      keyboard={false}
    >
      <Modal.Header closeButton={stores.length > 0}>
        <Modal.Title>
          <div className="d-flex align-items-center">
            <i className="fas fa-store me-2"></i>
            Select Your Store
          </div>
        </Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {loading ? (
          <div className="text-center py-4">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Loading your accessible stores...</div>
          </div>
        ) : stores.length === 0 ? (
          <div className="text-center py-4">
            <div className="mb-3">
              <i className="fas fa-exclamation-triangle fa-3x text-warning"></i>
            </div>
            <h5>No Store Access</h5>
            <p className="text-muted">
              You don't have access to any stores. Please contact your administrator to get store access.
            </p>
          </div>
        ) : (
          <div>
            <div className="mb-3">
              <p className="text-muted">
                You have access to <strong>{stores.length}</strong> store{stores.length !== 1 ? 's' : ''}. 
                Select the store you want to work with:
              </p>
            </div>

            <Row>
              {stores.map((store) => (
                <Col md={6} key={store.id} className="mb-3">
                  <Card 
                    className={`h-100 store-card ${selecting ? 'disabled' : ''}`}
                    style={{ 
                      cursor: selecting ? 'wait' : 'pointer',
                      transition: 'all 0.2s ease',
                      border: user?.active_store_id === store.id ? '2px solid var(--bs-primary)' : '1px solid var(--bs-border-color)'
                    }}
                    onClick={() => !selecting && handleStoreSelection(store.id)}
                    onMouseOver={(e) => !selecting && (e.currentTarget.style.transform = 'translateY(-2px)')}
                    onMouseOut={(e) => !selecting && (e.currentTarget.style.transform = 'translateY(0)')}
                  >
                    <Card.Body className="d-flex flex-column">
                      <div className="d-flex justify-content-between align-items-start mb-2">
                        <h6 className="card-title mb-0">{store.name}</h6>
                        {getAccessBadge(store.access_level)}
                      </div>
                      
                      <div className="text-muted small mb-2">
                        <div><i className="fas fa-map-marker-alt me-1"></i>{store.address}</div>
                        <div><i className="fas fa-map-marker-alt me-1"></i>{store.state} {store.zipcode}</div>
                      </div>
                      
                      <div className="text-muted small mb-3">
                        <div><i className="fas fa-phone me-1"></i>{store.phone}</div>
                        {store.fax && <div><i className="fas fa-fax me-1"></i>{store.fax}</div>}
                      </div>

                      <div className="text-muted small mb-3">
                        <div><strong>DEA:</strong> {store.dea_registration_number}</div>
                        <div><strong>NPI:</strong> {store.npi}</div>
                      </div>

                      {user?.active_store_id === store.id && (
                        <div className="mt-auto">
                          <Badge bg="success" className="w-100">
                            <i className="fas fa-check me-1"></i>Currently Active
                          </Badge>
                        </div>
                      )}

                      {selecting && (
                        <div className="position-absolute top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-light bg-opacity-75">
                          <Spinner animation="border" size="sm" />
                        </div>
                      )}
                    </Card.Body>
                  </Card>
                </Col>
              ))}
            </Row>

            {user?.active_store_id && (
              <div className="mt-3 p-3 bg-light rounded">
                <div className="d-flex align-items-center">
                  <i className="fas fa-info-circle text-primary me-2"></i>
                  <small className="text-muted">
                    You can change your active store at any time from the user menu in the top right corner.
                  </small>
                </div>
              </div>
            )}
          </div>
        )}
      </Modal.Body>

      {stores.length > 0 && user?.active_store_id && (
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={selecting}>
            Continue with Current Store
          </Button>
        </Modal.Footer>
      )}
    </Modal>
  );
};

export default StoreSelector;