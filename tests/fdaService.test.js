const fdaService = require('../openfda/fdaService');

// Mock axios for testing
jest.mock('axios');
const axios = require('axios');

describe('FDAService', () => {
  beforeEach(() => {
    // Clear cache before each test
    fdaService.clearCache();
    jest.clearAllMocks();
  });

  describe('NDC Validation and Formatting', () => {
    test('should clean NDC correctly', () => {
      expect(fdaService.cleanNDC('12345-678-90')).toBe('1234567890');
      expect(fdaService.cleanNDC('12345678901')).toBe('12345678901');
      expect(fdaService.cleanNDC('12345 678 90')).toBe('1234567890');
      expect(fdaService.cleanNDC('12345.678.90')).toBe('1234567890');
    });

    test('should validate NDC format', () => {
      expect(fdaService.validateNDC('12345-678-90')).toBe(true);
      expect(fdaService.validateNDC('12345678901')).toBe(true);
      expect(fdaService.validateNDC('1234567890')).toBe(true);
      expect(fdaService.validateNDC('123456789')).toBe(false); // too short
      expect(fdaService.validateNDC('123456789012')).toBe(false); // too long
      expect(fdaService.validateNDC('')).toBe(false);
      expect(fdaService.validateNDC('abc')).toBe(false);
    });

    test('should format NDC with dashes', () => {
      expect(fdaService.formatNDC('1234567890')).toBe('12345-678-90');
      expect(fdaService.formatNDC('12345678901')).toBe('12345-6789-01');
    });

    test('should throw error for invalid NDC lengths', () => {
      expect(() => fdaService.cleanNDC('123456789')).toThrow('NDC must be 10 or 11 digits');
      expect(() => fdaService.formatNDC('123456789')).toThrow('Invalid NDC length');
    });
  });

  describe('FDA API Search Methods', () => {
    const mockFDAResponse = {
      data: {
        meta: {
          results: {
            total: 1
          }
        },
        results: [
          {
            product_ndc: '0069-2587-10',
            generic_name: ['ACETAMINOPHEN'],
            brand_name: ['TYLENOL'],
            dosage_form: ['TABLET'],
            route: ['ORAL'],
            active_ingredients: [
              {
                name: 'ACETAMINOPHEN',
                strength: '325 mg/1'
              }
            ],
            openfda: {
              manufacturer_name: ['McNeil Consumer Healthcare']
            },
            product_type: 'HUMAN OTC DRUG',
            marketing_status: 'OTC monograph final',
            listing_expiration_date: '20251231'
          }
        ]
      }
    };

    test('should search by NDC', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      const result = await fdaService.searchByNDC('0069-2587-10');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.objectContaining({
          params: {
            search: 'product_ndc:"0069258710"',
            limit: 10
          }
        })
      );

      expect(result.data.results).toHaveLength(1);
      expect(result.data.results[0].product_ndc).toBe('0069-2587-10');
      expect(result.fromCache).toBe(false);
    });

    test('should search by generic name', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      const result = await fdaService.searchByGenericName('acetaminophen', 5);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.objectContaining({
          params: {
            search: 'generic_name:"acetaminophen"',
            limit: 5
          }
        })
      );

      expect(result.data.results).toHaveLength(1);
    });

    test('should search by brand name', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      const result = await fdaService.searchByBrandName('tylenol');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.objectContaining({
          params: {
            search: 'brand_name:"tylenol"',
            limit: 10
          }
        })
      );

      expect(result.data.results).toHaveLength(1);
    });

    test('should search by manufacturer', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      const result = await fdaService.searchByManufacturer('McNeil');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.objectContaining({
          params: {
            search: 'openfda.manufacturer_name:"McNeil"',
            limit: 10
          }
        })
      );

      expect(result.data.results).toHaveLength(1);
    });

    test('should perform advanced search', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      const criteria = {
        ndc: '0069-2587-10',
        genericName: 'acetaminophen',
        brandName: 'tylenol'
      };

      const result = await fdaService.advancedSearch(criteria);

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.objectContaining({
          params: {
            search: 'product_ndc:"0069258710" AND generic_name:"acetaminophen" AND brand_name:"tylenol"',
            limit: 10
          }
        })
      );

      expect(result.data.results).toHaveLength(1);
    });

    test('should throw error for advanced search with no criteria', async () => {
      await expect(fdaService.advancedSearch({})).rejects.toThrow('At least one search criterion is required');
    });

    test('should limit search results to maximum of 100', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByGenericName('acetaminophen', 150);

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: expect.objectContaining({
            limit: 100
          })
        })
      );
    });
  });

  describe('Cache Functionality', () => {
    const mockFDAResponse = {
      data: {
        results: [{ product_ndc: '0069-2587-10' }]
      }
    };

    test('should cache FDA API responses', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      // First call
      const result1 = await fdaService.searchByNDC('0069-2587-10');
      expect(result1.fromCache).toBe(false);
      expect(axios.get).toHaveBeenCalledTimes(1);

      // Second call should use cache
      const result2 = await fdaService.searchByNDC('0069-2587-10');
      expect(result2.fromCache).toBe(true);
      expect(axios.get).toHaveBeenCalledTimes(1); // No additional API call
    });

    test('should provide cache statistics', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByNDC('0069-2587-10');
      await fdaService.searchByNDC('0069-2587-10'); // Cache hit

      const stats = fdaService.getCacheStats();
      expect(stats.keys).toBe(1);
      expect(stats.hits).toBe(1);
      expect(stats.misses).toBe(1);
    });

    test('should clear cache', async () => {
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByNDC('0069-2587-10');
      expect(fdaService.getCacheStats().keys).toBe(1);

      fdaService.clearCache();
      expect(fdaService.getCacheStats().keys).toBe(0);
    });
  });

  describe('Error Handling', () => {
    test('should handle 404 errors', async () => {
      const error404 = {
        response: {
          status: 404,
          data: { error: { message: 'Not found' } }
        }
      };
      axios.get.mockRejectedValue(error404);

      await expect(fdaService.searchByNDC('invalid-ndc')).rejects.toThrow('No drugs found matching the search criteria');
    });

    test('should handle 429 rate limit errors', async () => {
      const error429 = {
        response: {
          status: 429,
          data: { error: { message: 'Too many requests' } }
        }
      };
      axios.get.mockRejectedValue(error429);

      await expect(fdaService.searchByNDC('0069-2587-10')).rejects.toThrow('Too many requests to FDA API');
    });

    test('should handle 500 server errors', async () => {
      const error500 = {
        response: {
          status: 500,
          data: { error: { message: 'Internal server error' } }
        }
      };
      axios.get.mockRejectedValue(error500);

      await expect(fdaService.searchByNDC('0069-2587-10')).rejects.toThrow('FDA API is currently unavailable');
    });

    test('should handle network errors', async () => {
      const networkError = {
        request: {},
        message: 'Network Error'
      };
      axios.get.mockRejectedValue(networkError);

      await expect(fdaService.searchByNDC('0069-2587-10')).rejects.toThrow('Unable to connect to FDA API');
    });

    test('should handle timeout errors', async () => {
      const timeoutError = {
        message: 'timeout of 10000ms exceeded'
      };
      axios.get.mockRejectedValue(timeoutError);

      await expect(fdaService.searchByNDC('0069-2587-10')).rejects.toThrow('FDA API request timed out');
    });

    test('should handle unknown errors', async () => {
      const unknownError = new Error('Unknown error');
      axios.get.mockRejectedValue(unknownError);

      await expect(fdaService.searchByNDC('0069-2587-10')).rejects.toThrow('Unknown error');
    });
  });

  describe('Request Configuration', () => {
    test('should include correct headers', async () => {
      const mockFDAResponse = { data: { results: [] } };
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByNDC('0069-2587-10');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: {
            'User-Agent': 'PharmaTrack/1.0 (pharmacy management system)'
          },
          timeout: 10000
        })
      );
    });

    test('should use correct base URL', async () => {
      const mockFDAResponse = { data: { results: [] } };
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByNDC('0069-2587-10');

      expect(axios.get).toHaveBeenCalledWith(
        'https://api.fda.gov/drug/ndc.json',
        expect.any(Object)
      );
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty search results', async () => {
      const emptyResponse = {
        data: {
          meta: { results: { total: 0 } },
          results: []
        }
      };
      axios.get.mockResolvedValue(emptyResponse);

      const result = await fdaService.searchByNDC('0000-0000-00');
      expect(result.data.results).toHaveLength(0);
    });

    test('should handle malformed FDA response', async () => {
      const malformedResponse = {
        data: {}
      };
      axios.get.mockResolvedValue(malformedResponse);

      const result = await fdaService.searchByNDC('0069-2587-10');
      expect(result.data).toEqual({});
    });

    test('should handle special characters in search terms', async () => {
      const mockFDAResponse = { data: { results: [] } };
      axios.get.mockResolvedValue(mockFDAResponse);

      await fdaService.searchByGenericName('acetaminophen & caffeine');

      expect(axios.get).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          params: {
            search: 'generic_name:"acetaminophen & caffeine"',
            limit: 10
          }
        })
      );
    });
  });
});