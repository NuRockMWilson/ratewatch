@echo off
title RateWatch
echo Starting RateWatch...

:: Navigate to the app directory
cd /d "%~dp0"

:: Check if node_modules exists, install if not
if not exist "node_modules\" (
    echo Installing dependencies for the first time...
    npm install
)

:: Open browser after short delay (gives server time to start)
start "" cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:3047"

:: Start Next.js on port 3047
npm run dev
