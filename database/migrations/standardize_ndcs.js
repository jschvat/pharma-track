/**
 * Database Migration: Standardize NDCs to 5-4-2 Format
 * 
 * This migration script converts all existing NDCs in the database to the
 * standardized 5-4-2 format (XXXXX-XXXX-XX) with leading zero padding.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const { pool: db } = require('../config/database');
const fdaService = require('../openfda/fdaService');

/**
 * Standardize all NDCs in the drugs table
 */
async function standardizeNDCs() {
  let processedCount = 0;
  let errorCount = 0;
  
  try {
    console.log('Starting NDC standardization migration...');
    
    // Get all drugs with their current NDCs
    const [drugs] = await db.execute('SELECT id, ndc, product_ndc FROM drugs WHERE ndc IS NOT NULL');
    
    console.log(`Found ${drugs.length} drugs to process.`);
    
    // Process each drug
    for (const drug of drugs) {
      try {
        // Standardize the NDC
        const originalNDC = drug.ndc;
        const standardizedNDC = fdaService.standardizeNDC(originalNDC);
        
        // Only update if the NDC has changed
        if (originalNDC !== standardizedNDC) {
          await db.execute(
            'UPDATE drugs SET ndc = ? WHERE id = ?',
            [standardizedNDC, drug.id]
          );
          
          console.log(`Updated drug ${drug.id}: ${originalNDC} → ${standardizedNDC}`);
          processedCount++;
        }
        
      } catch (error) {
        console.error(`Error processing drug ${drug.id} (NDC: ${drug.ndc}):`, error.message);
        errorCount++;
      }
    }
    
    console.log('\n=== NDC Standardization Complete ===');
    console.log(`Total drugs processed: ${drugs.length}`);
    console.log(`NDCs updated: ${processedCount}`);
    console.log(`Errors: ${errorCount}`);
    
    if (errorCount === 0) {
      console.log('✅ All NDCs standardized successfully!');
    } else {
      console.log(`⚠️  ${errorCount} errors occurred during migration.`);
    }
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

/**
 * Rollback function (optional) - converts standardized NDCs back to original format
 * Note: This is not fully reversible since we lose the original format information
 */
async function rollback() {
  console.log('⚠️  Warning: NDC standardization rollback is not fully supported.');
  console.log('Original NDC formats cannot be perfectly restored.');
  console.log('Consider restoring from a database backup if needed.');
}

// Run migration if called directly
if (require.main === module) {
  const command = process.argv[2];
  
  if (command === 'rollback') {
    rollback()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Rollback failed:', error);
        process.exit(1);
      });
  } else {
    standardizeNDCs()
      .then(() => process.exit(0))
      .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
      });
  }
}

module.exports = { standardizeNDCs, rollback };