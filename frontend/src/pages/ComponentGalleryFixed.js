import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Alert, Button } from 'react-bootstrap';

// Import actual PharmaTraK components (using default exports)
import PharmaButton from '../components/common/PharmaButton';
import PharmaModal from '../components/common/PharmaModal';
import PharmaAlert from '../components/common/PharmaAlert';
import PharmaCard from '../components/common/PharmaCard';
import PharmaSearch from '../components/common/PharmaSearch';
import PharmaTable from '../components/common/PharmaTable';
import PharmaBreadcrumbs from '../components/common/PharmaBreadcrumbs';
import PharmaTooltip from '../components/common/PharmaTooltip';
import PharmaForm from '../components/common/PharmaForm';
import PharmaFormGroup from '../components/common/PharmaFormGroup';

import './ComponentGallery.css';

const ComponentGalleryFixed = () => {
  const [activeCategory, setActiveCategory] = useState('buttons');
  const [showModal, setShowModal] = useState(false);

  // Only show in development
  if (process.env.NODE_ENV === 'production') {
    return (
      <Container className="py-5">
        <Alert variant="warning">
          <Alert.Heading>Development Only</Alert.Heading>
          <p>The Component Gallery is only available in development mode.</p>
        </Alert>
      </Container>
    );
  }

  const categories = {
    buttons: {
      title: 'Buttons & Actions',
      icon: 'fas fa-mouse-pointer',
      components: [
        {
          name: 'PharmaButton',
          description: 'Interactive buttons with pharmacy-specific actions and confirmations',
          examples: [
            {
              title: 'Basic Variants',
              component: (
                <div className="d-flex gap-2 flex-wrap">
                  <PharmaButton variant="primary">Primary</PharmaButton>
                  <PharmaButton variant="success">Success</PharmaButton>
                  <PharmaButton variant="danger">Danger</PharmaButton>
                  <PharmaButton variant="warning">Warning</PharmaButton>
                  <PharmaButton variant="outline-primary">Outline</PharmaButton>
                </div>
              )
            },
            {
              title: 'With Icons',
              component: (
                <div className="d-flex gap-2">
                  <PharmaButton variant="success" icon="fas fa-pills">
                    Fill Prescription
                  </PharmaButton>
                  <PharmaButton variant="danger" icon="fas fa-trash">
                    Delete
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Loading States',
              component: (
                <div className="d-flex gap-2">
                  <PharmaButton loading>Saving...</PharmaButton>
                  <PharmaButton variant="success" loading>Processing</PharmaButton>
                </div>
              )
            }
          ]
        }
      ]
    },
    forms: {
      title: 'Forms & Inputs',
      icon: 'fas fa-edit',
      components: [
        {
          name: 'PharmaForm',
          description: 'Advanced form handling with pharmacy-specific validation',
          examples: [
            {
              title: 'Basic Form',
              component: (
                <PharmaForm onSubmit={(data) => console.log('Form submitted:', data)}>
                  <PharmaFormGroup 
                    label="Patient Name" 
                    name="patientName" 
                    placeholder="Enter patient name"
                    required 
                  />
                  <PharmaFormGroup 
                    label="Email" 
                    name="email" 
                    type="email" 
                    placeholder="patient@example.com"
                    required 
                  />
                  <PharmaFormGroup 
                    label="Phone" 
                    name="phone" 
                    type="tel" 
                    placeholder="(555) 123-4567"
                  />
                  <div className="mt-3">
                    <PharmaButton type="submit" variant="primary">Submit</PharmaButton>
                    <PharmaButton type="button" variant="secondary" className="ms-2">Cancel</PharmaButton>
                  </div>
                </PharmaForm>
              )
            }
          ]
        },
        {
          name: 'PharmaSearch',
          description: 'Intelligent search with autocomplete and filtering',
          examples: [
            {
              title: 'Drug Search',
              component: (
                <PharmaSearch
                  placeholder="Search medications..."
                  onSearch={(query) => console.log('Searching:', query)}
                />
              )
            }
          ]
        }
      ]
    },
    display: {
      title: 'Data Display',
      icon: 'fas fa-table',
      components: [
        {
          name: 'PharmaTable',
          description: 'High-performance data tables with virtual scrolling',
          examples: [
            {
              title: 'Basic Table',
              component: (
                <PharmaTable
                  data={[
                    { id: 1, name: 'Amoxicillin 500mg', ndc: '12345-678-90', quantity: 100, status: 'Active' },
                    { id: 2, name: 'Ibuprofen 200mg', ndc: '98765-432-10', quantity: 50, status: 'Low Stock' },
                    { id: 3, name: 'Metformin 500mg', ndc: '11111-222-33', quantity: 200, status: 'Active' }
                  ]}
                  columns={[
                    { key: 'name', label: 'Medication', sortable: true },
                    { key: 'ndc', label: 'NDC' },
                    { key: 'quantity', label: 'Quantity', sortable: true },
                    { 
                      key: 'status', 
                      label: 'Status',
                      render: (value) => (
                        <Badge bg={value === 'Low Stock' ? 'warning' : 'success'}>
                          {value}
                        </Badge>
                      )
                    }
                  ]}
                />
              )
            }
          ]
        },
        {
          name: 'PharmaCard',
          description: 'Flexible card component for displaying pharmacy information',
          examples: [
            {
              title: 'Basic Cards',
              component: (
                <div className="row">
                  <div className="col-md-6">
                    <PharmaCard title="Patient Information" variant="primary">
                      <p><strong>Name:</strong> John Doe</p>
                      <p><strong>DOB:</strong> 01/15/1980</p>
                      <p><strong>Allergies:</strong> Penicillin, Sulfa</p>
                    </PharmaCard>
                  </div>
                  <div className="col-md-6">
                    <PharmaCard title="Prescription Details" variant="info">
                      <p><strong>RX Number:</strong> RX123456</p>
                      <p><strong>Drug:</strong> Amoxicillin 500mg</p>
                      <p><strong>Quantity:</strong> 30 capsules</p>
                    </PharmaCard>
                  </div>
                </div>
              )
            }
          ]
        }
      ]
    },
    navigation: {
      title: 'Navigation',
      icon: 'fas fa-route',
      components: [
        {
          name: 'PharmaBreadcrumbs',
          description: 'Navigation breadcrumbs for pharmacy workflows',
          examples: [
            {
              title: 'Basic Breadcrumbs',
              component: (
                <PharmaBreadcrumbs
                  items={[
                    { label: 'Dashboard', path: '/dashboard' },
                    { label: 'Inventory', path: '/inventory' },
                    { label: 'Medications', path: '/inventory/medications' },
                    { label: 'Edit Amoxicillin', current: true }
                  ]}
                />
              )
            }
          ]
        }
      ]
    },
    feedback: {
      title: 'Feedback & Alerts',
      icon: 'fas fa-bell',
      components: [
        {
          name: 'PharmaModal',
          description: 'Accessible modal dialogs with pharmacy workflows',
          examples: [
            {
              title: 'Modal Dialog',
              component: (
                <div>
                  <PharmaButton onClick={() => setShowModal(true)}>Show Modal</PharmaButton>
                  {showModal && (
                    <PharmaModal
                      show={showModal}
                      onHide={() => setShowModal(false)}
                      title="Prescription Details"
                      size="lg"
                    >
                      <p>This is a modal dialog for displaying prescription information.</p>
                      <div className="alert alert-info">
                        <i className="fas fa-info-circle me-2"></i>
                        Patient: John Doe, DOB: 01/01/1980
                      </div>
                    </PharmaModal>
                  )}
                </div>
              )
            }
          ]
        },
        {
          name: 'PharmaAlert',
          description: 'Context-aware alerts and notifications',
          examples: [
            {
              title: 'Alert Variants',
              component: (
                <div className="d-flex flex-column gap-2">
                  <PharmaAlert variant="success" dismissible>
                    Prescription filled successfully!
                  </PharmaAlert>
                  <PharmaAlert variant="warning">
                    Low stock alert for Amoxicillin
                  </PharmaAlert>
                  <PharmaAlert variant="danger">
                    Drug interaction detected
                  </PharmaAlert>
                  <PharmaAlert variant="info">
                    Information message
                  </PharmaAlert>
                </div>
              )
            }
          ]
        },
        {
          name: 'PharmaTooltip',
          description: 'Context-aware tooltips with pharmacy information',
          examples: [
            {
              title: 'Tooltips',
              component: (
                <div className="d-flex gap-3">
                  <PharmaTooltip content="This is helpful information">
                    <PharmaButton variant="outline-primary">Hover for tooltip</PharmaButton>
                  </PharmaTooltip>
                  <PharmaTooltip content="Drug interaction warning" position="bottom">
                    <span className="text-warning">
                      <i className="fas fa-exclamation-triangle"></i>
                    </span>
                  </PharmaTooltip>
                </div>
              )
            }
          ]
        }
      ]
    }
  };

  const renderComponent = (component) => (
    <Card className="mb-4 component-card">
      <Card.Header className="bg-light">
        <div className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">{component.name}</h5>
          <Badge bg="secondary">Component</Badge>
        </div>
        <small className="text-muted">{component.description}</small>
      </Card.Header>
      <Card.Body>
        {component.examples.map((example, index) => (
          <div key={index} className="example-section">
            <h6 className="text-primary">{example.title}</h6>
            <div className="example-preview p-3 border rounded bg-light mb-3">
              {example.component}
            </div>
          </div>
        ))}
      </Card.Body>
    </Card>
  );

  return (
    <Container fluid className="component-gallery py-4">
      <Row>
        <Col md={3}>
          <div className="gallery-sidebar">
            <div className="gallery-header mb-4">
              <h2><i className="fas fa-palette me-2"></i>Component Gallery</h2>
              <Badge bg="warning">Development Only</Badge>
            </div>
            
            <Nav variant="pills" className="flex-column">
              {Object.entries(categories).map(([key, category]) => (
                <Nav.Item key={key}>
                  <Nav.Link 
                    active={activeCategory === key}
                    onClick={() => setActiveCategory(key)}
                    className="d-flex align-items-center"
                  >
                    <i className={`${category.icon} me-2`}></i>
                    {category.title}
                    <Badge bg="light" text="dark" className="ms-auto">
                      {category.components.length}
                    </Badge>
                  </Nav.Link>
                </Nav.Item>
              ))}
            </Nav>

            <div className="mt-4 p-3 bg-light rounded">
              <h6><i className="fas fa-info-circle me-2"></i>About</h6>
              <p className="small mb-0">
                This gallery showcases all PharmaTraK components with interactive examples. 
                Use this page to test components during development.
              </p>
            </div>
          </div>
        </Col>
        
        <Col md={9}>
          <div className="gallery-content">
            <div className="category-header mb-4">
              <h3>
                <i className={`${categories[activeCategory].icon} me-2`}></i>
                {categories[activeCategory].title}
              </h3>
              <p className="text-muted">
                Interactive examples of {categories[activeCategory].title.toLowerCase()} components
              </p>
            </div>

            {categories[activeCategory].components.map((component, index) => (
              <div key={index}>
                {renderComponent(component)}
              </div>
            ))}
          </div>
        </Col>
      </Row>
    </Container>
  );
};

export default ComponentGalleryFixed;