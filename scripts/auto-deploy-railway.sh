#!/bin/bash

# TravelBlogr Automated Railway Deployment Script
# This script automates the entire deployment process

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_error() {
    echo -e "${RED}❌${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Header
echo ""
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   TravelBlogr Automated Railway Deployment    ║${NC}"
echo -e "${BLUE}╔════════════════════════════════════════════════╗${NC}"
echo ""

# Step 1: Check prerequisites
print_step "Step 1: Checking prerequisites..."

if ! command_exists git; then
    print_error "Git is not installed. Please install Git first."
    exit 1
fi
print_success "Git is installed"

if ! command_exists node; then
    print_error "Node.js is not installed. Please install Node.js first."
    exit 1
fi
print_success "Node.js is installed ($(node --version))"

if ! command_exists npm; then
    print_error "npm is not installed. Please install npm first."
    exit 1
fi
print_success "npm is installed ($(npm --version))"

# Step 2: Check if we're in the right directory
print_step "Step 2: Verifying project directory..."

if [ ! -f "package.json" ]; then
    print_error "Not in project root directory. Please run this script from the TravelBlogr root."
    exit 1
fi
print_success "In correct directory"

# Step 3: Check git status
print_step "Step 3: Checking git status..."

if [ -n "$(git status --porcelain)" ]; then
    print_warning "You have uncommitted changes. Showing status:"
    git status --short
    echo ""
    read -p "Do you want to continue? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Step 4: Pull latest changes
print_step "Step 4: Pulling latest changes from remote..."

git fetch origin
CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
print_success "Current branch: $CURRENT_BRANCH"

# Step 5: Run pre-deployment checks
print_step "Step 5: Running pre-deployment checks..."

cd apps/web

# Check TypeScript
print_step "  → Running TypeScript check..."
if npm run type-check; then
    print_success "TypeScript check passed"
else
    print_error "TypeScript check failed. Please fix errors before deploying."
    exit 1
fi

# Check ESLint
print_step "  → Running ESLint..."
if npm run lint; then
    print_success "ESLint check passed"
else
    print_warning "ESLint warnings found. Review them before deploying."
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        print_error "Deployment cancelled."
        exit 1
    fi
fi

# Test production build
print_step "  → Testing production build..."
if npm run build; then
    print_success "Production build successful"
else
    print_error "Production build failed. Please fix errors before deploying."
    exit 1
fi

cd ../..

# Step 6: Verify Dockerfile
print_step "Step 6: Verifying Dockerfile configuration..."

if grep -q "ARG NEXT_PUBLIC_SUPABASE_URL" Dockerfile; then
    print_success "Dockerfile has ARG declarations for env vars"
else
    print_error "Dockerfile missing ARG declarations. Please update Dockerfile."
    exit 1
fi

# Step 7: Check environment variables documentation
print_step "Step 7: Checking environment variables..."

echo ""
echo -e "${YELLOW}Required Railway Environment Variables:${NC}"
echo "  - NEXT_PUBLIC_SUPABASE_URL"
echo "  - NEXT_PUBLIC_SUPABASE_ANON_KEY"
echo "  - SUPABASE_SERVICE_ROLE_KEY"
echo "  - GROQ_API_KEY"
echo "  - NODE_ENV=production"
echo ""

read -p "Have you set all environment variables in Railway? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_warning "Please set environment variables in Railway first:"
    echo "  1. Go to Railway → Your Project → Variables tab"
    echo "  2. Add all required variables"
    echo "  3. Run this script again"
    exit 1
fi

# Step 8: Commit changes
print_step "Step 8: Preparing deployment commit..."

if [ -n "$(git status --porcelain)" ]; then
    echo ""
    echo "Files to be committed:"
    git status --short
    echo ""
    
    read -p "Enter commit message (or press Enter for default): " COMMIT_MSG
    
    if [ -z "$COMMIT_MSG" ]; then
        COMMIT_MSG="fix: Add ARG declarations for Railway env vars during build"
    fi
    
    git add .
    git commit -m "$COMMIT_MSG"
    print_success "Changes committed: $COMMIT_MSG"
else
    print_warning "No changes to commit. Will trigger rebuild anyway."
    
    # Create empty commit to trigger rebuild
    git commit --allow-empty -m "chore: Trigger Railway rebuild for env vars"
    print_success "Empty commit created to trigger rebuild"
fi

# Step 9: Push to remote
print_step "Step 9: Pushing to remote repository..."

echo ""
read -p "Push to branch '$CURRENT_BRANCH'? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Deployment cancelled. Changes are committed locally but not pushed."
    exit 1
fi

if git push origin "$CURRENT_BRANCH"; then
    print_success "Pushed to $CURRENT_BRANCH"
else
    print_error "Failed to push to remote. Please check your git configuration."
    exit 1
fi

# Step 10: Deployment summary
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║          Deployment Initiated Successfully     ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════╝${NC}"
echo ""

print_success "All pre-deployment checks passed"
print_success "Changes pushed to $CURRENT_BRANCH"
print_success "Railway will now rebuild your application"

echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo "  1. Go to Railway dashboard"
echo "  2. Monitor the build logs"
echo "  3. Look for: '✅ All required environment variables are set'"
echo "  4. Wait for deployment to complete"
echo "  5. Test your application"
echo ""

echo -e "${YELLOW}Monitoring Tips:${NC}"
echo "  - Build should complete in 5-10 minutes"
echo "  - Watch for any error messages in logs"
echo "  - Verify app starts with 'Ready in XXXms'"
echo ""

echo -e "${BLUE}Troubleshooting:${NC}"
echo "  - If build fails: Check docs/RAILWAY_ENV_VARS_TROUBLESHOOTING.md"
echo "  - If env vars missing: Verify Railway Variables tab"
echo "  - If app crashes: Check Railway deployment logs"
echo ""

print_success "Deployment script completed successfully!"
echo ""

