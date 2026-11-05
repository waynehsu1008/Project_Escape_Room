@echo off
setlocal
cd /d "%~dp0"
set "NODE_EXE="
for /f "delims=" %%N in ('where node 2^>nul') do if not defined NODE_EXE set "NODE_EXE=%%N"
if not defined NODE_EXE if exist "%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe" set "NODE_EXE=%USERPROFILE%\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe"
if not defined NODE_EXE (
  echo Node.js was not found. Install Node.js 20 or newer, then try again.
  pause
  exit /b 1
)
echo Open http://127.0.0.1:4173/ in your browser.
echo Keep this window open while playing. Press Ctrl+C to stop.
set "PORT=4173"
"%NODE_EXE%" "%~dp0scripts\serve.mjs"
if errorlevel 1 pause
