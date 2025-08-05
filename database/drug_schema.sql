-- Drug/Medication schema for storing FDA NDC data
USE pharmatrak;

CREATE TABLE IF NOT EXISTS drugs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ndc VARCHAR(15) UNIQUE NOT NULL,
    product_ndc VARCHAR(15) NOT NULL,
    generic_name VARCHAR(500),
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
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Indexes for fast searching
    INDEX idx_ndc (ndc),
    INDEX idx_product_ndc (product_ndc),
    INDEX idx_generic_name (generic_name(100)),
    INDEX idx_brand_name (brand_name(100)),
    INDEX idx_manufacturer (manufacturer_name(100)),
    INDEX idx_active (is_active),
    
    -- Full-text search indexes
    FULLTEXT idx_generic_fulltext (generic_name),
    FULLTEXT idx_brand_fulltext (brand_name),
    FULLTEXT idx_substance_fulltext (substance_name)
);

-- Store inventory table linking drugs to stores
CREATE TABLE IF NOT EXISTS store_inventory (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    drug_id INT NOT NULL,
    quantity_on_hand INT DEFAULT 0,
    reorder_level INT DEFAULT 0,
    unit_cost DECIMAL(10,4),
    selling_price DECIMAL(10,4),
    lot_number VARCHAR(50),
    expiration_date DATE,
    supplier VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    date_created TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (drug_id) REFERENCES drugs(id) ON DELETE CASCADE,
    
    -- Composite indexes
    INDEX idx_store_drug (store_id, drug_id),
    INDEX idx_store_active (store_id, is_active),
    INDEX idx_expiration (expiration_date),
    INDEX idx_reorder (reorder_level, quantity_on_hand),
    
    -- Unique constraint to prevent duplicate entries
    UNIQUE KEY unique_store_drug_lot (store_id, drug_id, lot_number)
);

-- FDA search history for analytics and caching
CREATE TABLE IF NOT EXISTS fda_search_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT,
    store_id INT,
    search_type ENUM('ndc', 'generic_name', 'brand_name', 'manufacturer', 'advanced') NOT NULL,
    search_query VARCHAR(1000) NOT NULL,
    results_count INT DEFAULT 0,
    response_time_ms INT,
    was_cached BOOLEAN DEFAULT FALSE,
    search_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    
    INDEX idx_user_searches (user_id, search_date),
    INDEX idx_store_searches (store_id, search_date),
    INDEX idx_search_type (search_type),
    INDEX idx_search_date (search_date)
);