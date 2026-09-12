@echo off
chcp 65001 >nul
title 笔心 · AI 写作工作室 - 桌面客户端
cd /d "%~dp0"

echo ========================================================
echo          笔心 · AI 写作工作室 - 桌面客户端启动器
echo ========================================================
echo.
echo 正在启动桌面端 Electron 窗口...
echo.

npm run dev:desktop

pause