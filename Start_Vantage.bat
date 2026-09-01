@echo off
:: ==========================================================================
:: Vantage PRM - Start Server
::
:: Serves this folder on http://localhost:5000 and opens it in Chrome app mode.
:: Pair: Stop_Vantage.bat stops it.
::
:: RECREATED 2026-09-01 after the original went missing from the repo root
:: (noticed when the app could not be restarted). Written from the spec in
:: ai/DECLARATIONS.md - "Start_Vantage.bat -> npx serve (Python http.server
:: fallback) on http://localhost:5000, opening Chrome in app mode."
::
:: The server runs in ITS OWN WINDOW so this one can close. Leave that window
:: open - closing it stops the server.
:: ==========================================================================

cd /d "%~dp0"

echo Starting Vantage PRM on http://localhost:5000 ...
echo.

:: --- Preferred: npx serve --------------------------------------------------
where npx >nul 2>nul
if %ERRORLEVEL%==0 (
  start "Vantage PRM Server" cmd /k "npx serve -l 5000 ."
  goto openbrowser
)

:: --- Fallback: Python's built-in static server -----------------------------
where python >nul 2>nul
if %ERRORLEVEL%==0 (
  start "Vantage PRM Server" cmd /k "python -m http.server 5000"
  goto openbrowser
)

echo ERROR: neither "npx" nor "python" was found on PATH.
echo Install Node.js (which provides npx) or Python, then run this again.
echo.
pause
exit /b 1

:openbrowser
:: Give the server a moment to bind the port before Chrome asks for it.
timeout /t 3 >nul
start chrome --app=http://localhost:5000
exit
