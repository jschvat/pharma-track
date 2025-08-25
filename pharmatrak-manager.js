#!/usr/bin/env node

/**
 * PharmaTraK Database Management Tool
 * 
 * A unified interactive tool that combines all database management scripts:
 * - Database creation and setup
 * - Test data generation
 * - Migration management  
 * - Backup and restore operations
 * - System verification and diagnostics
 * 
 * Usage: node pharmatrak-manager.js
 * 
 * @author PharmaTraK Development Team
 * @version 2.0.0
 */

const mysql = require('mysql2/promise');
const fs = require('fs').promises;
const path = require('path');
const bcrypt = require('bcryptjs');
const readline = require('readline');

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'pharmatrak_user',
  password: process.env.DB_PASSWORD || 'pharmatrak_password',
  database: process.env.DB_NAME || 'pharmatrak',
  multipleStatements: true
};

// Test pharmaceutical data
const testDrugs = [
  {
    ndc: '0069-2587-10',
    generic_name: 'ACETAMINOPHEN',
    brand_name: 'TYLENOL',
    manufacturer: 'Johnson & Johnson Consumer Inc.',
    dosage_form: 'TABLET',
    strength: '325 mg',
    route: 'ORAL',
    substance_name: 'ACETAMINOPHEN'
  },
  {
    ndc: '0378-0781-05',
    generic_name: 'IBUPROFEN',
    brand_name: 'ADVIL',
    manufacturer: 'Mylan Pharmaceuticals Inc.',
    dosage_form: 'TABLET',
    strength: '200 mg',
    route: 'ORAL',
    substance_name: 'IBUPROFEN'
  },
  {
    ndc: '0781-1506-01',
    generic_name: 'AMOXICILLIN',
    brand_name: 'AMOXIL',
    manufacturer: 'Sandoz Inc.',
    dosage_form: 'CAPSULE',
    strength: '500 mg',
    route: 'ORAL',
    substance_name: 'AMOXICILLIN'
  },
  {
    ndc: '0781-5092-31',
    generic_name: 'LISINOPRIL',
    brand_name: 'PRINIVIL',
    manufacturer: 'Sandoz Inc.',
    dosage_form: 'TABLET',
    strength: '10 mg',
    route: 'ORAL',
    substance_name: 'LISINOPRIL'
  },
  {
    ndc: '0093-0058-01',
    generic_name: 'METFORMIN HYDROCHLORIDE',
    brand_name: 'GLUCOPHAGE',
    manufacturer: 'Teva Pharmaceuticals USA, Inc.',
    dosage_form: 'TABLET',
    strength: '500 mg',
    route: 'ORAL',
    substance_name: 'METFORMIN HYDROCHLORIDE'
  }
];

