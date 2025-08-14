/**
 * Run Inventory Snapshot Migration
 * 
 * Executes the migration SQL commands using Node.js and the database pool.
 */

const { pool } = require('../config/database');
const fs = require('fs');
const path = require('path');

async function runMigration() {
    console.log('🚀 Running Inventory Snapshot Migration...\n');
    
    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, '..', 'database', 'migrations', 'add_inventory_snapshot.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error('❌ Migration file not found:', migrationPath);
            return;
        }
        
        console.log('📁 Reading migration file...');
        const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
        
        // Split SQL into individual statements (rough split on semicolons outside of procedures)
        const statements = [];
        let currentStatement = '';
        let inProcedure = false;
        const lines = migrationSQL.split('\n');
        
        for (const line of lines) {
            const trimmedLine = line.trim();
            
            // Skip comments and empty lines
            if (trimmedLine.startsWith('--') || trimmedLine.startsWith('/*') || trimmedLine === '') {
                continue;
            }
            
            // Handle USE statement
            if (trimmedLine.startsWith('USE ')) {
                continue; // Skip USE statements as we're already connected to the database
            }
            
            // Detect procedure boundaries
            if (trimmedLine.includes('DELIMITER //') || trimmedLine.includes('DELIMITER ;')) {
                inProcedure = !inProcedure;
                continue;
            }
            
            currentStatement += line + '\n';
            
            // End of statement detection
            if (!inProcedure && trimmedLine.endsWith(';')) {
                if (currentStatement.trim()) {
                    statements.push(currentStatement.trim());
                }
                currentStatement = '';
            }
        }
        
        // Add any remaining statement
        if (currentStatement.trim()) {
            statements.push(currentStatement.trim());
        }
        
        console.log(`📋 Found ${statements.length} SQL statements to execute\n`);
        
        // Execute each statement
        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i];
            const statementPreview = statement.substring(0, 100).replace(/\s+/g, ' ').trim();
            
            console.log(`${i + 1}️⃣ Executing: ${statementPreview}${statement.length > 100 ? '...' : ''}`);
            
            try {
                await pool.execute(statement);
                console.log('   ✅ Success');
            } catch (error) {
                // Some statements might be expected to fail (like IF NOT EXISTS)
                if (error.code === 'ER_TABLE_EXISTS_ERROR' || error.code === 'ER_DUP_KEYNAME') {
                    console.log('   ⚠️  Already exists (skipping)');
                } else {
                    console.log(`   ❌ Error: ${error.message}`);
                    
                    // Don't fail on certain expected errors
                    if (!error.message.includes('already exists') && 
                        !error.message.includes('Duplicate key name')) {
                        throw error;
                    }
                }
            }
        }
        
        console.log('\n🎉 Migration completed successfully!');
        
        // Verify the results
        console.log('\n📊 Verifying migration results...');
        
        // Check if table exists
        const [tables] = await pool.query("SHOW TABLES LIKE 'store_inventory_snapshot'");
        if (tables.length > 0) {
            console.log('✅ Inventory snapshot table created');
            
            // Check record count
            const [count] = await pool.query('SELECT COUNT(*) as count FROM store_inventory_snapshot');
            console.log(`📊 Snapshot records created: ${count[0].count}`);
            
            if (count[0].count > 0) {
                // Show sample data
                const [sample] = await pool.query(`
                    SELECT sis.*, d.generic_name, s.name as store_name 
                    FROM store_inventory_snapshot sis
                    INNER JOIN drugs d ON sis.drug_id = d.id
                    INNER JOIN stores s ON sis.store_id = s.id
                    LIMIT 3
                `);
                
                console.log('\n📋 Sample snapshot records:');
                sample.forEach((record, i) => {
                    console.log(`  ${i+1}. ${record.store_name} - ${record.generic_name}: ${record.quantity_on_hand} units`);
                });
            }
        } else {
            console.log('❌ Table creation failed');
        }
        
        // Check if stored procedure exists
        const [procedures] = await pool.query("SHOW PROCEDURE STATUS WHERE Name = 'UpdateInventorySnapshot'");
        if (procedures.length > 0) {
            console.log('✅ UpdateInventorySnapshot stored procedure created');
        } else {
            console.log('❌ Stored procedure creation failed');
        }
        
        // Check if view exists
        const [views] = await pool.query("SHOW TABLES WHERE Table_type = 'VIEW' AND Tables_in_pharmatrak = 'v_current_inventory'");
        if (views.length > 0) {
            console.log('✅ v_current_inventory view created');
        } else {
            console.log('❌ View creation failed');
        }
        
        console.log('\n🎯 Migration Summary:');
        console.log('• Inventory snapshot table: Ready for real-time tracking');
        console.log('• Stored procedure: Available for atomic updates');
        console.log('• API endpoints: Ready at /api/inventory-snapshot/');
        console.log('• Test script: Run with "node test_inventory_snapshot.js"');
        
    } catch (error) {
        console.error('\n💥 Migration failed:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.code === 'ECONNREFUSED') {
            console.log('\n💡 Database connection failed. Make sure:');
            console.log('• MySQL server is running');
            console.log('• Database credentials are correct');
            console.log('• Database "pharmatrak" exists');
        }
    }
}

// Run if called directly
if (require.main === module) {
    runMigration().then(() => {
        console.log('\n🏁 Migration script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Migration script crashed:', error);
        process.exit(1);
    });
}

module.exports = { runMigration };