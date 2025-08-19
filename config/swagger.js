/**
 * Swagger/OpenAPI Configuration
 * 
 * Configures comprehensive API documentation for PharmaTraK system.
 * Provides interactive documentation for all REST endpoints with
 * request/response schemas, authentication, and examples.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Basic API information
const swaggerDefinition = {
  openapi: '3.0.3',
  info: {
    title: 'PharmaTraK API Documentation',
    version: '1.0.0',
    description: `
      Comprehensive pharmacy inventory management system API.
      
      ## Features
      - **Multi-store inventory management** - Track inventory across multiple pharmacy locations
      - **Real-time transaction tracking** - Complete audit trail for all inventory changes
      - **FDA drug integration** - Search and import drugs from FDA database
      - **Snapshot history** - Maintain rolling history of inventory changes
      - **Role-based access control** - Secure access with user permissions
      - **Performance optimized** - Efficient queries with comprehensive indexing
      
      ## Authentication
      Most endpoints require authentication via JWT tokens. Obtain a token by logging in via \`/api/auth/login\`.
      
      ## Error Handling
      All endpoints return consistent error responses with HTTP status codes and descriptive messages.
      
      ## Rate Limiting
      API endpoints may be rate limited to prevent abuse. Check response headers for rate limit information.
    `,
    contact: {
      name: 'PharmaTraK Development Team',
      email: 'support@pharmatrak.com'
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT'
    }
  },
  servers: [
    {
      url: 'http://localhost:3001',
      description: 'Development server'
    },
    {
      url: 'https://api.pharmatrak.com',
      description: 'Production server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from /api/auth/login'
      }
    },
    schemas: {
      // Common response schemas
      SuccessResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            description: 'Response data (varies by endpoint)'
          }
        }
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            description: 'Error message',
            example: 'Resource not found'
          },
          details: {
            type: 'array',
            items: {
              type: 'object'
            },
            description: 'Additional error details (validation errors, etc.)'
          }
        }
      },
      ValidationErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false
          },
          error: {
            type: 'string',
            example: 'Validation failed'
          },
          details: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                msg: { type: 'string' },
                param: { type: 'string' },
                location: { type: 'string' }
              }
            }
          }
        }
      },
      
      // User schemas
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique user identifier',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Full name',
            example: 'John Doe'
          },
          email: {
            type: 'string',
            format: 'email',
            description: 'Email address',
            example: 'john.doe@pharmacy.com'
          },
          role: {
            type: 'string',
            enum: ['user', 'admin', 'god_mode'],
            description: 'User role determining permissions',
            example: 'admin'
          },
          store_id: {
            type: 'integer',
            nullable: true,
            description: 'Assigned store ID (null for god_mode users)',
            example: 1
          },
          is_active: {
            type: 'boolean',
            description: 'Whether user account is active',
            example: true
          },
          created_at: {
            type: 'string',
            format: 'date-time',
            description: 'Account creation timestamp'
          }
        },
        required: ['id', 'name', 'email', 'role', 'is_active']
      },
      
      // Store schemas
      Store: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique store identifier',
            example: 1
          },
          name: {
            type: 'string',
            description: 'Store name',
            example: 'Main Street Pharmacy'
          },
          address: {
            type: 'string',
            description: 'Street address',
            example: '123 Main Street'
          },
          city: {
            type: 'string',
            description: 'City',
            example: 'Springfield'
          },
          state: {
            type: 'string',
            description: 'State/province',
            example: 'IL'
          },
          zip: {
            type: 'string',
            description: 'ZIP/postal code',
            example: '62701'
          },
          phone: {
            type: 'string',
            description: 'Phone number',
            example: '(555) 123-4567'
          },
          is_active: {
            type: 'boolean',
            description: 'Whether store is active',
            example: true
          }
        },
        required: ['id', 'name', 'address', 'city', 'state', 'is_active']
      },
      
      // Drug schemas
      Drug: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique drug identifier',
            example: 1
          },
          ndc: {
            type: 'string',
            description: 'National Drug Code (11 digits with dashes)',
            example: '12345-678-90'
          },
          generic_name: {
            type: 'string',
            description: 'Generic drug name',
            example: 'acetaminophen'
          },
          brand_name: {
            type: 'string',
            nullable: true,
            description: 'Brand/trade name',
            example: 'Tylenol'
          },
          dosage_form: {
            type: 'string',
            description: 'Dosage form',
            example: 'tablet'
          },
          strength: {
            type: 'string',
            description: 'Drug strength',
            example: '500 mg'
          },
          manufacturer_name: {
            type: 'string',
            description: 'Manufacturer name',
            example: 'Johnson & Johnson'
          },
          substance_name: {
            type: 'string',
            description: 'Active substance names',
            example: 'ACETAMINOPHEN'
          },
          is_active: {
            type: 'boolean',
            description: 'Whether drug is active',
            example: true
          }
        },
        required: ['id', 'ndc', 'generic_name', 'dosage_form', 'is_active']
      },
      
      // Inventory schemas
      InventoryItem: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique inventory item identifier',
            example: 1
          },
          store_id: {
            type: 'integer',
            description: 'Store identifier',
            example: 1
          },
          drug_id: {
            type: 'integer',
            description: 'Drug identifier',
            example: 1
          },
          quantity_on_hand: {
            type: 'integer',
            description: 'Current quantity in stock',
            example: 150
          },
          reorder_level: {
            type: 'integer',
            description: 'Minimum quantity before reorder needed',
            example: 20
          },
          unit_cost: {
            type: 'number',
            format: 'decimal',
            nullable: true,
            description: 'Cost per unit',
            example: 0.15
          },
          selling_price: {
            type: 'number',
            format: 'decimal',
            nullable: true,
            description: 'Selling price per unit',
            example: 0.25
          },
          lot_number: {
            type: 'string',
            nullable: true,
            description: 'Batch/lot number',
            example: 'LOT12345'
          },
          expiration_date: {
            type: 'string',
            format: 'date',
            nullable: true,
            description: 'Expiration date',
            example: '2025-12-31'
          },
          is_active: {
            type: 'boolean',
            description: 'Whether inventory item is active',
            example: true
          },
          // Include drug details when populated
          ndc: { type: 'string', example: '12345-678-90' },
          generic_name: { type: 'string', example: 'acetaminophen' },
          brand_name: { type: 'string', example: 'Tylenol' }
        },
        required: ['id', 'store_id', 'drug_id', 'quantity_on_hand', 'is_active']
      },
      
      // Audit log schemas
      AuditLogEntry: {
        type: 'object',
        properties: {
          id: {
            type: 'integer',
            description: 'Unique audit log entry identifier',
            example: 1
          },
          inventory_id: {
            type: 'integer',
            description: 'Inventory item identifier',
            example: 1
          },
          store_id: {
            type: 'integer',
            description: 'Store identifier',
            example: 1
          },
          drug_id: {
            type: 'integer',
            description: 'Drug identifier',
            example: 1
          },
          transaction_type: {
            type: 'string',
            enum: ['prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory'],
            description: 'Type of inventory transaction',
            example: 'prescription_fill'
          },
          quantity_change: {
            type: 'integer',
            description: 'Quantity change (positive for additions, negative for subtractions)',
            example: -10
          },
          quantity_before: {
            type: 'integer',
            description: 'Quantity before transaction',
            example: 100
          },
          quantity_after: {
            type: 'integer',
            description: 'Quantity after transaction',
            example: 90
          },
          reason: {
            type: 'string',
            description: 'Reason for transaction',
            example: 'Prescription filled for patient'
          },
          reference_number: {
            type: 'string',
            nullable: true,
            description: 'Reference number (prescription, invoice, etc.)',
            example: 'RX123456'
          },
          performed_by: {
            type: 'integer',
            description: 'User ID who performed transaction',
            example: 1
          },
          transaction_date: {
            type: 'string',
            format: 'date-time',
            description: 'Transaction timestamp'
          }
        },
        required: ['id', 'inventory_id', 'store_id', 'drug_id', 'transaction_type', 'quantity_change', 'performed_by']
      },
      
      // Login schemas
      LoginRequest: {
        type: 'object',
        properties: {
          email: {
            type: 'string',
            format: 'email',
            description: 'User email address',
            example: 'admin@pharmatrak.com'
          },
          password: {
            type: 'string',
            description: 'User password',
            example: 'Admin123!'
          },
          rememberMe: {
            type: 'boolean',
            description: 'Whether to extend session duration',
            example: false
          }
        },
        required: ['email', 'password']
      },
      
      LoginResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          data: {
            type: 'object',
            properties: {
              token: {
                type: 'string',
                description: 'JWT authentication token',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'
              },
              user: {
                $ref: '#/components/schemas/User'
              }
            }
          }
        }
      }
    }
  },
  security: [
    {
      bearerAuth: []
    }
  ]
};

// Options for the swagger docs
const options = {
  definition: swaggerDefinition,
  // Paths to files containing OpenAPI definitions
  apis: [
    './routes/*.js',
    './models/*.js',
    './middleware/*.js'
  ]
};

// Initialize swagger-jsdoc
const specs = swaggerJsdoc(options);

// Swagger UI options
const swaggerUiOptions = {
  explorer: true,
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    filter: true,
    showExtensions: true,
    showCommonExtensions: true,
    docExpansion: 'none'
  },
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #2563eb; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 5px; }
    .swagger-ui .auth-wrapper { margin-bottom: 20px; }
  `,
  customSiteTitle: 'PharmaTraK API Documentation'
};

module.exports = {
  specs,
  swaggerUi,
  swaggerUiOptions
};