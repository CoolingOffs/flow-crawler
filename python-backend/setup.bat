@echo off
chcp 65001 >nul
echo ============================================
echo   爬虫流程执行引擎 - 环境配置
echo ============================================
echo.

echo [1/3] 安装 Python 依赖...
pip install -r requirements.txt
if errorlevel 1 (
    echo ✗ Python 依赖安装失败
    pause
    exit /b 1
)
echo ✓ Python 依赖安装完成
echo.

echo [2/3] 安装 Playwright 浏览器...
python -m playwright install chromium
if errorlevel 1 (
    echo ✗ Playwright 浏览器安装失败
    pause
    exit /b 1
)
echo ✓ Playwright 浏览器安装完成
echo.

echo [3/3] 验证安装...
python -c "import playwright; print('✓ Playwright 已安装')"
python -c "import requests; print('✓ Requests 已安装')"
python -c "import fastapi; print('✓ FastAPI 已安装')"
python -c "import jsonpath_ng; print('✓ JSONPath-NG 已安装')"
echo.

echo ============================================
echo ✅ 环境配置完成！
echo ============================================
echo.
echo 下一步:
echo 1. 运行示例: python main.py data\flows\example_config.json
echo 2. 启动 API 服务器: python server.py
echo ============================================
pause
