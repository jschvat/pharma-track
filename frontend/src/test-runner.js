#!/usr/bin/env node

/**
 * Comprehensive Frontend Test Runner
 * 
 * This script runs all frontend tests and generates detailed reports
 * about button functionality, form validation, API error handling,
 * accessibility, and overall component health.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// ANSI color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m'
};

class ComprehensiveTestRunner {
  constructor() {
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        totalTests: 0,
        passedTests: 0,
        failedTests: 0,
        skippedTests: 0,
        coverage: {
          statements: 0,
          branches: 0,
          functions: 0,
          lines: 0
        }
      },
      components: {},
      categories: {
        buttons: { passed: 0, failed: 0, total: 0 },
        forms: { passed: 0, failed: 0, total: 0 },
        apiCalls: { passed: 0, failed: 0, total: 0 },
        accessibility: { passed: 0, failed: 0, total: 0 },
        navigation: { passed: 0, failed: 0, total: 0 },
        errorHandling: { passed: 0, failed: 0, total: 0 }
      },
      performance: {
        slowTests: [],
        memoryUsage: process.memoryUsage(),
        executionTime: 0
      },
      recommendations: []
    };

    this.testStartTime = Date.now();
  }

  log(message, color = 'white') {
    console.log(`${colors[color]}${message}${colors.reset}`);
  }

  logHeader(message) {
    const border = '='.repeat(message.length + 4);
    this.log(border, 'cyan');
    this.log(`  ${message}  `, 'cyan');
    this.log(border, 'cyan');
    console.log();
  }

  logSubHeader(message) {
    this.log(`\n🔍 ${message}`, 'yellow');
    this.log('-'.repeat(message.length + 4), 'dim');
  }

  async runTestSuite() {
    this.logHeader('PharmaTraK Frontend Comprehensive Test Suite');

    try {
      // Run different test categories
      await this.runBasicTests();
      await this.runComprehensiveTests();
      await this.runPerformanceTests();
      await this.runAccessibilityTests();
      await this.generateCoverageReport();
      await this.analyzeResults();
      await this.generateRecommendations();
      
      this.displayResults();
      await this.saveResults();

    } catch (error) {
      this.log(`❌ Test suite failed: ${error.message}`, 'red');
      process.exit(1);
    }
  }

  async runBasicTests() {
    this.logSubHeader('Running Basic Component Tests');

    const testFiles = [
      '__tests__/Login.test.js',
      '__tests__/Dashboard.test.js', 
      '__tests__/Inventory.test.js',
      '__tests__/UserManagement.test.js',
      '__tests__/NDCAuditReport.test.js'
    ];

    for (const testFile of testFiles) {
      try {
        this.log(`  ▶ Running ${testFile}...`, 'blue');
        
        const startTime = Date.now();
        const result = execSync(`npm test -- --testPathPattern="${testFile}" --verbose --json`, {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe'
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const testResults = JSON.parse(result);
        this.processTestResults(testFile, testResults, duration);
        
        this.log(`  ✅ ${testFile} completed (${duration}ms)`, 'green');
        
      } catch (error) {
        this.log(`  ❌ ${testFile} failed: ${error.message}`, 'red');
        this.results.components[testFile] = { status: 'failed', error: error.message };
      }
    }
  }

  async runComprehensiveTests() {
    this.logSubHeader('Running Comprehensive Feature Tests');

    const comprehensiveTests = [
      '__tests__/Login.comprehensive.test.js',
      '__tests__/Dashboard.comprehensive.test.js',
      '__tests__/UserManagement.comprehensive.test.js'
    ];

    for (const testFile of comprehensiveTests) {
      try {
        this.log(`  ▶ Running comprehensive tests: ${testFile}...`, 'blue');
        
        const startTime = Date.now();
        const result = execSync(`npm test -- --testPathPattern="${testFile}" --verbose --json`, {
          cwd: process.cwd(),
          encoding: 'utf8',
          stdio: 'pipe',
          timeout: 60000 // Extended timeout for comprehensive tests
        });
        
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        const testResults = JSON.parse(result);
        this.processTestResults(testFile, testResults, duration);
        
        this.log(`  ✅ ${testFile} completed (${duration}ms)`, 'green');
        
        if (duration > 10000) {
          this.results.performance.slowTests.push({ test: testFile, duration });
        }
        
      } catch (error) {
        this.log(`  ❌ ${testFile} failed: ${error.message}`, 'red');
        this.results.components[testFile] = { status: 'failed', error: error.message };
      }
    }
  }

  async runPerformanceTests() {
    this.logSubHeader('Running Performance Tests');

    try {
      // Measure bundle size
      const bundleStatsPath = path.join(process.cwd(), 'build/static/js');
      if (fs.existsSync(bundleStatsPath)) {
        const files = fs.readdirSync(bundleStatsPath);
        const jsFiles = files.filter(f => f.endsWith('.js'));
        
        let totalSize = 0;
        jsFiles.forEach(file => {
          const filePath = path.join(bundleStatsPath, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });
        
        this.results.performance.bundleSize = Math.round(totalSize / 1024); // KB
        this.log(`  📦 Bundle size: ${this.results.performance.bundleSize}KB`, 'cyan');
      }

      // Memory usage
      const memUsage = process.memoryUsage();
      this.results.performance.memoryUsage = {
        heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024), // MB
        heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
        external: Math.round(memUsage.external / 1024 / 1024)
      };
      
      this.log(`  💾 Memory usage: ${this.results.performance.memoryUsage.heapUsed}MB`, 'cyan');

    } catch (error) {
      this.log(`  ⚠️  Performance tests failed: ${error.message}`, 'yellow');
    }
  }

  async runAccessibilityTests() {
    this.logSubHeader('Running Accessibility Tests');

    try {
      // This would run axe-core tests if configured
      this.log('  ♿ Accessibility tests would run here with axe-core', 'magenta');
      this.log('  📋 Manual accessibility checklist:', 'dim');
      this.log('      • Keyboard navigation', 'dim');
      this.log('      • Screen reader compatibility', 'dim');
      this.log('      • Color contrast compliance', 'dim');
      this.log('      • ARIA attributes', 'dim');
      this.log('      • Form labels and validation', 'dim');
      
    } catch (error) {
      this.log(`  ⚠️  Accessibility tests failed: ${error.message}`, 'yellow');
    }
  }

  async generateCoverageReport() {
    this.logSubHeader('Generating Code Coverage Report');

    try {
      const result = execSync('npm test -- --coverage --watchAll=false', {
        cwd: process.cwd(),
        encoding: 'utf8',
        stdio: 'pipe'
      });

      // Parse coverage from output
      const coverageMatch = result.match(/All files[|\s]+(\d+(?:\.\d+)?)[|\s]+(\d+(?:\.\d+)?)[|\s]+(\d+(?:\.\d+)?)[|\s]+(\d+(?:\.\d+)?)/);
      if (coverageMatch) {
        this.results.summary.coverage = {
          statements: parseFloat(coverageMatch[1]),
          branches: parseFloat(coverageMatch[2]),
          functions: parseFloat(coverageMatch[3]),
          lines: parseFloat(coverageMatch[4])
        };
        
        this.log(`  📊 Coverage - Statements: ${coverageMatch[1]}%, Branches: ${coverageMatch[2]}%, Functions: ${coverageMatch[3]}%, Lines: ${coverageMatch[4]}%`, 'cyan');
      }

    } catch (error) {
      this.log(`  ⚠️  Coverage report failed: ${error.message}`, 'yellow');
    }
  }

  processTestResults(testFile, testResults, duration) {
    const componentName = testFile.replace('.test.js', '').replace('__tests__/', '');
    
    if (testResults.testResults && testResults.testResults[0]) {
      const result = testResults.testResults[0];
      
      this.results.components[componentName] = {
        status: result.status,
        numPassingTests: result.numPassingTests,
        numFailingTests: result.numFailingTests,
        numPendingTests: result.numPendingTests,
        duration: duration,
        coverage: result.coverage || null
      };

      this.results.summary.totalTests += result.numPassingTests + result.numFailingTests + result.numPendingTests;
      this.results.summary.passedTests += result.numPassingTests;
      this.results.summary.failedTests += result.numFailingTests;
      this.results.summary.skippedTests += result.numPendingTests;
    }
  }

  analyzeResults() {
    this.logSubHeader('Analyzing Test Results');

    // Calculate overall health score
    const totalTests = this.results.summary.totalTests;
    const passedTests = this.results.summary.passedTests;
    const healthScore = totalTests > 0 ? Math.round((passedTests / totalTests) * 100) : 0;
    
    this.results.summary.healthScore = healthScore;
    
    // Analyze by category
    Object.keys(this.results.components).forEach(component => {
      const result = this.results.components[component];
      if (result.status === 'passed') {
        // Categorize tests based on component name and test patterns
        if (component.includes('Login') || component.includes('Auth')) {
          this.results.categories.forms.passed += result.numPassingTests || 0;
          this.results.categories.forms.total += result.numPassingTests + result.numFailingTests || 0;
        }
        if (component.includes('Button') || component.includes('comprehensive')) {
          this.results.categories.buttons.passed += result.numPassingTests || 0;
          this.results.categories.buttons.total += result.numPassingTests + result.numFailingTests || 0;
        }
      }
    });

    this.log(`  🎯 Overall Health Score: ${healthScore}%`, healthScore > 80 ? 'green' : healthScore > 60 ? 'yellow' : 'red');
    this.log(`  📈 Tests: ${passedTests}/${totalTests} passed`, 'cyan');
  }

  generateRecommendations() {
    this.logSubHeader('Generating Recommendations');

    const healthScore = this.results.summary.healthScore;
    const coverage = this.results.summary.coverage;
    
    // Coverage recommendations
    if (coverage.statements < 80) {
      this.results.recommendations.push({
        type: 'coverage',
        priority: 'high',
        message: `Statement coverage is ${coverage.statements}%. Aim for 80%+ coverage.`
      });
    }
    
    if (coverage.branches < 70) {
      this.results.recommendations.push({
        type: 'coverage',
        priority: 'medium',
        message: `Branch coverage is ${coverage.branches}%. Add more edge case testing.`
      });
    }

    // Performance recommendations
    if (this.results.performance.slowTests.length > 0) {
      this.results.recommendations.push({
        type: 'performance',
        priority: 'medium',
        message: `${this.results.performance.slowTests.length} tests are running slowly. Consider optimization.`
      });
    }

    // Health score recommendations
    if (healthScore < 90) {
      this.results.recommendations.push({
        type: 'quality',
        priority: 'high',
        message: `Test pass rate is ${healthScore}%. Fix failing tests to improve reliability.`
      });
    }

    // General recommendations
    this.results.recommendations.push({
      type: 'enhancement',
      priority: 'low',
      message: 'Consider adding visual regression tests for UI components.'
    });

    this.results.recommendations.push({
      type: 'enhancement', 
      priority: 'low',
      message: 'Add end-to-end tests for critical user workflows.'
    });

    // Display recommendations
    this.results.recommendations.forEach(rec => {
      const priority = rec.priority === 'high' ? 'red' : rec.priority === 'medium' ? 'yellow' : 'dim';
      this.log(`  💡 [${rec.priority.toUpperCase()}] ${rec.message}`, priority);
    });
  }

  displayResults() {
    this.results.performance.executionTime = Date.now() - this.testStartTime;
    
    this.logHeader('Test Results Summary');
    
    const summary = this.results.summary;
    this.log(`🎯 Health Score: ${summary.healthScore}%`, summary.healthScore > 80 ? 'green' : 'yellow');
    this.log(`📊 Total Tests: ${summary.totalTests}`);
    this.log(`✅ Passed: ${summary.passedTests}`, 'green'); 
    this.log(`❌ Failed: ${summary.failedTests}`, summary.failedTests > 0 ? 'red' : 'dim');
    this.log(`⏭️  Skipped: ${summary.skippedTests}`, 'dim');
    
    console.log();
    this.log('📈 Code Coverage:', 'cyan');
    this.log(`  Statements: ${summary.coverage.statements}%`);
    this.log(`  Branches: ${summary.coverage.branches}%`);
    this.log(`  Functions: ${summary.coverage.functions}%`);
    this.log(`  Lines: ${summary.coverage.lines}%`);

    console.log();
    this.log('⚡ Performance:', 'magenta');
    this.log(`  Execution Time: ${Math.round(this.results.performance.executionTime / 1000)}s`);
    this.log(`  Memory Usage: ${this.results.performance.memoryUsage.heapUsed}MB`);
    if (this.results.performance.bundleSize) {
      this.log(`  Bundle Size: ${this.results.performance.bundleSize}KB`);
    }

    console.log();
    this.log('📋 Component Status:', 'blue');
    Object.entries(this.results.components).forEach(([component, result]) => {
      const status = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⏭️';
      this.log(`  ${status} ${component}: ${result.numPassingTests || 0} passed, ${result.numFailingTests || 0} failed`);
    });
  }

  async saveResults() {
    this.logSubHeader('Saving Test Results');

    const resultsPath = path.join(process.cwd(), 'test-results.json');
    const htmlReportPath = path.join(process.cwd(), 'test-report.html');
    
    try {
      // Save JSON results
      fs.writeFileSync(resultsPath, JSON.stringify(this.results, null, 2));
      this.log(`  💾 Results saved to: ${resultsPath}`, 'green');

      // Generate HTML report
      const htmlReport = this.generateHTMLReport();
      fs.writeFileSync(htmlReportPath, htmlReport);
      this.log(`  📄 HTML report saved to: ${htmlReportPath}`, 'green');

    } catch (error) {
      this.log(`  ❌ Failed to save results: ${error.message}`, 'red');
    }
  }

  generateHTMLReport() {
    const summary = this.results.summary;
    const timestamp = new Date(this.results.timestamp).toLocaleString();

    return `
<!DOCTYPE html>
<html>
<head>
    <title>PharmaTraK Frontend Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
        .header { text-align: center; color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 20px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .card { background: #ecf0f1; padding: 15px; border-radius: 5px; text-align: center; }
        .card.success { background: #d5f4e6; }
        .card.warning { background: #fef9e7; }
        .card.error { background: #fadbd8; }
        .score { font-size: 2em; font-weight: bold; color: #2c3e50; }
        .recommendations { background: #e8f6f3; padding: 15px; border-radius: 5px; margin: 20px 0; }
        .recommendation { margin: 10px 0; padding: 8px; border-left: 4px solid #3498db; }
        .high { border-left-color: #e74c3c; }
        .medium { border-left-color: #f39c12; }
        .low { border-left-color: #95a5a6; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 10px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #3498db; color: white; }
        .passed { color: #27ae60; }
        .failed { color: #e74c3c; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>PharmaTraK Frontend Test Report</h1>
            <p>Generated: ${timestamp}</p>
        </div>
        
        <div class="summary">
            <div class="card ${summary.healthScore > 80 ? 'success' : summary.healthScore > 60 ? 'warning' : 'error'}">
                <h3>Health Score</h3>
                <div class="score">${summary.healthScore}%</div>
            </div>
            <div class="card">
                <h3>Total Tests</h3>
                <div class="score">${summary.totalTests}</div>
            </div>
            <div class="card success">
                <h3>Passed</h3>
                <div class="score">${summary.passedTests}</div>
            </div>
            <div class="card ${summary.failedTests > 0 ? 'error' : ''}">
                <h3>Failed</h3>
                <div class="score">${summary.failedTests}</div>
            </div>
        </div>

        <h2>Code Coverage</h2>
        <table>
            <tr><th>Metric</th><th>Percentage</th></tr>
            <tr><td>Statements</td><td>${summary.coverage.statements}%</td></tr>
            <tr><td>Branches</td><td>${summary.coverage.branches}%</td></tr>
            <tr><td>Functions</td><td>${summary.coverage.functions}%</td></tr>
            <tr><td>Lines</td><td>${summary.coverage.lines}%</td></tr>
        </table>

        <h2>Component Results</h2>
        <table>
            <tr><th>Component</th><th>Status</th><th>Passed</th><th>Failed</th><th>Duration</th></tr>
            ${Object.entries(this.results.components).map(([name, result]) => `
                <tr>
                    <td>${name}</td>
                    <td class="${result.status}">${result.status}</td>
                    <td class="passed">${result.numPassingTests || 0}</td>
                    <td class="failed">${result.numFailingTests || 0}</td>
                    <td>${result.duration ? Math.round(result.duration) + 'ms' : 'N/A'}</td>
                </tr>
            `).join('')}
        </table>

        <div class="recommendations">
            <h2>Recommendations</h2>
            ${this.results.recommendations.map(rec => `
                <div class="recommendation ${rec.priority}">
                    <strong>[${rec.priority.toUpperCase()}]</strong> ${rec.message}
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
  }
}

// Run the comprehensive test suite
if (require.main === module) {
  const runner = new ComprehensiveTestRunner();
  runner.runTestSuite().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = ComprehensiveTestRunner;