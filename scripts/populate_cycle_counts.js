const mysql = require('mysql2/promise');

/**
 * Populate Cycle Count Data - Store On-Hand Inventory Population
 * 
 * This script populates inventory on-hand quantities for cycle counting purposes.
 * It creates realistic inventory levels across all stores with varying quantities.
 */

class CycleCountPopulator {
  constructor() {
    this.connection = null;
  }

  async connect() {
    this.connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'pharmatrak_user',
      password: process.env.DB_PASSWORD || 'pharmatrak_password',
      database: process.env.DB_NAME || 'pharmatrak'
    });
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.end();
    }
  }

  /**
   * Generate realistic on-hand quantities for cycle counting
   */
  generateCycleCountQuantity(drugType = 'standard') {
    const baseQuantities = {
      'high-volume': { min: 500, max: 2000 }, // Popular drugs
      'standard': { min: 50, max: 500 },      // Regular drugs
      'specialty': { min: 10, max: 100 },     // Specialty drugs
      'controlled': { min: 25, max: 200 },    // Controlled substances
      'low-demand': { min: 5, max: 50 }       // Rarely used drugs
    };

    const range = baseQuantities[drugType] || baseQuantities['standard'];
    return Math.floor(Math.random() * (range.max - range.min + 1)) + range.min;
  }

  /**
   * Generate reorder levels based on on-hand quantities
   */
  generateReorderLevel(onHandQuantity) {
    // Reorder level is typically 20-30% of normal stock level
    const percentage = 0.2 + Math.random() * 0.1; // 20-30%
    return Math.max(10, Math.floor(onHandQuantity * percentage));
  }

  /**
   * Generate realistic cost and pricing data
   */
  generatePricingData() {
    const unitCost = (Math.random() * 50 + 0.50).toFixed(4); // $0.50 - $50.50
    const markup = 1.2 + Math.random() * 0.8; // 20% - 100% markup
    const sellingPrice = (parseFloat(unitCost) * markup).toFixed(4);
    
    return {
      unit_cost: parseFloat(unitCost),
      selling_price: parseFloat(sellingPrice)
    };
  }

  /**
   * Generate lot numbers and expiration dates
   */
  generateLotData() {
    const lotNumber = 'LOT' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    // Generate expiration date 6 months to 3 years in the future
    const expirationDate = new Date();
    expirationDate.setMonth(expirationDate.getMonth() + 6 + Math.floor(Math.random() * 30));
    
    return {
      lot_number: lotNumber,
      expiration_date: expirationDate.toISOString().split('T')[0]
    };
  }

  /**
   * Get all stores and drugs for inventory population
   */
  async getStoresAndDrugs() {
    const [stores] = await this.connection.execute('SELECT id, name FROM stores ORDER BY id');
    const [drugs] = await this.connection.execute('SELECT id, ndc, generic_name, brand_name FROM drugs ORDER BY id');
    
    return { stores, drugs };
  }

  /**
   * Check if inventory already exists for a store-drug combination
   */
  async inventoryExists(storeId, drugId) {
    const [rows] = await this.connection.execute(
      'SELECT id FROM store_inventory WHERE store_id = ? AND drug_id = ? AND is_active = TRUE',
      [storeId, drugId]
    );
    return rows.length > 0;
  }

  /**
   * Categorize drugs for appropriate quantity generation
   */
  categorizeDrug(drug) {
    const genericName = drug.generic_name.toLowerCase();
    
    // High-volume drugs (common medications)
    if (['acetaminophen', 'ibuprofen', 'amoxicillin', 'lisinopril', 'metformin'].some(name => 
        genericName.includes(name))) {
      return 'high-volume';
    }
    
    // Controlled substances
    if (['hydrocodone', 'oxycodone', 'alprazolam', 'lorazepam', 'adderall'].some(name => 
        genericName.includes(name))) {
      return 'controlled';
    }
    
    // Specialty drugs
    if (['insulin', 'warfarin', 'digoxin', 'phenytoin'].some(name => 
        genericName.includes(name))) {
      return 'specialty';
    }
    
    return 'standard';
  }

  /**
   * Populate inventory for a specific store-drug combination
   */
  async populateInventoryItem(storeId, drug, performedBy = 1) {
    const drugCategory = this.categorizeDrug(drug);
    const onHandQuantity = this.generateCycleCountQuantity(drugCategory);
    const reorderLevel = this.generateReorderLevel(onHandQuantity);
    const pricing = this.generatePricingData();
    const lotData = this.generateLotData();

    const inventoryData = {
      store_id: storeId,
      drug_id: drug.id,
      quantity_on_hand: onHandQuantity,
      reorder_level: reorderLevel,
      unit_cost: pricing.unit_cost,
      selling_price: pricing.selling_price,
      lot_number: lotData.lot_number,
      expiration_date: lotData.expiration_date,
      supplier: `Supplier-${Math.floor(Math.random() * 20) + 1}`
    };

    try {
      await this.connection.beginTransaction();

      // Insert inventory item
      const [result] = await this.connection.execute(`
        INSERT INTO store_inventory (
          store_id, drug_id, quantity_on_hand, reorder_level, unit_cost,
          selling_price, lot_number, expiration_date, supplier
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inventoryData.store_id,
        inventoryData.drug_id,
        inventoryData.quantity_on_hand,
        inventoryData.reorder_level,
        inventoryData.unit_cost,
        inventoryData.selling_price,
        inventoryData.lot_number,
        inventoryData.expiration_date,
        inventoryData.supplier
      ]);

      const inventoryId = result.insertId;

      // Log initial stock in audit log
      await this.connection.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change,
          quantity_before, quantity_after, reason, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inventoryId,
        inventoryData.store_id,
        inventoryData.drug_id,
        'initial_inventory',
        inventoryData.quantity_on_hand,
        0,
        inventoryData.quantity_on_hand,
        'Initial cycle count inventory setup',
        performedBy
      ]);

      await this.connection.commit();
      
      return {
        inventoryId,
        ...inventoryData,
        drugCategory
      };

    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  /**
   * Update existing inventory with new cycle count quantities
   */
  async updateExistingInventory(storeId, drugId, performedBy = 1) {
    try {
      // Get current inventory
      const [current] = await this.connection.execute(
        'SELECT id, quantity_on_hand FROM store_inventory WHERE store_id = ? AND drug_id = ? AND is_active = TRUE',
        [storeId, drugId]
      );

      if (current.length === 0) {
        return null;
      }

      const inventoryId = current[0].id;
      const currentQuantity = current[0].quantity_on_hand;
      
      // Generate new cycle count quantity
      const [drug] = await this.connection.execute('SELECT * FROM drugs WHERE id = ?', [drugId]);
      const drugCategory = this.categorizeDrug(drug[0]);
      const newQuantity = this.generateCycleCountQuantity(drugCategory);
      const newReorderLevel = this.generateReorderLevel(newQuantity);

      await this.connection.beginTransaction();

      // Update inventory
      await this.connection.execute(`
        UPDATE store_inventory 
        SET quantity_on_hand = ?, reorder_level = ?, last_updated = CURRENT_TIMESTAMP
        WHERE id = ?
      `, [newQuantity, newReorderLevel, inventoryId]);

      // Log cycle count adjustment
      const quantityChange = newQuantity - currentQuantity;
      await this.connection.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change,
          quantity_before, quantity_after, reason, performed_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inventoryId,
        storeId,
        drugId,
        'audit',
        quantityChange,
        currentQuantity,
        newQuantity,
        'Cycle count adjustment - system populated',
        performedBy
      ]);

      await this.connection.commit();

      return {
        inventoryId,
        previousQuantity: currentQuantity,
        newQuantity,
        adjustment: quantityChange,
        drugCategory
      };

    } catch (error) {
      await this.connection.rollback();
      throw error;
    }
  }

  /**
   * Populate all stores with inventory data
   */
  async populateAllStores() {
    console.log('🚀 Starting cycle count inventory population...\n');

    const { stores, drugs } = await await this.getStoresAndDrugs();
    
    console.log(`📊 Found ${stores.length} stores and ${drugs.length} drugs`);
    console.log(`📦 Will create up to ${stores.length * drugs.length} inventory items\n`);

    const results = {
      created: 0,
      updated: 0,
      skipped: 0,
      errors: 0,
      totalValue: 0,
      storeDetails: {}
    };

    for (const store of stores) {
      console.log(`🏪 Processing store: ${store.name} (ID: ${store.id})`);
      
      results.storeDetails[store.id] = {
        name: store.name,
        items: 0,
        totalOnHand: 0,
        totalValue: 0
      };

      let storeItems = 0;
      let storeOnHand = 0;
      let storeValue = 0;

      // Process each drug for this store
      for (const drug of drugs) {
        try {
          const exists = await this.inventoryExists(store.id, drug.id);
          
          if (exists) {
            // Update existing inventory with new cycle count
            const updateResult = await this.updateExistingInventory(store.id, drug.id);
            if (updateResult) {
              results.updated++;
              storeItems++;
              storeOnHand += updateResult.newQuantity;
              // Estimate value (using average cost)
              storeValue += updateResult.newQuantity * 5.0; // Rough estimate
              
              if (results.updated % 10 === 0) {
                process.stdout.write('.');
              }
            }
          } else {
            // Create new inventory item
            const createResult = await this.populateInventoryItem(store.id, drug);
            results.created++;
            storeItems++;
            storeOnHand += createResult.quantity_on_hand;
            storeValue += createResult.quantity_on_hand * createResult.unit_cost;
            
            if (results.created % 10 === 0) {
              process.stdout.write('.');
            }
          }
          
        } catch (error) {
          console.error(`\n❌ Error processing ${drug.generic_name} for ${store.name}: ${error.message}`);
          results.errors++;
        }
      }

      results.storeDetails[store.id].items = storeItems;
      results.storeDetails[store.id].totalOnHand = storeOnHand;
      results.storeDetails[store.id].totalValue = storeValue;
      results.totalValue += storeValue;

      console.log(`\n   ✅ ${storeItems} items, ${storeOnHand} total on-hand, $${storeValue.toFixed(2)} estimated value`);
    }

    return results;
  }

  /**
   * Generate cycle count summary report
   */
  async generateCycleCountReport() {
    console.log('\n📋 Generating Cycle Count Summary Report...\n');

    // Overall inventory summary
    const [summary] = await this.connection.execute(`
      SELECT 
        COUNT(DISTINCT s.id) as total_stores,
        COUNT(si.id) as total_inventory_items,
        SUM(si.quantity_on_hand) as total_on_hand,
        AVG(si.quantity_on_hand) as avg_on_hand,
        SUM(si.quantity_on_hand * si.unit_cost) as total_inventory_value,
        COUNT(CASE WHEN si.quantity_on_hand <= si.reorder_level THEN 1 END) as low_stock_items,
        COUNT(CASE WHEN si.quantity_on_hand < 0 THEN 1 END) as negative_stock_items
      FROM stores s
      LEFT JOIN store_inventory si ON s.id = si.store_id AND si.is_active = TRUE
    `);

    console.log('📊 CYCLE COUNT SUMMARY REPORT');
    console.log('=' .repeat(50));
    console.table(summary);

    // Store-by-store breakdown
    const [storeBreakdown] = await this.connection.execute(`
      SELECT 
        s.name as store_name,
        COUNT(si.id) as inventory_items,
        SUM(si.quantity_on_hand) as total_on_hand,
        AVG(si.quantity_on_hand) as avg_on_hand,
        SUM(si.quantity_on_hand * si.unit_cost) as estimated_value,
        COUNT(CASE WHEN si.quantity_on_hand <= si.reorder_level THEN 1 END) as low_stock_items
      FROM stores s
      LEFT JOIN store_inventory si ON s.id = si.store_id AND si.is_active = TRUE
      GROUP BY s.id, s.name
      ORDER BY total_on_hand DESC
    `);

    console.log('\n🏪 STORE BREAKDOWN');
    console.log('-' .repeat(50));
    console.table(storeBreakdown);

    // Top items by quantity
    const [topItems] = await this.connection.execute(`
      SELECT 
        d.generic_name,
        d.brand_name,
        s.name as store_name,
        si.quantity_on_hand,
        si.reorder_level,
        (si.quantity_on_hand * si.unit_cost) as estimated_value
      FROM store_inventory si
      JOIN drugs d ON si.drug_id = d.id
      JOIN stores s ON si.store_id = s.id
      WHERE si.is_active = TRUE
      ORDER BY si.quantity_on_hand DESC
      LIMIT 15
    `);

    console.log('\n📦 TOP INVENTORY ITEMS BY QUANTITY');
    console.log('-' .repeat(50));
    console.table(topItems);

    // Items needing reorder
    const [reorderItems] = await this.connection.execute(`
      SELECT 
        d.generic_name,
        s.name as store_name,
        si.quantity_on_hand,
        si.reorder_level,
        (si.reorder_level - si.quantity_on_hand) as reorder_quantity
      FROM store_inventory si
      JOIN drugs d ON si.drug_id = d.id
      JOIN stores s ON si.store_id = s.id
      WHERE si.is_active = TRUE AND si.quantity_on_hand <= si.reorder_level
      ORDER BY reorder_quantity DESC
      LIMIT 10
    `);

    if (reorderItems.length > 0) {
      console.log('\n⚠️  ITEMS NEEDING REORDER');
      console.log('-' .repeat(50));
      console.table(reorderItems);
    }
  }

  /**
   * Main execution function
   */
  async run() {
    try {
      await this.connect();
      
      console.log('🔄 PharmaTraK Cycle Count Inventory Population');
      console.log('=' .repeat(60));
      console.log('📅 Date:', new Date().toLocaleString());
      console.log('🎯 Purpose: Populate store on-hand quantities for cycle counting\n');

      const results = await this.populateAllStores();
      
      console.log('\n🎉 POPULATION COMPLETE!');
      console.log('=' .repeat(40));
      console.log(`✅ Created: ${results.created} new inventory items`);
      console.log(`🔄 Updated: ${results.updated} existing items`);
      console.log(`⏭️  Skipped: ${results.skipped} items`);
      console.log(`❌ Errors: ${results.errors} errors`);
      console.log(`💰 Total Est. Value: $${results.totalValue.toFixed(2)}`);

      await this.generateCycleCountReport();

    } catch (error) {
      console.error('❌ Population failed:', error);
      throw error;
    } finally {
      await this.disconnect();
    }
  }
}

// Run the cycle count population
if (require.main === module) {
  const populator = new CycleCountPopulator();
  populator.run().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

module.exports = CycleCountPopulator;