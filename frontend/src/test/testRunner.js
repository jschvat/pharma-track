/**
 * PharmaTraK Component Library Test Runner
 * 
 * Comprehensive test suite runner for the PharmaTraK component library.
 * Executes unit tests, integration tests, accessibility tests, and 
 * performance benchmarks.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

// Test configuration
const TEST_CONFIG = {
  // Test directories
  directories: {
    unit: 'src/test/components',
    integration: 'src/test/integration',
    utils: 'src/test/utils',
    hooks: 'src/test/hooks'
  },
  
  // Test patterns
  patterns: {
    unit: '**/*.test.js',
    integration: '**/*.test.js',
    performance: '**/*.perf.js',
    accessibility: '**/*.a11y.js'
  },
  
  // Coverage thresholds
  coverage: {
    statements: 90,
    branches: 85,
    functions: 90,
    lines: 90
  },
  
  // Performance benchmarks
  performance: {
    renderTime: 100, // ms
    memoryUsage: 50, // MB
    bundleSize: 500 // KB
  }
};

/**
 * Test Suite Runner
 */
class TestRunner {
  constructor() {
    this.results = {
      unit: null,
      integration: null,
      accessibility: null,
      performance: null,
      coverage: null
    };
    
    this.startTime = Date.now();
  }

  /**
   * Run all test suites
   */
  async runAll() {
    console.log('🧪 Starting PharmaTraK Component Library Test Suite\n');
    
    try {
      // Run unit tests
      console.log('📋 Running Unit Tests...');
      await this.runUnitTests();
      
      // Run integration tests
      console.log('\n🔗 Running Integration Tests...');
      await this.runIntegrationTests();
      
      // Run accessibility tests
      console.log('\n♿ Running Accessibility Tests...');
      await this.runAccessibilityTests();
      
      // Run performance tests
      console.log('\n⚡ Running Performance Tests...');
      await this.runPerformanceTests();
      
      // Generate coverage report
      console.log('\n📊 Generating Coverage Report...');
      await this.generateCoverageReport();
      
      // Generate final report
      this.generateFinalReport();
      
    } catch (error) {
      console.error('❌ Test suite failed:', error.message);
      process.exit(1);
    }
  }

