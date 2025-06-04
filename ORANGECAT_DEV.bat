@echo off
title OrangeCat Development - Clean Start

REM Change to the project directory (update this path if needed)
cd /d "C:\Users\butae\orangecat"

echo.
echo ========================================
echo 🚀 ORANGECAT DEVELOPMENT - CLEAN START
echo ========================================
echo.

echo 🧹 Killing existing Node.js processes...
taskkill /F /IM node.exe >nul 2>&1

echo 🗑️ Clearing cache...
if exist .next rmdir /s /q .next >nul 2>&1
npm cache clean --force >nul 2>&1

echo.
echo 🔧 Starting development server...
echo 📍 URL: http://localhost:3000
echo 🛑 Press Ctrl+C to stop the server
echo.

npm run dev

pause 