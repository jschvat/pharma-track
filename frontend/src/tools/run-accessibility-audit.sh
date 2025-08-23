#!/bin/bash

#
# PharmaTraK Accessibility Audit Runner
# 
# Comprehensive accessibility testing script that runs multiple audit tools
# and generates detailed reports for WCAG 2.1 AA compliance.
#

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
AUDIT_OUTPUT_DIR="$PROJECT_ROOT/build/accessibility"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
REPORT_FILE="$AUDIT_OUTPUT_DIR/audit_report_$TIMESTAMP.html"

echo -e "${BLUE}🔍 Starting PharmaTraK Accessibility Audit...${NC}\n"

# Check if required dependencies are installed
check_dependencies() {
    echo -e "${YELLOW}📋 Checking dependencies...${NC}"
    
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js is not installed${NC}"
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}✅ Dependencies check passed${NC}\n"
}

# Install accessibility testing dependencies
install_dependencies() {
    echo -e "${YELLOW}📦 Installing accessibility testing dependencies...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Install dependencies if not present
    if [ ! -d "node_modules/jest-axe" ]; then
        npm install jest-axe axe-core eslint-plugin-jsx-a11y --save-dev
    fi
    
    if [ ! -d "node_modules/lighthouse" ]; then
        npm install lighthouse --save-dev
    fi
    
    echo -e "${GREEN}✅ Dependencies installed${NC}\n"
}

# Run ESLint accessibility checks
run_eslint_audit() {
    echo -e "${YELLOW}🔧 Running ESLint accessibility checks...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Run ESLint with accessibility rules
    if npx eslint src --ext .js,.jsx --format json --output-file "$AUDIT_OUTPUT_DIR/eslint-a11y-report.json" 2>/dev/null; then
        echo -e "${GREEN}✅ ESLint accessibility check passed${NC}"
    else
        echo -e "${YELLOW}⚠️  ESLint found accessibility issues (see report)${NC}"
    fi
    
    echo ""
}

# Run Jest accessibility tests
run_jest_tests() {
    echo -e "${YELLOW}🧪 Running Jest accessibility tests...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Run accessibility-specific tests
    if npm run test:accessibility -- --coverage --watchAll=false --json --outputFile="$AUDIT_OUTPUT_DIR/jest-a11y-results.json" 2>/dev/null; then
        echo -e "${GREEN}✅ Jest accessibility tests passed${NC}"
    else
        echo -e "${YELLOW}⚠️  Some Jest accessibility tests failed (see report)${NC}"
    fi
    
    echo ""
}

# Run custom accessibility audit tool
run_custom_audit() {
    echo -e "${YELLOW}🔍 Running custom accessibility audit...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Run the custom accessibility audit tool
    if node src/tools/accessibility-audit.js; then
        echo -e "${GREEN}✅ Custom accessibility audit completed${NC}"
    else
        echo -e "${RED}❌ Custom accessibility audit failed${NC}"
        exit 1
    fi
    
    echo ""
}

# Run Lighthouse accessibility audit (if available)
run_lighthouse_audit() {
    echo -e "${YELLOW}💡 Running Lighthouse accessibility audit...${NC}"
    
    cd "$PROJECT_ROOT"
    
    # Check if a local server is running
    if curl -s http://localhost:3000 > /dev/null 2>&1; then
        SERVER_URL="http://localhost:3000"
    elif curl -s http://localhost:3001 > /dev/null 2>&1; then
        SERVER_URL="http://localhost:3001"
    else
        echo -e "${YELLOW}⚠️  No local server found, skipping Lighthouse audit${NC}"
        echo -e "${BLUE}   To run Lighthouse audit: npm start, then run this script again${NC}"
        return 0
    fi
    
    # Run Lighthouse with accessibility focus
    if command -v lighthouse &> /dev/null; then
        lighthouse "$SERVER_URL" \
            --only-categories=accessibility \
            --output=json \
            --output-path="$AUDIT_OUTPUT_DIR/lighthouse-a11y-report.json" \
            --chrome-flags="--headless --no-sandbox" \
            --quiet
        
        echo -e "${GREEN}✅ Lighthouse accessibility audit completed${NC}"
    else
        echo -e "${YELLOW}⚠️  Lighthouse not available, installing...${NC}"
        npm install lighthouse --save-dev
        echo -e "${BLUE}   Lighthouse installed. Run script again to include Lighthouse audit.${NC}"
    fi
    
    echo ""
}

