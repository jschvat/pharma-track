#!/usr/bin/env node

/**
 * PharmaTraK Documentation Site Builder
 * 
 * Builds a static documentation site from Markdown files and component examples.
 * Generates searchable, responsive documentation with live code examples.
 * 
 * @author PharmaTraK Development Team
 * @version 1.0.0
 */

const fs = require('fs').promises;
const path = require('path');
const { marked } = require('marked');
const Prism = require('prismjs');
const { JSDOM } = require('jsdom');

// Load additional Prism languages
require('prismjs/components/prism-jsx');
require('prismjs/components/prism-typescript');
require('prismjs/components/prism-css');
require('prismjs/components/prism-json');
require('prismjs/components/prism-bash');

class PharmaDocsBuilder {
  constructor() {
    this.config = {
      sourceDir: path.join(__dirname),
      outputDir: path.join(__dirname, '../../build/docs'),
      templateDir: path.join(__dirname, 'templates'),
      componentsDir: path.join(__dirname, '../components/common'),
      assetsDir: path.join(__dirname, 'assets')
    };
    
    this.navigation = [];
    this.searchIndex = [];
    this.components = [];
    this.examples = [];
  }

  /**
   * Build the complete documentation site
   */
  async build() {
    console.log('🏗️  Building PharmaTraK Documentation...\n');
    
    try {
      // Setup build environment
      await this.setupBuildEnvironment();
      
      // Scan and process content
      await this.scanComponents();
      await this.processMarkdownFiles();
      await this.generateNavigation();
      await this.buildSearchIndex();
      
      // Generate static site
      await this.generatePages();
      await this.copyAssets();
      await this.generateManifest();
      
      console.log('✅ Documentation site built successfully!');
      console.log(`📁 Output directory: ${this.config.outputDir}`);
      console.log(`🌐 Open index.html to view the documentation\n`);
      
    } catch (error) {
      console.error('❌ Build failed:', error);
      process.exit(1);
    }
  }

  /**
   * Setup build environment and directories
   */
  async setupBuildEnvironment() {
    console.log('📁 Setting up build environment...');
    
    // Clean and create output directory
    try {
      await fs.rmdir(this.config.outputDir, { recursive: true });
    } catch (error) {
      // Directory doesn't exist, that's fine
    }
    
    await fs.mkdir(this.config.outputDir, { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'components'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'guides'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'examples'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'api'), { recursive: true });
    await fs.mkdir(path.join(this.config.outputDir, 'assets'), { recursive: true });
    
    console.log('✅ Build environment ready');
  }

  /**
   * Scan React components for documentation
   */
  async scanComponents() {
    console.log('🔍 Scanning components...');
    
    try {
      const componentFiles = await fs.readdir(this.config.componentsDir);
      
      for (const file of componentFiles) {
        if (file.endsWith('.js') && file.startsWith('Pharma')) {
          const componentPath = path.join(this.config.componentsDir, file);
          const componentSource = await fs.readFile(componentPath, 'utf8');
          
          const componentInfo = this.parseComponentInfo(file, componentSource);
          this.components.push(componentInfo);
        }
      }
      
      console.log(`✅ Found ${this.components.length} components`);
      
    } catch (error) {
      console.warn('⚠️  Could not scan components:', error.message);
    }
  }

  /**
   * Parse component information from source code
   */
  parseComponentInfo(filename, source) {
    const componentName = path.basename(filename, '.js');
    
    // Extract JSDoc comments
    const jsdocRegex = /\/\*\*\s*([\s\S]*?)\s*\*\//g;
    const jsdocMatches = Array.from(source.matchAll(jsdocRegex));
    
    // Extract prop types (simplified)
    const propTypesRegex = /(\w+)\.propTypes\s*=\s*{([\s\S]*?)}/;
    const propTypesMatch = source.match(propTypesRegex);
    
    // Extract examples from comments
    const exampleRegex = /@example\s*([\s\S]*?)(?=\*\/|\*\s*@)/g;
    const examples = Array.from(source.matchAll(exampleRegex))
      .map(match => match[1].trim());
    
    return {
      name: componentName,
      filename,
      description: this.extractDescription(jsdocMatches),
      props: this.extractProps(propTypesMatch),
      examples: examples,
      category: this.categorizeComponent(componentName),
      complexity: this.assessComplexity(source)
    };
  }

