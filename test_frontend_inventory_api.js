/**
 * Test script to verify frontend-backend connectivity for inventory API
 * This simulates what the React frontend should be doing
 */

const axios = require('axios');

async function testInventoryAPI() {
  try {
    console.log('🧪 Testing Inventory API connectivity from frontend perspective...\n');
    
    // Step 1: Login to get token (same as frontend would do)
    console.log('1️⃣ Logging in...');
    const loginResponse = await axios.post('http://localhost:3001/api/auth/login', {
      email: 'admin@pharmatrak.com',
      password: 'Admin123!'
    });
    
    const token = loginResponse.data.token;
    const user = loginResponse.data.user;
    console.log('✅ Login successful:', {
      userId: user.id,
      userName: user.name,
      storeId: user.store_id,
      role: user.role
    });
    
    // Step 2: Call consolidated inventory API (same as frontend)
    console.log('\n2️⃣ Calling consolidated inventory API...');
    const inventoryResponse = await axios.get(
      `http://localhost:3001/api/inventory/store/${user.store_id}/consolidated`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        params: {
          page: 1,
          limit: 100,
          active: true
        }
      }
    );
    
    console.log('✅ API Response successful:', {
      status: inventoryResponse.status,
      success: inventoryResponse.data.success,
      inventoryCount: inventoryResponse.data.data.inventory.length,
      paginationTotal: inventoryResponse.data.data.pagination.total
    });
    
    // Step 3: Display first few inventory items (same structure frontend should receive)
    console.log('\n3️⃣ Sample inventory items:');
    const inventory = inventoryResponse.data.data.inventory;
    inventory.slice(0, 3).forEach((item, index) => {
      console.log(`   ${index + 1}. ${item.generic_name} (${item.brand_name}) - ${item.quantity_on_hand} units`);
    });
    
    console.log('\n🎉 Frontend-Backend connectivity test PASSED');
    console.log('✅ The inventory API is working correctly');
    console.log('❗ Issue must be in React component logic or browser environment');
    
  } catch (error) {
    console.error('❌ Frontend-Backend connectivity test FAILED:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data
    });
  }
}

testInventoryAPI();