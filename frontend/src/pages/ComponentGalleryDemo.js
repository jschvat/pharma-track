import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Alert, Button, Tab, Tabs } from 'react-bootstrap';

/**
 * Extended Component Gallery Demo with Real Component Examples
 * This demonstrates how components would integrate with real PharmaTraK functionality
 */
const ComponentGalleryDemo = () => {
  const [activeTab, setActiveTab] = useState('pharmacy-workflows');

  // Mock pharmacy data for demonstrations
  const mockPatient = {
    id: 1,
    name: 'John Doe',
    dob: '1980-01-15',
    allergies: ['Penicillin', 'Sulfa'],
    insurance: 'Blue Cross Blue Shield'
  };

  const mockPrescription = {
    id: 'RX123456',
    patient: mockPatient,
    drug: {
      ndc: '12345-678-90',
      name: 'Amoxicillin 500mg',
      generic: 'Amoxicillin',
      brand: 'Amoxil',
      strength: '500mg',
      form: 'Capsule'
    },
    sig: 'Take 1 capsule by mouth three times daily with food',
    quantity: 30,
    refills: 2,
    status: 'pending'
  };

  const mockInventory = [
    { id: 1, drug: 'Amoxicillin 500mg', ndc: '12345-678-90', quantity: 150, reorder: 50, status: 'normal' },
    { id: 2, drug: 'Ibuprofen 200mg', ndc: '98765-432-10', quantity: 25, reorder: 100, status: 'low' },
    { id: 3, drug: 'Metformin 500mg', ndc: '11111-222-33', quantity: 5, reorder: 75, status: 'critical' },
    { id: 4, drug: 'Lisinopril 10mg', ndc: '44444-555-66', quantity: 200, reorder: 50, status: 'normal' }
  ];

  return (
    <Container fluid className="py-4">
      <div className="text-center mb-5">
        <h1 className="display-5">
          <i className="fas fa-pills me-3 text-primary"></i>
          PharmaTraK Component Demonstrations
        </h1>
        <p className="lead text-muted">
          Real-world examples of components in pharmacy workflows
        </p>
        <Badge bg="info" className="fs-6">Interactive Demo</Badge>
      </div>

      <Tabs activeKey={activeTab} onSelect={setActiveTab} className="mb-4">
        <Tab eventKey="pharmacy-workflows" title="Pharmacy Workflows">
          <PharmacyWorkflowsDemo 
            patient={mockPatient}
            prescription={mockPrescription}
            inventory={mockInventory}
          />
        </Tab>
        
        <Tab eventKey="data-management" title="Data Management">
          <DataManagementDemo inventory={mockInventory} />
        </Tab>
        
        <Tab eventKey="user-interfaces" title="User Interfaces">
          <UserInterfaceDemo />
        </Tab>
        
        <Tab eventKey="accessibility" title="Accessibility">
          <AccessibilityDemo />
        </Tab>
      </Tabs>
    </Container>
  );
};

/**
 * Pharmacy Workflows Demo
 */