  /**
   * Extract component description from JSDoc
   */
  extractDescription(jsdocMatches) {
    if (jsdocMatches.length === 0) return 'No description available';
    
    const firstComment = jsdocMatches[0][1];
    const lines = firstComment.split('\n').map(line => line.replace(/^\s*\*\s?/, ''));
    
    // Find description (usually the first few lines before @tags)
    const descriptionLines = [];
    for (const line of lines) {
      if (line.startsWith('@')) break;
      if (line.trim()) descriptionLines.push(line.trim());
    }
    
    return descriptionLines.join(' ') || 'No description available';
  }

  /**
   * Extract props information
   */
  extractProps(propTypesMatch) {
    if (!propTypesMatch) return [];
    
    const propsSource = propTypesMatch[2];
    const propRegex = /(\w+):\s*([^,\n]+)/g;
    const props = [];
    
    let match;
    while ((match = propRegex.exec(propsSource)) !== null) {
      props.push({
        name: match[1],
        type: match[2].trim(),
        required: match[2].includes('.isRequired')
      });
    }
    
    return props;
  }

  /**
   * Categorize component by name
   */
  categorizeComponent(name) {
    if (name.includes('Button')) return 'Actions';
    if (name.includes('Form')) return 'Forms';
    if (name.includes('Table') || name.includes('Grid')) return 'Data Display';
    if (name.includes('Modal') || name.includes('Alert')) return 'Feedback';
    if (name.includes('Search') || name.includes('Filter')) return 'Navigation';
    if (name.includes('Chart') || name.includes('Report')) return 'Visualization';
    return 'Utilities';
  }

  /**
   * Assess component complexity
   */
  assessComplexity(source) {
    const lines = source.split('\n').length;
    const hooks = (source.match(/use[A-Z]\w+/g) || []).length;
    const props = (source.match(/props\.\w+/g) || []).length;
    
    if (lines > 300 || hooks > 5 || props > 15) return 'Advanced';
    if (lines > 150 || hooks > 2 || props > 8) return 'Intermediate';
    return 'Basic';
  }

  /**
   * Process all Markdown files
   */
  async processMarkdownFiles() {
    console.log('📝 Processing Markdown files...');
    
    const directories = ['components', 'guides', 'examples', 'api'];
    
    for (const dir of directories) {
      const dirPath = path.join(this.config.sourceDir, dir);
      
      try {
        const files = await fs.readdir(dirPath);
        
        for (const file of files) {
          if (file.endsWith('.md')) {
            await this.processMarkdownFile(dir, file);
          }
        }
      } catch (error) {
        console.warn(`⚠️  Could not process ${dir} directory:`, error.message);
      }
    }
    
    console.log('✅ Markdown files processed');
  }

  /**
   * Process individual Markdown file
   */
  async processMarkdownFile(directory, filename) {
    const filePath = path.join(this.config.sourceDir, directory, filename);
    const content = await fs.readFile(filePath, 'utf8');
    
    // Configure marked with syntax highlighting
    marked.setOptions({
      highlight: function(code, lang) {
        if (Prism.languages[lang]) {
          return Prism.highlight(code, Prism.languages[lang], lang);
        }
        return code;
      },
      breaks: true,
      gfm: true
    });
    
    const html = marked(content);
    const metadata = this.extractMetadata(content);
    
    // Generate HTML page
    const pageHtml = await this.generatePageHtml({
      title: metadata.title || path.basename(filename, '.md'),
      content: html,
      directory,
      filename: path.basename(filename, '.md'),
      metadata
    });
    
    // Write to output directory
    const outputPath = path.join(
      this.config.outputDir, 
      directory, 
      path.basename(filename, '.md') + '.html'
    );
    
    await fs.writeFile(outputPath, pageHtml);
    
    // Add to search index
    this.searchIndex.push({
      title: metadata.title || path.basename(filename, '.md'),
      url: `${directory}/${path.basename(filename, '.md')}.html`,
      content: this.stripHtml(html),
      category: directory
    });
  }