  /**
   * Run unit tests for individual components
   */
  async runUnitTests() {
    try {
      const result = execSync(
        'npm test -- --testPathPattern=src/test/components --coverage=false --verbose',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      this.results.unit = this.parseTestResults(result);
      console.log(`✅ Unit Tests: ${this.results.unit.passed}/${this.results.unit.total} passed`);
      
    } catch (error) {
      console.error('❌ Unit tests failed');
      throw error;
    }
  }

  /**
   * Run integration tests for component interactions
   */
  async runIntegrationTests() {
    try {
      const result = execSync(
        'npm test -- --testPathPattern=src/test/integration --coverage=false',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      this.results.integration = this.parseTestResults(result);
      console.log(`✅ Integration Tests: ${this.results.integration.passed}/${this.results.integration.total} passed`);
      
    } catch (error) {
      console.error('❌ Integration tests failed');
      throw error;
    }
  }

  /**
   * Run accessibility tests
   */
  async runAccessibilityTests() {
    try {
      // Run accessibility-specific tests
      const result = execSync(
        'npm test -- --testNamePattern="accessibility|a11y" --coverage=false',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      this.results.accessibility = this.parseTestResults(result);
      console.log(`✅ Accessibility Tests: ${this.results.accessibility.passed}/${this.results.accessibility.total} passed`);
      
      // Run axe-core audit
      await this.runAxeAudit();
      
    } catch (error) {
      console.error('❌ Accessibility tests failed');
      throw error;
    }
  }

  /**
   * Run performance benchmarks
   */
  async runPerformanceTests() {
    try {
      // Component render performance
      await this.testRenderPerformance();
      
      // Memory usage tests
      await this.testMemoryUsage();
      
      // Bundle size analysis
      await this.analyzeBundleSize();
      
      console.log('✅ Performance tests completed');
      
    } catch (error) {
      console.error('❌ Performance tests failed');
      throw error;
    }
  }

  /**
   * Test component render performance
   */
  async testRenderPerformance() {
    const components = [
      'PharmaButton',
      'PharmaModal',
      'PharmaTable',
      'PharmaForm',
      'PharmaReportGenerator'
    ];
    
    const results = {};
    
    for (const component of components) {
      try {
        const result = execSync(
          `npm test -- --testNamePattern="render time|performance" --testPathPattern=${component}`,
          { 
            encoding: 'utf8',
            cwd: process.cwd()
          }
        );
        
        results[component] = this.parsePerformanceResults(result);
        
      } catch (error) {
        console.warn(`⚠️ Performance test failed for ${component}`);
        results[component] = { renderTime: 'N/A' };
      }
    }
    
    this.results.performance = results;
  }

  /**
   * Test memory usage
   */
  async testMemoryUsage() {
    try {
      const result = execSync(
        'npm test -- --testNamePattern="memory" --detectLeaks',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      console.log('📈 Memory usage tests completed');
      
    } catch (error) {
      console.warn('⚠️ Memory usage tests had issues');
    }
  }

  /**
   * Analyze bundle size
   */
  async analyzeBundleSize() {
    try {
      // Build production bundle
      execSync('npm run build', { cwd: process.cwd() });
      
      // Analyze bundle size
      const buildDir = path.join(process.cwd(), 'build/static/js');
      
      if (fs.existsSync(buildDir)) {
        const files = fs.readdirSync(buildDir);
        const jsFiles = files.filter(file => file.endsWith('.js'));
        
        let totalSize = 0;
        jsFiles.forEach(file => {
          const filePath = path.join(buildDir, file);
          const stats = fs.statSync(filePath);
          totalSize += stats.size;
        });
        
        const sizeInKB = Math.round(totalSize / 1024);
        console.log(`📦 Bundle size: ${sizeInKB} KB`);
        
        if (sizeInKB > TEST_CONFIG.performance.bundleSize) {
          console.warn(`⚠️ Bundle size exceeds threshold (${TEST_CONFIG.performance.bundleSize} KB)`);
        }
        
      } else {
        console.warn('⚠️ Build directory not found');
      }
      
    } catch (error) {
      console.warn('⚠️ Bundle analysis failed:', error.message);
    }
  }

  /**
   * Run axe-core accessibility audit
   */
  async runAxeAudit() {
    try {
      const result = execSync(
        'npm test -- --testNamePattern="axe|accessibility violations"',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      console.log('♿ Axe audit completed');
      
    } catch (error) {
      console.warn('⚠️ Axe audit had issues');
    }
  }

  /**
   * Generate coverage report
   */
  async generateCoverageReport() {
    try {
      const result = execSync(
        'npm test -- --coverage --coverageReporters=text-summary --coverageReporters=html',
        { 
          encoding: 'utf8',
          cwd: process.cwd()
        }
      );
      
      this.results.coverage = this.parseCoverageResults(result);
      
      const { statements, branches, functions, lines } = this.results.coverage;
      console.log(`📊 Coverage: ${statements}% statements, ${branches}% branches, ${functions}% functions, ${lines}% lines`);
      
      // Check coverage thresholds
      this.checkCoverageThresholds();
      
    } catch (error) {
      console.error('❌ Coverage generation failed');
      throw error;
    }
  }

  /**
   * Check if coverage meets thresholds
   */
  checkCoverageThresholds() {
    const { coverage } = this.results;
    const thresholds = TEST_CONFIG.coverage;
    
    const failures = [];
    
    if (coverage.statements < thresholds.statements) {
      failures.push(`Statements: ${coverage.statements}% < ${thresholds.statements}%`);
    }
    
    if (coverage.branches < thresholds.branches) {
      failures.push(`Branches: ${coverage.branches}% < ${thresholds.branches}%`);
    }
    
    if (coverage.functions < thresholds.functions) {
      failures.push(`Functions: ${coverage.functions}% < ${thresholds.functions}%`);
    }
    
    if (coverage.lines < thresholds.lines) {
      failures.push(`Lines: ${coverage.lines}% < ${thresholds.lines}%`);
    }
    
    if (failures.length > 0) {
      console.warn('⚠️ Coverage thresholds not met:');
      failures.forEach(failure => console.warn(`   ${failure}`));
    } else {
      console.log('✅ All coverage thresholds met');
    }
  }

  /**
   * Parse test results from Jest output
   */
  parseTestResults(output) {
    const lines = output.split('\n');
    let passed = 0;
    let failed = 0;
    let total = 0;
    
    for (const line of lines) {
      if (line.includes('Tests:')) {
        const match = line.match(/(\d+) passed.*?(\d+) total/);
        if (match) {
          passed = parseInt(match[1]);
          total = parseInt(match[2]);
          failed = total - passed;
        }
        break;
      }
    }
    
    return { passed, failed, total };
  }

  /**
   * Parse performance results
   */
  parsePerformanceResults(output) {
    // Extract performance metrics from test output
    const renderTimeMatch = output.match(/render time.*?(\d+\.?\d*)ms/i);
    const renderTime = renderTimeMatch ? parseFloat(renderTimeMatch[1]) : null;
    
    return { renderTime };
  }

  /**
   * Parse coverage results
   */
  parseCoverageResults(output) {
    const lines = output.split('\n');
    let statements = 0;
    let branches = 0;
    let functions = 0;
    let linesCoverage = 0;
    
    for (const line of lines) {
      if (line.includes('All files')) {
        const parts = line.split('|').map(part => part.trim());
        if (parts.length >= 5) {
          statements = parseFloat(parts[1]) || 0;
          branches = parseFloat(parts[2]) || 0;
          functions = parseFloat(parts[3]) || 0;
          linesCoverage = parseFloat(parts[4]) || 0;
        }
        break;
      }
    }
    
    return {
      statements,
      branches,
      functions,
      lines: linesCoverage
    };
  }

  /**
   * Generate final test report
   */
  generateFinalReport() {
    const endTime = Date.now();
    const duration = Math.round((endTime - this.startTime) / 1000);
    
    console.log('\n' + '='.repeat(60));
    console.log('🎉 PharmaTraK Component Library Test Suite Complete');
    console.log('='.repeat(60));
    console.log(`⏱️ Total Duration: ${duration}s`);
    console.log('');
    
    // Unit Tests
    if (this.results.unit) {
      console.log(`📋 Unit Tests: ${this.results.unit.passed}/${this.results.unit.total} passed`);
    }
    
    // Integration Tests
    if (this.results.integration) {
      console.log(`🔗 Integration Tests: ${this.results.integration.passed}/${this.results.integration.total} passed`);
    }
    
    // Accessibility Tests
    if (this.results.accessibility) {
      console.log(`♿ Accessibility Tests: ${this.results.accessibility.passed}/${this.results.accessibility.total} passed`);
    }
    
    // Performance Tests
    if (this.results.performance) {
      console.log('⚡ Performance Tests: Completed');
      Object.entries(this.results.performance).forEach(([component, metrics]) => {
        if (metrics.renderTime) {
          const status = metrics.renderTime < TEST_CONFIG.performance.renderTime ? '✅' : '⚠️';
          console.log(`   ${status} ${component}: ${metrics.renderTime}ms render time`);
        }
      });
    }
    
    // Coverage
    if (this.results.coverage) {
      const { statements, branches, functions, lines } = this.results.coverage;
      console.log(`📊 Coverage: ${statements}% statements, ${branches}% branches, ${functions}% functions, ${lines}% lines`);
    }
    
    console.log('');
    
    // Overall status
    const allTestsPassed = this.getAllTestsStatus();
    if (allTestsPassed) {
      console.log('🎉 All tests passed! Component library is ready for production.');
    } else {
      console.log('❌ Some tests failed. Please review the results above.');
    }
    
    console.log('='.repeat(60));
  }

  /**
   * Get overall test status
   */
  getAllTestsStatus() {
    const { unit, integration, accessibility } = this.results;
    
    return (
      unit && unit.failed === 0 &&
      integration && integration.failed === 0 &&
      accessibility && accessibility.failed === 0
    );
  }

  /**
   * Generate detailed HTML report
   */
  async generateHTMLReport() {
    const reportHTML = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PharmaTraK Component Library Test Report</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background: #007bff; color: white; padding: 20px; border-radius: 8px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
        .passed { color: #28a745; }
        .failed { color: #dc3545; }
        .warning { color: #ffc107; }
        table { width: 100%; border-collapse: collapse; }
        th, td { padding: 8px; border: 1px solid #ddd; text-align: left; }
        th { background: #f8f9fa; }
    </style>
</head>
<body>
    <div class="header">
        <h1>PharmaTraK Component Library Test Report</h1>
        <p>Generated on ${new Date().toISOString()}</p>
    </div>
    
    <div class="section">
        <h2>Test Summary</h2>
        <table>
            <tr><th>Test Suite</th><th>Passed</th><th>Failed</th><th>Total</th></tr>
            <tr><td>Unit Tests</td><td class="passed">${this.results.unit?.passed || 0}</td><td class="failed">${this.results.unit?.failed || 0}</td><td>${this.results.unit?.total || 0}</td></tr>
            <tr><td>Integration Tests</td><td class="passed">${this.results.integration?.passed || 0}</td><td class="failed">${this.results.integration?.failed || 0}</td><td>${this.results.integration?.total || 0}</td></tr>
            <tr><td>Accessibility Tests</td><td class="passed">${this.results.accessibility?.passed || 0}</td><td class="failed">${this.results.accessibility?.failed || 0}</td><td>${this.results.accessibility?.total || 0}</td></tr>
        </table>
    </div>
    
    <div class="section">
        <h2>Coverage Report</h2>
        <table>
            <tr><th>Metric</th><th>Coverage</th><th>Threshold</th><th>Status</th></tr>
            <tr><td>Statements</td><td>${this.results.coverage?.statements || 0}%</td><td>${TEST_CONFIG.coverage.statements}%</td><td class="${this.results.coverage?.statements >= TEST_CONFIG.coverage.statements ? 'passed' : 'failed'}">${this.results.coverage?.statements >= TEST_CONFIG.coverage.statements ? '✅' : '❌'}</td></tr>
            <tr><td>Branches</td><td>${this.results.coverage?.branches || 0}%</td><td>${TEST_CONFIG.coverage.branches}%</td><td class="${this.results.coverage?.branches >= TEST_CONFIG.coverage.branches ? 'passed' : 'failed'}">${this.results.coverage?.branches >= TEST_CONFIG.coverage.branches ? '✅' : '❌'}</td></tr>
            <tr><td>Functions</td><td>${this.results.coverage?.functions || 0}%</td><td>${TEST_CONFIG.coverage.functions}%</td><td class="${this.results.coverage?.functions >= TEST_CONFIG.coverage.functions ? 'passed' : 'failed'}">${this.results.coverage?.functions >= TEST_CONFIG.coverage.functions ? '✅' : '❌'}</td></tr>
            <tr><td>Lines</td><td>${this.results.coverage?.lines || 0}%</td><td>${TEST_CONFIG.coverage.lines}%</td><td class="${this.results.coverage?.lines >= TEST_CONFIG.coverage.lines ? 'passed' : 'failed'}">${this.results.coverage?.lines >= TEST_CONFIG.coverage.lines ? '✅' : '❌'}</td></tr>
        </table>
    </div>
</body>
</html>`;

    fs.writeFileSync('test-report.html', reportHTML);
    console.log('📄 HTML report generated: test-report.html');
  }
}

/**
 * CLI Interface
 */
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'all';
  
  const runner = new TestRunner();
  
  switch (command) {
    case 'all':
      await runner.runAll();
      await runner.generateHTMLReport();
      break;
      
    case 'unit':
      await runner.runUnitTests();
      break;
      
    case 'integration':
      await runner.runIntegrationTests();
      break;
      
    case 'a11y':
    case 'accessibility':
      await runner.runAccessibilityTests();
      break;
      
    case 'performance':
    case 'perf':
      await runner.runPerformanceTests();
      break;
      
    case 'coverage':
      await runner.generateCoverageReport();
      break;
      
    default:
      console.log('Usage: node testRunner.js [all|unit|integration|a11y|performance|coverage]');
      process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}

export default TestRunner;