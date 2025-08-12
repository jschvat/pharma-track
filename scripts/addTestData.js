require('dotenv').config();
const { pool } = require('../config/database');

// Test drug data with realistic pharmaceutical information
const testDrugs = [
  {
    ndc: '0069-2587-10',
    generic_name: 'ACETAMINOPHEN',
    brand_name: 'TYLENOL',
    manufacturer: 'Johnson & Johnson Consumer Inc.',
    dosage_form: 'TABLET',
    strength: '325 mg',
    route: 'ORAL',
    substance_name: 'ACETAMINOPHEN',
    package_description: '100 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0378-0781-05',
    generic_name: 'IBUPROFEN',
    brand_name: 'ADVIL',
    manufacturer: 'Mylan Pharmaceuticals Inc.',
    dosage_form: 'TABLET',
    strength: '200 mg',
    route: 'ORAL',
    substance_name: 'IBUPROFEN',
    package_description: '500 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0781-1506-01',
    generic_name: 'AMOXICILLIN',
    brand_name: 'AMOXIL',
    manufacturer: 'Sandoz Inc.',
    dosage_form: 'CAPSULE',
    strength: '500 mg',
    route: 'ORAL',
    substance_name: 'AMOXICILLIN',
    package_description: '21 CAPSULE in 1 BOTTLE'
  },
  {
    ndc: '0781-5092-31',
    generic_name: 'LISINOPRIL',
    brand_name: 'PRINIVIL',
    manufacturer: 'Sandoz Inc.',
    dosage_form: 'TABLET',
    strength: '10 mg',
    route: 'ORAL',
    substance_name: 'LISINOPRIL',
    package_description: '90 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0093-0058-01',
    generic_name: 'METFORMIN HYDROCHLORIDE',
    brand_name: 'GLUCOPHAGE',
    manufacturer: 'Teva Pharmaceuticals USA, Inc.',
    dosage_form: 'TABLET',
    strength: '500 mg',
    route: 'ORAL',
    substance_name: 'METFORMIN HYDROCHLORIDE',
    package_description: '100 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0591-0405-01',
    generic_name: 'ATORVASTATIN CALCIUM',
    brand_name: 'LIPITOR',
    manufacturer: 'Actavis Pharma, Inc.',
    dosage_form: 'TABLET',
    strength: '20 mg',
    route: 'ORAL',
    substance_name: 'ATORVASTATIN CALCIUM',
    package_description: '90 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0378-6155-93',
    generic_name: 'AMLODIPINE BESYLATE',
    brand_name: 'NORVASC',
    manufacturer: 'Mylan Pharmaceuticals Inc.',
    dosage_form: 'TABLET',
    strength: '5 mg',
    route: 'ORAL',
    substance_name: 'AMLODIPINE BESYLATE',
    package_description: '90 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0378-0545-05',
    generic_name: 'SERTRALINE HYDROCHLORIDE',
    brand_name: 'ZOLOFT',
    manufacturer: 'Mylan Pharmaceuticals Inc.',
    dosage_form: 'TABLET',
    strength: '50 mg',
    route: 'ORAL',
    substance_name: 'SERTRALINE HYDROCHLORIDE',
    package_description: '30 TABLET in 1 BOTTLE'
  },
  {
    ndc: '0093-7267-56',
    generic_name: 'OMEPRAZOLE',
    brand_name: 'PRILOSEC',
    manufacturer: 'Teva Pharmaceuticals USA, Inc.',
    dosage_form: 'CAPSULE',
    strength: '20 mg',
    route: 'ORAL',
    substance_name: 'OMEPRAZOLE',
    package_description: '30 CAPSULE in 1 BOTTLE'
  },
  {
    ndc: '0378-0023-05',
    generic_name: 'GABAPENTIN',
    brand_name: 'NEURONTIN',
    manufacturer: 'Mylan Pharmaceuticals Inc.',
    dosage_form: 'CAPSULE',
    strength: '300 mg',
    route: 'ORAL',
    substance_name: 'GABAPENTIN',
    package_description: '100 CAPSULE in 1 BOTTLE'
  }
];

// Transaction types for audit log
const transactionTypes = [
  'prescription_fill',
  'return_to_stock', 
  'expire',
  'audit',
  'adjustment',
  'initial_inventory'
];

