import React, { useState } from 'react';
import { Container, Row, Col, Card, Nav, Badge, Alert, Button, Form } from 'react-bootstrap';
import './ComponentGallery.css';

// Import dropdown components
import MultiSelectDropdown from '../components/common/MultiSelectDropdown';
import PharmaDropdown from '../components/common/PharmaDropdown';

// Import all PharmaTraK components (adjust paths as needed)
// Note: These would be actual component imports in a real implementation
const PharmaButton = ({ children, variant = 'primary', size = 'md', loading = false, icon, confirmAction = false, ...props }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleClick = (e) => {
    if (confirmAction && !showConfirm) {
      e.preventDefault();
      setShowConfirm(true);
      setTimeout(() => setShowConfirm(false), 3000);
      return;
    }
    props.onClick?.(e);
  };

  return (
    <div>
      <button 
        className={`btn btn-${variant} btn-${size} ${loading ? 'disabled' : ''}`}
        onClick={handleClick}
        disabled={loading || props.disabled}
        {...props}
      >
        {icon && <span className="me-2">{icon}</span>}
        {loading ? (
          <>
            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
            Loading...
          </>
        ) : children}
      </button>
      {showConfirm && (
        <div className="alert alert-warning mt-2" role="alert">
          Confirmation required! Click again to proceed.
        </div>
      )}
    </div>
  );
};

