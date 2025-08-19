#!/usr/bin/env node

/**
 * Error Repair Logger
 * 
 * Automatically documents successful error fixes in the HTML repair log.
 * This script can be called by Claude or developers to maintain a comprehensive
 * record of all successful bug fixes and code improvements.
 * 
 * Usage:
 *   node scripts/log-error-repair.js --title "Fix Description" --file "path/to/file.js" --severity "critical"
 * 
 * @author PharmaTraK Development Team
 */

const fs = require('fs');
const path = require('path');

// Default paths
const LOG_FILE_PATH = path.join(__dirname, '../docs/error-repairs-log.html');
const TEMPLATE_PATH = path.join(__dirname, '../docs/error-repair-template.html');

/**
 * Generate HTML for a new repair entry
 */
function generateRepairEntry({
  title,
  description,
  files,
  severity = 'medium',
  rootCause,
  codeBlocks = [],
  testResults,
  impact,
  tags = [],
  timeToFix = 'Unknown'
}) {
  const severityClass = `severity-${severity.toLowerCase()}`;
  const date = new Date().toISOString().split('T')[0];
  const currentTime = new Date().toLocaleTimeString();
  
  const codeComparisons = codeBlocks.map(block => `
    <h4>${block.title}</h4>
    <div class="code-comparison">
      <div class="code-block code-before">
        <div class="code-header">❌ Before (${block.beforeLabel || 'Broken'})</div>
        <pre><code>${escapeHtml(block.before)}</code></pre>
      </div>
      
      <div class="code-block code-after">
        <div class="code-header">✅ After (${block.afterLabel || 'Working'})</div>
        <pre><code>${escapeHtml(block.after)}</code></pre>
      </div>
    </div>
  `).join('\n');
  
  const tagElements = tags.map(tag => `<span class="tag">${tag}</span>`).join('\n                ');
  
  return `
    <!-- REPAIR ENTRY: ${title} -->
    <div class="repair-entry">
        <div class="repair-header">
            <div class="repair-title">🎯 Fix: ${title}</div>
            <div class="repair-meta">
                <span>📅 <strong>Date:</strong> ${date}</span>
                <span>📂 <strong>File(s):</strong> ${files.join(', ')}</span>
                <span>⏱️ <strong>Time to Fix:</strong> ${timeToFix}</span>
                <span class="severity ${severityClass}">${severity.toUpperCase()}</span>
            </div>
        </div>
        
        <div class="repair-content">
            <div class="section">
                <h3>🐛 Problem Description</h3>
                <p>${description}</p>
            </div>

            ${rootCause ? `
            <div class="section">
                <h3>🔍 Root Cause Analysis</h3>
                ${Array.isArray(rootCause) ? `
                <ul>
                    ${rootCause.map(cause => `<li>${cause}</li>`).join('\n                    ')}
                </ul>
                ` : `<p>${rootCause}</p>`}
            </div>
            ` : ''}

            ${codeBlocks.length > 0 ? `
            <div class="section">
                <h3>🔧 Code Fix</h3>
                ${codeComparisons}
            </div>
            ` : ''}

            ${testResults || impact ? `
            <div class="section">
                <h3>📊 ${testResults ? 'Test Results' : 'Impact'}</h3>
                <div class="impact">
                    <div class="impact-title">✅ ${testResults ? 'Success Metrics' : 'Improvements Achieved'}</div>
                    ${testResults || impact}
                </div>
            </div>
            ` : ''}

            ${tags.length > 0 ? `
            <div class="tags">
                ${tagElements}
            </div>
            ` : ''}
        </div>
    </div>
  `;
}

/**
 * Escape HTML characters
 */
