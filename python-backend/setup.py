"""
环境配置脚本
"""
import subprocess
import sys

def install_dependencies():
    """安装依赖"""
    print("=" * 60)
    print("安装 Python 依赖...")
    print("=" * 60)
    
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✓ Python 依赖安装完成")
    except subprocess.CalledProcessError as e:
        print(f"✗ Python 依赖安装失败: {e}")
        sys.exit(1)

def install_playwright():
    """安装 Playwright 浏览器"""
    print("\n" + "=" * 60)
    print("安装 Playwright 浏览器...")
    print("=" * 60)
    
    try:
        subprocess.check_call([sys.executable, "-m", "playwright", "install", "chromium"])
        print("✓ Playwright 浏览器安装完成")
    except subprocess.CalledProcessError as e:
        print(f"✗ Playwright 浏览器安装失败: {e}")
        sys.exit(1)

def verify_installation():
    """验证安装"""
    print("\n" + "=" * 60)
    print("验证安装...")
    print("=" * 60)
    
    try:
        import playwright
        print("✓ Playwright 已安装")
        
        import requests
        print("✓ Requests 已安装")
        
        import fastapi
        print("✓ FastAPI 已安装")
        
        import jsonpath_ng
        print("✓ JSONPath-NG 已安装")
        
        print("\n✓ 所有依赖验证通过")
    except ImportError as e:
        print(f"✗ 依赖验证失败: {e}")
        sys.exit(1)

def main():
    """主函数"""
    print("\n🚀 开始配置爬虫流程执行引擎环境\n")
    
    install_dependencies()
    install_playwright()
    verify_installation()
    
    print("\n" + "=" * 60)
    print("✅ 环境配置完成！")
    print("=" * 60)
    print("\n下一步:")
    print("1. 运行示例: python main.py data/flows/example_config.json")
    print("2. 启动 API 服务器: python server.py")
    print("=" * 60)

if __name__ == "__main__":
    main()