# Generate comprehensive report
generate_report() {
    echo -e "${YELLOW}📊 Generating comprehensive accessibility report...${NC}"
    
    # Create HTML report combining all audit results
    cat > "$REPORT_FILE" << EOF
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>PharmaTraK Accessibility Audit Report - $TIMESTAMP</title>
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/css/bootstrap.min.css" rel="stylesheet">
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
    <style>
        .audit-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 2rem 0;
        }
        .score-excellent { color: #28a745; font-weight: bold; }
        .score-good { color: #ffc107; font-weight: bold; }
        .score-poor { color: #dc3545; font-weight: bold; }
        .tool-section {
            border-left: 4px solid #007bff;
            padding-left: 1rem;
            margin: 1rem 0;
        }
    </style>
</head>
<body>
    <div class="audit-header">
        <div class="container">
            <div class="row align-items-center">
                <div class="col-md-8">
                    <h1><i class="fas fa-universal-access me-3"></i>PharmaTraK Accessibility Audit</h1>
                    <p class="lead mb-0">Comprehensive WCAG 2.1 AA compliance report</p>
                </div>
                <div class="col-md-4 text-end">
                    <div class="bg-white bg-opacity-25 rounded p-3">
                        <div class="text-white-50 small">Generated</div>
                        <div class="fw-bold">$(date)</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="container py-4">
        <div class="row">
            <div class="col-md-8">
                <div class="tool-section">
                    <h3><i class="fas fa-code me-2"></i>ESLint Accessibility Analysis</h3>
                    <p>Static code analysis for accessibility rule violations.</p>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        See <code>eslint-a11y-report.json</code> for detailed results.
                    </div>
                </div>

                <div class="tool-section">
                    <h3><i class="fas fa-vial me-2"></i>Jest Accessibility Tests</h3>
                    <p>Automated component testing with jest-axe and WCAG validation.</p>
                    <div class="alert alert-info">
                        <i class="fas fa-info-circle me-2"></i>
                        See <code>jest-a11y-results.json</code> for detailed test results.
                    </div>
                </div>

                <div class="tool-section">
                    <h3><i class="fas fa-search me-2"></i>Custom Accessibility Audit</h3>
                    <p>PharmaTraK-specific accessibility analysis including pharmacy workflow compliance.</p>
                    <div class="alert alert-success">
                        <i class="fas fa-check-circle me-2"></i>
                        See <code>accessibility-report.html</code> for comprehensive component analysis.
                    </div>
                </div>

                <div class="tool-section">
                    <h3><i class="fas fa-lightbulb me-2"></i>Lighthouse Performance</h3>
                    <p>Google Lighthouse accessibility scoring and recommendations.</p>
                    <div class="alert alert-warning">
                        <i class="fas fa-exclamation-triangle me-2"></i>
                        Requires running application server. See <code>lighthouse-a11y-report.json</code> if available.
                    </div>
                </div>
            </div>

            <div class="col-md-4">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-tasks me-2"></i>Quick Actions</h5>
                    </div>
                    <div class="card-body">
                        <div class="d-grid gap-2">
                            <a href="accessibility-report.html" class="btn btn-primary">
                                <i class="fas fa-chart-bar me-2"></i>View Detailed Report
                            </a>
                            <a href="recommendations.md" class="btn btn-outline-info">
                                <i class="fas fa-lightbulb me-2"></i>View Recommendations
                            </a>
                            <button class="btn btn-outline-secondary" onclick="window.print()">
                                <i class="fas fa-print me-2"></i>Print Report
                            </button>
                        </div>
                    </div>
                </div>

                <div class="card mt-3">
                    <div class="card-header">
                        <h5><i class="fas fa-book me-2"></i>Resources</h5>
                    </div>
                    <div class="card-body">
                        <ul class="list-unstyled">
                            <li><a href="https://www.w3.org/WAI/WCAG21/quickref/" target="_blank">WCAG 2.1 Guidelines</a></li>
                            <li><a href="https://www.w3.org/WAI/ARIA/apg/" target="_blank">ARIA Authoring Practices</a></li>
                            <li><a href="https://webaim.org/" target="_blank">WebAIM Resources</a></li>
                            <li><a href="../docs/guides/AccessibilityGuide.md">PharmaTraK A11y Guide</a></li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>

        <div class="row mt-4">
            <div class="col-12">
                <div class="card">
                    <div class="card-header">
                        <h5><i class="fas fa-clipboard-check me-2"></i>Audit Summary</h5>
                    </div>
                    <div class="card-body">
                        <div class="row text-center">
                            <div class="col-md-3">
                                <div class="border rounded p-3">
                                    <i class="fas fa-code fa-2x text-primary mb-2"></i>
                                    <h6>ESLint Rules</h6>
                                    <p class="text-muted small">Static analysis complete</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="border rounded p-3">
                                    <i class="fas fa-vial fa-2x text-success mb-2"></i>
                                    <h6>Jest Tests</h6>
                                    <p class="text-muted small">Component testing complete</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="border rounded p-3">
                                    <i class="fas fa-search fa-2x text-info mb-2"></i>
                                    <h6>Custom Audit</h6>
                                    <p class="text-muted small">Pharmacy-specific analysis</p>
                                </div>
                            </div>
                            <div class="col-md-3">
                                <div class="border rounded p-3">
                                    <i class="fas fa-lightbulb fa-2x text-warning mb-2"></i>
                                    <h6>Lighthouse</h6>
                                    <p class="text-muted small">Performance analysis</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <footer class="bg-light py-3 mt-5">
        <div class="container text-center">
            <p class="text-muted mb-0">
                <i class="fas fa-pills me-2"></i>
                PharmaTraK Accessibility Audit • Generated $(date) • WCAG 2.1 AA Compliance
            </p>
        </div>
    </footer>
</body>
</html>
EOF

    echo -e "${GREEN}✅ Comprehensive report generated: $REPORT_FILE${NC}"
}

# Main execution
main() {
    echo -e "${BLUE}🚀 PharmaTraK Accessibility Audit Suite${NC}"
    echo -e "${BLUE}======================================${NC}\n"
    
    # Create output directory
    mkdir -p "$AUDIT_OUTPUT_DIR"
    
    # Run audit steps
    check_dependencies
    install_dependencies
    run_eslint_audit
    run_jest_tests
    run_custom_audit
    run_lighthouse_audit
    generate_report
    
    echo -e "${GREEN}🎉 Accessibility audit completed successfully!${NC}"
    echo -e "${BLUE}📁 Reports available in: $AUDIT_OUTPUT_DIR${NC}"
    echo -e "${BLUE}📊 Main report: $REPORT_FILE${NC}"
    echo -e "${BLUE}💡 View detailed recommendations in accessibility-report.html${NC}\n"
    
    # Open report if on macOS or Linux with desktop environment
    if command -v open &> /dev/null; then
        echo -e "${YELLOW}Opening report in default browser...${NC}"
        open "$REPORT_FILE"
    elif command -v xdg-open &> /dev/null; then
        echo -e "${YELLOW}Opening report in default browser...${NC}"
        xdg-open "$REPORT_FILE"
    else
        echo -e "${BLUE}To view the report, open: $REPORT_FILE${NC}"
    fi
}

# Run main function
main "$@"