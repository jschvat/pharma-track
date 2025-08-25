import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PharmaDropdown from './common/PharmaDropdown';
import '../css/components.css';

const Register = () => {
  const [formData, setFormData] = useState({
    // User fields
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    address: '',
    // Store fields
    storeName: '',
    storeAddress: '',
    storeCity: '',
    storeState: '',
    storeZipcode: '',
    storePhone: '',
    storeFax: '',
    deaRegistrationNumber: '',
    npi: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();

  // US States for PharmaDropdown
  const US_STATES_OPTIONS = [
    { value: 'AL', label: 'Alabama' },
    { value: 'AK', label: 'Alaska' },
    { value: 'AZ', label: 'Arizona' },
    { value: 'AR', label: 'Arkansas' },
    { value: 'CA', label: 'California' },
    { value: 'CO', label: 'Colorado' },
    { value: 'CT', label: 'Connecticut' },
    { value: 'DE', label: 'Delaware' },
    { value: 'FL', label: 'Florida' },
    { value: 'GA', label: 'Georgia' },
    { value: 'HI', label: 'Hawaii' },
    { value: 'ID', label: 'Idaho' },
    { value: 'IL', label: 'Illinois' },
    { value: 'IN', label: 'Indiana' },
    { value: 'IA', label: 'Iowa' },
    { value: 'KS', label: 'Kansas' },
    { value: 'KY', label: 'Kentucky' },
    { value: 'LA', label: 'Louisiana' },
    { value: 'ME', label: 'Maine' },
    { value: 'MD', label: 'Maryland' },
    { value: 'MA', label: 'Massachusetts' },
    { value: 'MI', label: 'Michigan' },
    { value: 'MN', label: 'Minnesota' },
    { value: 'MS', label: 'Mississippi' },
    { value: 'MO', label: 'Missouri' },
    { value: 'MT', label: 'Montana' },
    { value: 'NE', label: 'Nebraska' },
    { value: 'NV', label: 'Nevada' },
    { value: 'NH', label: 'New Hampshire' },
    { value: 'NJ', label: 'New Jersey' },
    { value: 'NM', label: 'New Mexico' },
    { value: 'NY', label: 'New York' },
    { value: 'NC', label: 'North Carolina' },
    { value: 'ND', label: 'North Dakota' },
    { value: 'OH', label: 'Ohio' },
    { value: 'OK', label: 'Oklahoma' },
    { value: 'OR', label: 'Oregon' },
    { value: 'PA', label: 'Pennsylvania' },
    { value: 'RI', label: 'Rhode Island' },
    { value: 'SC', label: 'South Carolina' },
    { value: 'SD', label: 'South Dakota' },
    { value: 'TN', label: 'Tennessee' },
    { value: 'TX', label: 'Texas' },
    { value: 'UT', label: 'Utah' },
    { value: 'VT', label: 'Vermont' },
    { value: 'VA', label: 'Virginia' },
    { value: 'WA', label: 'Washington' },
    { value: 'WV', label: 'West Virginia' },
    { value: 'WI', label: 'Wisconsin' },
    { value: 'WY', label: 'Wyoming' },
    { value: 'DC', label: 'District of Columbia' },
    { value: 'PR', label: 'Puerto Rico' },
    { value: 'VI', label: 'Virgin Islands' },
    { value: 'GU', label: 'Guam' },
    { value: 'AS', label: 'American Samoa' },
    { value: 'MP', label: 'Northern Mariana Islands' }
  ];

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear errors when user starts typing
    if (error) setError('');
  };

  const validateForm = () => {
    // User validation
    if (!formData.name.trim()) {
      setError('Name is required');
      return false;
    }
    if (!formData.email.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.email)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }
    if (!formData.password) {
      setError('Password is required');
      return false;
    }
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter, one uppercase letter, one number, and one special character');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    if (!formData.address.trim()) {
      setError('Address is required');
      return false;
    }
    
    // Store validation
    if (!formData.storeName.trim()) {
      setError('Store name is required');
      return false;
    }
    if (!formData.storeAddress.trim()) {
      setError('Store address is required');
      return false;
    }
    if (!formData.storeCity.trim()) {
      setError('Store city is required');
      return false;
    }
    if (!formData.storeState) {
      setError('Store state is required');
      return false;
    }
    if (!formData.storeZipcode.trim()) {
      setError('Store zip code is required');
      return false;
    }
    if (!/^\d{5}(-\d{4})?$/.test(formData.storeZipcode)) {
      setError('Please enter a valid zip code (12345 or 12345-6789)');
      return false;
    }
    if (!formData.storePhone.trim()) {
      setError('Store phone number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.storePhone.replace(/\D/g, ''))) {
      setError('Please enter a valid 10-digit store phone number');
      return false;
    }
    if (!formData.deaRegistrationNumber.trim()) {
      setError('DEA registration number is required');
      return false;
    }
    if (!/^[A-Z]{2}\d{7}$/.test(formData.deaRegistrationNumber.toUpperCase())) {
      setError('DEA number must be 2 letters followed by 7 digits (e.g., AB1234567)');
      return false;
    }
    if (!formData.npi.trim()) {
      setError('NPI number is required');
      return false;
    }
    if (!/^\d{10}$/.test(formData.npi)) {
      setError('NPI must be exactly 10 digits');
      return false;
    }
    
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const registrationData = {
        // User data
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        phone: formData.phone.replace(/\D/g, ''), // Remove non-digits
        password: formData.password,
        address: formData.address.trim(),
        // Store data
        store: {
          name: formData.storeName.trim(),
          address: formData.storeAddress.trim(),
          city: formData.storeCity.trim(),
          state: formData.storeState,
          zipcode: formData.storeZipcode.trim(),
          phone: formData.storePhone.replace(/\D/g, ''),
          fax: formData.storeFax.replace(/\D/g, '') || null,
          dea_registration_number: formData.deaRegistrationNumber.toUpperCase(),
          npi: formData.npi
        }
      };

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData)
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Registration successful! Please wait for administrator approval before you can log in.');
        // Clear form
        setFormData({
          name: '',
          email: '',
          phone: '',
          password: '',
          confirmPassword: '',
          address: '',
          storeName: '',
          storeAddress: '',
          storeCity: '',
          storeState: '',
          storeZipcode: '',
          storePhone: '',
          storeFax: '',
          deaRegistrationNumber: '',
          npi: ''
        });
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login', { 
            state: { 
              message: 'Registration successful! Please contact your administrator for account activation.' 
            } 
          });
        }, 3000);
      } else {
        setError(data.error || data.errors?.[0]?.msg || 'Registration failed');
      }
    } catch (err) {
      console.error('Registration error:', err);
      setError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPhoneNumber = (value) => {
    const phoneNumber = value.replace(/\D/g, '');
    if (phoneNumber.length < 4) return phoneNumber;
    if (phoneNumber.length < 7) return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3)}`;
    return `${phoneNumber.slice(0, 3)}-${phoneNumber.slice(3, 6)}-${phoneNumber.slice(6, 10)}`;
  };

  const handlePhoneChange = (e) => {
    const formatted = formatPhoneNumber(e.target.value);
    setFormData({
      ...formData,
      phone: formatted
    });
  };

  const handleStateChange = (selectedValue) => {
    setFormData({
      ...formData,
      storeState: selectedValue
    });
    // Clear errors when user makes selection
    if (error) setError('');
  };

  return (
    <div className="login-container">
      <div className="login-card" style={{ maxWidth: '600px' }}>
        {/* Header with Logo */}
        <div className="login-header">
          <div className="login-logo">
            <svg 
              className="pharmatrak-logo"
              viewBox="0 0 400 200" 
              xmlns="http://www.w3.org/2000/svg"
              alt="PharmaTraK - Professional Pharmacy Management System"
              style={{ height: '120px' }}
            >
              <defs>
                <linearGradient id="trayGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#e3f2fd",stopOpacity:1}} />
                  <stop offset="50%" style={{stopColor:"#ffffff",stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#bbdefb",stopOpacity:1}} />
                </linearGradient>
                <linearGradient id="rimGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" style={{stopColor:"#1976d2",stopOpacity:1}} />
                  <stop offset="100%" style={{stopColor:"#2196f3",stopOpacity:1}} />
                </linearGradient>
              </defs>
              <rect width="400" height="200" fill="#f8f9fa"/>
              <rect x="50" y="90" width="300" height="80" rx="8" ry="8" 
                    fill="url(#trayGradient)" stroke="#1976d2" strokeWidth="2"/>
              <text x="200" y="50" textAnchor="middle" 
                    fontFamily="serif" fontSize="38" fontWeight="bold" 
                    fill="#1565c0" style={{letterSpacing: "2px"}}>
                PharmaTraK
              </text>
              <text x="200" y="185" textAnchor="middle" 
                    fontFamily="sans-serif" fontSize="12" fontWeight="normal" 
                    fill="#666" opacity="0.8">
                Create New Profile
              </text>
            </svg>
          </div>
        </div>

        {/* Body */}
        <div className="login-body">
          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}

          {success && (
            <div className="alert alert-success">
              <i className="fas fa-check-circle me-2"></i>
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="name" className="form-label">
                  <i className="fas fa-user me-2"></i>
                  Full Name
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  className="form-control"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Enter your full name"
                  maxLength="100"
                />
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="email" className="form-label">
                  <i className="fas fa-envelope me-2"></i>
                  Email Address
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  className="form-control"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="Enter your email"
                  maxLength="255"
                />
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="phone" className="form-label">
                  <i className="fas fa-phone me-2"></i>
                  Phone Number
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  className="form-control"
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  required
                  placeholder="123-456-7890"
                  maxLength="12"
                />
              </div>

            </div>

            <div className="mb-3">
              <label htmlFor="address" className="form-label">
                <i className="fas fa-map-marker-alt me-2"></i>
                Address
              </label>
              <textarea
                id="address"
                name="address"
                className="form-control"
                value={formData.address}
                onChange={handleChange}
                required
                placeholder="Enter your address"
                rows="2"
                maxLength="500"
              />
            </div>

            {/* Store Information Section */}
            <div className="mb-4">
              <h5 className="mb-3" style={{ color: '#1976d2', borderBottom: '2px solid #e3f2fd', paddingBottom: '8px' }}>
                <i className="fas fa-store me-2"></i>
                Store Information
              </h5>
              
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label htmlFor="storeName" className="form-label">
                    <i className="fas fa-building me-2"></i>
                    Store Name
                  </label>
                  <input
                    type="text"
                    id="storeName"
                    name="storeName"
                    className="form-control"
                    value={formData.storeName}
                    onChange={handleChange}
                    required
                    placeholder="Enter your pharmacy name"
                    maxLength="100"
                  />
                </div>

                <div className="col-md-6 mb-3">
                  <label htmlFor="storePhone" className="form-label">
                    <i className="fas fa-phone me-2"></i>
                    Store Phone
                  </label>
                  <input
                    type="tel"
                    id="storePhone"
                    name="storePhone"
                    className="form-control"
                    value={formData.storePhone}
                    onChange={handleChange}
                    required
                    placeholder="(555) 123-4567"
                    maxLength="14"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label htmlFor="storeAddress" className="form-label">
                  <i className="fas fa-map-marker-alt me-2"></i>
                  Store Address
                </label>
                <textarea
                  id="storeAddress"
                  name="storeAddress"
                  className="form-control"
                  value={formData.storeAddress}
                  onChange={handleChange}
                  required
                  placeholder="Enter your store's complete address"
                  rows="2"
                  maxLength="500"
                />
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="storeCity" className="form-label">
                    <i className="fas fa-city me-2"></i>
                    City
                  </label>
                  <input
                    type="text"
                    id="storeCity"
                    name="storeCity"
                    className="form-control"
                    value={formData.storeCity}
                    onChange={handleChange}
                    required
                    placeholder="City"
                    maxLength="100"
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="storeState" className="form-label">
                    <i className="fas fa-flag-usa me-2"></i>
                    State
                  </label>
                  <PharmaDropdown
                    options={US_STATES_OPTIONS}
                    selectedValue={formData.storeState}
                    onSelectionChange={handleStateChange}
                    placeholder="Select State"
                    variant="outline-secondary"
                    size="md"
                    minWidth="100%"
                    maxMenuHeight="500px"
                    autoSize={true}
                    searchable={false}
                    clearable={false}
                    id="storeState"
                    aria-label="Select store state"
                    className="w-100"
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="storeZipcode" className="form-label">
                    <i className="fas fa-mail-bulk me-2"></i>
                    Zip Code
                  </label>
                  <input
                    type="text"
                    id="storeZipcode"
                    name="storeZipcode"
                    className="form-control"
                    value={formData.storeZipcode}
                    onChange={handleChange}
                    required
                    placeholder="12345"
                    maxLength="10"
                  />
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label htmlFor="storeFax" className="form-label">
                    <i className="fas fa-fax me-2"></i>
                    Fax Number <span className="text-muted">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="storeFax"
                    name="storeFax"
                    className="form-control"
                    value={formData.storeFax}
                    onChange={handleChange}
                    placeholder="(555) 123-4568"
                    maxLength="14"
                  />
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="deaRegistrationNumber" className="form-label">
                    <i className="fas fa-certificate me-2"></i>
                    DEA Registration
                  </label>
                  <input
                    type="text"
                    id="deaRegistrationNumber"
                    name="deaRegistrationNumber"
                    className="form-control"
                    value={formData.deaRegistrationNumber}
                    onChange={handleChange}
                    required
                    placeholder="AB1234567"
                    maxLength="9"
                    style={{ textTransform: 'uppercase' }}
                  />
                  <small className="form-text text-muted">
                    2 letters + 7 digits (e.g., AB1234567)
                  </small>
                </div>

                <div className="col-md-4 mb-3">
                  <label htmlFor="npi" className="form-label">
                    <i className="fas fa-id-card me-2"></i>
                    NPI Number
                  </label>
                  <input
                    type="text"
                    id="npi"
                    name="npi"
                    className="form-control"
                    value={formData.npi}
                    onChange={handleChange}
                    required
                    placeholder="1234567890"
                    maxLength="10"
                  />
                  <small className="form-text text-muted">
                    10-digit National Provider Identifier
                  </small>
                </div>
              </div>
            </div>

            <div className="row">
              <div className="col-md-6 mb-3">
                <label htmlFor="password" className="form-label">
                  <i className="fas fa-lock me-2"></i>
                  Password
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? "text" : "password"}
                    id="password"
                    name="password"
                    className="form-control"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="Create a secure password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    <i className={`fas ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
                <small className="form-text text-muted">
                  Password must be at least 8 characters with uppercase, lowercase, number, and special character.
                </small>
              </div>

              <div className="col-md-6 mb-3">
                <label htmlFor="confirmPassword" className="form-label">
                  <i className="fas fa-lock me-2"></i>
                  Confirm Password
                </label>
                <div className="input-group">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    id="confirmPassword"
                    name="confirmPassword"
                    className="form-control"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                    placeholder="Confirm your password"
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <i className={`fas ${showConfirmPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-success w-100 login-submit-btn mb-3"
              disabled={loading}
              style={{ padding: '12px' }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Creating Profile...
                </>
              ) : (
                <>
                  <i className="fas fa-user-plus me-2"></i>
                  Create New Profile
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="btn btn-outline-primary">
              <i className="fas fa-arrow-left me-2"></i>
              Back to Sign In
            </Link>
          </div>

          <div className="login-footer">
            <small className="text-muted">
              By creating a profile, you agree to the terms of use of this pharmacy management system.
              Your account will require administrator approval before activation.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;