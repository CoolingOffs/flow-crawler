"""
流程执行器 - 负责执行整个流程
"""
import json
from typing import Dict, Any, List
from playwright.sync_api import sync_playwright, Browser, Page, BrowserContext
from app.core.variable_manager import VariableManager
from app.core.command_handler import CommandHandler
from app.core.logger import setup_logger

logger = setup_logger()

class FlowExecutor:
    """流程执行器"""
    
    def __init__(self, config: Dict[str, Any], playwright=None, browser=None, context=None, page=None):
        """
        初始化执行器
        
        Args:
            config: 流程配置 JSON
            playwright: Playwright 实例（可选，用于共享浏览器）
            browser: 浏览器实例（可选，用于共享浏览器）
            context: 浏览器上下文实例（可选，用于共享浏览器）
            page: 页面实例（可选，用于共享浏览器）
        """
        self.config = config
        self.playwright = playwright
        self.browser: Browser = browser
        self.context: BrowserContext = context
        self.page: Page = page
        self.var_manager = VariableManager()
        self.command_handler: CommandHandler = None
        self._shared_browser = playwright is not None  # 是否使用共享浏览器
    
    def run(self) -> None:
        """执行流程"""
        logger.info("=" * 60)
        logger.info(f"开始执行流程: {self.config.get('name', '未命名')}")
        logger.info(f"版本: {self.config.get('version', '1.0')}")
        logger.info("=" * 60)
        
        # 初始化浏览器
        self._init_browser()
        
        # 创建命令处理器
        self.command_handler = CommandHandler(self.page, self.browser, self.var_manager)
        
        # 执行所有任务组
        tasks = self.config.get('task', [])
        
        for task_index, task_group in enumerate(tasks, 1):
            logger.info(f"\n{'='*60}")
            logger.info(f"任务组 {task_index}: {task_group.get('name', '未命名')}")
            logger.info(f"{'='*60}")
            
            actions = task_group.get('action', [])
            
            for action in actions:
                self._execute_action(action)
        
        logger.info("\n" + "=" * 60)
        logger.info("✓ 所有任务执行完成")
        logger.info("=" * 60)
        
        # 打印所有变量
        self._print_variables()
    
    def _init_browser(self) -> None:
        """初始化浏览器"""
        # 如果使用共享浏览器，不需要再次初始化
        if self._shared_browser:
            logger.info("使用全局浏览器实例（浏览器将保持打开）")
            return
        
        logger.info("正在启动浏览器...")
        
        self.playwright = sync_playwright().start()
        
        # 启动浏览器（可见模式）
        self.browser = self.playwright.chromium.launch(
            headless=False,  # 设置为 False 可以看到浏览器操作
            slow_mo=100,     # 每个操作延迟 100ms
            args=['--start-maximized']
        )
        
        # 创建浏览器上下文
        self.context = self.browser.new_context(
            viewport={'width': 1920, 'height': 1080},
            locale='zh-CN'
        )
        
        # 创建页面
        self.page = self.context.new_page()
        
        logger.info("✓ 浏览器已启动")
    
    def _execute_action(self, action: Dict[str, Any]) -> None:
        """
        执行单个 Action
        
        Args:
            action: Action 配置
        """
        action_id = action.get('id', 0)
        action_name = action.get('name', '未命名')
        action_type = action.get('type', 'once')
        commands = action.get('commands', [])
        
        logger.info(f"\n{'─'*60}")
        logger.info(f"执行 Action {action_id}: {action_name} (类型: {action_type})")
        logger.info(f"{'─'*60}")
        
        try:
            # 执行所有命令
            for cmd_index, command in enumerate(commands, 1):
                logger.info(f"\n[步骤 {cmd_index}/{len(commands)}]")
                self.command_handler.execute(command)
            
            logger.info(f"✓ Action {action_id} 执行完成")
            
        except Exception as e:
            logger.error(f"✗ Action {action_id} 执行失败: {e}", exc_info=True)
            raise
    
    def _print_variables(self) -> None:
        """打印所有变量"""
        variables = self.var_manager.list_all()
        
        if not variables:
            logger.info("\n未创建任何变量")
            return
        
        logger.info(f"\n{'='*60}")
        logger.info(f"变量列表 ({len(variables)} 个)")
        logger.info(f"{'='*60}")
        
        for name, value in variables.items():
            # 截断过长的值
            value_str = str(value)
            if len(value_str) > 100:
                value_str = value_str[:100] + "..."
            
            logger.info(f"  ${name} = {value_str}")
        
        logger.info(f"{'='*60}\n")
    
    def cleanup(self, close_browser: bool = False) -> None:
        """
        清理资源
        
        Args:
            close_browser: 是否关闭浏览器（默认 False，保持浏览器打开）
        """
        logger.info("\n正在清理资源...")
        
        # 如果使用共享浏览器，永远不关闭
        if self._shared_browser:
            logger.info("ℹ 使用全局浏览器实例，浏览器保持打开状态")
            return
        
        if close_browser:
            if self.browser:
                self.browser.close()
                logger.info("✓ 浏览器已关闭")
            
            if self.playwright:
                self.playwright.stop()
                logger.info("✓ Playwright 已停止")
        else:
            logger.info("ℹ 浏览器保持打开状态（如需关闭请手动关闭）")
        
        logger.info("✓ 资源清理完成")
    
    def __enter__(self):
        """上下文管理器入口"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """上下文管理器出口"""
        self.cleanup()