const PharmacyWorkflowsDemo = ({ patient, prescription, inventory }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const [processing, setProcessing] = useState(false);

  const handleFillPrescription = async () => {
    setProcessing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setProcessing(false);
    setCurrentStep(currentStep + 1);
  };

  return (
    <Row>
      <Col lg={8}>
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h5 className="mb-0">
              <i className="fas fa-prescription-bottle me-2"></i>
              Prescription Processing Workflow
            </h5>
          </Card.Header>
          <Card.Body>
            {/* Prescription Details */}
            <div className="prescription-details mb-4">
              <h6 className="text-primary">Prescription Information</h6>
              <div className="row">
                <div className="col-md-6">
                  <div className="info-group">
                    <span className="fw-bold">Patient:</span>
                    <span className="ms-2">{patient.name}</span>
                  </div>
                  <div className="info-group">
                    <span className="fw-bold">DOB:</span>
                    <span className="ms-2">{patient.dob}</span>
                  </div>
                  <div className="info-group">
                    <span className="fw-bold">Allergies:</span>
                    <span className="ms-2 text-danger">{patient.allergies.join(', ')}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="info-group">
                    <span className="fw-bold">RX Number:</span>
                    <span className="ms-2">{prescription.id}</span>
                  </div>
                  <div className="info-group">
                    <span className="fw-bold">Medication:</span>
                    <span className="ms-2">{prescription.drug.name}</span>
                  </div>
                  <div className="info-group">
                    <span className="fw-bold">NDC:</span>
                    <span className="ms-2 font-monospace">{prescription.drug.ndc}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Prescription Directions */}
            <div className="prescription-directions mb-4">
              <h6 className="text-primary">Directions for Use</h6>
              <div className="alert alert-light border-start border-primary border-3">
                <i className="fas fa-info-circle text-primary me-2"></i>
                {prescription.sig}
              </div>
            </div>

            {/* Drug Interaction Check */}
            <div className="interaction-check mb-4">
              <h6 className="text-primary">Safety Checks</h6>
              {patient.allergies.includes('Penicillin') && prescription.drug.generic.includes('Amoxicillin') && (
                <Alert variant="warning">
                  <Alert.Heading>
                    <i className="fas fa-exclamation-triangle me-2"></i>
                    Allergy Alert
                  </Alert.Heading>
                  <p>Patient has documented Penicillin allergy. Amoxicillin is a penicillin antibiotic.</p>
                  <div className="d-flex gap-2">
                    <Button variant="warning" size="sm">Override with Reason</Button>
                    <Button variant="outline-secondary" size="sm">Contact Prescriber</Button>
                  </div>
                </Alert>
              )}
            </div>

            {/* Action Buttons */}
            <div className="prescription-actions">
              <Button 
                variant="success" 
                size="lg"
                onClick={handleFillPrescription}
                disabled={processing}
                className="me-3"
              >
                {processing ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Filling Prescription...
                  </>
                ) : (
                  <>
                    <i className="fas fa-pills me-2"></i>
                    Fill Prescription
                  </>
                )}
              </Button>
              
              <Button variant="outline-warning" size="lg" className="me-3">
                <i className="fas fa-undo me-2"></i>
                Return to Stock
              </Button>
              
              <Button variant="outline-info" size="lg">
                <i className="fas fa-print me-2"></i>
                Print Label
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Col>

      <Col lg={4}>
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-boxes me-2"></i>
              Inventory Check
            </h6>
          </Card.Header>
          <Card.Body>
            {inventory.filter(item => item.drug.includes('Amoxicillin')).map(item => (
              <div key={item.id} className="inventory-item mb-3">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    <div className="fw-bold">{item.drug}</div>
                    <small className="text-muted">{item.ndc}</small>
                  </div>
                  <Badge bg={item.status === 'normal' ? 'success' : item.status === 'low' ? 'warning' : 'danger'}>
                    {item.quantity} units
                  </Badge>
                </div>
              </div>
            ))}
          </Card.Body>
        </Card>

        <Card>
          <Card.Header className="bg-secondary text-white">
            <h6 className="mb-0">
              <i className="fas fa-clock me-2"></i>
              Process Status
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="process-steps">
              <div className={`step ${currentStep >= 1 ? 'completed' : ''}`}>
                <i className="fas fa-check-circle"></i>
                <span>Prescription Received</span>
              </div>
              <div className={`step ${currentStep >= 2 ? 'completed' : ''}`}>
                <i className="fas fa-search"></i>
                <span>Safety Check Complete</span>
              </div>
              <div className={`step ${currentStep >= 3 ? 'completed' : ''}`}>
                <i className="fas fa-pills"></i>
                <span>Medication Dispensed</span>
              </div>
              <div className={`step ${currentStep >= 4 ? 'completed' : ''}`}>
                <i className="fas fa-clipboard-check"></i>
                <span>Ready for Pickup</span>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

/**
 * Data Management Demo
 */
