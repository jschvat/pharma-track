/**
 * Populate Inventory Snapshot Script
 * 
 * Manually populates the inventory snapshot table from existing store_inventory data.
 * Run this script if the snapshot table exists but is empty.
 */

const { pool } = require('../config/database');

async function populateInventorySnapshot() {
    console.log('🔄 Populating Inventory Snapshot Table...\n');
    
    try {
        // 1. Check if snapshot table exists
        console.log('1️⃣ Checking if snapshot table exists...');
        const [tables] = await pool.query("SHOW TABLES LIKE 'store_inventory_snapshot'");
        
        if (tables.length === 0) {
            console.log('❌ Snapshot table does not exist!');
            console.log('📋 Please run the migration first:');
            console.log('   mysql pharmatrak < database/migrations/add_inventory_snapshot.sql');
            return;
        }
        
        console.log('✅ Snapshot table exists');
        
        // 2. Check current record count
        console.log('\n2️⃣ Checking current snapshot data...');
        const [currentCount] = await pool.query('SELECT COUNT(*) as count FROM store_inventory_snapshot');
        console.log(`📊 Current snapshot records: ${currentCount[0].count}`);
        
        // 3. Check source data
        console.log('\n3️⃣ Checking source inventory data...');
        const [sourceCount] = await pool.query(`
            SELECT COUNT(DISTINCT store_id, drug_id) as count 
            FROM store_inventory 
            WHERE is_active = TRUE
        `);
        console.log(`📋 Source inventory combinations: ${sourceCount[0].count}`);
        
        if (sourceCount[0].count === 0) {
            console.log('⚠️  No source inventory data found');
            console.log('💡 Add some inventory items first, then run this script');
            return;
        }
        
        // 4. Populate snapshot from store_inventory
        console.log('\n4️⃣ Populating snapshot from store_inventory...');
        const [populateResult] = await pool.query(`
            INSERT INTO store_inventory_snapshot (store_id, drug_id, quantity_on_hand, last_transaction_date)
            SELECT 
                si.store_id,
                si.drug_id,
                SUM(si.quantity_on_hand) as total_quantity,
                MAX(si.last_updated) as last_updated
            FROM store_inventory si
            WHERE si.is_active = TRUE
            GROUP BY si.store_id, si.drug_id
            ON DUPLICATE KEY UPDATE
                quantity_on_hand = VALUES(quantity_on_hand),
                last_transaction_date = VALUES(last_transaction_date),
                updated_at = CURRENT_TIMESTAMP
        `);
        
        console.log(`✅ Populated ${populateResult.affectedRows} snapshot records`);
        
        // 5. Update with transaction data if available
        console.log('\n5️⃣ Updating with latest transaction data...');
        const [updateResult] = await pool.query(`
            UPDATE store_inventory_snapshot sis
            INNER JOIN (
                SELECT 
                    ial.store_id,
                    ial.drug_id,
                    ial.id as transaction_id,
                    ial.transaction_date,
                    ial.transaction_type,
                    ial.performed_by,
                    ial.quantity_after,
                    ROW_NUMBER() OVER (PARTITION BY ial.store_id, ial.drug_id ORDER BY ial.transaction_date DESC) as rn
                FROM inventory_audit_log ial
            ) latest_transactions ON sis.store_id = latest_transactions.store_id 
                AND sis.drug_id = latest_transactions.drug_id
                AND latest_transactions.rn = 1
            SET 
                sis.quantity_on_hand = latest_transactions.quantity_after,
                sis.last_transaction_id = latest_transactions.transaction_id,
                sis.last_transaction_date = latest_transactions.transaction_date,
                sis.last_transaction_type = latest_transactions.transaction_type,
                sis.last_updated_by = latest_transactions.performed_by,
                sis.updated_at = CURRENT_TIMESTAMP
        `);
        
        console.log(`✅ Updated ${updateResult.affectedRows} records with transaction data`);
        
        // 6. Show final statistics
        console.log('\n6️⃣ Final snapshot statistics...');
        const [finalStats] = await pool.query(`
            SELECT 
                COUNT(*) as total_records,
                SUM(quantity_on_hand) as total_quantity,
                COUNT(CASE WHEN quantity_on_hand > 0 THEN 1 END) as in_stock_count,
                COUNT(CASE WHEN quantity_on_hand = 0 THEN 1 END) as out_of_stock_count,
                COUNT(CASE WHEN last_transaction_id IS NOT NULL THEN 1 END) as with_transaction_data
            FROM store_inventory_snapshot
        `);
        
        const stats = finalStats[0];
        console.log(`📊 Total snapshot records: ${stats.total_records}`);
        console.log(`📊 Total quantity tracked: ${stats.total_quantity}`);
        console.log(`📊 Items in stock: ${stats.in_stock_count}`);
        console.log(`📊 Items out of stock: ${stats.out_of_stock_count}`);
        console.log(`📊 Records with transaction data: ${stats.with_transaction_data}`);
        
        // 7. Show sample data
        console.log('\n7️⃣ Sample snapshot data...');
        const [sampleData] = await pool.query(`
            SELECT 
                sis.store_id,
                s.name as store_name,
                d.generic_name,
                sis.quantity_on_hand,
                sis.last_transaction_type,
                sis.last_transaction_date
            FROM store_inventory_snapshot sis
            INNER JOIN stores s ON sis.store_id = s.id
            INNER JOIN drugs d ON sis.drug_id = d.id
            ORDER BY sis.updated_at DESC
            LIMIT 5
        `);
        
        console.log('📋 Recent snapshot entries:');
        sampleData.forEach((record, i) => {
            console.log(`  ${i+1}. ${record.store_name} - ${record.generic_name}`);
            console.log(`     Quantity: ${record.quantity_on_hand}`);
            console.log(`     Last transaction: ${record.last_transaction_type || 'None'}`);
            console.log(`     Date: ${record.last_transaction_date || 'N/A'}`);
            console.log('');
        });
        
        console.log('🎉 Inventory snapshot population completed successfully!');
        console.log('\n📋 Next steps:');
        console.log('• Test the system: node test_inventory_snapshot.js');
        console.log('• Use new API endpoints: /api/inventory-snapshot/*');
        console.log('• All future transactions will automatically update the snapshot');
        
    } catch (error) {
        console.error('❌ Population failed:', error);
        console.error('Stack trace:', error.stack);
        
        if (error.code === 'ER_NO_SUCH_TABLE') {
            console.log('\n💡 Possible solutions:');
            console.log('1. Run the migration: mysql pharmatrak < database/migrations/add_inventory_snapshot.sql');
            console.log('2. Check database connection settings');
        }
    }
}

// Run if called directly
if (require.main === module) {
    populateInventorySnapshot().then(() => {
        console.log('\n🏁 Population script completed');
        process.exit(0);
    }).catch((error) => {
        console.error('💥 Script crashed:', error);
        process.exit(1);
    });
}

module.exports = { populateInventorySnapshot };