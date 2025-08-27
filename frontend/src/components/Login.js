import React, { useState, useEffect } from 'react';
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
  const [isTransitioningToRegister, setIsTransitioningToRegister] = useState(false);
  const [showLoginForm, setShowLoginForm] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  // Cleanup classes on component mount (returning from register) and unmount
  useEffect(() => {
    // Immediately disable transitions and clean up classes when returning from register
    document.documentElement.classList.remove('login-fullscreen-transition');
    document.body.classList.remove('login-fullscreen-transition');
    
    // Force immediate layout reset with no transitions
    const loginContainer = document.querySelector('.login-container');
    if (loginContainer) {
      loginContainer.style.transition = 'none';
      loginContainer.classList.remove('fullscreen-transition');
      
      // Re-enable transitions after a brief moment
      setTimeout(() => {
        loginContainer.style.transition = '';
      }, 50);
    }
    
    // For now, disable fade-in to test dropdown issue
    setShowLoginForm(true);
    
    return () => {
      document.documentElement.classList.remove('login-fullscreen-transition');
      document.body.classList.remove('login-fullscreen-transition');
    };
  }, []);

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

  // Handle registration link click with 3-stage transition
  const handleRegisterClick = (e) => {
    e.preventDefault();
    setIsTransitioningToRegister(true);
    
    // Add classes to html and body to prevent interference
    document.documentElement.classList.add('login-fullscreen-transition');
    document.body.classList.add('login-fullscreen-transition');
    
    // Stage 1: Login form immediately disappears
    // Stage 2: Blue container will expand (slow) 
    // Then navigate to register for stage 3
    setTimeout(() => {
      navigate('/register');
    }, 200); // Brief delay to let blue expansion start, then navigate
  };

  return (
    <div className={`login-container ${isTransitioningToRegister ? 'fullscreen-transition' : ''}`}>
        <div className={`login-card ${isTransitioningToRegister ? 'expanding' : ''} ${showLoginForm ? 'fade-in' : 'fade-out'}`}>
        {/* Header */}
        <div className="login-header">
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

          {/* Create New Profile Button */}
          <div className="text-center mb-3">
            <div className="d-flex align-items-center my-3">
              <div className="border-top flex-grow-1"></div>
              <span className="px-3 text-muted small">or</span>
              <div className="border-top flex-grow-1"></div>
            </div>
            
            <button
              onClick={handleRegisterClick}
              className="btn btn-outline-success w-100"
              disabled={isTransitioningToRegister}
              style={{
                borderColor: '#28a745',
                color: '#28a745',
                fontWeight: '500',
                padding: '10px 20px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
            >
              <i className="fas fa-user-plus me-2"></i>
              {isTransitioningToRegister ? 'Loading...' : 'Create New Profile'}
            </button>
            
            <small className="d-block text-muted mt-2">
              New to PharmaTraK? Create your account here
            </small>
          </div>

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