const PharmaModal = ({ show, onHide, title, children, size = 'md' }) => {
  if (!show) return null;
  
  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog" aria-modal="true">
      <div className={`modal-dialog modal-${size}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title">{title}</h5>
            <button type="button" className="btn-close" onClick={onHide} aria-label="Close"></button>
          </div>
          <div className="modal-body">
            {children}
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onHide}>Close</button>
            <button type="button" className="btn btn-primary">Save Changes</button>
          </div>
        </div>
      </div>
      <div className="modal-backdrop show"></div>
    </div>
  );
};

const PharmaForm = ({ children, onSubmit, validationRules = {} }) => {
  const [errors, setErrors] = useState({});
  
  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    // Simple validation example
    const newErrors = {};
    Object.keys(validationRules).forEach(field => {
      const rules = validationRules[field];
      const value = data[field];
      
      rules.forEach(rule => {
        if (rule.type === 'required' && !value) {
          newErrors[field] = rule.message;
        }
      });
    });
    
    setErrors(newErrors);
    
    if (Object.keys(newErrors).length === 0) {
      onSubmit?.(data);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="pharma-form-context">
        {React.Children.map(children, child => 
          React.cloneElement(child, { errors })
        )}
      </div>
      <div className="mt-3">
        <button type="submit" className="btn btn-primary me-2">Submit</button>
        <button type="button" className="btn btn-secondary">Cancel</button>
      </div>
    </form>
  );
};

const PharmaFormGroup = ({ label, name, type = 'text', required = false, errors = {} }) => {
  const error = errors[name];
  
  return (
    <div className="mb-3">
      <label htmlFor={name} className="form-label">
        {label} {required && <span className="text-danger">*</span>}
      </label>
      <input
        type={type}
        className={`form-control ${error ? 'is-invalid' : ''}`}
        id={name}
        name={name}
        required={required}
      />
      {error && (
        <div className="invalid-feedback" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

const PharmaTable = ({ data = [], columns = [], sortable = false, pagination = false }) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  const sortedData = React.useMemo(() => {
    if (!sortConfig.key) return data;
    
    return [...data].sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  const paginatedData = pagination 
    ? sortedData.slice((currentPage - 1) * pageSize, currentPage * pageSize)
    : sortedData;

  const handleSort = (key) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  return (
    <div>
      <table className="table table-striped table-hover">
        <thead>
          <tr>
            {columns.map(column => (
              <th 
                key={column.key}
                onClick={() => handleSort(column.key)}
                style={{ cursor: sortable ? 'pointer' : 'default' }}
                className={sortable ? 'sortable' : ''}
              >
                {column.label}
                {sortConfig.key === column.key && (
                  <span className="ms-1">
                    {sortConfig.direction === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {paginatedData.map((row, index) => (
            <tr key={row.id || index}>
              {columns.map(column => (
                <td key={`${row.id || index}-${column.key}`}>
                  {column.render ? column.render(row[column.key], row) : row[column.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      
      {pagination && (
        <nav>
          <ul className="pagination">
            <li className={`page-item ${currentPage === 1 ? 'disabled' : ''}`}>
              <button 
                className="page-link" 
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                Previous
              </button>
            </li>
            <li className="page-item active">
              <span className="page-link">{currentPage}</span>
            </li>
            <li className={`page-item ${currentPage * pageSize >= data.length ? 'disabled' : ''}`}>
              <button 
                className="page-link"
                onClick={() => setCurrentPage(prev => prev + 1)}
              >
                Next
              </button>
            </li>
          </ul>
        </nav>
      )}
    </div>
  );
};

const PharmaSearch = ({ placeholder = 'Search...', onSearch, showResults = false, results = [] }) => {
  const [query, setQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const handleSearch = (value) => {
    setQuery(value);
    onSearch?.(value);
    setShowDropdown(value.length > 0 && results.length > 0);
  };

  return (
    <div className="position-relative">
      <div className="input-group">
        <input
          type="text"
          className="form-control"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <button className="btn btn-outline-secondary" type="button">
          <i className="fas fa-search"></i>
        </button>
      </div>
      
      {showDropdown && showResults && (
        <div className="position-absolute w-100 bg-white border rounded shadow-sm mt-1" style={{ zIndex: 1000 }}>
          {results.map((result, index) => (
            <div 
              key={index}
              className="p-2 border-bottom cursor-pointer hover-bg-light"
              onClick={() => {
                setQuery(result.title);
                setShowDropdown(false);
              }}
            >
              <div className="fw-bold">{result.title}</div>
              {result.description && (
                <small className="text-muted">{result.description}</small>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const PharmaAlert = ({ variant = 'info', children, dismissible = false, show = true }) => {
  const [visible, setVisible] = useState(show);
  
  if (!visible) return null;

  return (
    <div className={`alert alert-${variant} ${dismissible ? 'alert-dismissible' : ''}`} role="alert">
      {children}
      {dismissible && (
        <button 
          type="button" 
          className="btn-close" 
          onClick={() => setVisible(false)}
          aria-label="Close"
        ></button>
      )}
    </div>
  );
};

const PharmaBreadcrumbs = ({ items = [] }) => {
  return (
    <nav aria-label="breadcrumb">
      <ol className="breadcrumb">
        {items.map((item, index) => (
          <li 
            key={index}
            className={`breadcrumb-item ${item.current ? 'active' : ''}`}
            aria-current={item.current ? 'page' : undefined}
          >
            {item.current ? (
              item.label
            ) : (
              <a href={item.path || '#'}>{item.label}</a>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

const PharmaTooltip = ({ content, children, position = 'top' }) => {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="position-relative d-inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className={`position-absolute bg-dark text-white px-2 py-1 rounded small tooltip-${position}`}>
          {content}
          <div className="tooltip-arrow"></div>
        </div>
      )}
    </div>
  );
};

const ComponentGallery = () => {
  const [activeCategory, setActiveCategory] = useState('dropdowns');
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
              title: 'Loading States',
              component: (
                <div className="d-flex gap-2">
                  <PharmaButton loading>Saving...</PharmaButton>
                  <PharmaButton variant="success" loading>Processing</PharmaButton>
                </div>
              )
            },
            {
              title: 'With Icons',
              component: (
                <div className="d-flex gap-2">
                  <PharmaButton variant="success" icon={<i className="fas fa-pills"></i>}>
                    Fill Prescription
                  </PharmaButton>
                  <PharmaButton variant="danger" icon={<i className="fas fa-trash"></i>}>
                    Delete
                  </PharmaButton>
                </div>
              )
            },
            {
              title: 'Confirmation Actions',
              component: (
                <PharmaButton variant="danger" confirmAction>
                  Delete Item
                </PharmaButton>
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
                <PharmaForm 
                  validationRules={{
                    patientName: [{ type: 'required', message: 'Patient name is required' }],
                    email: [{ type: 'required', message: 'Email is required' }]
                  }}
                  onSubmit={(data) => console.log('Form submitted:', data)}
                >
                  <PharmaFormGroup label="Patient Name" name="patientName" required />
                  <PharmaFormGroup label="Email" name="email" type="email" required />
                  <PharmaFormGroup label="Phone" name="phone" type="tel" />
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
                  showResults={true}
                  results={[
                    { title: 'Amoxicillin 500mg', description: 'NDC: 12345-678-90' },
                    { title: 'Ibuprofen 200mg', description: 'NDC: 98765-432-10' }
                  ]}
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
                    { key: 'name', label: 'Medication' },
                    { key: 'ndc', label: 'NDC' },
                    { key: 'quantity', label: 'Quantity' },
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
                  sortable={true}
                  pagination={true}
                />
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
                  <Button onClick={() => setShowModal(true)}>Show Modal</Button>
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
                  <PharmaAlert variant="success">Prescription filled successfully!</PharmaAlert>
                  <PharmaAlert variant="warning">Low stock alert for Amoxicillin</PharmaAlert>
                  <PharmaAlert variant="danger">Drug interaction detected</PharmaAlert>
                  <PharmaAlert variant="info" dismissible>Information message</PharmaAlert>
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
                    <button className="btn btn-outline-primary">Hover for tooltip</button>
                  </PharmaTooltip>
                  <PharmaTooltip content="Drug interaction warning" position="bottom">
                    <i className="fas fa-exclamation-triangle text-warning"></i>
                  </PharmaTooltip>
                </div>
              )
            }
          ]
        }
      ]
    },
    dropdowns: {
      title: 'Dropdowns & Selects',
      icon: 'fas fa-caret-down',
      components: [
        {
          name: 'Test Dropdown Section',
          description: 'Testing if dropdowns section appears in component gallery',
          examples: [
            {
              title: 'Basic Test',
              component: (
                <div className="alert alert-success">
                  <h5>🎉 Dropdowns section is working!</h5>
                  <p>This confirms the dropdowns section has been added successfully to the Component Gallery.</p>
                  <Form.Select style={{ width: '200px' }}>
                    <option>Basic HTML Select</option>
                    <option value="1">Option 1</option>
                    <option value="2">Option 2</option>
                    <option value="3">Option 3</option>
                  </Form.Select>
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

export default ComponentGallery;