const addTestData = async () => {
  let connection;
  
  try {
    connection = await pool.getConnection();
    console.log('🔗 Connected to database');

    // Get store and user information
    const [stores] = await connection.execute('SELECT id, name FROM stores LIMIT 5');
    const [users] = await connection.execute('SELECT id, name FROM users WHERE role = "admin" LIMIT 3');
    
    if (stores.length === 0 || users.length === 0) {
      throw new Error('No stores or admin users found. Please run setup first.');
    }

    console.log(`📊 Found ${stores.length} stores and ${users.length} admin users`);

    // Add test drugs
    console.log('💊 Adding test drugs...');
    const drugIds = [];
    
    for (const drug of testDrugs) {
      // Check if drug already exists
      const [existing] = await connection.execute(
        'SELECT id FROM drugs WHERE ndc = ?',
        [drug.ndc]
      );

      let drugId;
      if (existing.length > 0) {
        drugId = existing[0].id;
        console.log(`   ✓ Drug ${drug.brand_name} (${drug.ndc}) already exists`);
      } else {
        const [result] = await connection.execute(`
          INSERT INTO drugs (
            ndc, product_ndc, generic_name, brand_name, manufacturer_name, 
            dosage_form, strength, route, substance_name, product_type,
            date_created, last_updated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        `, [
          drug.ndc, drug.ndc, drug.generic_name, drug.brand_name, drug.manufacturer,
          drug.dosage_form, drug.strength, drug.route, drug.substance_name, 'HUMAN PRESCRIPTION DRUG'
        ]);
        
        drugId = result.insertId;
        console.log(`   ✓ Added ${drug.brand_name} (${drug.ndc})`);
      }
      
      drugIds.push(drugId);
    }

    // Add store inventory for each drug
    console.log('📦 Creating store inventory...');
    const inventoryIds = [];
    
    for (const storeId of stores.map(s => s.id)) {
      for (const drugId of drugIds) {
        // Check if inventory item already exists
        const [existing] = await connection.execute(
          'SELECT id FROM store_inventory WHERE store_id = ? AND drug_id = ?',
          [storeId, drugId]
        );

        let inventoryId;
        if (existing.length > 0) {
          inventoryId = existing[0].id;
        } else {
          const initialQuantity = Math.floor(Math.random() * 500) + 50; // 50-550 units
          const unitCost = (Math.random() * 50 + 5).toFixed(2); // $5-$55
          const expirationDate = new Date();
          expirationDate.setMonth(expirationDate.getMonth() + Math.floor(Math.random() * 24) + 6); // 6-30 months

          const [result] = await connection.execute(`
            INSERT INTO store_inventory (
              store_id, drug_id, quantity_on_hand, unit_cost, expiration_date, 
              lot_number, supplier, date_created, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            storeId, drugId, initialQuantity, unitCost, expirationDate.toISOString().split('T')[0],
            `LOT${Math.random().toString(36).substr(2, 9).toUpperCase()}`,
            `Supplier-${Math.floor(Math.random() * 10) + 1}`
          ]);
          
          inventoryId = result.insertId;
        }
        
        inventoryIds.push({
          id: inventoryId,
          storeId: storeId,
          drugId: drugId
        });
      }
    }

    console.log(`   ✓ Created ${inventoryIds.length} inventory items`);

    // Generate 50 audit log transactions
    console.log('📝 Generating audit log transactions...');
    
    for (let i = 0; i < 50; i++) {
      const inventory = inventoryIds[Math.floor(Math.random() * inventoryIds.length)];
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      const user = users[Math.floor(Math.random() * users.length)];
      
      // Generate realistic quantities based on transaction type
      let quantity;
      let notes = '';
      
      switch (transactionType) {
        case 'prescription_fill':
          quantity = -(Math.floor(Math.random() * 90) + 10); // -10 to -100
          notes = `Prescription filled for patient #${Math.floor(Math.random() * 10000) + 1000}`;
          break;
        case 'return_to_stock':
          quantity = Math.floor(Math.random() * 30) + 5; // 5 to 35
          notes = 'Patient returned unused medication';
          break;
        case 'expire':
          quantity = -(Math.floor(Math.random() * 50) + 10); // -10 to -60
          notes = `Expired medication disposal - Lot expired ${new Date().toISOString().split('T')[0]}`;
          break;
        case 'audit':
          quantity = Math.floor(Math.random() * 200) - 100; // -100 to 100
          notes = `Physical inventory count adjustment - Cycle count performed`;
          break;
        case 'adjustment':
          quantity = Math.floor(Math.random() * 20) - 10; // -10 to 10
          notes = 'Inventory adjustment - damaged/lost items';
          break;
        case 'initial_inventory':
          quantity = Math.floor(Math.random() * 300) + 100; // 100 to 400
          notes = 'Initial inventory entry from supplier delivery';
          break;
      }

      // Create transaction date within last 30 days
      const transactionDate = new Date();
      transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 30));

      // Get current quantity for before/after calculations
      const [currentInventory] = await connection.execute(
        'SELECT quantity_on_hand, unit_cost FROM store_inventory WHERE id = ?',
        [inventory.id]
      );
      
      const quantityBefore = currentInventory[0].quantity_on_hand;
      const quantityAfter = Math.max(0, quantityBefore + quantity);
      const unitCost = currentInventory[0].unit_cost || 0;
      const totalValueChange = quantity * unitCost;

      await connection.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change, 
          quantity_before, quantity_after, unit_cost, total_value_change,
          reason, performed_by, transaction_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inventory.id, inventory.storeId, inventory.drugId, transactionType, quantity,
        quantityBefore, quantityAfter, unitCost, totalValueChange,
        notes, user.id, transactionDate.toISOString().replace('T', ' ').split('.')[0]
      ]);

      console.log(`   ✓ Transaction ${i + 1}/50: ${transactionType} ${quantity > 0 ? '+' : ''}${quantity} units`);
    }

    // Update inventory quantities to match the final quantities from audit log
    console.log('🔄 Finalizing inventory quantities...');
    
    for (const inventory of inventoryIds) {
      // Get the latest quantity_after from audit log for this inventory
      const [latestTransaction] = await connection.execute(`
        SELECT quantity_after 
        FROM inventory_audit_log 
        WHERE inventory_id = ? 
        ORDER BY transaction_date DESC, id DESC 
        LIMIT 1
      `, [inventory.id]);
      
      if (latestTransaction.length > 0) {
        const finalQuantity = latestTransaction[0].quantity_after;
        
        await connection.execute(
          'UPDATE store_inventory SET quantity_on_hand = ?, last_updated = NOW() WHERE id = ?',
          [finalQuantity, inventory.id]
        );
      }
    }

    console.log('📊 Generating summary statistics...');
    
    // Get summary statistics
    const [drugCount] = await connection.execute('SELECT COUNT(*) as count FROM drugs');
    const [inventoryCount] = await connection.execute('SELECT COUNT(*) as count FROM store_inventory');
    const [transactionCount] = await connection.execute('SELECT COUNT(*) as count FROM inventory_audit_log');
    const [totalValue] = await connection.execute(`
      SELECT SUM(quantity_on_hand * unit_cost) as total_value 
      FROM store_inventory 
      WHERE quantity_on_hand > 0
    `);

    console.log('\n✅ Test data added successfully!');
    console.log('\n📈 Database Summary:');
    console.log(`   💊 Drugs: ${drugCount[0].count}`);
    console.log(`   📦 Inventory Items: ${inventoryCount[0].count}`);
    console.log(`   📝 Audit Transactions: ${transactionCount[0].count}`);
    console.log(`   💰 Total Inventory Value: $${(totalValue[0].total_value || 0).toLocaleString()}`);
    
    console.log('\n🎯 Test Data Includes:');
    console.log('   • 10 realistic pharmaceutical drugs');
    console.log('   • Inventory across all stores');
    console.log('   • 50 diverse audit log transactions');
    console.log('   • Prescription fills, returns, expirations');
    console.log('   • Audit adjustments and stock receipts');
    console.log('   • Realistic lot numbers and locations');
    
    console.log('\n🌐 Frontend Testing:');
    console.log('   • Dashboard will show updated inventory stats');
    console.log('   • Inventory page will display all drugs');
    console.log('   • Audit reports will show transaction history');
    console.log('   • NDC reports will have data to display');

  } catch (error) {
    console.error('❌ Error adding test data:', error);
    process.exit(1);
  } finally {
    if (connection) {
      connection.release();
      console.log('🔐 Database connection closed');
    }
    process.exit(0);
  }
};

// Handle script interruption
process.on('SIGINT', () => {
  console.log('\n⚠️  Script interrupted by user');
  process.exit(1);
});

// Run the script
if (require.main === module) {
  console.log('🚀 PharmaTraK Test Data Generator');
  console.log('Adding 10 drugs and 50 audit transactions...\n');
  addTestData();
}

module.exports = addTestData;