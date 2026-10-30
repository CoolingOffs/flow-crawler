"""
爬虫流程执行引擎 - 主入口
"""
import json
import sys
from pathlib import Path
from app.core.executor import FlowExecutor
from app.core.logger import setup_logger

logger = setup_logger()

def main():
    """主函数：读取 JSON 配置并执行"""
    if len(sys.argv) < 2:
        logger.error("请提供 JSON 配置文件路径")
        print("用法: python main.py <config.json>")
        sys.exit(1)
    
    config_path = sys.argv[1]
    
    # 读取配置文件
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            config = json.load(f)
        logger.info(f"✓ 成功加载配置: {config.get('name', '未命名')}")
    except FileNotFoundError:
        logger.error(f"配置文件不存在: {config_path}")
        sys.exit(1)
    except json.JSONDecodeError as e:
        logger.error(f"JSON 解析失败: {e}")
        sys.exit(1)
    
    # 创建执行器并运行
    executor = FlowExecutor(config)
    
    try:
        executor.run()
        logger.info("✓ 流程执行完成")
        logger.info("\n" + "="*60)
        logger.info("浏览器保持打开状态，您可以查看结果")
        logger.info("按 Enter 键关闭浏览器并退出...")
        logger.info("="*60)
        input()
    except KeyboardInterrupt:
        logger.warning("用户中断执行")
    except Exception as e:
        logger.error(f"执行失败: {e}", exc_info=True)
    finally:
        executor.cleanup(close_browser=True)

if __name__ == "__main__":
    main()
