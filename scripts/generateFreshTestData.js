/**
 * Generate Fresh Test Data Script
 * 
 * Creates 10 new inventory items with realistic pharmaceutical data and 
 * generates 100+ audit log entries with proper initial_inventory baseline entries.
 */

require('dotenv').config();
const { pool } = require('../config/database');

// Realistic pharmaceutical data with valid NDCs and package information
const pharmaceuticalData = [
  {
    ndc: '00003-0232-21', // Valid NDC format: 5-4-2 digits  
    productNdc: '00003-0232',
    genericName: 'Acetaminophen',
    brandName: 'TYLENOL Regular Strength',
    dosageForm: 'TABLET',
    route: 'ORAL',
    strength: '325 mg',
    manufacturerName: 'McNeil Consumer Healthcare',
    substanceName: 'ACETAMINOPHEN',
    packageSize: 100, // 100 tablets per bottle
    packageUnit: 'tablets'
  },
  {
    ndc: '00049-0593-83',
    productNdc: '00049-0593', 
    genericName: 'Ibuprofen',
    brandName: 'ADVIL',
    dosageForm: 'TABLET',
    route: 'ORAL', 
    strength: '200 mg',
    manufacturerName: 'Pfizer Consumer Healthcare',
    substanceName: 'IBUPROFEN',
    packageSize: 50,
    packageUnit: 'tablets'
  },
  {
    ndc: '00781-1506-01',
    productNdc: '00781-1506',
    genericName: 'Amoxicillin',
    brandName: 'AMOXIL',
    dosageForm: 'CAPSULE',
    route: 'ORAL',
    strength: '500 mg',
    manufacturerName: 'Sandoz Inc',
    substanceName: 'AMOXICILLIN',
    packageSize: 30,
    packageUnit: 'capsules'
  },
  {
    ndc: '00071-0156-23',
    productNdc: '00071-0156',
    genericName: 'Lisinopril',
    brandName: 'PRINIVIL',
    dosageForm: 'TABLET',
    route: 'ORAL',
    strength: '10 mg',
    manufacturerName: 'Merck & Co Inc',
    substanceName: 'LISINOPRIL',
    packageSize: 90,
    packageUnit: 'tablets'
  },
  {
    ndc: '00378-0781-05',
    productNdc: '00378-0781',
    genericName: 'Metformin Hydrochloride',
    brandName: 'GLUCOPHAGE',
    dosageForm: 'TABLET',
    route: 'ORAL',
    strength: '500 mg',
    manufacturerName: 'Mylan Pharmaceuticals Inc',
    substanceName: 'METFORMIN HYDROCHLORIDE',
    packageSize: 60,
    packageUnit: 'tablets'
  },
  {
    ndc: '00172-3981-70',
    productNdc: '00172-3981',
    genericName: 'Amlodipine Besylate',
    brandName: 'NORVASC',
    dosageForm: 'TABLET',
    route: 'ORAL',
    strength: '5 mg',
    manufacturerName: 'Pfizer Labs',
    substanceName: 'AMLODIPINE BESYLATE',
    packageSize: 30,
    packageUnit: 'tablets'
  },
  {
    ndc: '00093-0058-01',
    productNdc: '00093-0058',
    genericName: 'Atorvastatin Calcium',
    brandName: 'LIPITOR',
    dosageForm: 'TABLET', 
    route: 'ORAL',
    strength: '20 mg',
    manufacturerName: 'Teva Pharmaceuticals USA Inc',
    substanceName: 'ATORVASTATIN CALCIUM',
    packageSize: 30,
    packageUnit: 'tablets'
  },
  {
    ndc: '00002-4112-02',
    productNdc: '00002-4112',
    genericName: 'Fluoxetine Hydrochloride',
    brandName: 'PROZAC',
    dosageForm: 'CAPSULE',
    route: 'ORAL',
    strength: '20 mg',
    manufacturerName: 'Eli Lilly and Company',
    substanceName: 'FLUOXETINE HYDROCHLORIDE',
    packageSize: 30,
    packageUnit: 'capsules'
  },
  {
    ndc: '00143-9726-01',
    productNdc: '00143-9726',
    genericName: 'Omeprazole',
    brandName: 'PRILOSEC',
    dosageForm: 'CAPSULE',
    route: 'ORAL',
    strength: '20 mg',
    manufacturerName: 'West-Ward Pharmaceutical Corp',
    substanceName: 'OMEPRAZOLE',
    packageSize: 30,
    packageUnit: 'capsules'
  },
  {
    ndc: '00378-6015-93',
    productNdc: '00378-6015',
    genericName: 'Hydrochlorothiazide',
    brandName: 'MICROZIDE',
    dosageForm: 'TABLET',
    route: 'ORAL',
    strength: '25 mg',
    manufacturerName: 'Mylan Pharmaceuticals Inc',
    substanceName: 'HYDROCHLOROTHIAZIDE',
    packageSize: 90,
    packageUnit: 'tablets'
  }
];

