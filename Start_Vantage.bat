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

:: Make sure node.exe resolves even if PATH hasn't refreshed since Node was installed
if exist "%ProgramFiles%\nodejs\node.exe" set "PATH=%ProgramFiles%\nodejs;%PATH%"

if defined NPX (
    powershell -WindowStyle Hidden -Command "Start-Process cmd -ArgumentList '/c cd /d ""%~dp0"" && %NPX% --yes serve -l 5000 .' -WindowStyle Hidden"
    timeout /t 3 >nul
    call :launch_app
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
    call :launch_app
    exit /b
)

:: Nothing found — tell the user
echo ERROR: Could not find Node.js (npx) or Python.
echo.
echo Install Node.js from https://nodejs.org  OR  Python from https://python.org
echo Then run this file again.
pause
exit /b

:launch_app
:: Open Vantage in a chrome-less app window (no tabs/address bar) instead of a normal browser tab
set CHROME="%ProgramFiles%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%ProgramFiles(x86)%\Google\Chrome\Application\chrome.exe"
if not exist %CHROME% set CHROME="%ProgramFiles(x86)%\Microsoft\Edge\Application\msedge.exe"
if not exist %CHROME% set CHROME="%ProgramFiles%\Microsoft\Edge\Application\msedge.exe"

if exist %CHROME% (
    start "" %CHROME% --app=http://localhost:5000 --window-size=1400,900
) else (
    start http://localhost:5000
)
goto :eof
