@echo off
echo ========================================
echo DSA FlashMem - FULL CLEAN RESTART
echo ========================================

echo.
echo [1/7] Stopping any running development server...
taskkill /f /im node.exe 2>nul
taskkill /f /im npm.cmd 2>nul
timeout /t 3 /nobreak >nul

echo.
echo [2/7] Removing build artifacts...
if exist "dist" rmdir /s /q "dist"
if exist ".vite" rmdir /s /q ".vite"
if exist "node_modules\.vite" rmdir /s /q "node_modules\.vite"
echo Build artifacts removed.

echo.
echo [3/7] Clearing all caches...
npm cache clean --force

echo.
echo [4/7] Removing node_modules for fresh install...
if exist "node_modules" (
    echo Removing node_modules...
    rmdir /s /q "node_modules"
)
if exist "package-lock.json" del "package-lock.json"

echo.
echo [5/7] Fresh install of dependencies...
npm install
if errorlevel 1 (
    echo ERROR: Dependency installation failed
    pause
    exit /b 1
)

echo.
echo [6/7] Building production version...
npm run build
if errorlevel 1 (
    echo ERROR: Build failed
    pause
    exit /b 1
)

echo.
echo [7/7] Starting development server...
echo.
echo ========================================
echo 🚀 DSA FlashMem Starting...
echo ========================================
echo 📍 URL: http://localhost:5173
echo 🔧 Press Ctrl+C to stop the server
echo 📱 Browser should open automatically
echo ========================================
echo.

timeout /t 2 /nobreak >nul

npm run dev

pause