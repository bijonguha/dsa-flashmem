#!/bin/bash

echo "========================================"
echo "DSA FlashMem - FULL CLEAN RESTART"
echo "========================================"

# Function to print colored output
print_step() {
    echo -e "\033[1;34m[Step $1/$2]\033[0m $3"
}

print_success() {
    echo -e "\033[1;32m✅ $1\033[0m"
}

print_error() {
    echo -e "\033[1;31m❌ $1\033[0m"
}

print_step 1 8 "Killing any running processes..."
pkill -f "vite\|npm.*dev\|node.*vite" 2>/dev/null || echo "No dev server running"
sleep 2
print_success "Processes stopped"

print_step 2 8 "Removing build artifacts..."
rm -rf dist .vite node_modules/.vite 
print_success "Build artifacts removed"

print_step 3 8 "Clearing all caches..."
npm cache clean --force
if command -v yarn &> /dev/null; then
    yarn cache clean 2>/dev/null || echo "Yarn cache clear skipped"
fi
print_success "Caches cleared"

print_step 4 8 "Removing node_modules and lock files..."
rm -rf node_modules package-lock.json yarn.lock pnpm-lock.yaml
print_success "Dependencies removed"

print_step 5 8 "Fresh install of dependencies..."
npm install
if [ $? -ne 0 ]; then
    print_error "Dependency installation failed"
    exit 1
fi
print_success "Dependencies installed"

print_step 6 8 "TypeScript compilation check..."
npx tsc --noEmit
if [ $? -ne 0 ]; then
    print_error "TypeScript errors found - please fix them first"
    exit 1
fi
print_success "TypeScript check passed"

print_step 7 8 "Building production version..."
npm run build
if [ $? -ne 0 ]; then
    print_error "Build failed"
    exit 1
fi
print_success "Build successful"

print_step 8 8 "Starting development server..."
echo
echo "========================================"
echo "🚀 DSA FlashMem Starting..."
echo "========================================"
echo "📍 URL: http://localhost:5173"
echo "🔧 Press Ctrl+C to stop"
echo "📱 Browser should open automatically"
echo "========================================"
echo

# Add a small delay for the user to read the message
sleep 2

# Start the dev server
npm run dev -- --open --host 0.0.0.0