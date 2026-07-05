@echo off
:: Vantage PRM - Stop Server
:: This script stops any running Vantage background node server processes.

echo Stopping Vantage PRM server...
powershell -Command "Stop-Process -Name node -ErrorAction SilentlyContinue"
echo Vantage PRM server has been stopped.
timeout /t 2 >nul
exit