  /**
   * Extract metadata from Markdown frontmatter
   */
  extractMetadata(content) {
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n/;
    const match = content.match(frontmatterRegex);
    
    if (!match) return {};
    
    const yaml = match[1];
    const metadata = {};
    
    // Simple YAML parsing (for basic key-value pairs)
    const lines = yaml.split('\n');
    for (const line of lines) {
      const colonIndex = line.indexOf(':');
      if (colonIndex > 0) {
        const key = line.substring(0, colonIndex).trim();
        const value = line.substring(colonIndex + 1).trim().replace(/^["']|["']$/g, '');
        metadata[key] = value;
      }
    }
    
    return metadata;
  }

  /**
   * Generate navigation structure
   */
  async generateNavigation() {
    console.log('🧭 Generating navigation...');
    
    this.navigation = [
      {
        title: 'Getting Started',
        items: [
          { title: 'Overview', url: 'index.html', icon: 'fas fa-home' },
          { title: 'Installation', url: 'guides/installation.html', icon: 'fas fa-download' },
          { title: 'Quick Start', url: 'guides/quick-start.html', icon: 'fas fa-rocket' },
          { title: 'Accessibility', url: 'guides/AccessibilityGuide.html', icon: 'fas fa-universal-access' }
        ]
      },
      {
        title: 'Components',
        items: this.components.map(component => ({
          title: component.name,
          url: `components/${component.name}.html`,
          icon: this.getComponentIcon(component.name),
          complexity: component.complexity
        }))
      },
      {
        title: 'Examples',
        items: [
          { title: 'Pharmacy Workflows', url: 'examples/PharmacyWorkflows.html', icon: 'fas fa-laptop-code' }
        ]
      },
      {
        title: 'API Reference',
        items: [
          { title: 'Component API', url: 'api/ComponentAPI.html', icon: 'fas fa-code' }
        ]
      }
    ];
    
    console.log('✅ Navigation generated');
  }

  /**
   * Get icon for component type
   */
  getComponentIcon(componentName) {
    const iconMap = {
      'PharmaButton': 'fas fa-mouse-pointer',
      'PharmaModal': 'fas fa-window-restore',
      'PharmaForm': 'fas fa-edit',
      'PharmaTable': 'fas fa-table',
      'PharmaSearch': 'fas fa-search',
      'PharmaTooltip': 'fas fa-comment',
      'PharmaBreadcrumbs': 'fas fa-route',
      'PharmaReportGenerator': 'fas fa-chart-bar',
      'PharmaErrorBoundary': 'fas fa-shield-alt',
      'PharmaNotificationSystem': 'fas fa-bell'
    };
    
    return iconMap[componentName] || 'fas fa-puzzle-piece';
  }

  /**
   * Build search index
   */
  async buildSearchIndex() {
    console.log('🔍 Building search index...');
    
    // Add components to search index
    for (const component of this.components) {
      this.searchIndex.push({
        title: component.name,
        url: `components/${component.name}.html`,
        content: component.description,
        category: 'components',
        complexity: component.complexity
      });
    }
    
    // Write search index to file
    const searchIndexPath = path.join(this.config.outputDir, 'assets', 'search-index.json');
    await fs.writeFile(searchIndexPath, JSON.stringify(this.searchIndex, null, 2));
    
    console.log(`✅ Search index built with ${this.searchIndex.length} entries`);
  }

  /**
   * Generate individual pages
   */
  async generatePages() {
    console.log('📄 Generating pages...');
    
    // Generate main index page
    await this.generateIndexPage();
    
    // Generate component pages for components without markdown
    for (const component of this.components) {
      const markdownExists = await this.fileExists(
        path.join(this.config.sourceDir, 'components', `${component.name}.md`)
      );
      
      if (!markdownExists) {
        await this.generateComponentPage(component);
      }
    }
    
    console.log('✅ Pages generated');
  }

  /**
   * Generate main index page
   */
  async generateIndexPage() {
    const template = await this.loadTemplate('index.html');
    
    const content = `
      <div class="hero-section">
        <div class="container">
          <div class="row align-items-center">
            <div class="col-lg-6">
              <h1 class="display-4 fw-bold">PharmaTraK</h1>
              <p class="lead">A comprehensive React component library built specifically for pharmacy management systems and healthcare applications.</p>
              <div class="hero-buttons">
                <a href="guides/quick-start.html" class="btn btn-primary btn-lg me-3">Get Started</a>
                <a href="components/PharmaButton.html" class="btn btn-outline-primary btn-lg">View Components</a>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="hero-image">
                <i class="fas fa-pills fa-10x text-primary"></i>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="features-section py-5">
        <div class="container">
          <div class="row">
            <div class="col-md-4 mb-4">
              <div class="feature-card text-center">
                <i class="fas fa-universal-access fa-3x text-success mb-3"></i>
                <h4>Accessibility First</h4>
                <p>WCAG 2.1 AA compliant with comprehensive keyboard navigation and screen reader support.</p>
              </div>
            </div>
            <div class="col-md-4 mb-4">
              <div class="feature-card text-center">
                <i class="fas fa-pills fa-3x text-primary mb-3"></i>
                <h4>Pharmacy Focused</h4>
                <p>Built specifically for pharmacy workflows with NDC validation, drug interactions, and compliance features.</p>
              </div>
            </div>
            <div class="col-md-4 mb-4">
              <div class="feature-card text-center">
                <i class="fas fa-code fa-3x text-info mb-3"></i>
                <h4>TypeScript Ready</h4>
                <p>Full TypeScript support with comprehensive type definitions and pharmacy domain types.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div class="components-overview py-5 bg-light">
        <div class="container">
          <h2 class="text-center mb-5">Component Categories</h2>
          <div class="row">
            ${this.generateComponentCategoryCards()}
          </div>
        </div>
      </div>
    `;
    
    const html = template
      .replace('{{TITLE}}', 'PharmaTraK Component Library')
      .replace('{{CONTENT}}', content)
      .replace('{{NAVIGATION}}', this.generateNavigationHtml());
    
    await fs.writeFile(path.join(this.config.outputDir, 'index.html'), html);
  }

  /**
   * Generate component category cards
   */
  generateComponentCategoryCards() {
    const categories = {};
    
    // Group components by category
    this.components.forEach(component => {
      if (!categories[component.category]) {
        categories[component.category] = [];
      }
      categories[component.category].push(component);
    });
    
    return Object.entries(categories).map(([category, components]) => `
      <div class="col-md-6 col-lg-4 mb-4">
        <div class="card h-100">
          <div class="card-body">
            <h5 class="card-title">${category}</h5>
            <p class="card-text">${components.length} components</p>
            <ul class="list-unstyled">
              ${components.slice(0, 3).map(comp => `
                <li><a href="components/${comp.name}.html">${comp.name}</a></li>
              `).join('')}
              ${components.length > 3 ? `<li class="text-muted">+${components.length - 3} more...</li>` : ''}
            </ul>
          </div>
        </div>
      </div>
    `).join('');
  }

  /**
   * Generate component page
   */
  async generateComponentPage(component) {
    const template = await this.loadTemplate('component.html');
    
    const content = `
      <div class="component-header">
        <h1>${component.name}</h1>
        <p class="lead">${component.description}</p>
        <div class="component-meta">
          <span class="badge bg-primary">${component.category}</span>
          <span class="badge bg-${this.getComplexityColor(component.complexity)}">${component.complexity}</span>
        </div>
      </div>
      
      ${component.props.length > 0 ? `
        <div class="props-section">
          <h2>Props</h2>
          <div class="table-responsive">
            <table class="table table-striped">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Required</th>
                </tr>
              </thead>
              <tbody>
                ${component.props.map(prop => `
                  <tr>
                    <td><code>${prop.name}</code></td>
                    <td>${prop.type}</td>
                    <td>${prop.required ? '<span class="badge bg-danger">Required</span>' : '<span class="badge bg-secondary">Optional</span>'}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
      
      ${component.examples.length > 0 ? `
        <div class="examples-section">
          <h2>Examples</h2>
          ${component.examples.map(example => `
            <div class="example-block">
              <pre><code class="language-jsx">${this.escapeHtml(example)}</code></pre>
            </div>
          `).join('')}
        </div>
      ` : ''}
    `;
    
    const html = template
      .replace('{{TITLE}}', component.name)
      .replace('{{CONTENT}}', content)
      .replace('{{NAVIGATION}}', this.generateNavigationHtml());
    
    const outputPath = path.join(this.config.outputDir, 'components', `${component.name}.html`);
    await fs.writeFile(outputPath, html);
  }

  /**
   * Get complexity color
   */
  getComplexityColor(complexity) {
    switch (complexity) {
      case 'Basic': return 'success';
      case 'Intermediate': return 'warning';
      case 'Advanced': return 'danger';
      default: return 'secondary';
    }
  }

  /**
   * Generate navigation HTML
   */
  generateNavigationHtml() {
    return this.navigation.map(section => `
      <div class="nav-section">
        <div class="nav-section-title">${section.title}</div>
        ${section.items.map(item => `
          <div class="nav-item">
            <a href="${item.url}" class="nav-link">
              <i class="${item.icon}"></i>
              ${item.title}
              ${item.complexity ? `<span class="badge bg-${this.getComplexityColor(item.complexity)} ms-2">${item.complexity}</span>` : ''}
            </a>
          </div>
        `).join('')}
      </div>
    `).join('');
  }

  /**
   * Generate page HTML from template
   */
  async generatePageHtml(data) {
    const template = await this.loadTemplate('page.html');
    
    return template
      .replace(/\{\{TITLE\}\}/g, data.title)
      .replace(/\{\{CONTENT\}\}/g, data.content)
      .replace(/\{\{NAVIGATION\}\}/g, this.generateNavigationHtml());
  }

  /**
   * Load HTML template
   */
  async loadTemplate(templateName) {
    const templatePath = path.join(__dirname, 'index.html');
    
    try {
      return await fs.readFile(templatePath, 'utf8');
    } catch (error) {
      // Return basic template if file doesn't exist
      return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{TITLE}} - PharmaTraK Documentation</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/themes/prism-tomorrow.min.css" rel="stylesheet">
</head>
<body>
    <div class="container-fluid">
        <div class="row">
            <nav class="col-md-3 col-lg-2 d-md-block bg-light sidebar">
                <div class="position-sticky pt-3">
                    <h5>PharmaTraK Docs</h5>
                    {{NAVIGATION}}
                </div>
            </nav>
            <main class="col-md-9 ms-sm-auto col-lg-10 px-md-4">
                {{CONTENT}}
            </main>
        </div>
    </div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/components/prism-core.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/prism/1.29.0/plugins/autoloader/prism-autoloader.min.js"></script>
</body>
</html>
      `;
    }
  }

  /**
   * Copy static assets
   */
  async copyAssets() {
    console.log('📁 Copying assets...');
    
    // Copy the main HTML file as template
    const indexPath = path.join(__dirname, 'index.html');
    const outputIndexPath = path.join(this.config.outputDir, 'template.html');
    
    try {
      await fs.copyFile(indexPath, outputIndexPath);
      console.log('✅ Assets copied');
    } catch (error) {
      console.warn('⚠️  Could not copy assets:', error.message);
    }
  }

  /**
   * Generate manifest file
   */
  async generateManifest() {
    console.log('📋 Generating manifest...');
    
    const manifest = {
      name: 'PharmaTraK Documentation',
      version: '1.0.0',
      description: 'Component library documentation for pharmacy management systems',
      components: this.components.length,
      pages: this.searchIndex.length,
      buildDate: new Date().toISOString(),
      navigation: this.navigation
    };
    
    const manifestPath = path.join(this.config.outputDir, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(manifest, null, 2));
    
    console.log('✅ Manifest generated');
  }

  /**
   * Utility functions
   */
  async fileExists(filePath) {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  stripHtml(html) {
    const dom = new JSDOM(html);
    return dom.window.document.body.textContent || '';
  }

  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }
}

// CLI interface
async function main() {
  const builder = new PharmaDocsBuilder();
  await builder.build();
}

// Run if called directly
if (require.main === module) {
  main().catch(error => {
    console.error('Documentation build failed:', error);
    process.exit(1);
  });
}

module.exports = PharmaDocsBuilder;