# PharmaTrack Backend Makefile
# Convenient commands for development and deployment

.PHONY: help setup install start dev stop clean backup restore reset docker-start docker-stop docker-restart docker-logs docker-connect test lint

# Default target
help: ## Show this help message
	@echo "PharmaTrack Backend - Available Commands:"
	@echo ""
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-15s\033[0m %s\n", $$1, $$2}'
	@echo ""

# Setup and Installation
setup: ## Run complete setup (dependencies, docker, database)
	@echo "🚀 Running complete setup..."
	./setup.sh

install: ## Install Node.js dependencies only
	@echo "📦 Installing dependencies..."
	npm install

# Application Management
start: ## Start the application in production mode
	@echo "🌟 Starting application..."
	npm start

dev: ## Start the application in development mode
	@echo "🔧 Starting development server..."
	npm run dev

stop: ## Stop the application (if running with PM2 or similar)
	@echo "🛑 Stopping application..."
	@pkill -f "node server.js" || echo "No application process found"

# Database Management
backup: ## Create database backup
	@echo "💾 Creating database backup..."
	./scripts/db-backup.sh

restore: ## Restore database from backup
	@echo "📥 Restoring database..."
	./scripts/db-restore.sh

reset: ## Reset database (WARNING: destroys all data)
	@echo "🗑️  Resetting database..."
	./scripts/db-reset.sh

# Docker Management
docker-start: ## Start MySQL Docker container
	@echo "🐳 Starting MySQL container..."
	./scripts/docker-manage.sh start

docker-stop: ## Stop MySQL Docker container
	@echo "🐳 Stopping MySQL container..."
	./scripts/docker-manage.sh stop

docker-restart: ## Restart MySQL Docker container
	@echo "🐳 Restarting MySQL container..."
	./scripts/docker-manage.sh restart

docker-logs: ## Show MySQL container logs
	@echo "📋 Showing MySQL logs..."
	./scripts/docker-manage.sh logs

docker-connect: ## Connect to MySQL database
	@echo "🔗 Connecting to MySQL..."
	./scripts/docker-manage.sh connect

docker-status: ## Show Docker container status
	@echo "📊 Docker container status..."
	./scripts/docker-manage.sh status

docker-remove: ## Remove MySQL Docker container (DESTRUCTIVE)
	@echo "🗑️  Removing MySQL container..."
	./scripts/docker-manage.sh remove

# Development Tools
test: ## Run all tests
	@echo "🧪 Running all tests..."
	npm test

test-watch: ## Run tests in watch mode
	@echo "👀 Running tests in watch mode..."
	npm run test:watch

test-coverage: ## Run tests with coverage report
	@echo "📊 Running tests with coverage..."
	npm run test:coverage

test-fda: ## Run FDA service integration tests
	@echo "🏥 Running FDA API tests..."
	npm run test:fda

test-fda-interactive: ## Run interactive FDA tests
	@echo "🔍 Running interactive FDA tests..."
	npm run test:fda:interactive

test-fda-offline: ## Run FDA tests without API calls
	@echo "📴 Running offline FDA tests..."
	npm run test:fda:offline

lint: ## Run linting
	@echo "🔍 Running linter..."
	@if command -v eslint >/dev/null 2>&1; then \
		npx eslint . --ext .js; \
	else \
		echo "ESLint not installed. Install with: npm install --save-dev eslint"; \
	fi

format: ## Format code
	@echo "✨ Formatting code..."
	@if command -v prettier >/dev/null 2>&1; then \
		npx prettier --write "**/*.js"; \
	else \
		echo "Prettier not installed. Install with: npm install --save-dev prettier"; \
	fi

# Utility Commands
clean: ## Clean up node_modules and logs
	@echo "🧹 Cleaning up..."
	rm -rf node_modules
	rm -f *.log
	rm -f npm-debug.log*

health: ## Check application health
	@echo "🏥 Checking application health..."
	@curl -s http://localhost:3000/api/health | jq . || echo "Application not running or jq not installed"

logs: ## Show application logs
	@echo "📋 Showing application logs..."
	@if [ -f "app.log" ]; then tail -f app.log; else echo "No log file found"; fi

env: ## Show environment information
	@echo "🌍 Environment Information:"
	@echo "Node.js version: $$(node --version)"
	@echo "npm version: $$(npm --version)"
	@echo "Docker version: $$(docker --version)"
	@echo "Current directory: $$(pwd)"
	@echo "Environment file exists: $$(if [ -f .env ]; then echo 'Yes'; else echo 'No'; fi)"

# Quick Development Workflow
quick-start: docker-start dev ## Quick start: start database and development server

full-reset: docker-stop docker-remove setup ## Full reset: remove everything and setup from scratch

# FDA API Testing
test-fda: ## Test FDA API connection
	@echo "🧪 Testing FDA API..."
	@curl -s "https://api.fda.gov/drug/ndc.json?search=product_ndc:0069-2587-10&limit=1" | jq . || echo "FDA API test failed or jq not installed"

# Production Deployment
deploy-prep: ## Prepare for production deployment
	@echo "🚀 Preparing for deployment..."
	npm ci --production
	@echo "✅ Production dependencies installed"
	@echo "⚠️  Remember to set NODE_ENV=production"

# Security
security-check: ## Run security audit
	@echo "🔒 Running security audit..."
	npm audit

# Database Utilities
db-shell: ## Open database shell
	@echo "🐚 Opening database shell..."
	./scripts/docker-manage.sh connect

db-root-shell: ## Open database shell as root
	@echo "🐚 Opening database shell as root..."
	./scripts/docker-manage.sh root