const DataManagementDemo = ({ inventory }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [filter, setFilter] = useState('all');

  const filteredInventory = inventory.filter(item => 
    filter === 'all' || item.status === filter
  );

  const sortedInventory = [...filteredInventory].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? -1 : 1;
    }
    if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const handleSort = (key) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <Row>
      <Col>
        <Card>
          <Card.Header className="bg-dark text-white">
            <div className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <i className="fas fa-warehouse me-2"></i>
                Inventory Management
              </h5>
              <div className="d-flex gap-2">
                <select 
                  className="form-select form-select-sm"
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                >
                  <option value="all">All Items</option>
                  <option value="normal">Normal Stock</option>
                  <option value="low">Low Stock</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </div>
          </Card.Header>
          <Card.Body className="p-0">
            <div className="table-responsive">
              <table className="table table-hover mb-0">
                <thead className="table-light">
                  <tr>
                    <th 
                      className="sortable"
                      onClick={() => handleSort('drug')}
                      style={{ cursor: 'pointer' }}
                    >
                      Medication
                      {sortConfig.key === 'drug' && (
                        <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-2`}></i>
                      )}
                    </th>
                    <th>NDC</th>
                    <th 
                      className="sortable text-end"
                      onClick={() => handleSort('quantity')}
                      style={{ cursor: 'pointer' }}
                    >
                      Quantity
                      {sortConfig.key === 'quantity' && (
                        <i className={`fas fa-sort-${sortConfig.direction === 'asc' ? 'up' : 'down'} ms-2`}></i>
                      )}
                    </th>
                    <th className="text-end">Reorder Level</th>
                    <th className="text-center">Status</th>
                    <th className="text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedInventory.map(item => (
                    <tr key={item.id}>
                      <td className="fw-medium">{item.drug}</td>
                      <td className="font-monospace small">{item.ndc}</td>
                      <td className="text-end">{item.quantity}</td>
                      <td className="text-end">{item.reorder}</td>
                      <td className="text-center">
                        <Badge bg={
                          item.status === 'normal' ? 'success' : 
                          item.status === 'low' ? 'warning' : 'danger'
                        }>
                          {item.status}
                        </Badge>
                      </td>
                      <td className="text-center">
                        <div className="btn-group btn-group-sm">
                          <Button variant="outline-primary" size="sm">
                            <i className="fas fa-edit"></i>
                          </Button>
                          <Button variant="outline-info" size="sm">
                            <i className="fas fa-plus"></i>
                          </Button>
                          <Button variant="outline-warning" size="sm">
                            <i className="fas fa-minus"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

/**
 * User Interface Demo
 */
const UserInterfaceDemo = () => {
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'success', message: 'Prescription filled successfully', time: '2 minutes ago' },
    { id: 2, type: 'warning', message: 'Low stock alert: Ibuprofen 200mg', time: '5 minutes ago' },
    { id: 3, type: 'info', message: 'New shipment received', time: '1 hour ago' }
  ]);

  const dismissNotification = (id) => {
    setNotifications(notifications.filter(n => n.id !== id));
  };

  return (
    <Row>
      <Col md={6}>
        <Card className="mb-4">
          <Card.Header className="bg-primary text-white">
            <h6 className="mb-0">
              <i className="fas fa-bell me-2"></i>
              Notification System
            </h6>
          </Card.Header>
          <Card.Body>
            {notifications.length === 0 ? (
              <div className="text-center text-muted py-4">
                <i className="fas fa-bell-slash fa-2x mb-2"></i>
                <p>No notifications</p>
              </div>
            ) : (
              notifications.map(notification => (
                <Alert 
                  key={notification.id}
                  variant={notification.type}
                  dismissible
                  onClose={() => dismissNotification(notification.id)}
                  className="mb-2"
                >
                  <div className="d-flex justify-content-between align-items-start">
                    <div>
                      <div>{notification.message}</div>
                      <small className="text-muted">{notification.time}</small>
                    </div>
                  </div>
                </Alert>
              ))
            )}
          </Card.Body>
        </Card>
      </Col>

      <Col md={6}>
        <Card className="mb-4">
          <Card.Header className="bg-info text-white">
            <h6 className="mb-0">
              <i className="fas fa-search me-2"></i>
              Smart Search
            </h6>
          </Card.Header>
          <Card.Body>
            <div className="position-relative">
              <input 
                type="text"
                className="form-control"
                placeholder="Search medications, NDC, or patients..."
              />
              <button className="btn btn-outline-secondary position-absolute end-0 top-0">
                <i className="fas fa-search"></i>
              </button>
            </div>
            
            <div className="mt-3">
              <small className="text-muted">Recent searches:</small>
              <div className="mt-2">
                <Badge bg="light" text="dark" className="me-2 mb-1">Amoxicillin</Badge>
                <Badge bg="light" text="dark" className="me-2 mb-1">12345-678-90</Badge>
                <Badge bg="light" text="dark" className="me-2 mb-1">John Doe</Badge>
              </div>
            </div>
          </Card.Body>
        </Card>
      </Col>
    </Row>
  );
};

/**
 * Accessibility Demo
 */
const AccessibilityDemo = () => {
  return (
    <Row>
      <Col>
        <Alert variant="info">
          <Alert.Heading>
            <i className="fas fa-universal-access me-2"></i>
            Accessibility Features Demonstration
          </Alert.Heading>
          <p>
            PharmaTraK components are built with accessibility as a core principle. 
            This section demonstrates WCAG 2.1 AA compliance features.
          </p>
        </Alert>

        <div className="row">
          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Keyboard Navigation</h6>
              </Card.Header>
              <Card.Body>
                <div className="d-flex flex-column gap-2">
                  <button className="btn btn-primary" tabIndex="1">
                    Tab Order 1
                  </button>
                  <button className="btn btn-secondary" tabIndex="2">
                    Tab Order 2
                  </button>
                  <button className="btn btn-success" tabIndex="3">
                    Tab Order 3
                  </button>
                </div>
                <small className="text-muted mt-2 d-block">
                  Use Tab key to navigate between elements
                </small>
              </Card.Body>
            </Card>
          </div>

          <div className="col-md-6">
            <Card className="mb-4">
              <Card.Header>
                <h6 className="mb-0">Screen Reader Support</h6>
              </Card.Header>
              <Card.Body>
                <div className="form-group mb-3">
                  <label htmlFor="patient-search" className="form-label">
                    Patient Search
                  </label>
                  <input 
                    id="patient-search"
                    type="text"
                    className="form-control"
                    aria-describedby="search-help"
                  />
                  <div id="search-help" className="form-text">
                    Enter patient name or ID number
                  </div>
                </div>
                
                <div role="alert" aria-live="polite" className="alert alert-warning">
                  <i className="fas fa-exclamation-triangle me-2"></i>
                  This message will be announced to screen readers
                </div>
              </Card.Body>
            </Card>
          </div>
        </div>
      </Col>
    </Row>
  );
};

export default ComponentGalleryDemo;