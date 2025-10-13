@echo off
REM 🚀 ORANGECAT DEV SCRIPT - NO MORE PORT CONFLICTS!
REM This script ensures a clean development environment every time

echo 🧹 Cleaning up existing development processes...

REM Kill any existing Node.js processes
taskkill /F /IM node.exe >nul 2>&1

REM Wait a moment for processes to fully terminate
timeout /t 2 /nobreak >nul

echo 🗑️ Clearing Next.js cache...

REM Clear Next.js cache
if exist .next rmdir /s /q .next

echo 🔧 Starting development server on port 3000...

REM Start the development server
npm run dev

echo ✅ Development server started successfully! 