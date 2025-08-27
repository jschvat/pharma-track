/**
 * Product Labeling Cache Table Migration
 * 
 * Creates a database table to cache FDA product labeling data indexed by NDC.
 * This enables fast retrieval of comprehensive drug labeling information
 * without repeatedly hitting the FDA API.
 * 
 * Features:
 * - NDC-indexed caching for fast lookups
 * - Comprehensive labeling data storage
 * - Automatic cache expiration (90 days)
 * - JSON storage for flexible data structure
 * - Performance indexes for quick searches
 */

const { pool: db } = require('../config/database');

async function runProductLabelingMigration() {
  console.log('🏥 Starting Product Labeling Cache Table Migration...');
  
  try {
    // Create product_labeling_cache table
    console.log('📋 Creating product_labeling_cache table...');
    
    await db.execute(`
      CREATE TABLE IF NOT EXISTS product_labeling_cache (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ndc VARCHAR(15) NOT NULL UNIQUE,
        
        -- Basic product information
        generic_name VARCHAR(500),
        brand_name VARCHAR(500), 
        manufacturer_name VARCHAR(255),
        product_type VARCHAR(100),
        dosage_form VARCHAR(100),
        route VARCHAR(255),
        
        -- Comprehensive labeling data (stored as JSON for flexibility)
        labeling_data JSON NOT NULL,
        
        -- Parsed key clinical information for quick access
        indications_and_usage TEXT,
        warnings TEXT,
        contraindications TEXT,
        dosage_and_administration TEXT,
        storage_and_handling TEXT,
        
        -- FDA metadata
        fda_set_id VARCHAR(50),
        fda_product_id VARCHAR(50),
        effective_time DATE,
        version VARCHAR(10),
        
        -- Cache management
        cached_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        cache_expires_at TIMESTAMP DEFAULT (DATE_ADD(CURRENT_TIMESTAMP, INTERVAL 90 DAY)),
        is_active BOOLEAN DEFAULT TRUE,
        
        -- Indexes for performance
        INDEX idx_ndc (ndc),
        INDEX idx_generic_name (generic_name(100)),
        INDEX idx_brand_name (brand_name(100)),
        INDEX idx_manufacturer (manufacturer_name(100)),
        INDEX idx_cached_at (cached_at),
        INDEX idx_cache_expires_at (cache_expires_at),
        INDEX idx_active_cache (is_active, cache_expires_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    
    console.log('✅ product_labeling_cache table created successfully');
    
    // Add constraints and additional indexes
    console.log('📋 Adding additional performance optimizations...');
    
    // Add check constraint for NDC format
    try {
      await db.execute(`
        ALTER TABLE product_labeling_cache 
        ADD CONSTRAINT chk_labeling_ndc_format 
        CHECK (ndc REGEXP '^[0-9-]{10,15}$')
      `);
      console.log('✅ NDC format constraint added');
    } catch (error) {
      if (!error.message.includes('Duplicate')) {
        console.log('ℹ️ NDC format constraint already exists or not supported');
      }
    }
    
    // Add composite index for common search patterns
    try {
      await db.execute(`
        CREATE INDEX idx_labeling_search_composite 
        ON product_labeling_cache (is_active, cache_expires_at, generic_name(50))
      `);
      console.log('✅ Composite search index added');
    } catch (error) {
      if (!error.message.includes('Duplicate')) {
        console.log('ℹ️ Composite search index already exists');
      }
    }
    
    console.log('📊 Verifying table structure...');
    const [columns] = await db.execute('DESCRIBE product_labeling_cache');
    console.log('✅ Table columns verified:', columns.length, 'columns created');
    
    console.log('🎉 Product Labeling Cache Migration completed successfully!');
    console.log('');
    console.log('📋 Table Features:');
    console.log('   - NDC-indexed fast lookups');
    console.log('   - JSON storage for complete FDA labeling data');
    console.log('   - Parsed clinical information for quick access');
    console.log('   - 90-day cache expiration');
    console.log('   - Performance indexes for searches');
    console.log('   - Support for cache invalidation');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run migration if called directly
if (require.main === module) {
  runProductLabelingMigration()
    .then(() => {
      console.log('✅ Migration completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Migration failed:', error);
      process.exit(1);
    });
}

module.exports = { runProductLabelingMigration };