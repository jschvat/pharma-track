# OpenFDA Integration

This module provides integration with the OpenFDA NDC (National Drug Code) endpoint API for drug information lookup and management.

## Features

- **FDA Drug Search**: Search the FDA database by NDC, generic name, brand name, or manufacturer
- **Local Drug Database**: Store frequently accessed drugs locally for faster access
- **Inventory Management**: Track drug inventory by store with expiration dates and reorder levels
- **Caching**: Intelligent caching of FDA API responses to reduce API calls
- **Validation**: NDC format validation and data integrity checks

## API Endpoints

### FDA Search
- `GET /api/drugs/search/fda` - Search FDA database
  - Query params: `ndc`, `generic_name`, `brand_name`, `manufacturer`, `limit`

### Local Drug Management
- `GET /api/drugs/search` - Search local drug database
- `GET /api/drugs/:id` - Get drug by ID
- `POST /api/drugs/add-from-fda` - Add drug from FDA to local database

### Inventory Management
- `GET /api/drugs/inventory/:storeId` - Get store inventory
- `POST /api/drugs/inventory` - Add drug to inventory
- `PUT /api/drugs/inventory/:id` - Update inventory item
- `GET /api/drugs/inventory/:storeId/low-stock` - Get low stock items
- `GET /api/drugs/inventory/:storeId/expiring` - Get expiring items
- `GET /api/drugs/inventory/:storeId/stats` - Get inventory statistics

## Usage Examples

### Search FDA by NDC
```bash
GET /api/drugs/search/fda?ndc=12345-678-90
```

### Search FDA by Generic Name
```bash
GET /api/drugs/search/fda?generic_name=acetaminophen&limit=10
```

### Add Drug from FDA to Local Database
```bash
POST /api/drugs/add-from-fda
{
  "ndc": "1234567890"
}
```

### Add Drug to Store Inventory
```bash
POST /api/drugs/inventory
{
  "drug_id": 1,
  "quantity_on_hand": 100,
  "reorder_level": 20,
  "unit_cost": 5.50,
  "selling_price": 12.99,
  "lot_number": "LOT123",
  "expiration_date": "2025-12-31",
  "supplier": "ABC Pharma"
}
```

## NDC Format

The system supports various NDC formats:
- `12345-678-90` (with dashes)
- `1234567890` (without dashes)
- 10-11 digit numbers

NDCs are automatically cleaned and validated.

## Caching

The FDA service implements intelligent caching:
- **TTL**: 1 hour for FDA API responses
- **Memory-based**: Uses node-cache for fast access
- **Automatic cleanup**: Expired entries are automatically removed

## Error Handling

Comprehensive error handling for:
- FDA API timeouts and rate limits
- Network connectivity issues
- Invalid NDC formats
- Database constraint violations
- Authentication and authorization

## Database Schema

### drugs table
- Stores drug information from FDA
- Includes NDC, names, dosage forms, manufacturers
- Full-text search capabilities
- JSON storage for complete FDA response

### store_inventory table
- Links drugs to stores
- Tracks quantities, costs, expiration dates
- Supports lot number tracking
- Reorder level monitoring

## Environment Variables

Add to your `.env` file:
```
# OpenFDA API settings (optional)
FDA_API_KEY=your_api_key_here  # Not required but recommended for higher rate limits
FDA_API_TIMEOUT=10000          # Request timeout in milliseconds
```

## Rate Limits

OpenFDA API limits:
- **Without API key**: 240 requests per minute, 1000 per hour
- **With API key**: 240 requests per minute, 120,000 per hour

The service automatically handles rate limiting with proper error messages.