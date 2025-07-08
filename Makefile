# Professional Frontend Skeleton - Makefile
# One-command setup for the entire project

.PHONY: help install setup dev build clean reset test lint format check-deps

# Default target
.DEFAULT_GOAL := help

# Colors for output
GREEN := \033[0;32m
YELLOW := \033[1;33m
RED := \033[0;31m
NC := \033[0m # No Color
BLUE := \033[0;34m

help: ## Show this help message
	@echo "$(BLUE)Professional Frontend Skeleton - Setup Commands$(NC)"
	@echo ""
	@echo "$(GREEN)Quick Start:$(NC)"
	@echo "  make setup    $(YELLOW)# Complete project setup (recommended)$(NC)"
	@echo "  make dev      $(YELLOW)# Start development server$(NC)"
	@echo ""
	@echo "$(GREEN)Available Commands:$(NC)"
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  $(GREEN)%-12s$(NC) %s\n", $$1, $$2}' $(MAKEFILE_LIST)

check-deps: ## Check if required dependencies are installed
	@echo "$(BLUE)Checking system dependencies...$(NC)"
	@command -v node >/dev/null 2>&1 || { echo "$(RED)Error: Node.js is required but not installed.$(NC)" >&2; exit 1; }
	@command -v npm >/dev/null 2>&1 || { echo "$(RED)Error: npm is required but not installed.$(NC)" >&2; exit 1; }
	@echo "$(GREEN)✓ Node.js and npm are installed$(NC)"

install: check-deps ## Install project dependencies
	@echo "$(BLUE)Installing dependencies...$(NC)"
	@npm install --cache /tmp/.npm-cache || npm install
	@echo "$(GREEN)✓ Dependencies installed$(NC)"

env-setup: ## Set up environment variables
	@echo "$(BLUE)Setting up environment variables...$(NC)"
	@if [ ! -f .env ]; then \
		echo "$(YELLOW)Creating .env file from .env.example...$(NC)"; \
		if [ -f .env.example ]; then \
			cp .env.example .env; \
		else \
			echo 'DATABASE_URL="file:./dev.db"' > .env; \
			echo 'NEXTAUTH_SECRET="$(shell openssl rand -base64 32)"' >> .env; \
			echo 'NEXTAUTH_URL="http://localhost:3000"' >> .env; \
			echo '' >> .env; \
			echo '# GitHub OAuth (optional - configure if needed)' >> .env; \
			echo '# GITHUB_CLIENT_ID=""' >> .env; \
			echo '# GITHUB_CLIENT_SECRET=""' >> .env; \
		fi; \
		echo "$(GREEN)✓ Environment file created$(NC)"; \
	else \
		echo "$(YELLOW)Environment file already exists$(NC)"; \
	fi

db-setup: ## Set up database with Prisma
	@echo "$(BLUE)Setting up database...$(NC)"
	@npx prisma generate
	@echo "$(GREEN)✓ Prisma client generated$(NC)"
	@npx prisma migrate dev --name init
	@echo "$(GREEN)✓ Database migrations applied$(NC)"

setup: install env-setup db-setup ## Complete project setup (recommended)
	@echo ""
	@echo "$(GREEN)🎉 Project setup complete!$(NC)"
	@echo ""
	@echo "$(BLUE)Next steps:$(NC)"
	@echo "  $(GREEN)make dev$(NC)     $(YELLOW)# Start development server$(NC)"
	@echo "  $(GREEN)make build$(NC)   $(YELLOW)# Build for production$(NC)"
	@echo "  $(GREEN)make test$(NC)    $(YELLOW)# Run tests and linting$(NC)"
	@echo ""
	@echo "$(BLUE)Your app will be available at: $(GREEN)http://localhost:3000$(NC)"

dev: ## Start development server
	@echo "$(BLUE)Starting development server...$(NC)"
	@npm run dev

build: ## Build for production
	@echo "$(BLUE)Building for production...$(NC)"
	@npm run build

start: ## Start production server
	@echo "$(BLUE)Starting production server...$(NC)"
	@npm run start

lint: ## Run ESLint
	@echo "$(BLUE)Running ESLint...$(NC)"
	@npm run lint

test: lint ## Run all tests and checks
	@echo "$(BLUE)Running tests and checks...$(NC)"
	@npm run build
	@echo "$(GREEN)✓ All tests passed$(NC)"

format: ## Format code (if you add prettier later)
	@echo "$(BLUE)Code formatting...$(NC)"
	@echo "$(YELLOW)Prettier not configured. Run 'npm install -D prettier' to add formatting.$(NC)"

clean: ## Clean build files and dependencies
	@echo "$(BLUE)Cleaning project...$(NC)"
	@rm -rf .next
	@rm -rf node_modules
	@rm -rf dist
	@echo "$(GREEN)✓ Cleaned build files and dependencies$(NC)"

reset: clean ## Full reset - clean everything and rebuild database
	@echo "$(BLUE)Performing full project reset...$(NC)"
	@rm -f dev.db*
	@rm -rf prisma/migrations
	@rm -rf src/generated
	@echo "$(YELLOW)Run 'make setup' to reinitialize the project$(NC)"

db-reset: ## Reset database only
	@echo "$(BLUE)Resetting database...$(NC)"
	@npx prisma migrate reset --force
	@echo "$(GREEN)✓ Database reset complete$(NC)"

db-studio: ## Open Prisma Studio to view database
	@echo "$(BLUE)Opening Prisma Studio...$(NC)"
	@npx prisma studio

update: ## Update dependencies
	@echo "$(BLUE)Updating dependencies...$(NC)"
	@npm update
	@echo "$(GREEN)✓ Dependencies updated$(NC)"

deploy-vercel: ## Deploy to Vercel
	@echo "$(BLUE)Deploying to Vercel...$(NC)"
	@if command -v vercel >/dev/null 2>&1; then \
		vercel --prod; \
	else \
		echo "$(RED)Vercel CLI not installed. Install with: npm i -g vercel$(NC)"; \
		echo "$(YELLOW)Or deploy via Vercel dashboard: https://vercel.com$(NC)"; \
	fi

doctor: ## Check project health
	@echo "$(BLUE)Running project health check...$(NC)"
	@echo "$(GREEN)Node.js version:$(NC) $$(node --version)"
	@echo "$(GREEN)npm version:$(NC) $$(npm --version)"
	@echo "$(GREEN)Next.js version:$(NC) $$(npm list next --depth=0 2>/dev/null | grep next || echo 'Not found')"
	@if [ -f .env ]; then \
		echo "$(GREEN)✓ Environment file exists$(NC)"; \
	else \
		echo "$(RED)✗ Environment file missing$(NC)"; \
	fi
	@if [ -f dev.db ]; then \
		echo "$(GREEN)✓ Database file exists$(NC)"; \
	else \
		echo "$(YELLOW)! Database file not found (run 'make db-setup')$(NC)"; \
	fi
	@if [ -d node_modules ]; then \
		echo "$(GREEN)✓ Dependencies installed$(NC)"; \
	else \
		echo "$(RED)✗ Dependencies not installed (run 'make install')$(NC)"; \
	fi

info: ## Show project information
	@echo "$(BLUE)Professional Frontend Skeleton$(NC)"
	@echo "$(GREEN)Framework:$(NC) Next.js 15 with App Router"
	@echo "$(GREEN)Language:$(NC) TypeScript"
	@echo "$(GREEN)Styling:$(NC) Tailwind CSS"
	@echo "$(GREEN)Database:$(NC) Prisma + SQLite"
	@echo "$(GREEN)Auth:$(NC) NextAuth.js v5"
	@echo "$(GREEN)Forms:$(NC) React Hook Form + Zod"
	@echo "$(GREEN)UI:$(NC) Custom components"
	@echo "$(GREEN)Deployment:$(NC) Vercel ready"
	@echo ""
	@echo "$(BLUE)Useful Commands:$(NC)"
	@echo "  make setup  $(YELLOW)# Initial setup$(NC)"
	@echo "  make dev    $(YELLOW)# Development$(NC)"
	@echo "  make build  $(YELLOW)# Production build$(NC)"
	@echo "  make doctor $(YELLOW)# Health check$(NC)"

# Development shortcuts
d: dev ## Shortcut for dev
b: build ## Shortcut for build
s: setup ## Shortcut for setup
c: clean ## Shortcut for clean
l: lint ## Shortcut for lint 