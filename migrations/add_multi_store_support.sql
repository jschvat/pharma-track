-- Add multi-store support for admin users
-- This allows admin users to access multiple stores

-- Create user_store_access table for multi-store admin permissions
CREATE TABLE IF NOT EXISTS user_store_access (
    id INT PRIMARY KEY AUTO_INCREMENT,
    user_id INT NOT NULL,
    store_id INT NOT NULL,
    access_level ENUM('admin', 'user') NOT NULL DEFAULT 'user',
    granted_by INT,
    granted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active TINYINT(1) DEFAULT 1,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (granted_by) REFERENCES users(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_store (user_id, store_id)
);

-- Add active_store_id to users table for session management
ALTER TABLE users ADD COLUMN active_store_id INT DEFAULT NULL;
ALTER TABLE users ADD FOREIGN KEY (active_store_id) REFERENCES stores(id) ON DELETE SET NULL;

-- Migrate existing users to the new system
-- All existing users get access to their current store
INSERT INTO user_store_access (user_id, store_id, access_level, granted_at)
SELECT 
    u.id, 
    u.store_id, 
    u.role,
    u.date_created
FROM users u
WHERE u.store_id IS NOT NULL
ON DUPLICATE KEY UPDATE access_level = VALUES(access_level);

-- Set active_store_id to current store_id for all users
UPDATE users SET active_store_id = store_id WHERE store_id IS NOT NULL;

-- Create indexes for performance
CREATE INDEX idx_user_store_access_user ON user_store_access(user_id, is_active);
CREATE INDEX idx_user_store_access_store ON user_store_access(store_id, is_active);
CREATE INDEX idx_users_active_store ON users(active_store_id);