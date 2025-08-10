import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await login(formData.email, formData.password);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleTestLogin = () => {
    setFormData({
      email: 'admin@pharmatrak.com',
      password: 'Admin123!'
    });
  };

  return (
    <div className="login-container" style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, var(--granite-dark) 0%, var(--granite-medium) 50%, var(--granite-light) 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="login-card" style={{
        width: '100%',
        maxWidth: '400px',
        background: 'var(--bg-secondary)',
        borderRadius: '16px',
        boxShadow: 'var(--shadow-lg)',
        overflow: 'hidden'
      }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, var(--granite-dark) 0%, var(--granite-medium) 100%)',
          color: 'var(--text-white)',
          padding: '2rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>
            <i className="fas fa-pills" style={{ color: 'var(--granite-accent)' }}></i>
          </div>
          <h2 style={{ margin: 0, fontWeight: '600' }}>PharmaTraK</h2>
          <p style={{ margin: '0.5rem 0 0 0', opacity: '0.9', fontSize: '0.9rem' }}>
            Professional Pharmacy Management
          </p>
        </div>

        {/* Body */}
        <div style={{ padding: '2rem' }}>
          {error && (
            <div className="alert alert-danger">
              <i className="fas fa-exclamation-circle me-2"></i>
              {error}
            </div>
          )}
          
          <div className="alert alert-info">
            <div style={{ marginBottom: '0.5rem' }}>
              <strong>Demo Credentials:</strong>
            </div>
            <div style={{ fontSize: '0.85rem', marginBottom: '1rem' }}>
              Email: <code>admin@pharmatrak.com</code><br />
              Password: <code>Admin123!</code>
            </div>
            <button 
              className="btn btn-outline-primary btn-sm"
              onClick={handleTestLogin}
              type="button"
            >
              <i className="fas fa-user me-1"></i>
              Use Demo Credentials
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">
                <i className="fas fa-envelope me-2"></i>
                Email Address
              </label>
              <input
                type="email"
                name="email"
                className="form-control"
                value={formData.email}
                onChange={handleChange}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">
                <i className="fas fa-lock me-2"></i>
                Password
              </label>
              <input
                type="password"
                name="password"
                className="form-control"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder="Enter your password"
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary w-100"
              disabled={loading}
              style={{ 
                padding: '0.75rem',
                fontSize: '1rem',
                fontWeight: '600'
              }}
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

          <div style={{ textAlign: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-light)' }}>
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