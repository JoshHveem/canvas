@echo off
setlocal
cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required but was not found on this computer.
  echo Install Node.js, then run this launcher again.
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo Installing package-manager dependencies...
  call npm.cmd install
  if errorlevel 1 (
    echo.
    echo Installation failed. See the error above.
    pause
    exit /b 1
  )
)

start "Canvas Feature Manager Server" /D "%~dp0" cmd.exe /d /k npm.cmd start
timeout /t 3 /nobreak >nul
start "" "http://localhost:4173"

endlocal
