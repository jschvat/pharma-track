#!/usr/bin/env node

/**
 * OpenFDA Data Downloader and Database Populator
 * 
 * This script downloads archived OpenFDA data files for NDC and labeling data,
 * extracts them, and populates a MySQL or PostgreSQL database with the parsed content.
 * 
 * Features:
 * - Interactive command-line interface
 * - Progress indicators for downloads and processing
 * - Database connection configuration
 * - Uses existing OpenFDA parsing methods from PharmaTraK
 * - Safe temporary table creation (doesn't touch existing tables)
 * - Support for both MySQL and PostgreSQL
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const readline = require('readline');
const { promisify } = require('util');
const { pipeline } = require('stream');
const zlib = require('zlib');
const crypto = require('crypto');

// Third-party dependencies (will install if needed)
let mysql2, pg, progressBar;

// Configuration
const CONFIG = {
  openfda: {
    baseUrl: 'https://download.open.fda.gov',
    downloadApi: 'https://api.fda.gov/download.json',
    // Known OpenFDA download endpoints
    knownFiles: {
      ndc: 'https://download.open.fda.gov/Comprehensive_NDC_SPL_Data_Elements_File.zip',
      drugsfda: 'https://download.open.fda.gov/drug/drugsfda/drug-drugsfda-0001-of-0001.json.zip',
      labeling: 'https://www.fda.gov/media/89850/download', // Drugs@FDA data files
      // Alternative: Check individual partitioned files on download.open.fda.gov
    }
  },
  download: {
    chunkSize: 64 * 1024, // 64KB chunks
    retryAttempts: 3,
    retryDelay: 1000
  },
  database: {
    tempTablePrefix: 'temp_openfda_',
    batchSize: 1000
  }
};

// Global variables
let rl;
let database = null;
let dbConfig = {};
let fdaService = null;

/**
 * Initialize readline interface
 */
function initReadline() {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Prompt user for input
 */
function askQuestion(question) {
  return new Promise(resolve => {
    if (rl.closed) {
      resolve('5'); // Default to exit if readline is closed
      return;
    }
    rl.question(question, resolve);
  });
}

/**
 * Display colored console output
 */
function colorLog(message, color = 'reset') {
  const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    magenta: '\x1b[35m',
    cyan: '\x1b[36m'
  };
  
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Display banner
 */
function displayBanner() {
  colorLog('\n' + '='.repeat(80), 'cyan');
  colorLog('             OpenFDA Data Downloader & Database Populator', 'bright');
  colorLog('                       PharmaTraK Integration Tool', 'cyan');
  colorLog('='.repeat(80), 'cyan');
  colorLog('\nThis tool will help you download and process OpenFDA archived data files.', 'reset');
  colorLog('Features: NDC data, Labeling data, MySQL/PostgreSQL support\n', 'yellow');
}

/**
 * Progress bar utility
 */
class ProgressIndicator {
  constructor(total, label = 'Progress') {
    this.total = total;
    this.current = 0;
    this.label = label;
    this.startTime = Date.now();
  }

  update(current, details = '') {
    this.current = current;
    const percentage = Math.round((current / this.total) * 100);
    const elapsed = (Date.now() - this.startTime) / 1000;
    const eta = current > 0 ? ((this.total - current) * elapsed) / current : 0;
    
    const barLength = 40;
    const filledLength = Math.round((percentage / 100) * barLength);
    const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);
    
    process.stdout.write(`\r${this.label}: [${bar}] ${percentage}% (${current}/${this.total}) ETA: ${Math.round(eta)}s ${details}`);
  }

  finish(message = 'Complete') {
    const elapsed = (Date.now() - this.startTime) / 1000;
    process.stdout.write(`\r${this.label}: [████████████████████████████████████████] 100% - ${message} (${elapsed.toFixed(2)}s)\n`);
  }
}

/**
 * Install required dependencies
 */
async function installDependencies() {
  colorLog('Checking and installing dependencies...', 'yellow');
  
  try {
    // Try to require existing modules first
    try {
      mysql2 = require('mysql2/promise');
    } catch (e) {
      colorLog('Installing mysql2...', 'blue');
      require('child_process').execSync('npm install mysql2', { stdio: 'inherit' });
      mysql2 = require('mysql2/promise');
    }

    try {
      pg = require('pg');
    } catch (e) {
      colorLog('Installing pg (PostgreSQL driver)...', 'blue');
      require('child_process').execSync('npm install pg', { stdio: 'inherit' });
      pg = require('pg');
    }

    colorLog('Dependencies ready!', 'green');
  } catch (error) {
    colorLog(`Error installing dependencies: ${error.message}`, 'red');
    process.exit(1);
  }
}

/**
 * Load existing FDA service parsing methods
 */
async function loadFdaService() {
  try {
    const fdaServicePath = path.join(__dirname, '..', 'fdaService.js');
    if (fs.existsSync(fdaServicePath)) {
      fdaService = require(fdaServicePath);
      colorLog('✓ Loaded existing FDA service parsing methods', 'green');
    } else {
      colorLog('⚠ FDA service not found, will use basic parsing', 'yellow');
    }
  } catch (error) {
    colorLog(`⚠ Could not load FDA service: ${error.message}`, 'yellow');
  }
}

/**
 * Discover OpenFDA drug label partitioned files with auto-detection
 */
async function discoverOpenFDALabelFiles() {
  const labelFiles = [];
  const baseUrl = 'https://download.open.fda.gov/drug/label';
  
  colorLog('Auto-detecting OpenFDA drug label partitions...', 'blue');
  
  // First, determine the total count by testing common patterns (find highest valid)
  let totalCount = 0;
  for (let testTotal = 10; testTotal <= 20; testTotal++) {
    const testUrl = `${baseUrl}/drug-label-0001-of-00${testTotal.toString().padStart(2, '0')}.json.zip`;
    
    try {
      const response = await new Promise((resolve, reject) => {
        const request = https.get(testUrl, { method: 'HEAD', timeout: 3000 }, resolve);
        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('Timeout'));
        });
      });
      
      if (response.statusCode === 200) {
        totalCount = testTotal;  // Keep updating to find the highest valid total
      }
    } catch (error) {
      // Continue testing
    }
  }
  
  if (totalCount === 0) {
    colorLog('Could not determine OpenFDA label partition count, using fallback', 'yellow');
    totalCount = 13; // Known current count
  }
  
  colorLog(`Detected ${totalCount} OpenFDA drug label partitions`, 'green');
  
  // Add all discovered partitions
  const totalStr = totalCount.toString().padStart(4, '0');
  for (let i = 1; i <= totalCount; i++) {
    const partNum = i.toString().padStart(4, '0');
    labelFiles.push({
      type: 'openfda_labeling',
      filename: `drug-label-${partNum}-of-${totalStr}.json.zip`,
      url: `${baseUrl}/drug-label-${partNum}-of-${totalStr}.json.zip`,
      date: 'current',
      size: 'JSON ZIP Archive',
      isApi: false,
      description: `OpenFDA Drug Labels - Part ${i} of ${totalCount}`,
      source: 'OpenFDA'
    });
  }
  
  return labelFiles;
}

/**
 * Get available OpenFDA data files
 */
