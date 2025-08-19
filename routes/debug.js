/**
 * Debug logging routes for development
 * Saves frontend console logs to files for Claude analysis
 */

const express = require('express');
const fs = require('fs').promises;
const path = require('path');

const router = express.Router();

// Ensure debug directory exists
const DEBUG_DIR = path.join(__dirname, '..', 'debug-logs');

async function ensureDebugDir() {
  try {
    await fs.access(DEBUG_DIR);
  } catch {
    await fs.mkdir(DEBUG_DIR, { recursive: true });
  }
}

/**
 * Save frontend debug logs to file
 */
router.post('/save-logs', async (req, res) => {
  try {
    await ensureDebugDir();

    const { timestamp, totalLogs, logs } = req.body;
    const filename = `debug-${new Date().toISOString().slice(0, 16).replace(/:/g, '-')}.json`;
    const filepath = path.join(DEBUG_DIR, filename);

    const debugData = {
      metadata: {
        timestamp,
        totalLogs,
        source: 'frontend-console',
        version: '1.0.0'
      },
      logs: logs
    };

    await fs.writeFile(filepath, JSON.stringify(debugData, null, 2));

    // Also save a "latest" file for easy access
    const latestPath = path.join(DEBUG_DIR, 'latest-debug.json');
    await fs.writeFile(latestPath, JSON.stringify(debugData, null, 2));

    res.json({
      success: true,
      message: `Debug logs saved to ${filename}`,
      totalLogs,
      filepath: filename
    });

  } catch (error) {
    console.error('Failed to save debug logs:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to save debug logs',
      message: error.message
    });
  }
});

/**
 * Get latest debug logs
 */
router.get('/latest', async (req, res) => {
  try {
    const latestPath = path.join(DEBUG_DIR, 'latest-debug.json');
    const data = await fs.readFile(latestPath, 'utf8');
    const debugData = JSON.parse(data);

    res.json({
      success: true,
      data: debugData
    });

  } catch (error) {
    if (error.code === 'ENOENT') {
      res.json({
        success: false,
        error: 'No debug logs found',
        message: 'No debug logs have been saved yet'
      });
    } else {
      res.status(500).json({
        success: false,
        error: 'Failed to read debug logs',
        message: error.message
      });
    }
  }
});

/**
 * List all debug log files
 */
router.get('/list', async (req, res) => {
  try {
    await ensureDebugDir();
    const files = await fs.readdir(DEBUG_DIR);
    const debugFiles = files.filter(file => file.endsWith('.json'));
    
    const fileDetails = await Promise.all(
      debugFiles.map(async (file) => {
        const filepath = path.join(DEBUG_DIR, file);
        const stats = await fs.stat(filepath);
        return {
          filename: file,
          size: stats.size,
          modified: stats.mtime,
          created: stats.ctime
        };
      })
    );

    res.json({
      success: true,
      files: fileDetails.sort((a, b) => new Date(b.modified) - new Date(a.modified))
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to list debug files',
      message: error.message
    });
  }
});

/**
 * Clear all debug logs
 */
router.delete('/clear', async (req, res) => {
  try {
    await ensureDebugDir();
    const files = await fs.readdir(DEBUG_DIR);
    const debugFiles = files.filter(file => file.endsWith('.json'));
    
    await Promise.all(
      debugFiles.map(file => 
        fs.unlink(path.join(DEBUG_DIR, file))
      )
    );

    res.json({
      success: true,
      message: `Cleared ${debugFiles.length} debug files`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to clear debug files',
      message: error.message
    });
  }
});

module.exports = router;