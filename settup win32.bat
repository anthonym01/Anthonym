@echo off
npm i electron & npm i asar & npm i electron-store & npm i electron-window-state & yarn add electron-builder --dev & echo "Electron environment should be ready to go" || echo "Failed to install, this may be because npm or nodejs or yarn is broken"
pause