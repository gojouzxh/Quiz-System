@echo off
cd /d "%~dp0"

python --version >nul 2>&1
if not errorlevel 1 (
    echo Serving static site on http://localhost:8080/
    python -m http.server 8080
    exit /b %errorlevel%
)

npm --version >nul 2>&1
if not errorlevel 1 (
    echo Serving static site on http://localhost:8080/
    npx --yes http-server . -p 8080
    exit /b %errorlevel%
)

echo Serving static site on http://localhost:8080/
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0start-server.ps1" -Port 8080