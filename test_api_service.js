/**
 * Test the exact structure returned by the inventoryAPI service
 * This will help identify any discrepancies in the response handling
 */

// Since this is a backend test, we'll simulate the frontend API service behavior
const axios = require('axios');

// Simulate the same API setup as the frontend
const API_BASE_URL = 'http://localhost:3001/api';

// Create axios instance similar to frontend
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

// Add auth token interceptor (simulate frontend behavior)
api.interceptors.request.use((config) => {
  const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEsImlhdCI6MTc1NTYyNDU0OSwiZXhwIjoxNzU1NzEwOTQ5fQ.4E36dxdHGxmqvKZKPrbqdmwCD6sB-lNS6PM2seHqTJg';
  config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Simulate the exact inventoryAPI.getConsolidated call
const inventoryAPI = {
  getConsolidated: (storeId, params) => api.get(`/inventory/store/${storeId}/consolidated`, { params })
};

async function testAPIService() {
  try {
    console.log('🧪 Testing inventoryAPI service structure...\n');
    
    const storeId = 1;
    const params = {
      page: 1,
      limit: 100,
      active: true
    };
    
    console.log('📡 Making API call with exact frontend parameters:', {
      storeId,
      params,
      fullUrl: `${API_BASE_URL}/inventory/store/${storeId}/consolidated`
    });
    
    // This should exactly match what the frontend does
    const response = await inventoryAPI.getConsolidated(storeId, params);
    
    console.log('✅ Response received. Analyzing structure...\n');
    
    console.log('📊 RESPONSE ANALYSIS:');
    console.log('Response type:', typeof response);
    console.log('Response status:', response.status);
    console.log('Response data type:', typeof response.data);
    
    console.log('\n📋 RESPONSE.DATA KEYS:');
    if (response.data && typeof response.data === 'object') {
      console.log(Object.keys(response.data));
    }
    
    console.log('\n🎯 CRITICAL PATH ANALYSIS:');
    console.log('response.data:', !!response.data);
    console.log('response.data.success:', response.data?.success);
    console.log('response.data.data:', !!response.data?.data);
    
    if (response.data?.data) {
      console.log('response.data.data keys:', Object.keys(response.data.data));
      console.log('response.data.data.inventory:', !!response.data.data.inventory);
      console.log('response.data.data.inventory is array:', Array.isArray(response.data.data.inventory));
      console.log('response.data.data.inventory length:', response.data.data.inventory?.length);
    }
    
    console.log('\n💾 FIRST INVENTORY ITEM:');
    const inventoryArray = response.data?.data?.inventory;
    if (inventoryArray && inventoryArray.length > 0) {
      console.log('First item keys:', Object.keys(inventoryArray[0]));
      console.log('First item sample:', {
        id: inventoryArray[0].id,
        generic_name: inventoryArray[0].generic_name,
        quantity_on_hand: inventoryArray[0].quantity_on_hand
      });
    }
    
    console.log('\n🔍 EXACT FRONTEND CODE PATH TEST:');
    const data = response.data.data;
    const newInventory = data.inventory || [];
    console.log('data variable:', !!data);
    console.log('newInventory variable:', !!newInventory);
    console.log('newInventory is array:', Array.isArray(newInventory));
    console.log('newInventory length:', newInventory.length);
    
    console.log('\n✅ This is exactly what the frontend inventoryAPI.getConsolidated() returns');
    
  } catch (error) {
    console.error('❌ API Service Test Failed:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
  }
}

testAPIService();