async function getAvailableFiles() {
  colorLog('Fetching available OpenFDA data files...', 'blue');
  
  try {
    // Fetch the official download list from OpenFDA API
    let downloadData = {};
    try {
      downloadData = await new Promise((resolve, reject) => {
        const request = https.get(CONFIG.openfda.downloadApi, { timeout: 5000 }, (res) => {
          let data = '';
          res.on('data', chunk => data += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(data));
            } catch (error) {
              reject(new Error('Failed to parse download API response'));
            }
          });
        });
        request.on('error', reject);
        request.on('timeout', () => {
          request.destroy();
          reject(new Error('API request timeout'));
        });
      });
    } catch (apiError) {
      colorLog(`Warning: Could not fetch download API (${apiError.message}), using known files`, 'yellow');
      downloadData = { results: {} };
    }

    const files = [];
    
    // Add known OpenFDA files
    if (CONFIG.openfda.knownFiles.ndc) {
      files.push({
        type: 'ndc',
        filename: 'Comprehensive_NDC_SPL_Data_Elements_File.zip',
        url: CONFIG.openfda.knownFiles.ndc,
        date: 'current',
        size: '~20MB ZIP Archive',
        isApi: false
      });
    }

    if (CONFIG.openfda.knownFiles.drugsfda) {
      files.push({
        type: 'drugsfda',
        filename: 'drug-drugsfda-0001-of-0001.json.zip',
        url: CONFIG.openfda.knownFiles.drugsfda,
        date: 'current',
        size: 'ZIP Archive',
        isApi: false
      });
    }

    if (CONFIG.openfda.knownFiles.labeling) {
      files.push({
        type: 'labeling',
        filename: 'drugsatfda.zip',
        url: CONFIG.openfda.knownFiles.labeling,
        date: 'current',
        size: '~5.7MB ZIP Archive',
        isApi: false
      });
    }

    // Add OpenFDA drug labeling partitioned files (auto-detect count)
    const openFdaLabelFiles = await discoverOpenFDALabelFiles();
    files.push(...openFdaLabelFiles);

    // Add DailyMed/NLM partitioned drug labeling files (separate source)
    // Human Prescription Labels (5 parts)
    for (let i = 1; i <= 5; i++) {
      files.push({
        type: 'dailymed_labeling',
        filename: `dm_spl_release_human_rx_part${i}.zip`,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/dm_spl_release_human_rx_part${i}.zip`,
        date: 'September 2025',
        size: 'Large ZIP Archive',
        isApi: false,
        description: `DailyMed Human Rx Labels - Part ${i} of 5`,
        source: 'NLM DailyMed'
      });
    }

    // Human OTC Labels (11 parts) 
    for (let i = 1; i <= 11; i++) {
      files.push({
        type: 'dailymed_labeling',
        filename: `dm_spl_release_human_otc_part${i}.zip`,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/dm_spl_release_human_otc_part${i}.zip`,
        date: 'September 2025', 
        size: 'Large ZIP Archive',
        isApi: false,
        description: `DailyMed Human OTC Labels - Part ${i} of 11`,
        source: 'NLM DailyMed'
      });
    }

    // Additional DailyMed files
    const additionalDailyMed = [
      { name: 'dm_spl_release_homeopathic.zip', desc: 'Homeopathic Labels' },
      { name: 'dm_spl_release_animal.zip', desc: 'Animal Labels' },
      { name: 'dm_spl_release_remainder.zip', desc: 'Remainder Labels' }
    ];

    additionalDailyMed.forEach(file => {
      files.push({
        type: 'dailymed_labeling',
        filename: file.name,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/${file.name}`,
        date: 'September 2025',
        size: 'ZIP Archive',
        isApi: false,
        description: `DailyMed ${file.desc}`,
        source: 'NLM DailyMed'
      });
    });

    // Parse download.json to find drug-related downloads
    if (downloadData.results) {
      Object.keys(downloadData.results).forEach(endpoint => {
        const endpointData = downloadData.results[endpoint];
        
        if (endpoint.includes('drug') && endpointData.export) {
          const exportUrl = endpointData.export;
          
          // Determine file type based on endpoint
          let fileType = 'unknown';
          let filename = path.basename(exportUrl);
          
          if (endpoint.includes('ndc')) {
            fileType = 'ndc';
          } else if (endpoint.includes('label')) {
            fileType = 'labeling';
          } else if (endpoint.includes('enforcement')) {
            fileType = 'enforcement';
          } else if (endpoint.includes('event')) {
            fileType = 'event';
          }
          
          if (fileType !== 'unknown') {
            files.push({
              type: fileType,
              filename: filename,
              url: exportUrl,
              date: endpointData.last_updated || 'unknown',
              size: endpointData.size_mb ? `${endpointData.size_mb}MB` : 'Unknown',
              isApi: false,
              endpoint: endpoint
            });
          }
        }
      });
    }

    colorLog(`Found ${files.length} available data files`, 'green');
    return files;
    
  } catch (error) {
    colorLog(`Error fetching OpenFDA files: ${error.message}`, 'red');
    colorLog('Using known file fallbacks...', 'yellow');
    
    // Fallback to known files
    const fallbackFiles = [
      {
        type: 'ndc',
        filename: 'Comprehensive_NDC_SPL_Data_Elements_File.zip',
        url: CONFIG.openfda.knownFiles.ndc,
        date: 'current',
        size: '~20MB ZIP Archive',
        isApi: false
      },
      {
        type: 'drugsfda',
        filename: 'drug-drugsfda-0001-of-0001.json.zip',
        url: CONFIG.openfda.knownFiles.drugsfda,
        date: 'current',
        size: 'ZIP Archive',
        isApi: false
      },
      {
        type: 'labeling',
        filename: 'drugsatfda.zip',
        url: CONFIG.openfda.knownFiles.labeling,
        date: 'current',
        size: '~5.7MB ZIP Archive',
        isApi: false
      }
    ];

    // Add OpenFDA drug label files to fallback (known count)
    for (let i = 1; i <= 13; i++) {
      const partNum = i.toString().padStart(4, '0');
      fallbackFiles.push({
        type: 'openfda_labeling',
        filename: `drug-label-${partNum}-of-0013.json.zip`,
        url: `https://download.open.fda.gov/drug/label/drug-label-${partNum}-of-0013.json.zip`,
        date: 'current',
        size: 'JSON ZIP Archive',
        isApi: false,
        description: `OpenFDA Drug Labels - Part ${i} of 13`,
        source: 'OpenFDA'
      });
    }

    // Add all DailyMed partitioned files to fallback as well
    // Human Prescription Labels (5 parts)
    for (let i = 1; i <= 5; i++) {
      fallbackFiles.push({
        type: 'dailymed_labeling',
        filename: `dm_spl_release_human_rx_part${i}.zip`,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/dm_spl_release_human_rx_part${i}.zip`,
        date: 'September 2025',
        size: 'Large ZIP Archive',
        isApi: false,
        description: `DailyMed Human Rx Labels - Part ${i} of 5`,
        source: 'NLM DailyMed'
      });
    }

    // Human OTC Labels (11 parts)
    for (let i = 1; i <= 11; i++) {
      fallbackFiles.push({
        type: 'dailymed_labeling',
        filename: `dm_spl_release_human_otc_part${i}.zip`,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/dm_spl_release_human_otc_part${i}.zip`,
        date: 'September 2025',
        size: 'Large ZIP Archive',
        isApi: false,
        description: `DailyMed Human OTC Labels - Part ${i} of 11`,
        source: 'NLM DailyMed'
      });
    }

    // Additional DailyMed files
    ['dm_spl_release_homeopathic.zip', 'dm_spl_release_animal.zip', 'dm_spl_release_remainder.zip'].forEach((filename, i) => {
      const descriptions = ['Homeopathic Labels', 'Animal Labels', 'Remainder Labels'];
      fallbackFiles.push({
        type: 'dailymed_labeling',
        filename: filename,
        url: `https://dailymed-data.nlm.nih.gov/public-release-files/${filename}`,
        date: 'September 2025',
        size: 'ZIP Archive',
        isApi: false,
        description: `DailyMed ${descriptions[i]}`,
        source: 'NLM DailyMed'
      });
    });
    
    return fallbackFiles;
  }
}

/**
 * Download file with progress indicator
 */
