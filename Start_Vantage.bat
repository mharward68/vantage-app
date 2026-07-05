@echo off
:: Vantage PRM - Silent Background Launcher
cd /d "%~dp0"

:: Kill anything already on port 5000
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5000 "') do (
    taskkill /F /PID %%a >nul 2>&1
)
timeout /t 1 >nul

:: Try npx (check PATH and common install locations)
set NPX=
where npx >nul 2>&1 && set NPX=npx
if not defined NPX (
    if exist "%ProgramFiles%\nodejs\npx.cmd" set NPX="%ProgramFiles%\nodejs\npx.cmd"
)
if not defined NPX (
    if exist "%APPDATA%\npm\npx.cmd" set NPX="%APPDATA%\npm\npx.cmd"
)

if defined NPX (
    powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c cd /d ""%~dp0"" && %NPX% serve -l 5000 .' -WindowStyle Hidden"
    timeout /t 3 >nul
    start http://localhost:5000
    exit /b
)

:: Try Python
set PYTHON=
where python >nul 2>&1 && set PYTHON=python
if not defined PYTHON (
    where python3 >nul 2>&1 && set PYTHON=python3
)
if not defined PYTHON (
    if exist "%LOCALAPPDATA%\Programs\Python\Python3*\python.exe" (
        for /f %%i in ('dir /b "%LOCALAPPDATA%\Programs\Python\Python3*\python.exe" 2^>nul') do set PYTHON="%%i"
    )
)

if defined PYTHON (
    powershell -WindowStyle Hidden -Command "Start-Process %PYTHON% -ArgumentList '-m http.server 5000' -WorkingDirectory '%~dp0' -WindowStyle Hidden"
    timeout /t 3 >nul
    start http://localhost:5000
    exit /b
)

:: Nothing found — tell the user
echo ERROR: Could not find Node.js (npx) or Python.
echo.
echo Install Node.js from https://nodejs.org  OR  Python from https://python.org
echo Then run this file again.
pause
