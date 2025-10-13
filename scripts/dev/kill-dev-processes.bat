@echo off
echo Killing all Node.js processes to free up ports...
powershell "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
echo Node.js processes terminated.
echo Ports should now be available for development.
pause 