async function downloadFile(url, outputPath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(outputPath);
    let downloadedBytes = 0;
    let totalBytes = 0;
    let progress;

    const request = https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode} ${response.statusMessage}`));
        return;
      }

      totalBytes = parseInt(response.headers['content-length'] || '0', 10);
      progress = new ProgressIndicator(totalBytes, `Downloading ${path.basename(outputPath)}`);

      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        progress.update(downloadedBytes, `${(downloadedBytes / 1024 / 1024).toFixed(1)}MB`);
      });

      response.pipe(file);
    });

    file.on('finish', () => {
      file.close();
      if (progress) progress.finish('Downloaded');
      resolve(outputPath);
    });

    file.on('error', (err) => {
      fs.unlink(outputPath, () => {}); // Delete partial file
      reject(err);
    });

    request.on('error', (err) => {
      reject(err);
    });
  });
}


/**
 * Extract ZIP file with support for large files (>2GB)
 */
async function extractZipFile(zipPath, extractPath) {
  try {
    const stats = fs.statSync(zipPath);
    const fileSizeMB = stats.size / (1024 * 1024);
    
    colorLog(`Extracting ZIP file (${fileSizeMB.toFixed(1)}MB)...`, 'blue');
    
    // For files larger than 500MB, use system unzip to avoid memory issues
    if (stats.size > 500 * 1024 * 1024) {
      colorLog('Large file detected, using system unzip for better memory handling...', 'yellow');
      return await extractLargeZipFile(zipPath, extractPath);
    } else {
      // Use adm-zip for smaller files (faster and more reliable for small files)
      return await extractSmallZipFile(zipPath, extractPath);
    }
  } catch (error) {
    colorLog(`Extraction failed: ${error.message}`, 'red');
    throw error;
  }
}

/**
 * Extract large ZIP files using system unzip command
 */
async function extractLargeZipFile(zipPath, extractPath) {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // Ensure extract directory exists
    fs.mkdirSync(extractPath, { recursive: true });
    
    // Use system unzip command which handles large files efficiently
    const unzipProcess = spawn('unzip', ['-o', zipPath, '-d', extractPath], {
      stdio: ['ignore', 'pipe', 'pipe']
    });
    
    let stdout = '';
    let stderr = '';
    
    unzipProcess.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    unzipProcess.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    unzipProcess.on('close', (code) => {
      if (code === 0) {
        // List extracted files
        try {
          const extractedFiles = [];
          const scanDir = (dir) => {
            const entries = fs.readdirSync(dir, { withFileTypes: true });
            entries.forEach(entry => {
              const fullPath = path.join(dir, entry.name);
              if (entry.isDirectory()) {
                scanDir(fullPath);
              } else {
                extractedFiles.push(fullPath);
              }
            });
          };
          
          scanDir(extractPath);
          colorLog(`✓ Extraction complete: ${extractedFiles.length} files extracted`, 'green');
          resolve(extractedFiles);
        } catch (scanError) {
          colorLog(`Extraction succeeded but file listing failed: ${scanError.message}`, 'yellow');
          resolve([]);
        }
      } else {
        reject(new Error(`Unzip failed with code ${code}: ${stderr}`));
      }
    });
    
    unzipProcess.on('error', (error) => {
      if (error.code === 'ENOENT') {
        colorLog('System unzip not found, trying fallback method...', 'yellow');
        // Fallback to streaming zip extraction
        extractStreamingZipFile(zipPath, extractPath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(error);
      }
    });
  });
}

/**
 * Extract small ZIP files using adm-zip (memory-efficient for small files)
 */
async function extractSmallZipFile(zipPath, extractPath) {
  try {
    // Install adm-zip if not available
    try {
      require.resolve('adm-zip');
    } catch (e) {
      colorLog('Installing adm-zip...', 'blue');
      require('child_process').execSync('npm install adm-zip', { stdio: 'inherit' });
    }
    
    const AdmZip = require('adm-zip');
    const zip = new AdmZip(zipPath);
    const entries = zip.getEntries();
    
    colorLog(`Extracting ${entries.length} files...`, 'blue');
    
    // Ensure extract directory exists
    fs.mkdirSync(extractPath, { recursive: true });
    
    const extractedFiles = [];
    
    entries.forEach(entry => {
      if (!entry.isDirectory) {
        const outputPath = path.join(extractPath, entry.entryName);
        fs.mkdirSync(path.dirname(outputPath), { recursive: true });
        fs.writeFileSync(outputPath, entry.getData());
        extractedFiles.push(outputPath);
      }
    });
    
    colorLog('✓ Extraction complete', 'green');
    return extractedFiles;
  } catch (error) {
    // If adm-zip fails (memory issues), fallback to streaming
    if (error.message.includes('out of memory') || error.message.includes('Maximum call stack')) {
      colorLog('Memory issue with adm-zip, falling back to streaming extraction...', 'yellow');
      return await extractStreamingZipFile(zipPath, extractPath);
    }
    throw error;
  }
}

/**
 * Streaming ZIP extraction fallback for when system unzip is not available
 */
async function extractStreamingZipFile(zipPath, extractPath) {
  try {
    // Install yauzl for streaming zip extraction
    try {
      require.resolve('yauzl');
    } catch (e) {
      colorLog('Installing yauzl for streaming extraction...', 'blue');
      require('child_process').execSync('npm install yauzl', { stdio: 'inherit' });
    }
    
    const yauzl = require('yauzl');
    
    return new Promise((resolve, reject) => {
      const extractedFiles = [];
      
      yauzl.open(zipPath, { lazyEntries: true }, (err, zipfile) => {
        if (err) {
          reject(err);
          return;
        }
        
        fs.mkdirSync(extractPath, { recursive: true });
        
        zipfile.readEntry();
        
        zipfile.on('entry', (entry) => {
          if (/\/$/.test(entry.fileName)) {
            // Directory entry
            const dirPath = path.join(extractPath, entry.fileName);
            fs.mkdirSync(dirPath, { recursive: true });
            zipfile.readEntry();
          } else {
            // File entry
            const filePath = path.join(extractPath, entry.fileName);
            fs.mkdirSync(path.dirname(filePath), { recursive: true });
            
            zipfile.openReadStream(entry, (err, readStream) => {
              if (err) {
                reject(err);
                return;
              }
              
              const writeStream = fs.createWriteStream(filePath);
              readStream.pipe(writeStream);
              
              writeStream.on('close', () => {
                extractedFiles.push(filePath);
                zipfile.readEntry();
              });
              
              writeStream.on('error', reject);
            });
          }
        });
        
        zipfile.on('end', () => {
          colorLog(`✓ Streaming extraction complete: ${extractedFiles.length} files`, 'green');
          resolve(extractedFiles);
        });
        
        zipfile.on('error', reject);
      });
    });
  } catch (error) {
    throw new Error(`Streaming extraction failed: ${error.message}`);
  }
}

/**
 * Configure database connection
 */
async function configureDatabaseConnection() {
  colorLog('\n' + '='.repeat(50), 'cyan');
  colorLog('Database Configuration', 'bright');
  colorLog('='.repeat(50), 'cyan');
  
  const dbType = await askQuestion('Database type (mysql/postgresql): ');
  
  if (!['mysql', 'postgresql'].includes(dbType.toLowerCase())) {
    colorLog('Invalid database type. Please choose mysql or postgresql.', 'red');
    return configureDatabaseConnection();
  }
  
  dbConfig.type = dbType.toLowerCase();
  dbConfig.host = await askQuestion('Host (default: localhost): ') || 'localhost';
  dbConfig.port = await askQuestion(`Port (default: ${dbType === 'mysql' ? 3306 : 5432}): `) || (dbType === 'mysql' ? 3306 : 5432);
  dbConfig.database = await askQuestion('Database name: ');
  dbConfig.user = await askQuestion('Username: ');
  
  // Hide password input
  return new Promise((resolve) => {
    process.stdout.write('Password: ');
    
    // Remove any existing listeners to prevent conflicts
    process.stdin.removeAllListeners('data');
    
    process.stdin.setRawMode(true);
    process.stdin.setEncoding('utf8');
    
    let password = '';
    
    const handleInput = (char) => {
      if (char === '\n' || char === '\r' || char === '\u0004') {
        // Enter pressed - finish input
        process.stdin.setRawMode(false);
        process.stdin.removeListener('data', handleInput);
        process.stdin.pause();
        process.stdout.write('\n');
        dbConfig.password = password;
        resolve();
      } else if (char === '\u0008' || char === '\u007f') {
        // Backspace pressed
        if (password.length > 0) {
          password = password.slice(0, -1);
          process.stdout.write('\u0008 \u0008');
        }
      } else if (char === '\u0003') {
        // Ctrl+C pressed
        process.stdin.setRawMode(false);
        process.stdin.removeListener('data', handleInput);
        process.stdout.write('\n');
        process.exit(1);
      } else if (char >= ' ' && char <= '~') {
        // Printable character
        password += char;
        process.stdout.write('*');
      }
      // Ignore non-printable characters
    };
    
    process.stdin.on('data', handleInput);
  });
}

/**
 * Test database connection
 */
async function testDatabaseConnection() {
  try {
    colorLog('Testing database connection...', 'blue');
    
    if (dbConfig.type === 'mysql') {
      // Enhanced MySQL connection with timeouts and better error handling
      database = await mysql2.createConnection({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectTimeout: 10000,
        charset: 'utf8mb4'
      });
      
      const [rows] = await database.execute('SELECT 1 as test, DATABASE() as current_db, USER() as user');
      colorLog('✓ MySQL connection successful', 'green');
      colorLog(`  Database: ${rows[0].current_db}`, 'cyan');
      colorLog(`  User: ${rows[0].user}`, 'cyan');
    } else {
      // Enhanced PostgreSQL connection
      database = new pg.Client({
        host: dbConfig.host,
        port: dbConfig.port,
        user: dbConfig.user,
        password: dbConfig.password,
        database: dbConfig.database,
        connectionTimeoutMillis: 10000,
        query_timeout: 10000
      });
      
      await database.connect();
      const result = await database.query('SELECT 1 as test, current_database() as current_db, current_user as current_user');
      colorLog('✓ PostgreSQL connection successful', 'green');
      colorLog(`  Database: ${result.rows[0].current_db}`, 'cyan');
      colorLog(`  User: ${result.rows[0].current_user}`, 'cyan');
    }
    
    return true;
  } catch (error) {
    colorLog(`✗ Database connection failed: ${error.message}`, 'red');
    
    // Provide helpful troubleshooting information
    if (error.code === 'ETIMEDOUT') {
      colorLog('  Troubleshooting: Connection timeout', 'yellow');
      colorLog('  - Check if the database server is running', 'yellow');
      colorLog('  - Verify firewall settings allow connections on port ' + dbConfig.port, 'yellow');
      colorLog('  - Try using IP address instead of hostname', 'yellow');
    } else if (error.code === 'ENOTFOUND') {
      colorLog('  Troubleshooting: Host not found', 'yellow');
      colorLog('  - Check if hostname resolves correctly', 'yellow');
      colorLog('  - Try using IP address: miniserver.local = 192.168.1.220', 'yellow');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      colorLog('  Troubleshooting: Access denied', 'yellow');
      colorLog('  - Verify username and password are correct', 'yellow');
      colorLog('  - Check if user has access from this host', 'yellow');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      colorLog('  Troubleshooting: Database does not exist', 'yellow');
      colorLog('  - The database needs to be created first', 'yellow');
      colorLog('  - You can create it with: CREATE DATABASE ' + dbConfig.database, 'yellow');
    } else if (error.code === 'ECONNREFUSED') {
      colorLog('  Troubleshooting: Connection refused', 'yellow');
      colorLog('  - Check if MySQL/PostgreSQL is running', 'yellow');
      colorLog('  - Verify the port number is correct', 'yellow');
    }
    
    return false;
  }
}

/**
 * Save database configuration to file for testing
 */
function saveDatabaseConfig() {
  try {
    const configPath = path.join(__dirname, 'db-config.json');
    const configToSave = {
      ...dbConfig,
      password: '***HIDDEN***', // Don't save the actual password
      savedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(configPath, JSON.stringify(configToSave, null, 2));
    colorLog(`✓ Database configuration saved to ${configPath}`, 'green');
  } catch (error) {
    colorLog(`⚠ Could not save database configuration: ${error.message}`, 'yellow');
  }
}

/**
 * Load database configuration from file
 */
function loadDatabaseConfig() {
  try {
    const configPath = path.join(__dirname, 'db-config.json');
    if (fs.existsSync(configPath)) {
      const savedConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      
      // Load password from file (for testing - be careful in production)
      delete savedConfig.savedAt;
      
      Object.assign(dbConfig, savedConfig);
      colorLog(`✓ Database configuration loaded from ${configPath}`, 'green');
      colorLog(`  Type: ${dbConfig.type}, Host: ${dbConfig.host}, Database: ${dbConfig.database}`, 'cyan');
      return true;
    }
    return false;
  } catch (error) {
    colorLog(`⚠ Could not load database configuration: ${error.message}`, 'yellow');
    return false;
  }
}

/**
 * Create temporary database tables
 */
async function createTempTables() {
  colorLog('Creating temporary database tables...', 'blue');
  
  colorLog('🔧 DEBUG: Generating table names...', 'magenta');
  const ndcTableName = `${CONFIG.database.tempTablePrefix}ndc_data`;
  const labelingTableName = `${CONFIG.database.tempTablePrefix}labeling_data`;
  
  colorLog(`🔧 DEBUG: Table names: ${ndcTableName}, ${labelingTableName}`, 'magenta');
  
  const mysqlSchemas = {
    ndc: `
      CREATE TABLE IF NOT EXISTS ${ndcTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        product_ndc VARCHAR(20) NOT NULL,
        generic_name TEXT,
        labeler_name VARCHAR(500),
        brand_name VARCHAR(500),
        active_ingredients JSON,
        dosage_form VARCHAR(200),
        route JSON,
        product_type VARCHAR(100),
        marketing_start_date VARCHAR(20),
        marketing_end_date VARCHAR(20),
        dea_schedule VARCHAR(10),
        openfda_data JSON,
        raw_data JSON,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_product_ndc (product_ndc),
        INDEX idx_generic_name (generic_name(100)),
        INDEX idx_labeler_name (labeler_name(100)),
        INDEX idx_brand_name (brand_name(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `,
    labeling: `
      CREATE TABLE IF NOT EXISTS ${labelingTableName} (
        id INT AUTO_INCREMENT PRIMARY KEY,
        set_id VARCHAR(100) NOT NULL,
        product_ndc VARCHAR(20),
        generic_name TEXT,
        brand_name VARCHAR(500),
        labeler_name VARCHAR(500),
        dosage_form VARCHAR(200),
        route JSON,
        indications_and_usage LONGTEXT,
        contraindications LONGTEXT,
        warnings_and_precautions LONGTEXT,
        adverse_reactions LONGTEXT,
        drug_interactions LONGTEXT,
        dosage_and_administration LONGTEXT,
        clinical_pharmacology LONGTEXT,
        description_text LONGTEXT,
        openfda_data JSON,
        parsed_sections JSON,
        raw_data JSON,
        effective_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_set_id (set_id),
        INDEX idx_product_ndc (product_ndc),
        INDEX idx_generic_name (generic_name(100)),
        INDEX idx_brand_name (brand_name(100)),
        INDEX idx_labeler_name (labeler_name(100))
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `
  };
  
  const postgresSchemas = {
    ndc: `
      CREATE TABLE IF NOT EXISTS ${ndcTableName} (
        id SERIAL PRIMARY KEY,
        product_ndc VARCHAR(20) NOT NULL,
        generic_name TEXT,
        labeler_name VARCHAR(500),
        brand_name VARCHAR(500),
        active_ingredients JSONB,
        dosage_form VARCHAR(200),
        route JSONB,
        product_type VARCHAR(100),
        marketing_start_date VARCHAR(20),
        marketing_end_date VARCHAR(20),
        dea_schedule VARCHAR(10),
        openfda_data JSONB,
        raw_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_${ndcTableName}_product_ndc ON ${ndcTableName} (product_ndc);
      CREATE INDEX IF NOT EXISTS idx_${ndcTableName}_generic_name ON ${ndcTableName} USING gin(to_tsvector('english', generic_name));
      CREATE INDEX IF NOT EXISTS idx_${ndcTableName}_labeler_name ON ${ndcTableName} (labeler_name);
      CREATE INDEX IF NOT EXISTS idx_${ndcTableName}_brand_name ON ${ndcTableName} (brand_name);
    `,
    labeling: `
      CREATE TABLE IF NOT EXISTS ${labelingTableName} (
        id SERIAL PRIMARY KEY,
        set_id VARCHAR(100) NOT NULL UNIQUE,
        product_ndc VARCHAR(20),
        generic_name TEXT,
        brand_name VARCHAR(500),
        labeler_name VARCHAR(500),
        dosage_form VARCHAR(200),
        route JSONB,
        indications_and_usage TEXT,
        contraindications TEXT,
        warnings_and_precautions TEXT,
        adverse_reactions TEXT,
        drug_interactions TEXT,
        dosage_and_administration TEXT,
        clinical_pharmacology TEXT,
        description_text TEXT,
        openfda_data JSONB,
        parsed_sections JSONB,
        raw_data JSONB,
        effective_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_${labelingTableName}_product_ndc ON ${labelingTableName} (product_ndc);
      CREATE INDEX IF NOT EXISTS idx_${labelingTableName}_generic_name ON ${labelingTableName} USING gin(to_tsvector('english', generic_name));
      CREATE INDEX IF NOT EXISTS idx_${labelingTableName}_brand_name ON ${labelingTableName} (brand_name);
      CREATE INDEX IF NOT EXISTS idx_${labelingTableName}_labeler_name ON ${labelingTableName} (labeler_name);
    `
  };
  
  try {
    colorLog('🔧 DEBUG: Selecting database schema type...', 'magenta');
    const schemas = dbConfig.type === 'mysql' ? mysqlSchemas : postgresSchemas;
    
    colorLog(`🔧 DEBUG: Using ${dbConfig.type} schemas, executing SQL...`, 'magenta');
    
    if (dbConfig.type === 'mysql') {
      colorLog('🔧 DEBUG: Creating NDC table...', 'magenta');
      await database.execute(schemas.ndc);
      colorLog('🔧 DEBUG: NDC table created, creating labeling table...', 'magenta');
      await database.execute(schemas.labeling);
      colorLog('🔧 DEBUG: Labeling table created!', 'magenta');
    } else {
      colorLog('🔧 DEBUG: Creating PostgreSQL tables...', 'magenta');
      await database.query(schemas.ndc);
      await database.query(schemas.labeling);
    }
    
    colorLog('✓ Temporary tables created successfully', 'green');
    colorLog(`  - ${ndcTableName}`, 'cyan');
    colorLog(`  - ${labelingTableName}`, 'cyan');
    
    return { ndcTableName, labelingTableName };
  } catch (error) {
    colorLog(`✗ Failed to create tables: ${error.message}`, 'red');
    colorLog(`✗ Error details: ${error.stack}`, 'red');
    throw error;
  }
}

/**
 * Parse NDC data using FDA service methods
 */
function parseNdcData(record) {
  const parsed = {
    product_ndc: record.product_ndc || null,
    generic_name: record.generic_name || null,
    labeler_name: record.labeler_name || null,
    brand_name: record.brand_name || null,
    active_ingredients: record.active_ingredients || null,
    dosage_form: record.dosage_form || null,
    route: record.route || null,
    product_type: record.product_type || null,
    marketing_start_date: record.marketing_start_date || null,
    marketing_end_date: record.marketing_end_date || null,
    dea_schedule: record.dea_schedule || null,
    openfda_data: record.openfda || null,
    raw_data: record
  };
  
  // Use existing FDA service parsing if available
  if (fdaService && fdaService.parseFDAData) {
    try {
      const enhanced = fdaService.parseFDAData(record);
      Object.assign(parsed, enhanced);
    } catch (error) {
      colorLog(`Warning: FDA service parsing failed for record: ${error.message}`, 'yellow');
    }
  }
  
  return parsed;
}

/**
 * Parse labeling data using FDA service methods
 */
function parseLabelingData(record) {
  const parsed = {
    set_id: record.set_id || null,
    product_ndc: (record.openfda && record.openfda.product_ndc) ? record.openfda.product_ndc[0] : null,
    generic_name: (record.openfda && record.openfda.generic_name) ? record.openfda.generic_name[0] : null,
    brand_name: (record.openfda && record.openfda.brand_name) ? record.openfda.brand_name[0] : null,
    labeler_name: (record.openfda && record.openfda.manufacturer_name) ? record.openfda.manufacturer_name[0] : null,
    dosage_form: (record.openfda && record.openfda.dosage_form) ? record.openfda.dosage_form[0] : null,
    route: (record.openfda && record.openfda.route) ? record.openfda.route : null,
    indications_and_usage: record.indications_and_usage ? record.indications_and_usage.join(' ') : null,
    contraindications: record.contraindications ? record.contraindications.join(' ') : null,
    warnings_and_precautions: record.warnings ? record.warnings.join(' ') : null,
    adverse_reactions: record.adverse_reactions ? record.adverse_reactions.join(' ') : null,
    drug_interactions: record.drug_interactions ? record.drug_interactions.join(' ') : null,
    dosage_and_administration: record.dosage_and_administration ? record.dosage_and_administration.join(' ') : null,
    clinical_pharmacology: record.clinical_pharmacology ? record.clinical_pharmacology.join(' ') : null,
    description_text: record.description ? record.description.join(' ') : null,
    openfda_data: record.openfda || null,
    effective_time: record.effective_time || null,
    raw_data: record
  };
  
  // Use existing FDA service parsing if available
  if (fdaService && fdaService.parseLabelingData) {
    try {
      const enhanced = fdaService.parseLabelingData(record);
      parsed.parsed_sections = enhanced;
    } catch (error) {
      colorLog(`Warning: FDA labeling parsing failed for record: ${error.message}`, 'yellow');
    }
  }
  
  return parsed;
}

/**
 * Process and populate database with JSON data
 */
async function processJsonFile(filePath, dataType, tableName) {
  const startTime = Date.now();
  const fileName = path.basename(filePath);
  
  colorLog(`    📄 Starting ${dataType} processing: ${fileName}`, 'blue');
  
  try {
    // Check file size first
    const fileStats = fs.statSync(filePath);
    const fileSizeMB = fileStats.size / (1024 * 1024);
    colorLog(`    📊 File size: ${fileSizeMB.toFixed(2)}MB`, 'cyan');
    
    // For files larger than 400MB, use streaming approach
    if (fileStats.size > 400 * 1024 * 1024) {
      colorLog(`    🔄 File is large (${fileSizeMB.toFixed(2)}MB), using streaming parser...`, 'yellow');
      return await processLargeJsonFile(filePath, dataType, tableName);
    }
    
    colorLog(`    ⏳ Reading file content (small file approach)...`, 'yellow');
    const fileContent = fs.readFileSync(filePath, 'utf8');
    colorLog(`    ✓ File content loaded (${(fileContent.length / 1024 / 1024).toFixed(2)}MB)`, 'green');
    
    colorLog(`    🔍 Parsing JSON data...`, 'yellow');
    const data = JSON.parse(fileContent);
    const results = data.results || [];
    
    if (results.length === 0) {
      colorLog('    ⚠ No data found in file', 'yellow');
      return;
    }
    
    colorLog(`    ✓ Found ${results.length} ${dataType} records to process`, 'green');
    colorLog(`    📊 Processing in batches of ${CONFIG.database.batchSize}`, 'cyan');
    
    const progress = new ProgressIndicator(results.length, `    Inserting ${dataType} records`);
    let processedCount = 0;
    let errorCount = 0;
    let batchCount = 0;
    
    // Process in batches
    const totalBatches = Math.ceil(results.length / CONFIG.database.batchSize);
    
    for (let i = 0; i < results.length; i += CONFIG.database.batchSize) {
      batchCount++;
      const batch = results.slice(i, i + CONFIG.database.batchSize);
      const parsedBatch = [];
      
      colorLog(`\n    📦 Processing batch ${batchCount}/${totalBatches} (${batch.length} records)...`, 'yellow');
      
      let parseErrors = 0;
      for (const record of batch) {
        try {
          const parsed = dataType === 'ndc' ? parseNdcData(record) : parseLabelingData(record);
          parsedBatch.push(parsed);
        } catch (error) {
          parseErrors++;
          errorCount++;
          if (parseErrors <= 3) { // Only log first few errors to avoid spam
            colorLog(`    ❌ Parse error: ${error.message}`, 'red');
          }
        }
      }
      
      if (parseErrors > 3) {
        colorLog(`    ⚠ ${parseErrors - 3} additional parse errors (not shown)`, 'yellow');
      }
      
      // Insert batch
      if (parsedBatch.length > 0) {
        try {
          colorLog(`    💾 Inserting batch ${batchCount} into database (${parsedBatch.length} records)...`, 'cyan');
          const insertStart = Date.now();
          
          await insertBatch(parsedBatch, tableName, dataType);
          
          const insertTime = Date.now() - insertStart;
          processedCount += parsedBatch.length;
          
          colorLog(`    ✓ Batch ${batchCount} inserted successfully in ${insertTime}ms`, 'green');
        } catch (error) {
          errorCount += parsedBatch.length;
          colorLog(`    ❌ Batch ${batchCount} insertion failed: ${error.message}`, 'red');
          
          // Add some additional error context
          if (error.code) {
            colorLog(`    Error code: ${error.code}`, 'red');
          }
          if (error.errno) {
            colorLog(`    Error number: ${error.errno}`, 'red');
          }
        }
      }
      
      progress.update(Math.min(i + CONFIG.database.batchSize, results.length));
      
      // Small delay between batches to prevent overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 10));
    }
    
    const totalTime = Date.now() - startTime;
    progress.finish(`${processedCount} records inserted, ${errorCount} errors in ${(totalTime / 1000).toFixed(2)}s`);
    
    // Summary for this file
    colorLog(`\n    📈 File Processing Summary:`, 'cyan');
    colorLog(`      • File: ${fileName}`, 'cyan');
    colorLog(`      • Records processed: ${processedCount}`, 'cyan');
    colorLog(`      • Errors: ${errorCount}`, errorCount > 0 ? 'yellow' : 'cyan');
    colorLog(`      • Processing time: ${(totalTime / 1000).toFixed(2)}s`, 'cyan');
    colorLog(`      • Records per second: ${(processedCount / (totalTime / 1000)).toFixed(0)}`, 'cyan');
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    colorLog(`    ❌ Failed to process file ${fileName}: ${error.message}`, 'red');
    colorLog(`    Processing time before failure: ${(totalTime / 1000).toFixed(2)}s`, 'red');
    
    if (error.name === 'SyntaxError') {
      colorLog(`    This appears to be a JSON parsing error. The file may be corrupted.`, 'yellow');
    }
    
    throw error;
  }
}

/**
 * Process large JSON files using chunked reading approach
 */
async function processLargeJsonFile(filePath, dataType, tableName) {
  const startTime = Date.now();
  const fileName = path.basename(filePath);
  
  colorLog(`    📄 Processing large ${dataType} file: ${fileName}`, 'blue');
  
  try {
    colorLog(`    🔄 Using chunked reading approach for large file...`, 'yellow');
    
    // Read file in chunks to find the results array without loading everything into memory
    const fd = fs.openSync(filePath, 'r');
    const chunkSize = 64 * 1024; // 64KB chunks
    let buffer = Buffer.alloc(chunkSize);
    let filePosition = 0;
    let jsonBuffer = '';
    let foundResultsStart = false;
    let resultsStartPos = -1;
    let bracketCount = 0;
    let inString = false;
    let escapeNext = false;
    
    colorLog(`    🔍 Scanning file to locate 'results' array...`, 'yellow');
    
    // Phase 1: Find the start of the results array
    while (!foundResultsStart) {
      const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, filePosition);
      
      if (bytesRead === 0) {
        throw new Error('Could not find "results" array in JSON file');
      }
      
      const chunk = buffer.slice(0, bytesRead).toString('utf8');
      jsonBuffer += chunk;
      
      // Look for "results":[
      const resultsMatch = jsonBuffer.match(/"results"\s*:\s*\[/);
      if (resultsMatch) {
        resultsStartPos = filePosition + resultsMatch.index + resultsMatch[0].length;
        foundResultsStart = true;
        colorLog(`    ✓ Found 'results' array at position ${resultsStartPos}`, 'green');
        break;
      }
      
      filePosition += bytesRead;
      
      // Keep only the last part of the buffer to handle matches across chunk boundaries
      if (jsonBuffer.length > chunkSize) {
        jsonBuffer = jsonBuffer.slice(-1000); // Keep last 1KB
      }
    }
    
    // Phase 2: Process the results array record by record
    colorLog(`    🔄 Starting record-by-record processing...`, 'yellow');
    
    let recordCount = 0;
    let processedCount = 0;
    let errorCount = 0;
    let currentBatch = [];
    let batchCount = 0;
    let currentRecord = '';
    let recordBracketCount = 0;
    let inRecordString = false;
    let recordEscapeNext = false;
    
    filePosition = resultsStartPos;
    jsonBuffer = '';
    
    while (true) {
      const bytesRead = fs.readSync(fd, buffer, 0, chunkSize, filePosition);
      
      if (bytesRead === 0) {
        break; // End of file
      }
      
      const chunk = buffer.slice(0, bytesRead).toString('utf8');
      jsonBuffer += chunk;
      
      // Process character by character to extract individual records
      let bufferPos = 0;
      while (bufferPos < jsonBuffer.length) {
        const char = jsonBuffer[bufferPos];
        
        if (!inRecordString) {
          if (char === '{') {
            if (recordBracketCount === 0) {
              currentRecord = char;
            } else {
              currentRecord += char;
            }
            recordBracketCount++;
          } else if (char === '}') {
            currentRecord += char;
            recordBracketCount--;
            
            if (recordBracketCount === 0 && currentRecord.trim()) {
              // Complete record found
              recordCount++;
              
              try {
                const recordObj = JSON.parse(currentRecord);
                const parsed = dataType === 'ndc' ? parseNdcData(recordObj) : parseLabelingData(recordObj);
                currentBatch.push(parsed);
                
                if (recordCount % 1000 === 0) {
                  colorLog(`    🔄 Processed ${recordCount} records so far...`, 'blue');
                }
              } catch (parseError) {
                errorCount++;
                if (errorCount <= 5) {
                  colorLog(`    ❌ Parse error for record ${recordCount}: ${parseError.message}`, 'red');
                }
              }
              
              // Process batch when it reaches the configured size
              if (currentBatch.length >= CONFIG.database.batchSize) {
                batchCount++;
                colorLog(`    💾 Processing batch ${batchCount} (${currentBatch.length} records, total processed: ${recordCount})...`, 'cyan');
                
                try {
                  await insertBatch(currentBatch, tableName, dataType);
                  processedCount += currentBatch.length;
                  colorLog(`    ✓ Batch ${batchCount} inserted successfully`, 'green');
                } catch (insertError) {
                  errorCount += currentBatch.length;
                  colorLog(`    ❌ Batch ${batchCount} insertion failed: ${insertError.message}`, 'red');
                }
                
                currentBatch = [];
                
                // Small delay to prevent overwhelming the database
                await new Promise(resolve => setTimeout(resolve, 50));
              }
              
              currentRecord = '';
            }
          } else if (recordBracketCount > 0) {
            currentRecord += char;
            
            if (char === '"' && !recordEscapeNext) {
              inRecordString = true;
            }
          } else if (char === ']') {
            // End of results array
            bufferPos = jsonBuffer.length; // Break out of character processing
            break;
          }
        } else {
          currentRecord += char;
          if (char === '"' && !recordEscapeNext) {
            inRecordString = false;
          }
        }
        
        recordEscapeNext = (char === '\\' && !recordEscapeNext);
        bufferPos++;
      }
      
      filePosition += bytesRead;
      
      // Keep some buffer for incomplete records at chunk boundaries
      if (currentRecord.length === 0 && recordBracketCount === 0) {
        jsonBuffer = ''; // Clear buffer if no active record
      } else {
        jsonBuffer = jsonBuffer.slice(Math.max(0, bufferPos - 1000)); // Keep last 1KB for safety
      }
    }
    
    fs.closeSync(fd);
    
    // Process any remaining records in the final batch
    if (currentBatch.length > 0) {
      batchCount++;
      colorLog(`    💾 Processing final batch ${batchCount} (${currentBatch.length} records)...`, 'cyan');
      
      try {
        await insertBatch(currentBatch, tableName, dataType);
        processedCount += currentBatch.length;
        colorLog(`    ✓ Final batch inserted successfully`, 'green');
      } catch (insertError) {
        errorCount += currentBatch.length;
        colorLog(`    ❌ Final batch insertion failed: ${insertError.message}`, 'red');
      }
    }
    
    const totalTime = Date.now() - startTime;
    
    colorLog(`\n    📈 Chunked Processing Complete:`, 'cyan');
    colorLog(`      • File: ${fileName}`, 'cyan');
    colorLog(`      • Records found: ${recordCount}`, 'cyan');
    colorLog(`      • Records processed: ${processedCount}`, 'cyan');
    colorLog(`      • Errors: ${errorCount}`, errorCount > 0 ? 'yellow' : 'cyan');
    colorLog(`      • Processing time: ${(totalTime / 1000).toFixed(2)}s`, 'cyan');
    colorLog(`      • Records per second: ${(processedCount / (totalTime / 1000)).toFixed(0)}`, 'cyan');
    
  } catch (error) {
    const totalTime = Date.now() - startTime;
    colorLog(`    ❌ Failed to process large file ${fileName}: ${error.message}`, 'red');
    colorLog(`    Processing time before failure: ${(totalTime / 1000).toFixed(2)}s`, 'red');
    throw error;
  }
}

/**
 * Insert batch of records into database
 */
async function insertBatch(records, tableName, dataType) {
  if (records.length === 0) return;
  
  if (dbConfig.type === 'mysql') {
    const columns = Object.keys(records[0]);
    const placeholders = '(' + columns.map(() => '?').join(', ') + ')';
    const values = [];
    
    for (const record of records) {
      const recordValues = columns.map(col => {
        const val = record[col];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
      });
      values.push(recordValues);
    }
    
    const sql = `INSERT IGNORE INTO ${tableName} (${columns.join(', ')}) VALUES ${Array(records.length).fill(placeholders).join(', ')}`;
    const flatValues = values.flat();
    
    await database.execute(sql, flatValues);
  } else {
    // PostgreSQL
    for (const record of records) {
      const columns = Object.keys(record);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(', ');
      const values = columns.map(col => {
        const val = record[col];
        return (typeof val === 'object' && val !== null) ? JSON.stringify(val) : val;
      });
      
      const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
      
      try {
        await database.query(sql, values);
      } catch (error) {
        // Skip duplicate entries
        if (!error.message.includes('duplicate key')) {
          throw error;
        }
      }
    }
  }
}

/**
 * Main menu
 */
async function showMainMenu() {
  while (true) {
    colorLog('\n' + '='.repeat(50), 'cyan');
    colorLog('Main Menu', 'bright');
    colorLog('='.repeat(50), 'cyan');
    colorLog('1. Download OpenFDA data files', 'reset');
    colorLog('2. Configure database connection', 'reset');
    colorLog('3. Process and populate database', 'reset');
    colorLog('4. View download status', 'reset');
    colorLog('5. Exit', 'reset');
    
    const choice = await askQuestion('\nSelect option (1-5): ');
    
    switch (choice) {
      case '1':
        await downloadMenu();
        break;
      case '2':
        await configureDatabaseConnection();
        if (await testDatabaseConnection()) {
          saveDatabaseConfig();
          colorLog('Database configuration saved!', 'green');
        } else {
          colorLog('Please fix database configuration before continuing.', 'yellow');
        }
        break;
      case '3':
        await processDataMenu();
        break;
      case '4':
        await viewDownloadStatus();
        break;
      case '5':
        colorLog('Goodbye!', 'green');
        process.exit(0);
        break;
      default:
        colorLog('Invalid option. Please try again.', 'red');
    }
  }
}

/**
 * Download menu
 */
async function downloadMenu() {
  const files = await getAvailableFiles();
  
  colorLog('\n' + '='.repeat(50), 'cyan');
  colorLog('Available OpenFDA Data Files', 'bright');
  colorLog('='.repeat(50), 'cyan');
  
  files.forEach((file, index) => {
    const sourceTag = file.source ? ` [${file.source}]` : '';
    const typeDisplay = file.type.replace('_', ' ').toUpperCase();
    colorLog(`${index + 1}. ${typeDisplay}${sourceTag} - ${file.filename} (${file.date})`, 'reset');
  });
  
  colorLog('\nDownload options:', 'yellow');
  colorLog('A. Download all NDC files', 'reset');
  colorLog('B. Download all OpenFDA labeling files', 'reset');
  colorLog('C. Download all DailyMed labeling files', 'reset');
  colorLog('D. Download specific file by number', 'reset');
  colorLog('E. Download all files', 'reset');
  colorLog('F. Back to main menu', 'reset');
  
  const choice = await askQuestion('\nSelect option: ');
  
  const downloadDir = path.join(__dirname, 'downloads');
  fs.mkdirSync(downloadDir, { recursive: true });
  
  let filesToDownload = [];
  
  switch (choice.toUpperCase()) {
    case 'A':
      filesToDownload = files.filter(f => f.type === 'ndc');
      break;
    case 'B':
      filesToDownload = files.filter(f => f.type === 'openfda_labeling');
      break;
    case 'C':
      filesToDownload = files.filter(f => f.type === 'dailymed_labeling');
      break;
    case 'D':
      const fileIndex = parseInt(await askQuestion('Enter file number: ')) - 1;
      if (fileIndex >= 0 && fileIndex < files.length) {
        filesToDownload = [files[fileIndex]];
      } else {
        colorLog('Invalid file number', 'red');
        return;
      }
      break;
    case 'E':
      filesToDownload = files;
      break;
    case 'F':
      return;
    default:
      colorLog('Invalid option', 'red');
      return;
  }
  
  // Download selected files
  for (const file of filesToDownload) {
    const outputPath = path.join(downloadDir, file.filename);
    
    try {
      colorLog(`\nStarting download: ${file.filename}`, 'blue');
      await downloadFile(file.url, outputPath);
      
      // Extract if it's a zip file
      if (path.extname(file.filename) === '.zip') {
        const extractDir = path.join(downloadDir, 'extracted', file.type);
        fs.mkdirSync(extractDir, { recursive: true });
        await extractZipFile(outputPath, extractDir);
        
        // Save extraction info
        const infoFile = path.join(extractDir, 'download_info.json');
        fs.writeFileSync(infoFile, JSON.stringify({
          filename: file.filename,
          downloadDate: new Date().toISOString(),
          originalUrl: file.url,
          extractPath: extractDir,
          type: file.type,
          source: 'OpenFDA ZIP Download',
          endpoint: file.endpoint || 'manual'
        }, null, 2));
        
        colorLog(`✓ ZIP file extracted to ${extractDir}`, 'green');
      }
      
    } catch (error) {
      colorLog(`Failed to download ${file.filename}: ${error.message}`, 'red');
      
      // Try with curl as fallback
      try {
        colorLog('Trying alternative download method...', 'yellow');
        require('child_process').execSync(`curl -L "${file.url}" -o "${outputPath}"`, { stdio: 'inherit' });
        colorLog('✓ Alternative download successful', 'green');
      } catch (curlError) {
        colorLog(`Alternative download also failed: ${curlError.message}`, 'red');
      }
    }
  }
}

/**
 * Process data menu
 */
async function processDataMenu() {
  colorLog('='.repeat(60), 'cyan');
  colorLog('Starting Database Population Process', 'bright');
  colorLog('='.repeat(60), 'cyan');
  
  // Check if we have database config but no active connection
  if (!database && dbConfig.type) {
    colorLog('🔧 Database config found but no active connection. Establishing connection...', 'yellow');
    
    // Prompt for password if not set
    if (!dbConfig.password || dbConfig.password === '***HIDDEN***' || dbConfig.password.length === 0) {
      // Check if stdin is a TTY (interactive terminal)
      if (!process.stdin.isTTY) {
        colorLog('❌ Password required but running in non-interactive mode.', 'red');
        colorLog('   Please run the database connection test first:', 'yellow');
        colorLog('   node test-db-connection.js', 'cyan');
        process.exit(1);
      }
      
      colorLog('Please enter the database password:', 'blue');
      await new Promise((resolve) => {
        process.stdout.write('Password: ');
        
        // Remove any existing listeners to prevent conflicts
        process.stdin.removeAllListeners('data');
        
        process.stdin.setRawMode(true);
        process.stdin.setEncoding('utf8');
        
        let password = '';
        
        const handleInput = (char) => {
          if (char === '\n' || char === '\r' || char === '\u0004') {
            // Enter pressed - finish input
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', handleInput);
            process.stdin.pause();
            process.stdout.write('\n');
            dbConfig.password = password;
            resolve();
          } else if (char === '\u0008' || char === '\u007f') {
            // Backspace pressed
            if (password.length > 0) {
              password = password.slice(0, -1);
              process.stdout.write('\u0008 \u0008');
            }
          } else if (char === '\u0003') {
            // Ctrl+C pressed
            process.stdin.setRawMode(false);
            process.stdin.removeListener('data', handleInput);
            process.stdout.write('\n');
            process.exit(1);
          } else if (char >= ' ' && char <= '~') {
            // Printable character
            password += char;
            process.stdout.write('*');
          }
          // Ignore non-printable characters
        };
        
        process.stdin.on('data', handleInput);
      });
    }
    
    // Attempt to connect
    const connected = await testDatabaseConnection();
    if (!connected) {
      colorLog('❌ Could not establish database connection. Please use option 2 to configure.', 'red');
      return;
    }
  } else if (!database) {
    colorLog('❌ No database connection or configuration found. Please use option 2 first.', 'red');
    return;
  }
  
  colorLog(`✓ Database connection verified: ${dbConfig.type}://${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`, 'green');
  
  colorLog('🚀 CHECKPOINT 1: Database connection verified, proceeding with file checks...', 'magenta');
  
  const downloadDir = path.join(__dirname, 'downloads', 'extracted');
  colorLog(`Checking extracted data directory: ${downloadDir}`, 'blue');
  
  if (!fs.existsSync(downloadDir)) {
    colorLog('No extracted data found. Please download files first (option 1)', 'red');
    return;
  }
  
  colorLog('✓ Extracted data directory found', 'green');
  
  try {
    colorLog('🚀 CHECKPOINT 2: Starting table creation process...', 'magenta');
    colorLog('\n📋 STEP 1: Creating Database Tables', 'cyan');
    
    const tables = await createTempTables();
    
    colorLog('🚀 CHECKPOINT 3: Tables created, scanning directories...', 'magenta');
    colorLog('✓ Database tables ready', 'green');
    
    // Scan for available data types
    const availableTypes = fs.readdirSync(downloadDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);
    
    colorLog(`\n📁 Available data types: ${availableTypes.join(', ')}`, 'yellow');
    
    // Process NDC files
    colorLog('\n📋 STEP 2: Processing NDC Data', 'cyan');
    const ndcDir = path.join(downloadDir, 'ndc');
    if (fs.existsSync(ndcDir)) {
      const ndcFiles = fs.readdirSync(ndcDir).filter(f => f.endsWith('.json'));
      colorLog(`Found ${ndcFiles.length} NDC files to process`, 'blue');
      
      for (let i = 0; i < ndcFiles.length; i++) {
        const file = ndcFiles[i];
        colorLog(`\n  Processing NDC file ${i + 1}/${ndcFiles.length}: ${file}`, 'yellow');
        const filePath = path.join(ndcDir, file);
        const fileStats = fs.statSync(filePath);
        colorLog(`  File size: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`, 'cyan');
        
        await processJsonFile(filePath, 'ndc', tables.ndcTableName);
        colorLog(`  ✓ Completed processing ${file}`, 'green');
      }
    } else {
      colorLog('No NDC directory found, skipping NDC processing', 'yellow');
    }
    
    // Process Labeling files
    colorLog('\n📋 STEP 3: Processing Labeling Data', 'cyan');
    const labelingDirs = [
      { path: path.join(downloadDir, 'labeling'), name: 'labeling' },
      { path: path.join(downloadDir, 'openfda_labeling'), name: 'OpenFDA labeling' },
      { path: path.join(downloadDir, 'dailymed_labeling'), name: 'DailyMed labeling' }
    ];
    
    let totalLabelingFiles = 0;
    
    for (const labelingDirInfo of labelingDirs) {
      if (fs.existsSync(labelingDirInfo.path)) {
        const labelingFiles = fs.readdirSync(labelingDirInfo.path).filter(f => f.endsWith('.json'));
        if (labelingFiles.length > 0) {
          colorLog(`\n  Found ${labelingFiles.length} ${labelingDirInfo.name} files`, 'blue');
          totalLabelingFiles += labelingFiles.length;
          
          for (let i = 0; i < labelingFiles.length; i++) {
            const file = labelingFiles[i];
            colorLog(`\n  Processing ${labelingDirInfo.name} file ${i + 1}/${labelingFiles.length}: ${file}`, 'yellow');
            const filePath = path.join(labelingDirInfo.path, file);
            const fileStats = fs.statSync(filePath);
            colorLog(`  File size: ${(fileStats.size / 1024 / 1024).toFixed(2)}MB`, 'cyan');
            
            await processJsonFile(filePath, 'labeling', tables.labelingTableName);
            colorLog(`  ✓ Completed processing ${file}`, 'green');
          }
        }
      }
    }
    
    if (totalLabelingFiles === 0) {
      colorLog('No labeling directories found, skipping labeling processing', 'yellow');
    }
    
    // Show summary
    colorLog('\n' + '='.repeat(50), 'green');
    colorLog('Processing Complete!', 'bright');
    colorLog('='.repeat(50), 'green');
    
    // Get record counts
    if (dbConfig.type === 'mysql') {
      const [ndcCount] = await database.execute(`SELECT COUNT(*) as count FROM ${tables.ndcTableName}`);
      const [labelingCount] = await database.execute(`SELECT COUNT(*) as count FROM ${tables.labelingTableName}`);
      colorLog(`NDC Records: ${ndcCount[0].count}`, 'cyan');
      colorLog(`Labeling Records: ${labelingCount[0].count}`, 'cyan');
    } else {
      const ndcResult = await database.query(`SELECT COUNT(*) as count FROM ${tables.ndcTableName}`);
      const labelingResult = await database.query(`SELECT COUNT(*) as count FROM ${tables.labelingTableName}`);
      colorLog(`NDC Records: ${ndcResult.rows[0].count}`, 'cyan');
      colorLog(`Labeling Records: ${labelingResult.rows[0].count}`, 'cyan');
    }
    
    colorLog(`\nTemporary tables created:`, 'yellow');
    colorLog(`- ${tables.ndcTableName}`, 'reset');
    colorLog(`- ${tables.labelingTableName}`, 'reset');
    colorLog(`\nYou can now query these tables or migrate data to production tables.`, 'green');
    
  } catch (error) {
    colorLog(`Processing failed: ${error.message}`, 'red');
    console.error(error.stack);
  }
}

/**
 * View download status
 */
async function viewDownloadStatus() {
  const downloadDir = path.join(__dirname, 'downloads');
  
  if (!fs.existsSync(downloadDir)) {
    colorLog('No downloads found', 'yellow');
    return;
  }
  
  colorLog('\n' + '='.repeat(50), 'cyan');
  colorLog('Download Status', 'bright');
  colorLog('='.repeat(50), 'cyan');
  
  // Check for ZIP files
  const zipFiles = fs.readdirSync(downloadDir).filter(f => f.endsWith('.zip'));
  colorLog(`\nDownloaded ZIP files: ${zipFiles.length}`, 'blue');
  zipFiles.forEach(file => {
    const stats = fs.statSync(path.join(downloadDir, file));
    colorLog(`  ${file} (${(stats.size / 1024 / 1024).toFixed(1)}MB)`, 'reset');
  });
  
  // Check for extracted files
  const extractedDir = path.join(downloadDir, 'extracted');
  if (fs.existsSync(extractedDir)) {
    const types = fs.readdirSync(extractedDir);
    colorLog(`\nExtracted data types: ${types.length}`, 'blue');
    
    types.forEach(type => {
      const typeDir = path.join(extractedDir, type);
      if (fs.statSync(typeDir).isDirectory()) {
        const files = fs.readdirSync(typeDir).filter(f => f.endsWith('.json'));
        colorLog(`  ${type.toUpperCase()}: ${files.length} JSON files`, 'reset');
      }
    });
  }
}

/**
 * Cleanup function
 */
async function cleanup() {
  try {
    if (database) {
      if (dbConfig.type === 'mysql') {
        await database.end();
      } else {
        await database.end();
      }
    }
    if (rl) {
      rl.close();
    }
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Main function
 */
async function main() {
  try {
    initReadline();
    displayBanner();
    
    await installDependencies();
    await loadFdaService();
    
    // Try to load saved database configuration
    if (loadDatabaseConfig()) {
      colorLog('💡 Tip: Your database configuration is loaded. You can skip to option 3 if connection works.', 'yellow');
    }
    
    // Handle cleanup on exit
    process.on('SIGINT', async () => {
      colorLog('\n\nCleaning up...', 'yellow');
      await cleanup();
      process.exit(0);
    });
    
    process.on('exit', cleanup);
    
    await showMainMenu();
    
  } catch (error) {
    colorLog(`Fatal error: ${error.message}`, 'red');
    console.error(error.stack);
    process.exit(1);
  } finally {
    await cleanup();
  }
}

// Run the script if called directly
if (require.main === module) {
  main();
}

module.exports = {
  main,
  downloadFile,
  extractZipFile,
  parseNdcData,
  parseLabelingData
};