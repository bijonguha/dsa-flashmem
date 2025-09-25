#!/bin/bash

echo "========================================"
echo "DSA FlashMem - Clean Restart Script"
echo "========================================"

echo
echo "[1/5] Stopping any running development server..."
# Kill any node processes that might be running the dev server
pkill -f "vite\|npm.*dev" 2>/dev/null || echo "No running dev server found."
sleep 2

echo
echo "[2/5] Removing existing build directory..."
if [ -d "dist" ]; then
    rm -rf dist
    echo "Build directory removed."
else
    echo "No existing build directory found."
fi

echo
echo "[3/5] Clearing npm cache and node_modules..."
npm cache clean --force

# For a deep clean, uncomment the next lines:
echo "Performing deep clean of node_modules..."
rm -rf node_modules package-lock.json
echo "Deep clean completed."

echo
echo "[4/5] Installing dependencies and building..."
npm install
npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed. Check the errors above."
    exit 1
fi

echo
echo "[5/5] Starting development server..."
echo
echo "========================================"
echo "Opening DSA FlashMem in development mode"
echo "App will be available at: http://localhost:5173"
echo "Press Ctrl+C to stop the server"
echo "========================================"
echo

npm run dev