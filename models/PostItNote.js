const mysql = require('mysql2/promise');
const { pool } = require('../config/database');

class PostItNote {
  constructor() {
    this.tableName = 'post_it_notes';
  }

  // Create a new post-it note
  async create(noteData) {
    const { store_id, user_id, content, position_x, position_y, color, is_pinned } = noteData;
    
    const [result] = await pool.execute(
      `INSERT INTO ${this.tableName} 
       (store_id, user_id, content, position_x, position_y, color, is_pinned, created_at, updated_at) 
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [store_id, user_id, content, position_x, position_y, color || 'yellow', is_pinned || false]
    );
    
    return result.insertId;
  }

  // Get all notes for a specific store
  async getByStore(store_id) {
    const [rows] = await pool.execute(
      `SELECT pn.*, u.name as created_by_name 
       FROM ${this.tableName} pn
       LEFT JOIN users u ON pn.user_id = u.id
       WHERE pn.store_id = ? AND pn.is_active = TRUE
       ORDER BY pn.is_pinned DESC, pn.updated_at DESC`,
      [store_id]
    );
    
    return rows;
  }

  // Get a specific note by ID
  async getById(id) {
    const [rows] = await pool.execute(
      `SELECT pn.*, u.name as created_by_name 
       FROM ${this.tableName} pn
       LEFT JOIN users u ON pn.user_id = u.id
       WHERE pn.id = ? AND pn.is_active = TRUE`,
      [id]
    );
    
    return rows[0] || null;
  }

  // Update a post-it note
  async update(id, updateData) {
    const fields = [];
    const values = [];
    
    const allowedFields = ['content', 'position_x', 'position_y', 'color', 'is_pinned'];
    
    allowedFields.forEach(field => {
      if (updateData[field] !== undefined) {
        fields.push(`${field} = ?`);
        values.push(updateData[field]);
      }
    });
    
    if (fields.length === 0) {
      throw new Error('No valid fields to update');
    }
    
    fields.push('updated_at = NOW()');
    values.push(id);
    
    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET ${fields.join(', ')} WHERE id = ?`,
      values
    );
    
    return result.affectedRows > 0;
  }

  // Soft delete a note
  async delete(id) {
    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET is_active = FALSE, updated_at = NOW() WHERE id = ?`,
      [id]
    );
    
    return result.affectedRows > 0;
  }

  // Toggle pin status
  async togglePin(id) {
    const [result] = await pool.execute(
      `UPDATE ${this.tableName} SET is_pinned = NOT is_pinned, updated_at = NOW() WHERE id = ?`,
      [id]
    );
    
    return result.affectedRows > 0;
  }

  // Check if user has access to note (same store)
  async hasAccess(note_id, user_store_id) {
    const [rows] = await pool.execute(
      `SELECT id FROM ${this.tableName} WHERE id = ? AND store_id = ?`,
      [note_id, user_store_id]
    );
    
    return rows.length > 0;
  }

  // Get pinned notes for a store
  async getPinnedByStore(store_id) {
    const [rows] = await pool.execute(
      `SELECT pn.*, u.name as created_by_name 
       FROM ${this.tableName} pn
       LEFT JOIN users u ON pn.user_id = u.id
       WHERE pn.store_id = ? AND pn.is_pinned = TRUE AND pn.is_active = TRUE
       ORDER BY pn.updated_at DESC`,
      [store_id]
    );
    
    return rows;
  }

  // Get recent notes for a store (last 7 days)
  async getRecentByStore(store_id, days = 7) {
    const [rows] = await pool.execute(
      `SELECT pn.*, u.name as created_by_name 
       FROM ${this.tableName} pn
       LEFT JOIN users u ON pn.user_id = u.id
       WHERE pn.store_id = ? AND pn.is_active = TRUE 
       AND pn.created_at >= DATE_SUB(NOW(), INTERVAL ? DAY)
       ORDER BY pn.created_at DESC`,
      [store_id, days]
    );
    
    return rows;
  }

  // Get stats for a store
  async getStoreStats(store_id) {
    const [stats] = await pool.execute(
      `SELECT 
         COUNT(*) as total_notes,
         SUM(CASE WHEN is_pinned = TRUE THEN 1 ELSE 0 END) as pinned_notes,
         SUM(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_notes
       FROM ${this.tableName} 
       WHERE store_id = ? AND is_active = TRUE`,
      [store_id]
    );
    
    return stats[0] || { total_notes: 0, pinned_notes: 0, recent_notes: 0 };
  }
}

module.exports = new PostItNote();