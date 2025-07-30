# Makefile for setting up and running the development environment

# --- Configuration ---
# COLORS
GREEN  := $(shell tput -Txterm setaf 2)
YELLOW := $(shell tput -Txterm setaf 3)
RESET  := $(shell tput -Txterm sgr0)

# Directories
CURRENT_DIR := $(shell pwd)
FRONT_DIR := $(CURRENT_DIR)/front
BACK_DIR := $(CURRENT_DIR)/back

# Backend venv paths
VENV_DIR := $(BACK_DIR)/.venv
VENV_PYTHON := $(VENV_DIR)/bin/python
VENV_PIP := $(VENV_DIR)/bin/pip
VENV_HONCHO := $(VENV_DIR)/bin/honcho

# Touchfiles to track installation status (ensures we don't reinstall every time)
VENV_TOUCHFILE := $(VENV_DIR)/.setup_complete
NODE_MODULES_TOUCHFILE := $(FRONT_DIR)/node_modules/.setup_complete

# --- Commands & Ports ---
# Frontend command
FRONT_COMMAND := npm run dev -- --mode dev
FRONT_PORT := 5173 # Default Vite port, change if your 'npm run dev' uses another port

# Backend command (runs from project root to ensure 'back' module is found)
BACK_COMMAND := $(VENV_PYTHON) -m uvicorn --factory back:make_app --reload --port 8040 --log-level debug
BACK_PORT := 8040

# Proxy command
PROXY_COMMAND := caddy run --config Caddyfile.dev --adapter caddyfile
PROXY_PORT := 8080 # Main entry point for your browser

# --- Main Targets ---
.PHONY: all help run install clean

# Default target runs all services
all: run

# Show help menu
help:
	@echo ''
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Targets:'
	@echo '  ${YELLOW}make install${RESET}     : ${GREEN}Installs all backend and frontend dependencies.${RESET}'
	@echo '  ${YELLOW}make run${RESET}         : ${GREEN}Installs if needed, then starts all services (front, back, proxy).${RESET}'
	@echo '  ${YELLOW}make types${RESET}       : ${GREEN}Checks TypeScript types for the frontend.${RESET}'
	@echo '  ${YELLOW}make clean${RESET}       : ${GREEN}Removes installed dependencies and temporary files.${RESET}'
	@echo ''

# Target to run all services concurrently using honcho
# This is the primary command you will use.
run: check-caddy install Procfile
	@echo "▶️  Starting all services via honcho..."
	@echo "✅ Main application will be available at ${YELLOW}http://localhost:$(PROXY_PORT)${RESET}"
	@$(VENV_HONCHO) start

# Target to install all dependencies if they haven't been already
install: $(VENV_TOUCHFILE) $(NODE_MODULES_TOUCHFILE)
	@echo "✅ Dependencies are up to date."

# --- Service-Specific Targets ---

.PHONY: types
types: install
	@echo "🔍 Checking frontend types..."
	@cd $(FRONT_DIR) && npm run types

# --- Setup & Helper Targets (Internal) ---

# Rule for setting up backend venv and installing requirements
$(VENV_TOUCHFILE): $(BACK_DIR)/requirements.txt
	@echo "🐍 Creating backend virtual environment..."
	@python3 -m venv $(VENV_DIR)
	@echo "🐍 Installing backend dependencies from requirements.txt..."
	@$(VENV_PIP) install --upgrade pip > /dev/null
	@$(VENV_PIP) install -r $(BACK_DIR)/requirements.txt
	@echo "🐍 Installing honcho process manager..."
	@$(VENV_PIP) install honcho > /dev/null
	@touch $@ # Create touchfile to mark installation as complete

# Rule for installing frontend dependencies
$(NODE_MODULES_TOUCHFILE): $(FRONT_DIR)/package-lock.json
	@echo "📦 Installing frontend dependencies..."
	@cd $(FRONT_DIR) && npm install
	@mkdir -p $(dir $@) # Ensure the .setup_complete directory exists
	@touch $@ # Create touchfile to mark installation as complete

# Rule to generate the Procfile needed by honcho
.PHONY: Procfile
Procfile: Makefile # Re-generate if Makefile changes
	@echo "⚙️  Generating Procfile..."
	@echo "proxy: $(PROXY_COMMAND)" > Procfile
	@echo "backend: cd $(BACK_DIR) && $(BACK_COMMAND)" >> Procfile
	@echo "frontend: cd $(FRONT_DIR) && $(FRONT_COMMAND)" >> Procfile

# Hidden target to check if the 'caddy' command is available
.PHONY: check-caddy
check-caddy:
	@command -v caddy >/dev/null 2>&1 || \
	  (echo "${YELLOW}Error: 'caddy' command not found.${RESET}" >&2; \
	   echo "Please install Caddy (https://caddyserver.com/docs/install) and ensure it's in your PATH." >&2; \
	   exit 1)

# --- Cleanup ---

# Target to remove all generated files and dependencies
clean:
	@echo "🔥 Cleaning up the project..."
	@rm -rf $(VENV_DIR)
	@rm -rf $(FRONT_DIR)/node_modules
	@rm -f Procfile
	@echo "✅ Cleanup complete."

