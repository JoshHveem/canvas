@echo off
setlocal
set "build_exit_code=1"
cd /d "%~dp0feature-manager"
if errorlevel 1 goto finished

where node >nul 2>&1
if errorlevel 1 (
  echo Node.js is required. Install Node.js, then run this file again.
  goto finished
)
where npm.cmd >nul 2>&1
if errorlevel 1 (
  echo npm is required. Reinstall Node.js with npm, then run this file again.
  goto finished
)

if not exist "node_modules\esbuild\package.json" goto install
if not exist "node_modules\terser\package.json" goto install
goto build

:install
echo Installing build dependencies...
call npm.cmd ci --no-audit --no-fund
if errorlevel 1 (
  echo Dependency installation failed. See the error above.
  goto finished
)

:build
echo Building Canvas v2 feature bundles and loaders...
call npm.cmd run build
if errorlevel 1 (
  echo Build failed. See the error above.
  goto finished
)
set "build_exit_code=0"
echo.
echo Build complete. Deploy the updated custom_features_v2 bundles and scripts_v2 files.
echo This file does not deploy files or change the Canvas cache version.

:finished
echo.
if /i not "%~1"=="--no-pause" pause
exit /b %build_exit_code%