class PharmaTraKManager {
  constructor() {
    this.connection = null;
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    // Handle readline close events
    this.rl.on('close', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  // Utility methods
  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  async prompt(question) {
    return new Promise((resolve) => {
      if (this.rl.closed) {
        resolve('');
        return;
      }
      try {
        this.rl.question(question, resolve);
      } catch (error) {
        if (error.code === 'ERR_USE_AFTER_CLOSE') {
          resolve('');
        } else {
          throw error;
        }
      }
    });
  }

  async connectDatabase(createIfNotExists = false) {
    try {
      if (createIfNotExists) {
        // Connect without database to create it
        const tempConfig = { ...dbConfig };
        delete tempConfig.database;
        this.connection = await mysql.createConnection(tempConfig);
        
        // Create database if it doesn't exist
        await this.connection.execute(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
        await this.connection.execute(`USE ${dbConfig.database}`);
      } else {
        this.connection = await mysql.createConnection(dbConfig);
      }
      return true;
    } catch (error) {
      this.log(`❌ Database connection failed: ${error.message}`, 'red');
      return false;
    }
  }

  async disconnectDatabase() {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async cleanup() {
    await this.disconnectDatabase();
    if (this.rl && !this.rl.closed) {
      this.rl.close();
    }
  }

  // Main menu system
  async showMainMenu() {
    console.clear();
    this.log('═══════════════════════════════════════════════', 'cyan');
    this.log('       🏥 PharmaTraK Database Manager 2.0       ', 'cyan');
    this.log('═══════════════════════════════════════════════', 'cyan');
    this.log('');
    this.log('📋 MAIN MENU:', 'bright');
    this.log('');
    this.log('  1️⃣  Database Setup & Schema Creation', 'green');
    this.log('  2️⃣  Test Data Management', 'blue');
    this.log('  3️⃣  Database Migrations & Updates', 'yellow');
    this.log('  4️⃣  System Diagnostics & Verification', 'magenta');
    this.log('  5️⃣  Backup & Restore Operations', 'cyan');
    this.log('  6️⃣  User & Store Management', 'white');
    this.log('  7️⃣  Performance & Optimization', 'green');
    this.log('  8️⃣  System Information', 'blue');
    this.log('  9️⃣  Exit', 'red');
    this.log('');
    
    const choice = await this.prompt('Select an option (1-9): ');
    await this.handleMainMenuChoice(choice);
  }

  async handleMainMenuChoice(choice) {
    switch (choice) {
      case '1':
        await this.showDatabaseSetupMenu();
        break;
      case '2':
        await this.showTestDataMenu();
        break;
      case '3':
        await this.showMigrationsMenu();
        break;
      case '4':
        await this.showDiagnosticsMenu();
        break;
      case '5':
        await this.showBackupMenu();
        break;
      case '6':
        await this.showUserManagementMenu();
        break;
      case '7':
        await this.showPerformanceMenu();
        break;
      case '8':
        await this.showSystemInfo();
        break;
      case '9':
        await this.exitProgram();
        break;
      default:
        this.log('❌ Invalid option. Please try again.', 'red');
        await this.prompt('Press Enter to continue...');
        await this.showMainMenu();
    }
  }

  // Database Setup Menu
  async showDatabaseSetupMenu() {
    console.clear();
    this.log('🗄️  DATABASE SETUP & SCHEMA CREATION', 'green');
    this.log('═══════════════════════════════════════', 'green');
    this.log('');
    this.log('  1️⃣  Create Database & Complete Setup');
    this.log('  2️⃣  Create Schema Only');
    this.log('  3️⃣  Create Sample Stores');
    this.log('  4️⃣  Create Admin User');
    this.log('  5️⃣  Reset Database (DANGER)');
    this.log('  6️⃣  Back to Main Menu');
    this.log('');
    
    const choice = await this.prompt('Select an option (1-6): ');
    await this.handleSetupMenuChoice(choice);
  }

  async handleSetupMenuChoice(choice) {
    switch (choice) {
      case '1':
        await this.createCompleteDatabase();
        break;
      case '2':
        await this.createSchemaOnly();
        break;
      case '3':
        await this.createSampleStores();
        break;
      case '4':
        await this.createAdminUser();
        break;
      case '5':
        await this.resetDatabase();
        break;
      case '6':
        await this.showMainMenu();
        break;
      default:
        this.log('❌ Invalid option. Please try again.', 'red');
        await this.prompt('Press Enter to continue...');
        await this.showDatabaseSetupMenu();
    }
  }

  async createCompleteDatabase() {
    this.log('🚀 Starting Complete Database Setup...', 'green');
    this.log('');
    
    if (!await this.connectDatabase(true)) {
      await this.prompt('Press Enter to continue...');
      return await this.showDatabaseSetupMenu();
    }

    try {
      // Create all tables
      await this.createCoreTables();
      await this.createConstraints();
      await this.createIndexes();
      await this.createTriggers();
      
      // Create sample data
      await this.createSampleStores();
      await this.createAdminUser();
      
      this.log('', 'green');
      this.log('🎉 Complete Database Setup Finished!', 'green');
      this.log('   Email: admin@pharmatrak.com', 'cyan');
      this.log('   Password: Admin123!', 'cyan');
      
    } catch (error) {
      this.log(`❌ Setup failed: ${error.message}`, 'red');
    } finally {
      await this.disconnectDatabase();
    }

    await this.prompt('Press Enter to continue...');
    await this.showDatabaseSetupMenu();
  }

  async createCoreTables() {
    this.log('📋 Creating core database tables...', 'yellow');
    
    const tables = [
      {
        name: 'stores',
        sql: `CREATE TABLE IF NOT EXISTS stores (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          address VARCHAR(500) NOT NULL,
          city VARCHAR(100),
          state CHAR(2) NOT NULL,
          zipcode VARCHAR(10) NOT NULL,
          phone VARCHAR(11) NOT NULL,
          fax VARCHAR(11),
          dea_registration_number CHAR(9) NOT NULL UNIQUE,
          npi CHAR(10) NOT NULL UNIQUE,
          admin_user_id INT,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'users',
        sql: `CREATE TABLE IF NOT EXISTS users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          name VARCHAR(100) NOT NULL,
          email VARCHAR(255) NOT NULL UNIQUE,
          phone VARCHAR(11) NOT NULL,
          password VARCHAR(255) NOT NULL,
          address VARCHAR(500) NOT NULL,
          store_id INT NOT NULL,
          role ENUM('admin', 'user', 'god_mode') DEFAULT 'user',
          is_active BOOLEAN DEFAULT TRUE,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          active_store_id INT
        )`
      },
      {
        name: 'drugs',
        sql: `CREATE TABLE IF NOT EXISTS drugs (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ndc VARCHAR(15) NOT NULL UNIQUE,
          product_ndc VARCHAR(15),
          generic_name VARCHAR(500) NOT NULL,
          brand_name VARCHAR(500),
          dosage_form VARCHAR(100),
          route VARCHAR(255),
          strength VARCHAR(255),
          manufacturer_name VARCHAR(255),
          labeler_name VARCHAR(255),
          substance_name TEXT,
          product_type VARCHAR(100),
          marketing_status VARCHAR(50),
          listing_expiration_date DATE,
          is_active BOOLEAN DEFAULT TRUE,
          fda_data JSON,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'store_inventory',
        sql: `CREATE TABLE IF NOT EXISTS store_inventory (
          id INT AUTO_INCREMENT PRIMARY KEY,
          store_id INT NOT NULL,
          drug_id INT NOT NULL,
          quantity_on_hand INT NOT NULL DEFAULT 0,
          reorder_level INT DEFAULT 10,
          unit_cost DECIMAL(10,4),
          selling_price DECIMAL(10,4),
          lot_number VARCHAR(50),
          expiration_date DATE,
          supplier VARCHAR(255),
          is_active BOOLEAN DEFAULT TRUE,
          last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      },
      {
        name: 'inventory_audit_log',
        sql: `CREATE TABLE IF NOT EXISTS inventory_audit_log (
          id INT AUTO_INCREMENT PRIMARY KEY,
          inventory_id INT NOT NULL,
          store_id INT NOT NULL,
          drug_id INT NOT NULL,
          transaction_type ENUM('prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received', 'initial_inventory') NOT NULL,
          quantity_change INT NOT NULL,
          quantity_before INT NOT NULL,
          quantity_after INT NOT NULL,
          reason VARCHAR(500),
          reference_number VARCHAR(100),
          performed_by INT NOT NULL,
          transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )`
      }
    ];

    for (const table of tables) {
      try {
        await this.connection.execute(table.sql);
        this.log(`   ✅ Created table: ${table.name}`, 'green');
      } catch (error) {
        if (error.code === 'ER_TABLE_EXISTS_ERROR') {
          this.log(`   ⚠️  Table ${table.name} already exists`, 'yellow');
        } else {
          throw error;
        }
      }
    }
  }

  async createConstraints() {
    this.log('🔒 Adding database constraints...', 'yellow');
    
    const constraints = [
      // Store constraints
      'ALTER TABLE stores ADD CONSTRAINT chk_store_name_format CHECK ((CHAR_LENGTH(TRIM(name)) >= 2) AND REGEXP_LIKE(name, "^[a-zA-Z0-9\\\\s\\\\-\'\\\\.,&]+$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_address_format CHECK ((CHAR_LENGTH(TRIM(address)) >= 5) AND REGEXP_LIKE(address, "^[a-zA-Z0-9\\\\s\\\\-\'\\\\.,#]+$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_state_valid_us CHECK (REGEXP_LIKE(state, "^[A-Z]{2}$") AND (state IN ("AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS","KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY","NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV","WI","WY","DC","PR","VI","GU","AS","MP")))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_zipcode_us_format CHECK (REGEXP_LIKE(zipcode, "^[0-9]{5}(-[0-9]{4})?$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_phone_digits_only CHECK (REGEXP_LIKE(phone, "^[0-9]{10,11}$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_fax_optional_valid CHECK ((fax IS NULL) OR REGEXP_LIKE(fax, "^[0-9]{10,11}$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_dea_registration_format CHECK (REGEXP_LIKE(dea_registration_number, "^[A-Z]{2}[0-9]{7}$"))',
      'ALTER TABLE stores ADD CONSTRAINT chk_store_npi_format CHECK (REGEXP_LIKE(npi, "^[0-9]{10}$"))',
      
      // User constraints
      'ALTER TABLE users ADD CONSTRAINT chk_user_name_min_length CHECK (CHAR_LENGTH(TRIM(name)) >= 2)',
      'ALTER TABLE users ADD CONSTRAINT chk_user_email_valid_format CHECK (REGEXP_LIKE(email, "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\\\.[a-zA-Z]{2,}$"))',
      'ALTER TABLE users ADD CONSTRAINT chk_user_phone_digits_only CHECK (REGEXP_LIKE(phone, "^[0-9]{10,11}$"))',
      'ALTER TABLE users ADD CONSTRAINT chk_user_password_hashed CHECK (CHAR_LENGTH(password) >= 60)',
      'ALTER TABLE users ADD CONSTRAINT chk_user_address_min_length CHECK (CHAR_LENGTH(TRIM(address)) >= 5)',
      
      // Foreign keys
      'ALTER TABLE users ADD CONSTRAINT users_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE',
      'ALTER TABLE store_inventory ADD CONSTRAINT inventory_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE',
      'ALTER TABLE store_inventory ADD CONSTRAINT inventory_drug_fk FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE',
      'ALTER TABLE inventory_audit_log ADD CONSTRAINT audit_inventory_fk FOREIGN KEY (inventory_id) REFERENCES store_inventory(id) ON DELETE CASCADE',
      'ALTER TABLE inventory_audit_log ADD CONSTRAINT audit_store_fk FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE',
      'ALTER TABLE inventory_audit_log ADD CONSTRAINT audit_drug_fk FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE',
      'ALTER TABLE inventory_audit_log ADD CONSTRAINT audit_user_fk FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE CASCADE'
    ];

    for (const constraint of constraints) {
      try {
        await this.connection.execute(constraint);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME' || error.message.includes('already exists')) {
          // Constraint already exists, skip
          continue;
        } else {
          this.log(`   ⚠️  Constraint warning: ${error.message.substring(0, 50)}...`, 'yellow');
        }
      }
    }
    
    this.log('   ✅ Database constraints applied', 'green');
  }

  async createIndexes() {
    this.log('📊 Creating performance indexes...', 'yellow');
    
    const indexes = [
      'CREATE INDEX idx_stores_dea ON stores (dea_registration_number)',
      'CREATE INDEX idx_stores_npi ON stores (npi)',
      'CREATE INDEX idx_users_email ON users (email)',
      'CREATE INDEX idx_users_store_id ON users (store_id)',
      'CREATE INDEX idx_drugs_ndc ON drugs (ndc)',
      'CREATE INDEX idx_drugs_generic_name ON drugs (generic_name(100))',
      'CREATE INDEX idx_inventory_store_drug ON store_inventory (store_id, drug_id)',
      'CREATE INDEX idx_inventory_active ON store_inventory (is_active)',
      'CREATE INDEX idx_audit_store_date ON inventory_audit_log (store_id, transaction_date DESC)',
      'CREATE INDEX idx_audit_drug_date ON inventory_audit_log (drug_id, transaction_date DESC)'
    ];

    for (const index of indexes) {
      try {
        await this.connection.execute(index);
      } catch (error) {
        if (error.code === 'ER_DUP_KEYNAME') {
          continue; // Index already exists
        }
      }
    }
    
    this.log('   ✅ Performance indexes created', 'green');
  }

  async createTriggers() {
    this.log('⚡ Creating database triggers...', 'yellow');
    this.log('   ✅ Triggers skipped (will be added in future version)', 'green');
  }

  async createSampleStores() {
    this.log('🏪 Creating sample stores...', 'yellow');
    
    if (!this.connection) {
      await this.connectDatabase();
    }

    const stores = [
      {
        name: 'Main Pharmacy',
        address: '123 Main Street',
        city: 'Springfield',
        state: 'IL',
        zipcode: '62701',
        phone: '5551234567',
        dea_registration_number: 'AB1234567',
        npi: '1234567890'
      },
      {
        name: 'Downtown Pharmacy',
        address: '456 Oak Avenue', 
        city: 'Springfield',
        state: 'IL',
        zipcode: '62702',
        phone: '5559876543',
        dea_registration_number: 'CD2345678',
        npi: '0987654321'
      }
    ];

    for (const store of stores) {
      try {
        const [result] = await this.connection.execute(`
          INSERT INTO stores (name, address, city, state, zipcode, phone, dea_registration_number, npi)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [store.name, store.address, store.city, store.state, store.zipcode, store.phone, store.dea_registration_number, store.npi]);
        
        this.log(`   ✅ Created: ${store.name}`, 'green');
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          this.log(`   ⚠️  Store ${store.name} already exists`, 'yellow');
        } else {
          this.log(`   ❌ Failed to create ${store.name}: ${error.message}`, 'red');
        }
      }
    }
  }

  async createAdminUser() {
    this.log('👤 Creating admin user...', 'yellow');
    
    if (!this.connection) {
      await this.connectDatabase();
    }

    try {
      // Check if admin user exists
      const [existingUsers] = await this.connection.execute(
        'SELECT id FROM users WHERE email = ?',
        ['admin@pharmatrak.com']
      );

      if (existingUsers.length > 0) {
        this.log('   ⚠️  Admin user already exists, updating...', 'yellow');
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        await this.connection.execute(
          'UPDATE users SET password = ?, role = ? WHERE email = ?',
          [hashedPassword, 'god_mode', 'admin@pharmatrak.com']
        );
      } else {
        const hashedPassword = await bcrypt.hash('Admin123!', 12);
        await this.connection.execute(`
          INSERT INTO users (name, email, phone, password, address, store_id, role, is_active, date_created)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
          'System Administrator',
          'admin@pharmatrak.com',
          '5551234567',
          hashedPassword,
          '123 Admin Street, Admin City, CA 90210',
          1,
          'god_mode',
          true
        ]);
      }

      this.log('   ✅ Admin user ready', 'green');
      this.log('      Email: admin@pharmatrak.com', 'cyan');
      this.log('      Password: Admin123!', 'cyan');
    } catch (error) {
      this.log(`   ❌ Failed to create admin user: ${error.message}`, 'red');
    }
  }

  // Test Data Menu
  async showTestDataMenu() {
    console.clear();
    this.log('🧪 TEST DATA MANAGEMENT', 'blue');
    this.log('═══════════════════════', 'blue');
    this.log('');
    this.log('  1️⃣  Generate Basic Test Data (10 drugs, 50 transactions)');
    this.log('  2️⃣  Generate Comprehensive Test Data (50+ drugs, 200+ transactions)');
    this.log('  3️⃣  Add Sample Prescription Data');
    this.log('  4️⃣  Clear All Test Data');
    this.log('  5️⃣  Back to Main Menu');
    this.log('');
    
    const choice = await this.prompt('Select an option (1-5): ');
    await this.handleTestDataChoice(choice);
  }

  async handleTestDataChoice(choice) {
    switch (choice) {
      case '1':
        await this.generateBasicTestData();
        break;
      case '2':
        await this.generateComprehensiveTestData();
        break;
      case '3':
        await this.addSamplePrescriptionData();
        break;
      case '4':
        await this.clearAllTestData();
        break;
      case '5':
        await this.showMainMenu();
        break;
      default:
        this.log('❌ Invalid option. Please try again.', 'red');
        await this.prompt('Press Enter to continue...');
        await this.showTestDataMenu();
    }
  }

  async generateBasicTestData() {
    this.log('🧪 Generating Basic Test Data...', 'blue');
    
    if (!await this.connectDatabase()) {
      await this.prompt('Press Enter to continue...');
      return await this.showTestDataMenu();
    }

    try {
      // Add test drugs
      const drugIds = [];
      for (const drug of testDrugs) {
        try {
          const [result] = await this.connection.execute(`
            INSERT INTO drugs (
              ndc, product_ndc, generic_name, brand_name, manufacturer_name,
              dosage_form, strength, route, substance_name, product_type, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'HUMAN PRESCRIPTION DRUG', TRUE)
          `, [
            drug.ndc, drug.ndc, drug.generic_name, drug.brand_name, drug.manufacturer,
            drug.dosage_form, drug.strength, drug.route, drug.substance_name
          ]);
          drugIds.push(result.insertId);
          this.log(`   ✅ Added drug: ${drug.brand_name}`, 'green');
        } catch (error) {
          if (error.code === 'ER_DUP_ENTRY') {
            const [existing] = await this.connection.execute('SELECT id FROM drugs WHERE ndc = ?', [drug.ndc]);
            drugIds.push(existing[0].id);
            this.log(`   ⚠️  Drug ${drug.brand_name} already exists`, 'yellow');
          }
        }
      }

      // Add inventory for each drug
      const [stores] = await this.connection.execute('SELECT id FROM stores LIMIT 2');
      const [users] = await this.connection.execute('SELECT id FROM users WHERE role IN ("admin", "god_mode") LIMIT 1');

      if (stores.length === 0 || users.length === 0) {
        throw new Error('No stores or admin users found. Please create them first.');
      }

      for (const store of stores) {
        for (const drugId of drugIds) {
          const initialQuantity = Math.floor(Math.random() * 500) + 50;
          try {
            await this.connection.execute(`
              INSERT INTO store_inventory (
                store_id, drug_id, quantity_on_hand, reorder_level, unit_cost, supplier, is_active
              ) VALUES (?, ?, ?, ?, ?, 'Test Supplier', TRUE)
            `, [store.id, drugId, initialQuantity, 20, (Math.random() * 50 + 5).toFixed(2)]);
          } catch (error) {
            if (error.code !== 'ER_DUP_ENTRY') {
              throw error;
            }
          }
        }
      }

      this.log('   ✅ Basic test data generation completed!', 'green');
      this.log(`   💊 ${testDrugs.length} drugs added`, 'cyan');
      this.log(`   📦 ${stores.length * drugIds.length} inventory items created`, 'cyan');

    } catch (error) {
      this.log(`❌ Failed to generate test data: ${error.message}`, 'red');
    } finally {
      await this.disconnectDatabase();
    }

    await this.prompt('Press Enter to continue...');
    await this.showTestDataMenu();
  }

  // System Information
  async showSystemInfo() {
    console.clear();
    this.log('ℹ️  SYSTEM INFORMATION', 'blue');
    this.log('═══════════════════════', 'blue');
    this.log('');
    
    if (!await this.connectDatabase()) {
      this.log('❌ Cannot connect to database', 'red');
      await this.prompt('Press Enter to continue...');
      return await this.showMainMenu();
    }

    try {
      // Database info
      const [dbInfo] = await this.connection.execute('SELECT DATABASE() as db_name, VERSION() as db_version');
      this.log(`📋 Database: ${dbInfo[0].db_name}`, 'cyan');
      this.log(`🔧 MySQL Version: ${dbInfo[0].db_version}`, 'cyan');
      this.log('');

      // Table counts
      const tables = ['stores', 'users', 'drugs', 'store_inventory', 'inventory_audit_log'];
      this.log('📊 Table Statistics:', 'yellow');
      for (const table of tables) {
        try {
          const [count] = await this.connection.execute(`SELECT COUNT(*) as count FROM ${table}`);
          this.log(`   ${table}: ${count[0].count} records`, 'white');
        } catch (error) {
          this.log(`   ${table}: Table not found`, 'red');
        }
      }
      this.log('');

      // Connection info
      this.log('🔗 Connection Details:', 'yellow');
      this.log(`   Host: ${dbConfig.host}`, 'white');
      this.log(`   User: ${dbConfig.user}`, 'white');
      this.log(`   Database: ${dbConfig.database}`, 'white');

    } catch (error) {
      this.log(`❌ Error retrieving system info: ${error.message}`, 'red');
    } finally {
      await this.disconnectDatabase();
    }

    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  // Placeholder methods for other menus
  async showMigrationsMenu() {
    this.log('🔄 Migration features coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  async showDiagnosticsMenu() {
    this.log('🔍 Diagnostics features coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  async showBackupMenu() {
    this.log('💾 Backup features coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  async showUserManagementMenu() {
    this.log('👥 User management features coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  async showPerformanceMenu() {
    this.log('⚡ Performance features coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showMainMenu();
  }

  async generateComprehensiveTestData() {
    this.log('🧪 Generating Comprehensive Test Data...', 'blue');
    this.log('This will create 50+ drugs and 200+ transactions...', 'yellow');
    
    const confirm = await this.prompt('Continue? (y/n): ');
    if (confirm.toLowerCase() !== 'y') {
      return await this.showTestDataMenu();
    }
    
    if (!await this.connectDatabase()) {
      await this.prompt('Press Enter to continue...');
      return await this.showTestDataMenu();
    }

    try {
      // First add basic test data
      await this.generateBasicTestDataQuiet();
      
      // Generate additional random drugs
      this.log('📦 Generating additional pharmaceutical data...', 'yellow');
      
      const additionalDrugs = [];
      const genericNames = ['Amlodipine', 'Atorvastatin', 'Metformin', 'Omeprazole', 'Levothyroxine', 'Amlodipine', 'Hydrochlorothiazide', 'Albuterol', 'Gabapentin', 'Sertraline'];
      const manufacturers = ['Pfizer Inc', 'Novartis AG', 'Teva Pharmaceuticals', 'Mylan Pharmaceuticals', 'Sandoz Inc', 'Sun Pharmaceutical'];
      const forms = ['TABLET', 'CAPSULE', 'LIQUID', 'INJECTION'];
      
      for (let i = 0; i < 45; i++) {
        const ndc = `${String(Math.floor(Math.random() * 99999)).padStart(5, '0')}-${String(Math.floor(Math.random() * 9999)).padStart(4, '0')}-${String(Math.floor(Math.random() * 99)).padStart(2, '0')}`;
        const genericName = genericNames[Math.floor(Math.random() * genericNames.length)];
        const strength = `${Math.floor(Math.random() * 500) + 5} mg`;
        const manufacturer = manufacturers[Math.floor(Math.random() * manufacturers.length)];
        const dosageForm = forms[Math.floor(Math.random() * forms.length)];
        
        const drug = {
          ndc,
          generic_name: genericName,
          brand_name: `${genericName.toUpperCase()} BRAND`,
          manufacturer,
          dosage_form: dosageForm,
          strength,
          route: 'ORAL',
          substance_name: genericName.toUpperCase()
        };
        
        try {
          const [result] = await this.connection.execute(`
            INSERT INTO drugs (
              ndc, product_ndc, generic_name, brand_name, manufacturer_name,
              dosage_form, strength, route, substance_name, product_type, is_active
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'HUMAN PRESCRIPTION DRUG', TRUE)
          `, [
            drug.ndc, drug.ndc, drug.generic_name, drug.brand_name, drug.manufacturer,
            drug.dosage_form, drug.strength, drug.route, drug.substance_name
          ]);
          additionalDrugs.push(result.insertId);
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            continue; // Skip duplicates
          }
        }
      }
      
      // Generate comprehensive audit transactions
      this.log('📝 Generating comprehensive audit log entries...', 'yellow');
      
      const [stores] = await this.connection.execute('SELECT id FROM stores');
      const [users] = await this.connection.execute('SELECT id FROM users WHERE role IN ("admin", "god_mode") LIMIT 1');
      const [allInventory] = await this.connection.execute('SELECT id, store_id, drug_id FROM store_inventory WHERE is_active = TRUE');
      
      const transactionTypes = ['prescription_fill', 'return_to_stock', 'expire', 'audit', 'shipment_received'];
      
      for (let i = 0; i < 200; i++) {
        const inventory = allInventory[Math.floor(Math.random() * allInventory.length)];
        const transactionType = transactionTypes[Math.floor(Math.random() * transactionTypes.length)];
        
        let quantityChange = 0;
        let reason = '';
        
        switch (transactionType) {
          case 'prescription_fill':
            quantityChange = -(Math.floor(Math.random() * 90) + 10);
            reason = `Prescription filled for patient #${Math.floor(Math.random() * 10000) + 1000}`;
            break;
          case 'return_to_stock':
            quantityChange = Math.floor(Math.random() * 30) + 5;
            reason = 'Patient returned unused medication';
            break;
          case 'expire':
            quantityChange = -(Math.floor(Math.random() * 50) + 10);
            reason = 'Expired medication disposal';
            break;
          case 'audit':
            quantityChange = Math.floor(Math.random() * 41) - 20;
            reason = 'Physical inventory count adjustment';
            break;
          case 'shipment_received':
            quantityChange = Math.floor(Math.random() * 200) + 50;
            reason = 'New shipment received from supplier';
            break;
        }
        
        // Get current quantity
        const [currentInv] = await this.connection.execute('SELECT quantity_on_hand FROM store_inventory WHERE id = ?', [inventory.id]);
        const quantityBefore = currentInv[0]?.quantity_on_hand || 0;
        const quantityAfter = Math.max(0, quantityBefore + quantityChange);
        
        // Create transaction date within last 90 days
        const transactionDate = new Date();
        transactionDate.setDate(transactionDate.getDate() - Math.floor(Math.random() * 90));
        
        try {
          await this.connection.execute(`
            INSERT INTO inventory_audit_log (
              inventory_id, store_id, drug_id, transaction_type, quantity_change,
              quantity_before, quantity_after, reason, performed_by, transaction_date
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `, [
            inventory.id, inventory.store_id, inventory.drug_id, transactionType, quantityChange,
            quantityBefore, quantityAfter, reason, users[0].id, transactionDate
          ]);
          
          // Update inventory
          await this.connection.execute('UPDATE store_inventory SET quantity_on_hand = ? WHERE id = ?', [quantityAfter, inventory.id]);
          
        } catch (error) {
          // Skip errors and continue
          continue;
        }
      }
      
      // Show summary
      const [drugCount] = await this.connection.execute('SELECT COUNT(*) as count FROM drugs WHERE is_active = TRUE');
      const [inventoryCount] = await this.connection.execute('SELECT COUNT(*) as count FROM store_inventory WHERE is_active = TRUE');
      const [transactionCount] = await this.connection.execute('SELECT COUNT(*) as count FROM inventory_audit_log');
      
      this.log('', 'green');
      this.log('🎉 Comprehensive test data generation completed!', 'green');
      this.log(`   💊 Total drugs: ${drugCount[0].count}`, 'cyan');
      this.log(`   📦 Total inventory items: ${inventoryCount[0].count}`, 'cyan');
      this.log(`   📝 Total audit transactions: ${transactionCount[0].count}`, 'cyan');

    } catch (error) {
      this.log(`❌ Failed to generate comprehensive test data: ${error.message}`, 'red');
    } finally {
      await this.disconnectDatabase();
    }

    await this.prompt('Press Enter to continue...');
    await this.showTestDataMenu();
  }
  
  async generateBasicTestDataQuiet() {
    // Quiet version of generateBasicTestData for internal use
    const drugIds = [];
    for (const drug of testDrugs) {
      try {
        const [result] = await this.connection.execute(`
          INSERT INTO drugs (
            ndc, product_ndc, generic_name, brand_name, manufacturer_name,
            dosage_form, strength, route, substance_name, product_type, is_active
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'HUMAN PRESCRIPTION DRUG', TRUE)
        `, [
          drug.ndc, drug.ndc, drug.generic_name, drug.brand_name, drug.manufacturer,
          drug.dosage_form, drug.strength, drug.route, drug.substance_name
        ]);
        drugIds.push(result.insertId);
      } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
          const [existing] = await this.connection.execute('SELECT id FROM drugs WHERE ndc = ?', [drug.ndc]);
          drugIds.push(existing[0].id);
        }
      }
    }

    // Add inventory for each drug
    const [stores] = await this.connection.execute('SELECT id FROM stores LIMIT 2');
    for (const store of stores) {
      for (const drugId of drugIds) {
        const initialQuantity = Math.floor(Math.random() * 500) + 50;
        try {
          await this.connection.execute(`
            INSERT INTO store_inventory (
              store_id, drug_id, quantity_on_hand, reorder_level, unit_cost, supplier, is_active
            ) VALUES (?, ?, ?, ?, ?, 'Test Supplier', TRUE)
          `, [store.id, drugId, initialQuantity, 20, (Math.random() * 50 + 5).toFixed(2)]);
        } catch (error) {
          if (error.code !== 'ER_DUP_ENTRY') {
            continue;
          }
        }
      }
    }
  }

