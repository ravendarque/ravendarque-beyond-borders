#!/bin/bash
# Setup development environment for Beyond Borders
# Installs all tools and dependencies needed for building, testing, and validation

set -e

# Parse arguments
DRY_RUN=false
SKIP_OPTIONAL=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --skip-optional)
            SKIP_OPTIONAL=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            echo "Usage: $0 [--dry-run] [--skip-optional]"
            exit 1
            ;;
    esac
done

# Color output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${CYAN}========================================${NC}"
    echo -e "${CYAN}$1${NC}"
    echo -e "${CYAN}========================================${NC}\n"
}

print_step() {
    echo -e "${WHITE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Detect OS
detect_os() {
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "linux"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        echo "mac"
    else
        echo "unknown"
    fi
}

# Detect package manager
detect_package_manager() {
    if command_exists apt-get; then
        echo "apt"
    elif command_exists yum; then
        echo "yum"
    elif command_exists dnf; then
        echo "dnf"
    elif command_exists brew; then
        echo "brew"
    else
        echo "none"
    fi
}

OS=$(detect_os)
PKG_MGR=$(detect_package_manager)

print_header "🚀 Beyond Borders Development Environment Setup"
echo -e "${GRAY}OS: $OS${NC}"
echo -e "${GRAY}Package Manager: $PKG_MGR${NC}"

if [ "$DRY_RUN" = true ]; then
    print_info "DRY RUN MODE - No changes will be made"
fi

# Summary counters
installed=0
skipped=0
failed=0
already_installed=0

# 1. Check Git
print_step "Checking Git..."
if command_exists git; then
    git_version=$(git --version)
    print_success "Git already installed: $git_version"
    ((already_installed++))
else
    print_error "Git is not installed"
    echo -e "${GRAY}  Install Git based on your OS:${NC}"
    echo -e "${GRAY}    Ubuntu/Debian: sudo apt-get install git${NC}"
    echo -e "${GRAY}    Fedora: sudo dnf install git${NC}"
    echo -e "${GRAY}    macOS: brew install git${NC}"
    ((failed++))
fi

# 2. Check Node.js
print_step "Checking Node.js..."
if command_exists node; then
    node_version=$(node --version)
    node_major=$(echo "$node_version" | sed 's/v\([0-9]*\).*/\1/')
    
    if [ "$node_major" -ge 18 ]; then
        print_success "Node.js already installed: $node_version"
        ((already_installed++))
    else
        print_warning "Node.js version $node_version is too old (need 18.x or 20.x)"
        echo -e "${GRAY}  Upgrade Node.js:${NC}"
        echo -e "${GRAY}    Using nvm: nvm install --lts${NC}"
        echo -e "${GRAY}    Or download from: https://nodejs.org/${NC}"
        ((failed++))
    fi
else
    print_warning "Node.js not found"
    echo -e "${GRAY}  Install Node.js (LTS version recommended):${NC}"
    echo -e "${GRAY}    Using nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash${NC}"
    echo -e "${GRAY}               nvm install --lts${NC}"
    echo -e "${GRAY}    macOS: brew install node@20${NC}"
    echo -e "${GRAY}    Ubuntu: https://github.com/nodesource/distributions${NC}"
    ((failed++))
fi

# 3. Check/Install pnpm
print_step "Checking pnpm..."
if command_exists pnpm; then
    pnpm_version=$(pnpm --version)
    print_success "pnpm already installed: $pnpm_version"
    ((already_installed++))
else
    print_warning "pnpm not found"
    if [ "$DRY_RUN" = false ]; then
        print_info "Installing pnpm via npm..."
        if npm install -g pnpm; then
            print_success "pnpm installed successfully"
            ((installed++))
        else
            print_error "Failed to install pnpm"
            ((failed++))
        fi
    else
        print_info "Would install: npm install -g pnpm"
        ((skipped++))
    fi
fi

# 4. Install project dependencies
print_step "Checking project dependencies..."
if [ -f "package.json" ]; then
    if [ "$DRY_RUN" = false ]; then
        print_info "Installing project dependencies with pnpm..."
        if pnpm install; then
            print_success "Project dependencies installed"
            ((installed++))
        else
            print_error "Failed to install project dependencies"
            ((failed++))
        fi
    else
        print_info "Would run: pnpm install"
        ((skipped++))
    fi
else
    print_warning "No package.json found in current directory"
fi

# 5. Install Playwright browsers
print_step "Checking Playwright browsers..."
if [ "$DRY_RUN" = false ]; then
    print_info "Installing Playwright browsers..."
    if pnpm exec playwright install --with-deps; then
        print_success "Playwright browsers installed"
        ((installed++))
    else
        print_warning "Failed to install Playwright browsers"
        echo -e "${GRAY}  You can install manually with: pnpm exec playwright install --with-deps${NC}"
        ((failed++))
    fi
else
    print_info "Would run: pnpm exec playwright install --with-deps"
    ((skipped++))
fi

# 6. Install markdownlint-cli2
print_step "Checking markdownlint-cli2..."
if command_exists markdownlint-cli2; then
    print_success "markdownlint-cli2 already installed"
    ((already_installed++))
else
    print_warning "markdownlint-cli2 not found"
    if [ "$DRY_RUN" = false ]; then
        print_info "Installing markdownlint-cli2..."
        if npm install -g markdownlint-cli2; then
            print_success "markdownlint-cli2 installed"
            ((installed++))
        else
            print_error "Failed to install markdownlint-cli2"
            ((failed++))
        fi
    else
        print_info "Would install: npm install -g markdownlint-cli2"
        ((skipped++))
    fi
fi

# 7. Check Python and yamllint
print_step "Checking Python and yamllint..."
if command_exists python3 || command_exists python; then
    python_cmd=$(command_exists python3 && echo "python3" || echo "python")
    python_version=$($python_cmd --version)
    print_success "Python already installed: $python_version"
    ((already_installed++))
    
    # Check yamllint
    if command_exists yamllint; then
        print_success "yamllint already installed"
        ((already_installed++))
    else
        print_warning "yamllint not found"
        if [ "$DRY_RUN" = false ]; then
            print_info "Installing yamllint..."
            if $python_cmd -m pip install --user yamllint; then
                print_success "yamllint installed"
                ((installed++))
            else
                print_error "Failed to install yamllint"
                ((failed++))
            fi
        else
            print_info "Would install: pip install yamllint"
            ((skipped++))
        fi
    fi
else
    print_warning "Python not found"
    echo -e "${GRAY}  Install Python:${NC}"
    echo -e "${GRAY}    Ubuntu/Debian: sudo apt-get install python3 python3-pip${NC}"
    echo -e "${GRAY}    Fedora: sudo dnf install python3 python3-pip${NC}"
    echo -e "${GRAY}    macOS: brew install python${NC}"
    ((failed++))
fi

# Optional tools (security scanning)
if [ "$SKIP_OPTIONAL" = false ]; then
    # 8. Check TruffleHog
    print_step "Checking TruffleHog (optional)..."
    if command_exists trufflehog; then
        print_success "TruffleHog already installed"
        ((already_installed++))
    else
        print_warning "TruffleHog not found (optional - for secret scanning)"
        echo -e "${GRAY}  Install manually:${NC}"
        if [ "$OS" = "mac" ]; then
            echo -e "${GRAY}    brew install trufflehog${NC}"
        else
            echo -e "${GRAY}    Download from: https://github.com/trufflesecurity/trufflehog/releases${NC}"
            echo -e "${GRAY}    Or use Docker: docker pull trufflesecurity/trufflehog:latest${NC}"
        fi
        ((skipped++))
    fi

    # 9. Check Trivy
    print_step "Checking Trivy (optional)..."
    if command_exists trivy; then
        print_success "Trivy already installed"
        ((already_installed++))
    else
        print_warning "Trivy not found (optional - for security scanning)"
        echo -e "${GRAY}  Install manually:${NC}"
        if [ "$OS" = "mac" ]; then
            echo -e "${GRAY}    brew install trivy${NC}"
        else
            echo -e "${GRAY}    See: https://aquasecurity.github.io/trivy/latest/getting-started/installation/${NC}"
        fi
        ((skipped++))
    fi
else
    print_info "Skipping optional tools (TruffleHog, Trivy)"
fi

# Summary
print_header "📊 Setup Summary"
echo -e "Already installed: ${GREEN}$already_installed${NC}"
echo -e "Newly installed:   ${GREEN}$installed${NC}"
echo -e "Skipped:           ${YELLOW}$skipped${NC}"
echo -e "Failed:            ${RED}$failed${NC}"

if [ "$DRY_RUN" = true ]; then
    echo -e "\n${CYAN}Run without --dry-run to perform actual installation${NC}"
fi

if [ $failed -eq 0 ]; then
    echo -e "\n${GREEN}✅ Setup completed successfully!${NC}"
    echo -e "\n${CYAN}Next steps:${NC}"
    echo -e "${GRAY}  1. Run 'pnpm dev' to start the development server${NC}"
    echo -e "${GRAY}  2. Run 'pnpm test' to run tests${NC}"
    echo -e "${GRAY}  3. Run 'bash .github/scripts/validate-local.sh' to test validation${NC}"
    echo -e "${GRAY}  4. Install git pre-push hook (see .github/hooks/README.md)${NC}"
    exit 0
else
    echo -e "\n${YELLOW}⚠️  Setup completed with $failed error(s)${NC}"
    echo -e "${GRAY}Please address the errors above and run this script again${NC}"
    exit 1
fi
