import React, { useState, useEffect } from 'react';
import { storeAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

const DebugStores = () => {
  const { isAdmin } = useAuth();
  const [status, setStatus] = useState('Loading...');
  
  useEffect(() => {
    if (!isAdmin()) {
      setStatus('Not admin');
      return;
    }

    const loadStores = async () => {
      try {
        console.log('🔍 DebugStores: About to call storeAPI.getAll...');
        setStatus('Calling API...');
        
        const params = {
          page: 1,
          limit: 10
        };
        
        console.log('🔍 DebugStores: Calling with params:', params);
        const response = await storeAPI.getAll(params);
        
        console.log('🔍 DebugStores: API response received:', response);
        setStatus(`Success! Got ${response.data?.stores?.length || 0} stores`);
        
      } catch (error) {
        console.error('🔍 DebugStores: Error occurred:', error);
        setStatus(`Error: ${error.message}`);
      }
    };
    
    loadStores();
  }, [isAdmin]);

  return (
    <div style={{ padding: '20px' }}>
      <h2>Debug Stores API Test</h2>
      <p>Status: {status}</p>
      <p>Check console for detailed logs</p>
    </div>
  );
};

export default DebugStores;