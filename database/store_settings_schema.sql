-- Store Settings schema for store-level configuration
USE pharmatrak;

-- Store settings table for store-level configuration accessible only to store admins
CREATE TABLE IF NOT EXISTS store_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    setting_value JSON NOT NULL COMMENT 'Stores setting value as JSON for flexibility',
    description TEXT COMMENT 'Human readable description of the setting',
    data_type ENUM('string', 'number', 'boolean', 'json', 'array') NOT NULL DEFAULT 'string',
    is_system BOOLEAN DEFAULT FALSE COMMENT 'System settings vs user-configurable settings',
    created_by INT NOT NULL COMMENT 'Admin user who created the setting',
    updated_by INT NOT NULL COMMENT 'Admin user who last updated the setting',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE RESTRICT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Ensure unique settings per store
    UNIQUE KEY unique_store_setting (store_id, setting_key),
    
    -- Indexes for efficient querying
    INDEX idx_store_id (store_id),
    INDEX idx_setting_key (setting_key),
    INDEX idx_is_system (is_system),
    INDEX idx_updated_at (updated_at)
);

-- Insert default store settings that all stores should have
INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'default_theme' as setting_key,
    '"bootstrap"' as setting_value,
    'Default theme for all users in this store' as description,
    'string' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key; -- No-op to avoid duplicate key errors

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'default_font_family' as setting_key,
    '"system"' as setting_value,
    'Default font family for all users in this store' as description,
    'string' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'default_font_size' as setting_key,
    '"medium"' as setting_value,
    'Default font size for all users in this store' as description,
    'string' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'session_timeout_hours' as setting_key,
    '8' as setting_value,
    'Session timeout in hours for store users' as description,
    'number' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'auto_backup_enabled' as setting_key,
    'true' as setting_value,
    'Enable automatic daily backups for this store' as description,
    'boolean' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'low_stock_threshold' as setting_key,
    '10' as setting_value,
    'Default low stock threshold for inventory alerts' as description,
    'number' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'expiration_alert_days' as setting_key,
    '30' as setting_value,
    'Days before expiration to show alerts' as description,
    'number' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

INSERT INTO store_settings (store_id, setting_key, setting_value, description, data_type, is_system, created_by, updated_by) 
SELECT 
    s.id as store_id,
    'require_prescription_verification' as setting_key,
    'true' as setting_value,
    'Require prescription verification for controlled substances' as description,
    'boolean' as data_type,
    false as is_system,
    s.admin_user_id as created_by,
    s.admin_user_id as updated_by
FROM stores s
WHERE s.admin_user_id IS NOT NULL
ON DUPLICATE KEY UPDATE setting_key = setting_key;

-- Store setting history for audit trail
CREATE TABLE IF NOT EXISTS store_settings_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_setting_id INT NOT NULL,
    store_id INT NOT NULL,
    setting_key VARCHAR(100) NOT NULL,
    old_value JSON COMMENT 'Previous setting value',
    new_value JSON NOT NULL COMMENT 'New setting value',
    changed_by INT NOT NULL COMMENT 'Admin user who made the change',
    change_reason TEXT COMMENT 'Optional reason for the change',
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (store_setting_id) REFERENCES store_settings(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (changed_by) REFERENCES users(id) ON DELETE RESTRICT,
    
    -- Indexes for efficient querying
    INDEX idx_store_setting_id (store_setting_id),
    INDEX idx_store_id (store_id),
    INDEX idx_setting_key (setting_key),
    INDEX idx_changed_by (changed_by),
    INDEX idx_changed_at (changed_at)
);