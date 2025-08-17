/**
 * Global Test Setup
 * 
 * Runs once before all tests begin.
 * Sets up test database and global test environment.
 */

const mysql = require('mysql2/promise');
const logger = require('../../config/logger');

module.exports = async () => {
  try {
    console.log('🧪 Setting up test environment...');
    
    // Database configuration for tests
    const dbConfig = {
      host: process.env.DB_HOST || 'localhost',
      user: process.env.DB_USER || 'pharmatrak_user',
      password: process.env.DB_PASSWORD || 'pharmatrak_password'
    };
    
    const testDbName = process.env.DB_NAME_TEST || 'pharmatrak_test';
    
    // Connect to MySQL server (without database)
    const connection = await mysql.createConnection(dbConfig);
    
    // Create test database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${testDbName}\``);
    console.log(`✅ Test database '${testDbName}' ready`);
    
    // Switch to test database
    await connection.execute(`USE \`${testDbName}\``);
    
    // Create basic test schema (minimal required tables)
    const tables = [
      // Users table
      `CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        phone VARCHAR(20),
        address TEXT,
        role ENUM('user', 'admin', 'god_mode') DEFAULT 'user',
        store_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Stores table
      `CREATE TABLE IF NOT EXISTS stores (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        address TEXT,
        city VARCHAR(100),
        state VARCHAR(2),
        zip_code VARCHAR(10),
        phone VARCHAR(20),
        email VARCHAR(255),
        dea_registration_number VARCHAR(50) UNIQUE,
        npi VARCHAR(20) UNIQUE,
        admin_user_id INT,
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Drugs table
      `CREATE TABLE IF NOT EXISTS drugs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        ndc VARCHAR(20) UNIQUE NOT NULL,
        product_ndc VARCHAR(20),
        generic_name VARCHAR(255),
        brand_name VARCHAR(255),
        dosage_form VARCHAR(100),
        strength VARCHAR(100),
        route VARCHAR(100),
        manufacturer_name VARCHAR(255),
        substance_name TEXT,
        dea_schedule VARCHAR(10),
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )`,
      
      // Store inventory table
      `CREATE TABLE IF NOT EXISTS store_inventory (
        id INT AUTO_INCREMENT PRIMARY KEY,
        store_id INT NOT NULL,
        drug_id INT NOT NULL,
        quantity_on_hand INT DEFAULT 0,
        reorder_level INT DEFAULT 0,
        unit_cost DECIMAL(10,2),
        selling_price DECIMAL(10,2),
        lot_number VARCHAR(50),
        expiration_date DATE,
        supplier VARCHAR(255),
        is_active BOOLEAN DEFAULT TRUE,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_store_drug_lot (store_id, drug_id, lot_number),
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (drug_id) REFERENCES drugs(id)
      )`,
      
      // Inventory audit log table
      `CREATE TABLE IF NOT EXISTS inventory_audit_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        inventory_id INT,
        store_id INT NOT NULL,
        drug_id INT NOT NULL,
        transaction_type ENUM('initial_inventory', 'shipment_received', 'prescription_fill', 'return_to_stock', 'expire', 'audit') NOT NULL,
        quantity_change INT NOT NULL,
        quantity_before INT NOT NULL,
        quantity_after INT NOT NULL,
        reason TEXT,
        reference_number VARCHAR(100),
        performed_by INT NOT NULL,
        transaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (store_id) REFERENCES stores(id),
        FOREIGN KEY (drug_id) REFERENCES drugs(id),
        FOREIGN KEY (performed_by) REFERENCES users(id)
      )`
    ];
    
    // Create tables
    for (const tableSQL of tables) {
      await connection.execute(tableSQL);
    }
    
    console.log('✅ Test database schema created');
    
    // Insert test data
    await setupTestData(connection);
    
    await connection.end();
    
    console.log('🎯 Test environment setup complete');
    
  } catch (error) {
    console.error('❌ Failed to setup test environment:', error.message);
    throw error;
  }
};

/**
 * Insert minimal test data required for tests
 */
async function setupTestData(connection) {
  try {
    // Insert test store
    await connection.execute(`
      INSERT IGNORE INTO stores (id, name, address, city, state, zip_code, phone, email, dea_registration_number, npi) 
      VALUES (1, 'Test Pharmacy', '123 Test St', 'Test City', 'TS', '12345', '555-0100', 'test@pharmacy.com', 'TEST123456', '1234567890')
    `);
    
    // Insert test admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('TestPassword123!', 12);
    
    await connection.execute(`
      INSERT IGNORE INTO users (id, name, email, password, role, store_id) 
      VALUES (1, 'Test Admin', 'admin@test.com', ?, 'admin', 1)
    `, [hashedPassword]);
    
    // Insert test drug
    await connection.execute(`
      INSERT IGNORE INTO drugs (id, ndc, generic_name, brand_name, dosage_form, strength, route, manufacturer_name) 
      VALUES (1, '12345-678-90', 'Test Drug', 'Test Brand', 'tablet', '10mg', 'oral', 'Test Pharma')
    `);
    
    // Insert test inventory
    await connection.execute(`
      INSERT IGNORE INTO store_inventory (id, store_id, drug_id, quantity_on_hand, reorder_level, unit_cost, selling_price, lot_number, expiration_date) 
      VALUES (1, 1, 1, 100, 10, 5.99, 12.99, 'TEST123', '2025-12-31')
    `);
    
    console.log('✅ Test data inserted');
    
  } catch (error) {
    console.error('❌ Failed to insert test data:', error.message);
    throw error;
  }
}