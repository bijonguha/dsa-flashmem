#!/bin/bash

echo "========================================"
echo "DSA FlashMem - Debug Startup"
echo "========================================"

# Check if we're in the right directory
echo
echo "Current directory: $(pwd)"
echo "Checking for required files..."

if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Make sure you're in the project root."
    exit 1
fi

if [ ! -f "vite.config.ts" ]; then
    echo "❌ vite.config.ts not found."
    exit 1
fi

echo "✅ Required files found."

# Check Node version
echo
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

# Check if dependencies are installed
if [ ! -d "node_modules" ]; then
    echo
    echo "Installing dependencies..."
    npm install
fi

# Quick syntax check
echo
echo "Running TypeScript check..."
npx tsc --noEmit

if [ $? -ne 0 ]; then
    echo "❌ TypeScript errors found. Please fix them first."
    exit 1
fi

echo "✅ TypeScript check passed."

# Start with verbose output
echo
echo "========================================"
echo "Starting development server with debug info..."
echo "========================================"

npm run dev -- --host 0.0.0.0 --port 5173 --open