function escapeHtml(text) {
  const div = { innerHTML: text };
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Update statistics in the HTML file
 */
function updateStatistics(htmlContent) {
  const repairCount = (htmlContent.match(/repair-entry/g) || []).length;
  const criticalCount = (htmlContent.match(/severity-critical/g) || []).length;
  
  return htmlContent
    .replace(/(<div class="stat-number" id="totalRepairs">)\d+(<\/div>)/, `$1${repairCount}$2`)
    .replace(/(<div class="stat-number" id="criticalFixes">)\d+(<\/div>)/, `$1${criticalCount}$2`)
    .replace(/(<span id="lastUpdated">)[^<]*(<\/span>)/, `$1${new Date().toISOString().split('T')[0]}$2`);
}

/**
 * Add new repair entry to the log
 */
function addRepairEntry(repairData) {
  try {
    // Read current log file
    let htmlContent = fs.readFileSync(LOG_FILE_PATH, 'utf8');
    
    // Generate new entry HTML
    const newEntry = generateRepairEntry(repairData);
    
    // Find insertion point (after stats, before first repair entry or before closing body)
    const insertionPoint = htmlContent.indexOf('<div class="repair-entry">');
    
    if (insertionPoint !== -1) {
      // Insert before first repair entry
      htmlContent = htmlContent.slice(0, insertionPoint) + newEntry + '\n\n    ' + htmlContent.slice(insertionPoint);
    } else {
      // Insert before closing body tag
      const bodyCloseIndex = htmlContent.lastIndexOf('</body>');
      htmlContent = htmlContent.slice(0, bodyCloseIndex) + newEntry + '\n\n' + htmlContent.slice(bodyCloseIndex);
    }
    
    // Update statistics
    htmlContent = updateStatistics(htmlContent);
    
    // Write updated content back to file
    fs.writeFileSync(LOG_FILE_PATH, htmlContent, 'utf8');
    
    console.log('✅ Successfully added repair entry to log');
    console.log(`📁 Log file updated: ${LOG_FILE_PATH}`);
    
  } catch (error) {
    console.error('❌ Failed to add repair entry:', error.message);
    process.exit(1);
  }
}

/**
 * Parse command line arguments
 */
function parseArgs() {
  const args = process.argv.slice(2);
  const parsed = {};
  
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      const key = args[i].substring(2);
      const value = args[i + 1];
      
      if (key === 'files' || key === 'tags' || key === 'rootCause') {
        parsed[key] = value ? value.split(',').map(s => s.trim()) : [];
      } else {
        parsed[key] = value;
      }
      
      i++; // Skip next arg since it's the value
    }
  }
  
  return parsed;
}

/**
 * Interactive mode for easier entry
 */
function interactiveMode() {
  const readline = require('readline');
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
  
  console.log('\n🔧 Error Repair Logger - Interactive Mode\n');
  
  const questions = [
    'Title (brief description): ',
    'Files affected (comma-separated): ',
    'Severity (critical/high/medium/low): ',
    'Problem description: ',
    'Time to fix (e.g., "~30 minutes"): ',
    'Tags (comma-separated): '
  ];
  
  let answers = {};
  let currentQuestion = 0;
  
  function askQuestion() {
    if (currentQuestion >= questions.length) {
      rl.close();
      processAnswers(answers);
      return;
    }
    
    rl.question(questions[currentQuestion], (answer) => {
      const keys = ['title', 'files', 'severity', 'description', 'timeToFix', 'tags'];
      answers[keys[currentQuestion]] = answer;
      currentQuestion++;
      askQuestion();
    });
  }
  
  function processAnswers(answers) {
    const repairData = {
      title: answers.title,
      files: answers.files.split(',').map(s => s.trim()),
      severity: answers.severity || 'medium',
      description: answers.description,
      timeToFix: answers.timeToFix || 'Unknown',
      tags: answers.tags ? answers.tags.split(',').map(s => s.trim()) : []
    };
    
    addRepairEntry(repairData);
  }
  
  askQuestion();
}

// Main execution
if (require.main === module) {
  const args = parseArgs();
  
  if (Object.keys(args).length === 0) {
    // No args provided, start interactive mode
    interactiveMode();
  } else if (args.title && args.description) {
    // Required fields provided
    const repairData = {
      title: args.title,
      description: args.description,
      files: args.files || ['Multiple files'],
      severity: args.severity || 'medium',
      rootCause: args.rootCause,
      timeToFix: args.timeToFix || 'Unknown',
      tags: args.tags || []
    };
    
    addRepairEntry(repairData);
  } else {
    console.log(`
Usage: 
  node scripts/log-error-repair.js [--title "Fix Title"] [--description "Problem description"]
  
  or run without arguments for interactive mode

Arguments:
  --title         Brief description of the fix
  --description   Detailed problem description  
  --files         Comma-separated list of files changed
  --severity      critical|high|medium|low (default: medium)
  --timeToFix     How long it took to fix (e.g., "~30 minutes")
  --tags          Comma-separated tags
  --rootCause     Comma-separated root causes
`);
    process.exit(1);
  }
}

module.exports = { addRepairEntry, generateRepairEntry };