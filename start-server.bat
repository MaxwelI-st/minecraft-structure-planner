@echo off
chcp 65001 >nul
title Structure Material Planner - Dev Server
cd /d "%~dp0"

echo ============================================
echo  Structure Material Planner - Dev Server
echo ============================================
echo.

REM --- 1) Try npm (Vite) ---
where npm >nul 2>nul
if not errorlevel 1 (
    if not exist "node_modules\vite" (
        echo [npm] node_modules not found. Running npm install ...
        call npm install
    )
    echo [npm] Starting Vite at http://localhost:3000/
    echo Press Ctrl+C to stop.
    echo.
    call npm run dev
    goto :end
)

REM --- 2) Fallback: Python http.server ---
where python >nul 2>nul
if not errorlevel 1 (
    echo [python] Starting http.server at http://localhost:8000/
    start "" "http://localhost:8000/"
    python -m http.server 8000
    goto :end
)

where py >nul 2>nul
if not errorlevel 1 (
    echo [py] Starting http.server at http://localhost:8000/
    start "" "http://localhost:8000/"
    py -m http.server 8000
    goto :end
)

echo ============================================
echo  ERROR: Neither npm nor python was found.
echo  Please install one of:
echo    - Node.js: https://nodejs.org/
echo    - Python : https://www.python.org/downloads/
echo ============================================
pause

:end
