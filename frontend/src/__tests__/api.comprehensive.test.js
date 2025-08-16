import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import { 
  authAPI, 
  userAPI, 
  drugAPI, 
  inventoryAPI, 
  auditAPI, 
  storeAPI 
} from '../services/api';

// Create axios mock
const mockAxios = new MockAdapter(axios);

describe('API Integration - Comprehensive Tests', () => {
  beforeEach(() => {
    mockAxios.reset();
    localStorage.clear();
  });

  afterEach(() => {
    mockAxios.reset();
  });

  describe('🔐 Authentication API Tests', () => {
    describe('Login API', () => {
      it('should handle successful login', async () => {
        const mockResponse = {
          token: 'jwt-token-123',
          user: {
            id: 1,
            name: 'Test User',
            email: 'test@example.com',
            role: 'admin'
          }
        };

        mockAxios.onPost('/auth/login').reply(200, mockResponse);

        const result = await authAPI.login('test@example.com', 'password123');
        
        expect(result.data).toEqual(mockResponse);
        expect(mockAxios.history.post[0].data).toBe(JSON.stringify({
          email: 'test@example.com',
          password: 'password123'
        }));
      });

      it('should handle login failure with 401', async () => {
        mockAxios.onPost('/auth/login').reply(401, { error: 'Invalid credentials' });

        await expect(authAPI.login('test@example.com', 'wrongpassword'))
          .rejects.toHaveProperty('response.status', 401);
      });

      it('should handle rate limiting with 429', async () => {
        mockAxios.onPost('/auth/login').reply(429, { 
          error: 'Too many attempts. Try again in 15 minutes.' 
        });

        await expect(authAPI.login('test@example.com', 'password123'))
          .rejects.toHaveProperty('response.status', 429);
      });

      it('should handle server errors with 500', async () => {
        mockAxios.onPost('/auth/login').reply(500, { error: 'Internal server error' });

        await expect(authAPI.login('test@example.com', 'password123'))
          .rejects.toHaveProperty('response.status', 500);
      });

      it('should handle network timeout', async () => {
        mockAxios.onPost('/auth/login').timeout();

        await expect(authAPI.login('test@example.com', 'password123'))
          .rejects.toHaveProperty('code', 'ECONNABORTED');
      });

      it('should handle malformed request data', async () => {
        mockAxios.onPost('/auth/login').reply(400, { 
          error: 'Invalid request format' 
        });

        await expect(authAPI.login('', ''))
          .rejects.toHaveProperty('response.status', 400);
      });
    });

    describe('Profile API', () => {
      it('should fetch user profile successfully', async () => {
        const mockProfile = {
          id: 1,
          name: 'Test User',
          email: 'test@example.com',
          role: 'admin',
          store_id: 1
        };

        mockAxios.onGet('/auth/me').reply(200, { user: mockProfile });

        const result = await authAPI.getProfile();
        expect(result.data.user).toEqual(mockProfile);
      });

      it('should handle unauthorized profile access', async () => {
        mockAxios.onGet('/auth/me').reply(401, { error: 'Unauthorized' });

        await expect(authAPI.getProfile())
          .rejects.toHaveProperty('response.status', 401);
      });
    });

    describe('Logout API', () => {
      it('should handle successful logout', async () => {
        mockAxios.onPost('/auth/logout').reply(200, { message: 'Logged out successfully' });

        const result = await authAPI.logout();
        expect(result.data.message).toBe('Logged out successfully');
      });
    });
  });

  describe('👥 User Management API Tests', () => {
    describe('Get Users API', () => {
      it('should fetch users with pagination', async () => {
        const mockUsers = {
          users: [
            { id: 1, name: 'User 1', email: 'user1@test.com', role: 'user' },
            { id: 2, name: 'User 2', email: 'user2@test.com', role: 'admin' }
          ],
          pagination: { page: 1, pages: 1, total: 2 }
        };

        mockAxios.onGet('/users').reply(200, mockUsers);

        const result = await userAPI.getAll({ page: 1, limit: 10 });
        expect(result.data).toEqual(mockUsers);
      });

      it('should handle user search with filters', async () => {
        const searchParams = { search: 'admin', role: 'admin', active: true };
        
        mockAxios.onGet('/users').reply(config => {
          const params = new URLSearchParams(config.params);
          expect(params.get('search')).toBe('admin');
          expect(params.get('role')).toBe('admin');
          expect(params.get('active')).toBe('true');
          
          return [200, { users: [], pagination: { total: 0 } }];
        });

        await userAPI.getAll(searchParams);
      });

      it('should handle empty user list', async () => {
        mockAxios.onGet('/users').reply(200, { users: [], pagination: { total: 0 } });

        const result = await userAPI.getAll();
        expect(result.data.users).toHaveLength(0);
      });
    });

    describe('Create User API', () => {
      it('should create user successfully', async () => {
        const newUser = {
          name: 'New User',
          email: 'newuser@test.com',
          phone: '5551234567',
          password: 'StrongPass123!',
          address: '123 Test St',
          role: 'user',
          store_id: 1
        };

        mockAxios.onPost('/users').reply(201, { 
          id: 3, 
          message: 'User created successfully' 
        });

        const result = await userAPI.create(newUser);
        expect(result.data.id).toBe(3);
        expect(JSON.parse(mockAxios.history.post[0].data)).toMatchObject(newUser);
      });

      it('should handle duplicate email error', async () => {
        mockAxios.onPost('/users').reply(409, { error: 'Email already exists' });

        await expect(userAPI.create({ email: 'existing@test.com' }))
          .rejects.toHaveProperty('response.status', 409);
      });

      it('should handle validation errors', async () => {
        mockAxios.onPost('/users').reply(400, { 
          errors: [
            { field: 'email', message: 'Invalid email format' },
            { field: 'password', message: 'Password too weak' }
          ]
        });

        await expect(userAPI.create({ email: 'invalid', password: 'weak' }))
          .rejects.toHaveProperty('response.status', 400);
      });
    });

    describe('Update User API', () => {
      it('should update user successfully', async () => {
        const updates = { name: 'Updated Name', phone: '5559876543' };
        
        mockAxios.onPut('/users/1').reply(200, { 
          message: 'User updated successfully' 
        });

        const result = await userAPI.update(1, updates);
        expect(result.data.message).toBe('User updated successfully');
        expect(JSON.parse(mockAxios.history.put[0].data)).toMatchObject(updates);
      });

      it('should handle user not found', async () => {
        mockAxios.onPut('/users/999').reply(404, { error: 'User not found' });

        await expect(userAPI.update(999, { name: 'Test' }))
          .rejects.toHaveProperty('response.status', 404);
      });
    });

    describe('Delete User API', () => {
      it('should delete user successfully (soft delete)', async () => {
        mockAxios.onDelete('/users/2').reply(200, { 
          message: 'User deactivated successfully' 
        });

        const result = await userAPI.delete(2);
        expect(result.data.message).toBe('User deactivated successfully');
      });

      it('should prevent admin deletion by regular user', async () => {
        mockAxios.onDelete('/users/1').reply(403, { 
          error: 'Admin users cannot be deleted. To remove admin access, change their role to user instead.' 
        });

        await expect(userAPI.delete(1))
          .rejects.toHaveProperty('response.status', 403);
      });

      it('should prevent deletion of last admin', async () => {
        mockAxios.onDelete('/users/1').reply(400, { 
          error: 'Cannot delete the last admin for this store. Each store must have at least one admin.' 
        });

        await expect(userAPI.delete(1))
          .rejects.toHaveProperty('response.status', 400);
      });
    });

    describe('Password Update API', () => {
      it('should update password successfully', async () => {
        mockAxios.onPut('/users/1/password').reply(200, { 
          message: 'Password updated successfully' 
        });

        const result = await userAPI.updatePassword(1, { new_password: 'NewStrongPass123!' });
        expect(result.data.message).toBe('Password updated successfully');
      });

      it('should handle weak password validation', async () => {
        mockAxios.onPut('/users/1/password').reply(400, { 
          errors: [{ field: 'password', message: 'Password does not meet requirements' }]
        });

        await expect(userAPI.updatePassword(1, { new_password: 'weak' }))
          .rejects.toHaveProperty('response.status', 400);
      });
    });
  });

  describe('💊 Drug API Tests', () => {
    describe('Drug Search API', () => {
      it('should search drugs successfully', async () => {
        const mockDrugs = {
          drugs: [
            { id: 1, ndc: '12345-678-90', generic_name: 'Test Drug', brand_name: 'Brand Drug' }
          ],
          pagination: { page: 1, pages: 1, total: 1 }
        };

        mockAxios.onGet('/drugs/search').reply(200, mockDrugs);

        const result = await drugAPI.search('test drug');
        expect(result.data).toEqual(mockDrugs);
      });

      it('should handle no search results', async () => {
        mockAxios.onGet('/drugs/search').reply(200, { drugs: [], pagination: { total: 0 } });

        const result = await drugAPI.search('nonexistent drug');
        expect(result.data.drugs).toHaveLength(0);
      });
    });

    describe('FDA Search API', () => {
      it('should search FDA database successfully', async () => {
        const mockFDAResults = {
          results: [
            {
              product_ndc: '12345-678-90',
              generic_name: 'Test Generic',
              labeler_name: 'Test Manufacturer'
            }
          ]
        };

        mockAxios.onGet('/drugs/fda/search').reply(200, mockFDAResults);

        const result = await drugAPI.searchFDA('test drug');
        expect(result.data.results).toHaveLength(1);
      });

      it('should handle FDA API errors', async () => {
        mockAxios.onGet('/drugs/fda/search').reply(503, { 
          error: 'FDA API temporarily unavailable' 
        });

        await expect(drugAPI.searchFDA('test'))
          .rejects.toHaveProperty('response.status', 503);
      });
    });

    describe('Drug Validation API', () => {
      it('should check if drugs exist', async () => {
        const ndcList = ['12345-678-90', '98765-432-10'];
        
        mockAxios.onPost('/drugs/check-exist').reply(200, {
          existingNDCs: ['12345-678-90'],
          newNDCs: ['98765-432-10']
        });

        const result = await drugAPI.checkDrugsExist(ndcList);
        expect(result.data.existingNDCs).toContain('12345-678-90');
        expect(result.data.newNDCs).toContain('98765-432-10');
      });
    });
  });

  describe('📦 Inventory API Tests', () => {
    describe('Inventory Retrieval API', () => {
      it('should get store inventory successfully', async () => {
        const mockInventory = {
          inventory: [
            { 
              id: 1, 
              drug_id: 1, 
              store_id: 1, 
              quantity: 100, 
              expiration_date: '2025-12-31' 
            }
          ],
          pagination: { page: 1, pages: 1, total: 1 }
        };

        mockAxios.onGet('/inventory/store/1').reply(200, mockInventory);

        const result = await inventoryAPI.getByStore(1);
        expect(result.data).toEqual(mockInventory);
      });

      it('should handle store not found', async () => {
        mockAxios.onGet('/inventory/store/999').reply(404, { error: 'Store not found' });

        await expect(inventoryAPI.getByStore(999))
          .rejects.toHaveProperty('response.status', 404);
      });
    });

    describe('Inventory Transactions API', () => {
      it('should fill prescription successfully', async () => {
        mockAxios.onPost('/inventory/1/fill').reply(200, { 
          message: 'Prescription filled successfully',
          new_quantity: 70
        });

        const result = await inventoryAPI.fillPrescription(1, 30, 'Patient prescription');
        expect(result.data.message).toBe('Prescription filled successfully');
      });

      it('should handle insufficient stock', async () => {
        mockAxios.onPost('/inventory/1/fill').reply(400, { 
          error: 'Insufficient stock. Only 5 units available.' 
        });

        await expect(inventoryAPI.fillPrescription(1, 100, 'Large prescription'))
          .rejects.toHaveProperty('response.status', 400);
      });

      it('should return stock successfully', async () => {
        mockAxios.onPost('/inventory/1/return').reply(200, { 
          message: 'Stock returned successfully',
          new_quantity: 130
        });

        const result = await inventoryAPI.returnToStock(1, 30, 'Prescription return');
        expect(result.data.message).toBe('Stock returned successfully');
      });

      it('should expire items successfully', async () => {
        mockAxios.onPost('/inventory/1/expire').reply(200, { 
          message: 'Items expired successfully',
          expired_quantity: 25
        });

        const result = await inventoryAPI.expire(1, 25, 'Expired items');
        expect(result.data.message).toBe('Items expired successfully');
      });
    });

    describe('Inventory Statistics API', () => {
      it('should get inventory stats successfully', async () => {
        const mockStats = {
          total_items: 1500,
          low_stock_items: 25,
          expiring_items: 8,
          total_value: 45000.50
        };

        mockAxios.onGet('/inventory/store/1/stats').reply(200, mockStats);

        const result = await inventoryAPI.getStats(1);
        expect(result.data).toEqual(mockStats);
      });

      it('should get low stock items', async () => {
        const mockLowStock = {
          inventory: [
            { id: 1, drug_name: 'Low Stock Drug', quantity: 5, minimum_stock: 20 }
          ]
        };

        mockAxios.onGet('/inventory/store/1/low-stock').reply(200, mockLowStock);

        const result = await inventoryAPI.getLowStock(1);
        expect(result.data.inventory).toHaveLength(1);
      });

      it('should get expiring items', async () => {
        const mockExpiring = {
          inventory: [
            { id: 1, drug_name: 'Expiring Drug', expiration_date: '2025-01-15', quantity: 12 }
          ]
        };

        mockAxios.onGet('/inventory/store/1/expiring').reply(200, mockExpiring);

        const result = await inventoryAPI.getExpiring(1, 30);
        expect(result.data.inventory).toHaveLength(1);
      });
    });
  });

  describe('📊 Audit API Tests', () => {
    describe('Transaction History API', () => {
      it('should get inventory history successfully', async () => {
        const mockHistory = {
          transactions: [
            {
              id: 1,
              drug_name: 'Test Drug',
              transaction_type: 'prescription_fill',
              quantity: -30,
              transaction_date: '2025-01-10T10:00:00Z',
              performed_by: 'Test User'
            }
          ],
          pagination: { page: 1, pages: 1, total: 1 }
        };

        mockAxios.onGet('/audit/inventory/1').reply(200, mockHistory);

        const result = await auditAPI.getInventoryHistory(1);
        expect(result.data.transactions).toHaveLength(1);
      });

      it('should get drug-specific history', async () => {
        mockAxios.onGet('/audit/drug/1').reply(200, { 
          transactions: [],
          drug_info: { id: 1, name: 'Test Drug' }
        });

        const result = await auditAPI.getDrugHistory(1);
        expect(result.data).toHaveProperty('drug_info');
      });
    });

    describe('Audit Reports API', () => {
      it('should generate NDC audit report', async () => {
        const mockReport = {
          report_data: {
            ndc: '12345-678-90',
            total_dispensed: 500,
            current_stock: 100,
            transactions: []
          }
        };

        mockAxios.onGet('/audit/ndc-report').reply(200, mockReport);

        const result = await auditAPI.getNDCReport('12345-678-90', '2025-01-01', '2025-01-31');
        expect(result.data.report_data).toHaveProperty('ndc');
      });

      it('should export NDC report as CSV', async () => {
        const csvData = 'NDC,Date,Transaction Type,Quantity\n12345-678-90,2025-01-10,fill,-30';

        mockAxios.onGet('/audit/ndc-report/export').reply(200, csvData, {
          'content-type': 'text/csv'
        });

        const result = await auditAPI.exportNDCReport('12345-678-90', '2025-01-01', '2025-01-31');
        expect(result.data).toBe(csvData);
      });
    });
  });

  describe('🏪 Store API Tests', () => {
    describe('Store Management API', () => {
      it('should get all stores successfully', async () => {
        const mockStores = {
          stores: [
            { id: 1, name: 'Main Store', city: 'Test City', state: 'NY' },
            { id: 2, name: 'Branch Store', city: 'Test City 2', state: 'CA' }
          ],
          pagination: { page: 1, pages: 1, total: 2 }
        };

        mockAxios.onGet('/stores').reply(200, mockStores);

        const result = await storeAPI.getAll();
        expect(result.data.stores).toHaveLength(2);
      });

      it('should get store statistics', async () => {
        const mockStats = {
          total_stores: 5,
          stores_with_admin: 4,
          unique_states: 3,
          total_inventory_value: 150000.75
        };

        mockAxios.onGet('/stores/stats').reply(200, mockStats);

        const result = await storeAPI.getStats();
        expect(result.data).toEqual(mockStats);
      });

      it('should handle unauthorized store access', async () => {
        mockAxios.onGet('/stores').reply(403, { error: 'Insufficient permissions' });

        await expect(storeAPI.getAll())
          .rejects.toHaveProperty('response.status', 403);
      });
    });
  });

  describe('🛡️ Error Handling and Edge Cases', () => {
    it('should handle network connection errors', async () => {
      mockAxios.onAny().networkError();

      await expect(authAPI.getProfile())
        .rejects.toHaveProperty('code', 'ERR_NETWORK');
    });

    it('should handle request timeout', async () => {
      mockAxios.onAny().timeout();

      await expect(authAPI.getProfile())
        .rejects.toHaveProperty('code', 'ECONNABORTED');
    });

    it('should handle large response data', async () => {
      const largeUserList = Array.from({ length: 1000 }, (_, i) => ({
        id: i + 1,
        name: `User ${i + 1}`,
        email: `user${i + 1}@test.com`
      }));

      mockAxios.onGet('/users').reply(200, { 
        users: largeUserList,
        pagination: { page: 1, pages: 50, total: 1000 }
      });

      const result = await userAPI.getAll();
      expect(result.data.users).toHaveLength(1000);
    });

    it('should handle malformed JSON responses', async () => {
      mockAxios.onGet('/users').reply(200, 'invalid json');

      await expect(userAPI.getAll())
        .rejects.toThrow();
    });

    it('should handle HTTP status codes comprehensively', async () => {
      const statusCodes = [
        { code: 400, description: 'Bad Request' },
        { code: 401, description: 'Unauthorized' },
        { code: 403, description: 'Forbidden' },
        { code: 404, description: 'Not Found' },
        { code: 429, description: 'Too Many Requests' },
        { code: 500, description: 'Internal Server Error' },
        { code: 502, description: 'Bad Gateway' },
        { code: 503, description: 'Service Unavailable' }
      ];

      for (const status of statusCodes) {
        mockAxios.reset();
        mockAxios.onGet('/test').reply(status.code, { error: status.description });

        try {
          await axios.get('/test');
        } catch (error) {
          expect(error.response.status).toBe(status.code);
        }
      }
    });
  });

  describe('🔒 Security and Data Protection', () => {
    it('should not expose sensitive data in request headers', async () => {
      mockAxios.onPost('/auth/login').reply(config => {
        // Verify no sensitive data in headers
        const headers = config.headers;
        expect(headers).not.toHaveProperty('password');
        expect(headers).not.toHaveProperty('secret');
        
        return [200, { token: 'test-token' }];
      });

      await authAPI.login('test@example.com', 'password123');
    });

    it('should handle CORS preflight requests', async () => {
      mockAxios.onOptions('/auth/login').reply(200, '', {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization'
      });

      const result = await axios.options('/auth/login');
      expect(result.status).toBe(200);
    });

    it('should handle authentication token properly', async () => {
      const token = 'Bearer jwt-token-123';
      localStorage.setItem('token', token);

      mockAxios.onGet('/auth/me').reply(config => {
        expect(config.headers.Authorization).toBe(token);
        return [200, { user: { id: 1 } }];
      });

      await authAPI.getProfile();
    });
  });

  describe('⚡ Performance and Efficiency', () => {
    it('should handle concurrent API requests', async () => {
      // Mock multiple endpoints
      mockAxios.onGet('/users').reply(200, { users: [] });
      mockAxios.onGet('/stores').reply(200, { stores: [] });
      mockAxios.onGet('/drugs/stats').reply(200, { total: 0 });

      const startTime = Date.now();
      
      // Make concurrent requests
      const [users, stores, drugStats] = await Promise.all([
        userAPI.getAll(),
        storeAPI.getAll(),
        drugAPI.getStats()
      ]);

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(users.data).toBeDefined();
      expect(stores.data).toBeDefined();
      expect(drugStats.data).toBeDefined();
      expect(duration).toBeLessThan(1000); // Should complete quickly
    });

    it('should handle request cancellation', async () => {
      const source = axios.CancelToken.source();
      
      mockAxios.onGet('/users').reply(() => {
        // Simulate slow request
        return new Promise(resolve => {
          setTimeout(() => resolve([200, { users: [] }]), 1000);
        });
      });

      // Cancel request after 100ms
      setTimeout(() => source.cancel('Request cancelled'), 100);

      await expect(
        userAPI.getAll({ cancelToken: source.token })
      ).rejects.toHaveProperty('message', 'Request cancelled');
    });
  });
});