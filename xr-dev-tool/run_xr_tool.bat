@echo off
SET "NODE_PATH=C:\Users\901969\Documents\node-standalone\node-v22.13.1-win-x64"
SET "PATH=%NODE_PATH%;%PATH%"

echo [XR DEV TOOL] Starting bootstrap...
node xr-loader.js
pause
