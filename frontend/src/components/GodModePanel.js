/**
 * God Mode Panel Component
 * 
 * Provides god mode interface for super administrators:
 * - Store switching dropdown
 * - System-wide statistics dashboard
 * - Quick access to admin functions
 * - Real-time god mode session status
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../css/god-mode.css';

const GodModePanel = () => {
    const { user, updateStoreContext } = useAuth();
    const [isGodMode, setIsGodMode] = useState(false);
    const [stores, setStores] = useState([]);
    const [currentContext, setCurrentContext] = useState(null);
    const [systemStats, setSystemStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [switchingStore, setSwitchingStore] = useState(false);
    const [error, setError] = useState(null);

    // Check if user has god mode privileges
    useEffect(() => {
        const checkGodMode = () => {
            if (user && user.role === 'god_mode') {
                setIsGodMode(true);
                fetchGodModeData();
            } else {
                setIsGodMode(false);
                setLoading(false);
            }
        };

        checkGodMode();
    }, [user]);

    // Fetch all god mode data
    const fetchGodModeData = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            
            const token = localStorage.getItem('token');
            const headers = {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            };

            // Fetch accessible stores
            const storesResponse = await fetch('/api/god-mode/stores', { headers });
            if (!storesResponse.ok) throw new Error('Failed to fetch stores');
            const storesData = await storesResponse.json();

            // Fetch current context
            const contextResponse = await fetch('/api/god-mode/current-context', { headers });
            if (!contextResponse.ok) throw new Error('Failed to fetch context');
            const contextData = await contextResponse.json();

            // Fetch system statistics
            const statsResponse = await fetch('/api/god-mode/stats', { headers });
            if (!statsResponse.ok) throw new Error('Failed to fetch stats');
            const statsData = await statsResponse.json();

            setStores(storesData.stores || []);
            setCurrentContext(contextData.context || null);
            setSystemStats(statsData.stats || null);
            
        } catch (error) {
            console.error('Error fetching god mode data:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    }, []);

    // Handle store switching
    const handleStoreSwitch = async (targetStoreId) => {
        if (!targetStoreId || switchingStore) return;

        try {
            setSwitchingStore(true);
            setError(null);

            const token = localStorage.getItem('token');
            const response = await fetch('/api/god-mode/switch-store', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ target_store_id: parseInt(targetStoreId) })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.details || 'Store switch failed');
            }

            const result = await response.json();
            
            // Update context and notify auth context
            setCurrentContext(prev => ({
                ...prev,
                current_store_id: result.store_id,
                current_store_name: result.store_name,
                is_god_mode_session: true
            }));

            // Update auth context with new store
            if (updateStoreContext) {
                updateStoreContext({
                    store_id: result.store_id,
                    store_name: result.store_name
                });
            }

            // Show success message
            showNotification(`Successfully switched to ${result.store_name}`, 'success');
            
        } catch (error) {
            console.error('Error switching store:', error);
            setError(error.message);
            showNotification(`Store switch failed: ${error.message}`, 'error');
        } finally {
            setSwitchingStore(false);
        }
    };

    // Show notification (you can replace this with your notification system)
    const showNotification = (message, type) => {
        // For now, just use alert - replace with proper notification system
        console.log(`${type.toUpperCase()}: ${message}`);
        
        // Create a temporary notification element
        const notification = document.createElement('div');
        notification.className = `god-mode-notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 3000);
    };

    // Refresh data periodically
    useEffect(() => {
        if (!isGodMode) return;

        const interval = setInterval(() => {
            fetchGodModeData();
        }, 30000); // Refresh every 30 seconds

        return () => clearInterval(interval);
    }, [isGodMode, fetchGodModeData]);

    // Don't render if not god mode user
    if (!isGodMode) {
        return null;
    }

    if (loading) {
        return (
            <div className=\"god-mode-panel loading\">
                <div className=\"god-mode-header\">
                    <h3>🛡️ God Mode</h3>
                </div>
                <div className=\"loading-spinner\">Loading god mode panel...</div>
            </div>
        );
    }

    if (error) {
        return (
            <div className=\"god-mode-panel error\">
                <div className=\"god-mode-header\">
                    <h3>🛡️ God Mode</h3>
                </div>
                <div className=\"error-message\">
                    Error: {error}
                    <button onClick={fetchGodModeData} className=\"retry-button\">
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className=\"god-mode-panel\">
            <div className=\"god-mode-header\">
                <h3>🛡️ God Mode Panel</h3>
                <span className=\"god-mode-badge\">SUPER ADMIN</span>
            </div>

            {/* Current Context Display */}
            {currentContext && (
                <div className=\"current-context\">
                    <h4>Current Context</h4>
                    <div className=\"context-info\">
                        <div className=\"context-item\">
                            <strong>Store:</strong> 
                            <span className=\"store-name\">
                                {currentContext.current_store_name}
                                {currentContext.is_god_mode_session && (
                                    <span className=\"god-session-indicator\">👑</span>
                                )}
                            </span>
                        </div>
                        {currentContext.current_store_id !== currentContext.original_store_id && (
                            <div className=\"context-item\">
                                <strong>Original Store:</strong> 
                                <span>{currentContext.original_store_name}</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Store Switching */}
            <div className=\"store-switcher\">
                <h4>Switch Store Context</h4>
                <div className=\"switcher-controls\">
                    <select 
                        value={currentContext?.current_store_id || ''} 
                        onChange={(e) => handleStoreSwitch(e.target.value)}
                        disabled={switchingStore}
                        className=\"store-select\"
                    >
                        <option value=\"\">Select Store...</option>
                        {stores.map(store => (
                            <option key={store.id} value={store.id}>
                                {store.name} ({store.user_count} users, {store.drug_count} drugs)
                            </option>
                        ))}
                    </select>
                    {switchingStore && (
                        <div className=\"switching-indicator\">
                            <span className=\"spinner\">⏳</span> Switching...
                        </div>
                    )}
                </div>
                <div className=\"store-count\">
                    Access to <strong>{stores.length}</strong> stores
                </div>
            </div>

            {/* System Statistics */}
            {systemStats && (
                <div className=\"system-stats\">
                    <h4>System Overview</h4>
                    <div className=\"stats-grid\">
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.total_stores}</span>
                            <span className=\"stat-label\">Stores</span>
                        </div>
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.total_users}</span>
                            <span className=\"stat-label\">Users</span>
                        </div>
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.god_mode_users}</span>
                            <span className=\"stat-label\">God Mode</span>
                        </div>
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.total_drugs}</span>
                            <span className=\"stat-label\">Drugs</span>
                        </div>
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.total_inventory?.toLocaleString()}</span>
                            <span className=\"stat-label\">Total Inventory</span>
                        </div>
                        <div className=\"stat-item\">
                            <span className=\"stat-value\">{systemStats.active_god_sessions}</span>
                            <span className=\"stat-label\">Active Sessions</span>
                        </div>
                    </div>
                </div>
            )}

            {/* Quick Actions */}
            <div className=\"quick-actions\">
                <h4>Quick Actions</h4>
                <div className=\"action-buttons\">
                    <button 
                        className=\"action-btn view-users\"
                        onClick={() => window.location.href = '/god-mode/users'}
                    >
                        👥 Manage Users
                    </button>
                    <button 
                        className=\"action-btn view-drugs\"
                        onClick={() => window.location.href = '/god-mode/drugs'}
                    >
                        💊 Manage Drugs
                    </button>
                    <button 
                        className=\"action-btn view-transactions\"
                        onClick={() => window.location.href = '/god-mode/transactions'}
                    >
                        📋 View Transactions
                    </button>
                    <button 
                        className=\"action-btn view-audit\"
                        onClick={() => window.location.href = '/god-mode/audit'}
                    >
                        🔍 Audit Log
                    </button>
                </div>
            </div>

            {/* Refresh Controls */}
            <div className=\"refresh-controls\">
                <button 
                    onClick={fetchGodModeData} 
                    className=\"refresh-btn\"
                    disabled={loading}
                >
                    🔄 Refresh Data
                </button>
                <small className=\"last-updated\">
                    Auto-refresh every 30 seconds
                </small>
            </div>
        </div>
    );
};

export default GodModePanel;