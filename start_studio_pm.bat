@echo off
title NS Studio PM Launcher
echo ==================================================
echo         NAUGHTY SOCIETY - STUDIO PM
echo ==================================================
echo.
echo Starting local web server on port 9100...

:: Check if python is installed
where python >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Python is not installed or not in PATH!
    echo Please install Python to run the local server.
    pause
    exit /b
)

:: Start the Python HTTP server on port 9100 in a separate background window
start "NS Studio PM Server" /min python -m http.server 9100

:: Wait 1 second for server to initialize
ping -n 2 127.0.0.1 >nul

:: Open browser
echo Launching Studio PM in default browser...
start http://localhost:9100/index.html

echo.
echo Local server is running in the background.
echo You can close this launcher window now.
ping -n 3 127.0.0.1 >nul
exit
