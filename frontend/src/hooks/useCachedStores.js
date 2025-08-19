import { useState, useEffect } from 'react';
import { useCache } from '../contexts/CacheContext';
import { storeAccessAPI } from '../services/api';

export const useCachedStores = () => {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { getCachedData, setCachedData } = useCache();
  
  // Cache stores for 10 minutes (stores don't change frequently)
  const CACHE_TTL = 10 * 60 * 1000;
  
  useEffect(() => {
    loadStores();
  }, []);
  
  const loadStores = async (forceRefresh = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Check cache first unless force refresh is requested
      if (!forceRefresh) {
        const cachedStores = getCachedData('stores', {}, CACHE_TTL);
        if (cachedStores) {
          setStores(cachedStores);
          setLoading(false);
          return cachedStores;
        }
      }
      
      // Fetch from API
      const response = await storeAccessAPI.getMyStores();
      const storesData = response.data.stores || [];
      
      // Update state and cache
      setStores(storesData);
      setCachedData('stores', {}, storesData);
      
      return storesData;
      
    } catch (err) {
      console.error('Failed to load stores:', err);
      setError('Failed to load stores');
      setStores([]);
      throw err;
    } finally {
      setLoading(false);
    }
  };
  
  return {
    stores,
    loading,
    error,
    loadStores,
    refreshStores: () => loadStores(true)
  };
};