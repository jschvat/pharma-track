-- Create post_it_notes table for store-specific sticky notes
CREATE TABLE IF NOT EXISTS post_it_notes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    store_id INT NOT NULL,
    user_id INT NOT NULL,
    content TEXT NOT NULL,
    position_x INT NOT NULL DEFAULT 300,
    position_y INT NOT NULL DEFAULT 100,
    color VARCHAR(20) NOT NULL DEFAULT 'yellow',
    is_pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Foreign key constraints
    FOREIGN KEY (store_id) REFERENCES stores(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    
    -- Indexes for performance
    INDEX idx_store_active (store_id, is_active),
    INDEX idx_store_pinned (store_id, is_pinned, is_active),
    INDEX idx_user_store (user_id, store_id),
    INDEX idx_created_at (created_at),
    INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;