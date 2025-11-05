#!/bin/bash
# Pre-push validation script
# Run all CI validation checks locally before pushing

set -e  # Exit on error

echo "🔍 Running pre-push validation checks..."
echo "========================================"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
ERRORS=0
WARNINGS=0

# Function to print status
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2${NC}"
    else
        echo -e "${RED}❌ $2${NC}"
        ERRORS=$((ERRORS + 1))
    fi
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    WARNINGS=$((WARNINGS + 1))
}

# 1. Security audit with trivy (if installed)
echo "1️⃣  Running security audit..."
if command -v trivy &> /dev/null; then
    if trivy fs . --severity CRITICAL,HIGH --exit-code 1 --quiet 2>&1; then
        print_status 0 "No critical/high vulnerabilities found"
    else
        print_status 1 "Security vulnerabilities found"
    fi
else
    print_warning "trivy not installed - skipping security scan"
    echo "  Install: https://aquasecurity.github.io/trivy/"
fi
echo ""

# 2. Markdown linting
echo "2️⃣  Linting Markdown files..."
if command -v markdownlint-cli2 &> /dev/null; then
    if markdownlint-cli2 "**/*.md" "#node_modules" "#.local" 2>&1; then
        print_status 0 "Markdown files are valid"
    else
        print_status 1 "Markdown linting failed"
    fi
else
    print_warning "markdownlint-cli2 not installed - skipping markdown lint"
    echo "  Install: npm install -g markdownlint-cli2"
fi
echo ""

# 3. YAML linting
echo "3️⃣  Linting YAML files..."
if command -v yamllint &> /dev/null; then
    error_found=0
    for file in .github/workflows/*.yml; do
        if [ -f "$file" ]; then
            if ! yamllint "$file" 2>&1; then
                error_found=1
            fi
        fi
    done
    if [ $error_found -eq 0 ]; then
        print_status 0 "YAML files are valid"
    else
        print_status 1 "YAML linting failed"
    fi
else
    print_warning "yaml-lint not installed - skipping YAML lint"
    echo "  Install: npm install -g yaml-lint"
fi
echo ""

# 4. Check for TODO/FIXME in production code
echo "4️⃣  Checking for TODO/FIXME comments..."
if grep -r "TODO\|FIXME" src/ public/ --exclude-dir=node_modules 2>/dev/null; then
    print_warning "Found TODO/FIXME comments in production code"
    echo "  Consider creating issues for these items"
else
    echo -e "${GREEN}✅ No TODO/FIXME comments in production code${NC}"
fi
echo ""

# 5. Validate file permissions
echo "5️⃣  Validating file permissions..."
if find src/ public/ -type f -executable -not -path "*/node_modules/*" 2>/dev/null | grep -v ".sh$"; then
    print_status 1 "Found unexpected executable files"
else
    print_status 0 "File permissions OK"
fi
echo ""

# 6. Check for large files
echo "6️⃣  Checking for large files (>1MB)..."
large_files=$(find . -type f -size +1M -not -path "*/node_modules/*" -not -path "*/.git/*" -not -path "*/.local/*" 2>/dev/null || true)
if [ -n "$large_files" ]; then
    print_warning "Large files found:"
    echo "$large_files" | while read -r file; do
        size=$(du -h "$file" | cut -f1)
        echo "    $size - $file"
    done
else
    echo -e "${GREEN}✅ No large files found${NC}"
fi
echo ""

# 7. Run production build/test checks if code changed
echo "7️⃣  Checking if production code changed..."
PROD_FILES_CHANGED=$(git diff --cached --name-only | grep -E "^(src/|public/|index.html|vite.config.ts|tsconfig.json|package.json|pnpm-lock.yaml|playwright.config.ts|scripts/|.github/scripts/)" || true)

if [ -n "$PROD_FILES_CHANGED" ]; then
    echo -e "${YELLOW}Production code changes detected. Running build checks...${NC}"
    echo ""
    
    # Lint
    echo "  📝 Linting code..."
    if pnpm run lint 2>&1; then
        print_status 0 "Linting passed"
    else
        print_status 1 "Linting failed"
    fi
    echo ""
    
    # Type check and build
    echo "  🏗️  Type checking and building..."
    if pnpm run build 2>&1; then
        print_status 0 "Build passed"
    else
        print_status 1 "Build failed"
    fi
    echo ""
    
    # Tests
    echo "  🧪 Running tests..."
    if pnpm test -- --run 2>&1; then
        print_status 0 "Tests passed"
    else
        print_status 1 "Tests failed"
    fi
    echo ""
else
    echo -e "${GREEN}✅ No production code changes - skipping build checks${NC}"
    echo ""
fi

# Summary
echo "========================================"
echo "📊 Validation Summary"
echo "========================================"
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All checks passed!${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s) (non-blocking)${NC}"
    fi
    echo ""
    echo "Safe to push! 🚀"
    exit 0
else
    echo -e "${RED}❌ $ERRORS error(s) found${NC}"
    if [ $WARNINGS -gt 0 ]; then
        echo -e "${YELLOW}⚠️  $WARNINGS warning(s)${NC}"
    fi
    echo ""
    echo "Please fix the errors before pushing."
    echo ""
    echo "To skip validation: git push --no-verify"
    exit 1
fi
