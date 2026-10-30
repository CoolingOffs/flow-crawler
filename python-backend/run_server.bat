@echo off
chcp 65001 >nul
echo ============================================
echo   启动 API 服务器
echo ============================================
echo.
echo 服务器地址: http://localhost:8000
echo API 文档: http://localhost:8000/docs
echo.
echo 按 Ctrl+C 停止服务器
echo ============================================
echo.
python server.py
pause
