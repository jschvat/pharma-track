import React, { createContext, useContext, useState, useCallback } from 'react';

const CacheContext = createContext();

export const useCache = () => {
  const context = useContext(CacheContext);
  if (!context) {
    throw new Error('useCache must be used within a CacheProvider');
  }
  return context;
};

export const CacheProvider = ({ children }) => {
  const [cache, setCache] = useState(new Map());
  const [cacheTimestamps, setCacheTimestamps] = useState(new Map());

  // Default cache TTL: 10 minutes for most data
  const DEFAULT_TTL = 10 * 60 * 1000; // 10 minutes in milliseconds

  const getCacheKey = useCallback((key, params = {}) => {
    const paramString = JSON.stringify(params, Object.keys(params).sort());
    return `${key}_${paramString}`;
  }, []);

  const isCacheValid = useCallback((key, ttl = DEFAULT_TTL) => {
    const timestamp = cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < ttl;
  }, [cacheTimestamps]);

  const getCachedData = useCallback((key, params = {}, ttl = DEFAULT_TTL) => {
    const cacheKey = getCacheKey(key, params);
    
    if (cache.has(cacheKey) && isCacheValid(cacheKey, ttl)) {
      // console.log(`🎯 Cache hit for: ${cacheKey}`);
      return cache.get(cacheKey);
    }
    
    // console.log(`🔍 Cache miss for: ${cacheKey}`);
    return null;
  }, [cache, getCacheKey, isCacheValid]);

  const setCachedData = useCallback((key, params = {}, data) => {
    const cacheKey = getCacheKey(key, params);
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.set(cacheKey, data);
      return newCache;
    });
    
    setCacheTimestamps(prevTimestamps => {
      const newTimestamps = new Map(prevTimestamps);
      newTimestamps.set(cacheKey, Date.now());
      return newTimestamps;
    });
    
    // console.log(`💾 Cached data for: ${cacheKey}`);
  }, [getCacheKey]);

  const invalidateCache = useCallback((key, params = {}) => {
    const cacheKey = getCacheKey(key, params);
    
    setCache(prevCache => {
      const newCache = new Map(prevCache);
      newCache.delete(cacheKey);
      return newCache;
    });
    
    setCacheTimestamps(prevTimestamps => {
      const newTimestamps = new Map(prevTimestamps);
      newTimestamps.delete(cacheKey);
      return newTimestamps;
    });
    
    // console.log(`🗑️ Invalidated cache for: ${cacheKey}`);
  }, [getCacheKey]);

  const clearCache = useCallback(() => {
    setCache(new Map());
    setCacheTimestamps(new Map());
    // console.log('🧹 Cleared all cache');
  }, []);

  const getCacheStats = useCallback(() => {
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
      timestamps: Object.fromEntries(cacheTimestamps)
    };
  }, [cache, cacheTimestamps]);

  const value = {
    getCachedData,
    setCachedData,
    invalidateCache,
    clearCache,
    getCacheStats,
    DEFAULT_TTL
  };

  return (
    <CacheContext.Provider value={value}>
      {children}
    </CacheContext.Provider>
  );
};