  async addSamplePrescriptionData() {
    this.log('💊 Prescription data generation coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showTestDataMenu();
  }

  async clearAllTestData() {
    this.log('⚠️  This will delete ALL data from the database!', 'red');
    const confirm = await this.prompt('Type "DELETE ALL DATA" to confirm: ');
    
    if (confirm === 'DELETE ALL DATA') {
      this.log('🗑️  Data clearing coming soon...', 'yellow');
    } else {
      this.log('❌ Operation cancelled', 'red');
    }
    
    await this.prompt('Press Enter to continue...');
    await this.showTestDataMenu();
  }

  async createSchemaOnly() {
    this.log('📋 Schema-only creation coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showDatabaseSetupMenu();
  }

  async resetDatabase() {
    this.log('⚠️  Database reset coming soon...', 'yellow');
    await this.prompt('Press Enter to continue...');
    await this.showDatabaseSetupMenu();
  }

  async exitProgram() {
    console.clear();
    this.log('═══════════════════════════════════════════════', 'cyan');
    this.log('   Thank you for using PharmaTraK Manager! 👋   ', 'cyan');
    this.log('═══════════════════════════════════════════════', 'cyan');
    this.log('');
    await this.cleanup();
    process.exit(0);
  }

  // Main program entry point
  async run() {
    console.clear();
    this.log('🚀 Starting PharmaTraK Database Manager...', 'green');
    this.log('');
    
    // Test database connection
    this.log('📡 Testing database connection...', 'yellow');
    if (await this.connectDatabase()) {
      this.log('✅ Database connection successful', 'green');
      await this.disconnectDatabase();
    } else {
      this.log('❌ Database connection failed', 'red');
      this.log('📋 Please check your environment variables:', 'yellow');
      this.log(`   DB_HOST=${dbConfig.host}`, 'white');
      this.log(`   DB_USER=${dbConfig.user}`, 'white');
      this.log(`   DB_PASSWORD=${dbConfig.password ? '[SET]' : '[NOT SET]'}`, 'white');
      this.log(`   DB_NAME=${dbConfig.database}`, 'white');
      this.log('');
      const retry = await this.prompt('Would you like to continue anyway? (y/n): ');
      if (retry.toLowerCase() !== 'y') {
        await this.exitProgram();
      }
    }
    
    await this.showMainMenu();
  }
}

// Run the program
const manager = new PharmaTraKManager();

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n\n🛑 Shutting down gracefully...');
  await manager.cleanup();
  process.exit(0);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Start the application
if (require.main === module) {
  manager.run().catch(console.error);
}

module.exports = PharmaTraKManager;