const transactionTypes = [
  'prescription_fill',
  'return_to_stock', 
  'expire',
  'audit',
  'adjustment'
];

// Helper function to generate random date in the past
function getRandomPastDate(daysBack = 90) {
  const now = new Date();
  const pastTime = now.getTime() - (Math.random() * daysBack * 24 * 60 * 60 * 1000);
  return new Date(pastTime);
}

// Helper function to generate prescription numbers
function generatePrescriptionNumber() {
  return 'RX' + Math.floor(Math.random() * 900000 + 100000).toString();
}

async function generateFreshTestData() {
  console.log('\n=== Generating Fresh Test Data ===\n');

  try {
    console.log('1. Creating 10 new drug entries...');
    
    const drugIds = [];
    
    // Create drug entries
    for (let i = 0; i < pharmaceuticalData.length; i++) {
      const drug = pharmaceuticalData[i];
      
      const [result] = await pool.execute(`
        INSERT INTO drugs (
          ndc, product_ndc, generic_name, brand_name, dosage_form, route,
          strength, manufacturer_name, substance_name, product_type, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'HUMAN PRESCRIPTION DRUG', TRUE)
      `, [
        drug.ndc,
        drug.productNdc, 
        drug.genericName,
        drug.brandName,
        drug.dosageForm,
        drug.route,
        drug.strength,
        drug.manufacturerName,
        drug.substanceName
      ]);
      
      drugIds.push(result.insertId);
      console.log(`   ✅ Created ${drug.brandName} (${drug.genericName}) - NDC: ${drug.ndc}`);
    }

    console.log(`\n2. Creating store inventory items...`);
    
    // Get store ID (assuming store ID 1 exists)
    const [storeRows] = await pool.execute('SELECT id FROM stores LIMIT 1');
    if (storeRows.length === 0) {
      throw new Error('No store found in database. Please ensure at least one store exists.');
    }
    const storeId = storeRows[0].id;
    
    // Get user ID for audit logs (assuming user ID 1 exists) 
    const [userRows] = await pool.execute('SELECT id FROM users LIMIT 1');
    if (userRows.length === 0) {
      throw new Error('No users found in database. Please ensure at least one user exists.');
    }
    const userId = userRows[0].id;
    
    const inventoryIds = [];
    
    // Create inventory items with initial stock
    for (let i = 0; i < drugIds.length; i++) {
      const drugId = drugIds[i];
      const drugData = pharmaceuticalData[i];
      
      // Calculate initial inventory: random number of full bottles/packages
      const numberOfPackages = Math.floor(Math.random() * 10) + 1; // 1 to 10 packages
      const initialQuantity = numberOfPackages * drugData.packageSize;
      
      const [inventoryResult] = await pool.execute(`
        INSERT INTO store_inventory (
          store_id, drug_id, quantity_on_hand, reorder_level, 
          unit_cost, selling_price, supplier, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, 'Cardinal Health', TRUE)
      `, [
        storeId,
        drugId,
        initialQuantity,
        Math.max(drugData.packageSize, 20), // Reorder level at least 1 package
        (Math.random() * 50 + 5).toFixed(2), // Random cost between $5-55
        (Math.random() * 100 + 10).toFixed(2) // Random selling price between $10-110
      ]);
      
      inventoryIds.push(inventoryResult.insertId);
      
      console.log(`   ✅ Created inventory for ${drugData.brandName}: ${numberOfPackages} packages = ${initialQuantity} ${drugData.packageUnit}`);
    }

    console.log(`\n3. Creating initial_inventory audit entries...`);
    
    // Create initial_inventory entries for all items
    let totalAuditEntries = 0;
    
    for (let i = 0; i < inventoryIds.length; i++) {
      const inventoryId = inventoryIds[i];
      const drugId = drugIds[i];
      const drugData = pharmaceuticalData[i];
      
      // Get the current quantity for this inventory item
      const [invRows] = await pool.execute('SELECT quantity_on_hand FROM store_inventory WHERE id = ?', [inventoryId]);
      const currentQuantity = invRows[0].quantity_on_hand;
      
      // Create initial_inventory entry with a date 3-6 months ago
      const initialDate = getRandomPastDate(180); // Up to 6 months ago
      
      await pool.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change,
          quantity_before, quantity_after, reason, performed_by, transaction_date
        ) VALUES (?, ?, ?, 'initial_inventory', ?, 0, ?, 'Initial inventory from supplier delivery', ?, ?)
      `, [inventoryId, storeId, drugId, currentQuantity, currentQuantity, userId, initialDate]);
      
      totalAuditEntries++;
      console.log(`   ✅ Initial inventory entry for ${drugData.brandName}: ${currentQuantity} units`);
    }

    console.log(`\n4. Creating additional audit log entries...`);
    
    // Generate additional audit entries to reach ~100 total
    const targetAuditEntries = 100;
    const remainingEntries = targetAuditEntries - totalAuditEntries;
    
    for (let i = 0; i < remainingEntries; i++) {
      // Pick random inventory item
      const randomIndex = Math.floor(Math.random() * inventoryIds.length);
      const inventoryId = inventoryIds[randomIndex];
      const drugId = drugIds[randomIndex];
      const drugData = pharmaceuticalData[randomIndex];
      
      // Get current quantity from last transaction
      const [lastTransaction] = await pool.execute(`
        SELECT quantity_after FROM inventory_audit_log 
        WHERE inventory_id = ? 
        ORDER BY transaction_date DESC, id DESC 
        LIMIT 1
      `, [inventoryId]);
      
      const currentQuantity = lastTransaction[0].quantity_after;
      
      // Pick random transaction type (excluding initial_inventory)
      const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
      
      let quantityChange = 0;
      let reason = '';
      let prescriptionNumber = null;
      
      // Generate realistic quantity changes based on transaction type
      switch (transactionType) {
        case 'prescription_fill':
          // Prescription fills: typically 30, 60, or 90 day supplies
          const supplyDays = [30, 60, 90][Math.floor(Math.random() * 3)];
          quantityChange = -Math.min(supplyDays, currentQuantity); // Don't go below 0
          reason = `${supplyDays}-day prescription fill`;
          prescriptionNumber = generatePrescriptionNumber();
          break;
          
        case 'return_to_stock':
          // Returns: typically smaller amounts
          quantityChange = Math.floor(Math.random() * 30) + 1;
          reason = 'Patient return - unused medication';
          break;
          
        case 'expire':
          // Expired medication: random small amounts
          quantityChange = -Math.min(Math.floor(Math.random() * 20) + 1, currentQuantity);
          reason = 'Medication expired - removed from stock';
          break;
          
        case 'audit':
          // Audit adjustments: can be positive or negative
          quantityChange = Math.floor(Math.random() * 21) - 10; // -10 to +10
          reason = 'Physical inventory count adjustment';
          break;
          
        case 'adjustment':
          // Stock adjustments: typically restocking
          const packages = Math.floor(Math.random() * 5) + 1;
          quantityChange = packages * drugData.packageSize;
          reason = `Supplier delivery - ${packages} package(s)`;
          break;
      }
      
      const quantityAfter = Math.max(0, currentQuantity + quantityChange);
      
      // Generate random date between initial inventory and now
      const transactionDate = getRandomPastDate(60); // Within last 60 days
      
      await pool.execute(`
        INSERT INTO inventory_audit_log (
          inventory_id, store_id, drug_id, transaction_type, quantity_change,
          quantity_before, quantity_after, reason, reference_number, performed_by, transaction_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        inventoryId, storeId, drugId, transactionType, quantityChange,
        currentQuantity, quantityAfter, reason, prescriptionNumber, userId, transactionDate
      ]);
      
      // Update the actual inventory quantity to match
      await pool.execute('UPDATE store_inventory SET quantity_on_hand = ? WHERE id = ?', [quantityAfter, inventoryId]);
      
      totalAuditEntries++;
      
      if ((i + 1) % 10 === 0) {
        console.log(`   Progress: ${i + 1}/${remainingEntries} additional entries created...`);
      }
    }

    console.log(`\n✅ Data generation complete!`);
    console.log(`   - Created ${drugIds.length} drugs`);
    console.log(`   - Created ${inventoryIds.length} inventory items`);
    console.log(`   - Created ${totalAuditEntries} audit log entries`);
    
    // Display summary
    console.log(`\n📊 Inventory Summary:`);
    const [summaryRows] = await pool.execute(`
      SELECT 
        d.brand_name,
        d.generic_name,
        d.ndc,
        si.quantity_on_hand,
        COUNT(ial.id) as audit_count
      FROM store_inventory si
      JOIN drugs d ON si.drug_id = d.id
      LEFT JOIN inventory_audit_log ial ON si.id = ial.inventory_id
      WHERE si.store_id = ?
      GROUP BY si.id
      ORDER BY d.brand_name
    `, [storeId]);
    
    summaryRows.forEach(row => {
      console.log(`   ${row.brand_name}: ${row.quantity_on_hand} units (${row.audit_count} transactions)`);
    });
    
    console.log(`\n=== Test Data Generation Complete ===\n`);

  } catch (error) {
    console.error('❌ Error generating test data:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

// Run the data generation
generateFreshTestData();