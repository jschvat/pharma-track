import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { initializeAllDropdownEnhancements, closeAllDropdowns } from './utils/dropdownUtils';
import ProtectedRoute from './components/ProtectedRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import StateCount from './components/StateCount';
import BrowseDrugs from './components/BrowseDrugs';
import NDCAuditReport from './components/NDCAuditReport';
import FDASearch from './components/FDASearch';
import UserManagement from './components/UserManagement';
import AdminStores from './components/AdminStores';
import AdminSettings from './components/AdminSettings';
import DebugStores from './components/DebugStores';
import DropdownRouteHandler from './components/DropdownRouteHandler';
import './App.css';
import './theme.css';
import './css/dropdown-clean.css';

function App() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Disable dropdown enhancements for now
  /*
  useEffect(() => {
    initializeAllDropdownEnhancements();
  }, []);
  */

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <div className="app-container">
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route 
                path="/*" 
                element={
                  <ProtectedRoute>
                    <div className="app-container">
                      <Sidebar 
                        collapsed={sidebarCollapsed}
                        onToggle={toggleSidebar}
                        mobileOpen={mobileMenuOpen}
                        onMobileToggle={toggleMobileMenu}
                      />
                      <div className="main-content">
                        <Header 
                          onMenuToggle={toggleMobileMenu}
                          onSidebarToggle={toggleSidebar}
                        />
                        <div className="content-area">
                          <Routes>
                            <Route path="/dashboard" element={<Dashboard />} />
                            <Route path="/inventory" element={<Inventory />} />
                            <Route path="/inventory/state-count" element={<StateCount />} />
                            <Route path="/drugs" element={<BrowseDrugs />} />
                            <Route path="/drugs/add" element={<FDASearch />} />
                            <Route path="/audit/ndc" element={<NDCAuditReport />} />
                            <Route path="/drugs/search" element={<FDASearch />} />
                            <Route path="/admin/users" element={<UserManagement />} />
                            <Route path="/admin/stores" element={<AdminStores />} />
                            <Route path="/admin/settings" element={<AdminSettings />} />
                            <Route path="/debug/stores" element={<DebugStores />} />
                            {/* Catch all route */}
                            <Route path="*" element={<Navigate to="/dashboard" replace />} />
                          </Routes>
                        </div>
                      </div>
                    </div>
                  </ProtectedRoute>
                } 
              />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
