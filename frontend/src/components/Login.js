import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import '../css/components.css';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password, formData.rememberMe);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Development mode auto-fill function
  const handleDemoFill = () => {
    setFormData({
      email: 'admin@pharmatrak.com',
      password: 'Admin123!',
      rememberMe: false
    });
    setError(''); // Clear any existing errors
  };

  // Check if we're in development mode
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.REACT_APP_ENV === 'development';

  return (
    <div className="login-container">
      <div className="login-card">
        {/* Header */}
        <div className="login-header">
          <div className="login-icon">
            <i className="fas fa-pills"></i>
          </div>
          <h2 className="login-title">PharmaTraK</h2>
          <p className="login-subtitle">
            Professional Pharmacy Management
          </p>
        </div>

        {/* Body */}
        <div className="login-body">
          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          
          {/* Development mode demo credentials auto-fill */}
          {isDevelopment && (
            <div className="alert alert-info border-0 mb-3" style={{ 
              background: 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
              borderLeft: '4px solid #2196f3'
            }}>
              <div className="d-flex align-items-center justify-content-between">
                <small className="mb-0">
                  <i className="fas fa-code me-2"></i>
                  <strong>Development Mode</strong>
                </small>
                <button
                  type="button"
                  className="btn btn-sm btn-outline-primary"
                  onClick={handleDemoFill}
                  style={{
                    fontSize: '0.75rem',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '20px',
                    fontWeight: '600'
                  }}
                >
                  <i className="fas fa-user-cog me-1"></i>
                  Fill Demo Admin
                </button>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
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
                autoComplete="email"
              />
            </div>

            <div className="mb-3">
              <label htmlFor="password" className="form-label">
                <i className="fas fa-lock me-2"></i>
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
                autoComplete="current-password"
              />
            </div>

            <div className="mb-4">
              <div className="form-check">
                <input
                  type="checkbox"
                  name="rememberMe"
                  className="form-check-input"
                  id="rememberMe"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                />
                <label className="form-check-label" htmlFor="rememberMe">
                  <i className="fas fa-clock me-2"></i>
                  Remember me for 30 days
                </label>
              </div>
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100 login-submit-btn"
              disabled={loading}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2"></span>
                  Signing in...
                </>
              ) : (
                <>
                  <i className="fas fa-sign-in-alt me-2"></i>
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="login-footer">
            <small className="text-muted">
              Secure pharmacy management system
            </small>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;