"""
命令处理器 - 处理各种 action 类型
"""
import time
import json
import requests
from typing import Dict, Any, List, Optional
from playwright.sync_api import Page, Browser, Route
from jsonpath_ng import parse as jsonpath_parse
from app.core.logger import setup_logger
from app.core.variable_manager import VariableManager

logger = setup_logger()

class CommandHandler:
    """命令处理器"""
    
    def __init__(self, page: Page, browser: Browser, var_manager: VariableManager):
        """
        初始化命令处理器
        
        Args:
            page: Playwright 页面对象
            browser: Playwright 浏览器对象
            var_manager: 变量管理器
        """
        self.page = page
        self.browser = browser
        self.var_manager = var_manager
        self.intercepted_requests: List[Dict] = []
    
    def execute(self, command: Dict[str, Any]) -> None:
        """
        执行单个命令
        
        Args:
            command: 命令配置 {action: str, data: dict}
        """
        action = command.get('action')
        data = command.get('data', {})
        
        # 替换变量引用
        data = self.var_manager.replace_in_dict(data)
        
        # 等待 1 秒再执行（让用户看到浏览器操作过程）
        logger.info(f"等待 1 秒后执行命令: {action}")
        time.sleep(1)
        
        logger.info(f"执行命令: {action}")
        logger.debug(f"命令数据: {data}")
        
        try:
            if action == 'openBrower':
                self._handle_open_browser(data)
            elif action == 'clickBrowerElement':
                self._handle_click_element(data)
            elif action == 'wait':
                self._handle_wait(data)
            elif action == 'getText':
                self._handle_get_text(data)
            elif action == 'getAttribute':
                self._handle_get_attribute(data)
            elif action == 'setAttribute':
                self._handle_set_attribute(data)
            elif action == 'httpRequest':
                self._handle_http_request(data)
            elif action == 'jsonExtract':
                self._handle_json_extract(data)
            elif action == 'loop':
                self._handle_loop(data)
            elif action == 'interceptRequest':
                self._handle_intercept_request(data)
            else:
                logger.warning(f"未知命令: {action}")
        except Exception as e:
            logger.error(f"执行命令 {action} 失败: {e}", exc_info=True)
            raise
    
    def _handle_open_browser(self, data: Dict[str, Any]) -> None:
        """处理打开浏览器命令"""
        url = data.get('webUrl', '')
        clear_cache = data.get('clearCache', True)
        finish_wait = data.get('finishwait', 2)
        
        if not url:
            raise ValueError("URL 不能为空")
        
        logger.info(f"打开网址: {url}")
        
        # 清除缓存（可选）
        if clear_cache:
            self.page.context.clear_cookies()
            logger.debug("已清除缓存和 Cookie")
        
        # 导航到 URL
        self.page.goto(url, wait_until='networkidle')
        
        # 等待指定秒数
        if finish_wait > 0:
            time.sleep(finish_wait)
        
        logger.info(f"✓ 网址已打开，等待 {finish_wait} 秒")
    
    def _handle_click_element(self, data: Dict[str, Any]) -> None:
        """处理点击元素命令"""
        selector = data.get('querySelector', '')
        finish_wait = data.get('finishwait', 1)
        
        if not selector:
            raise ValueError("选择器不能为空")
        
        logger.info(f"点击元素: {selector}")
        
        # 等待元素出现并点击
        self.page.wait_for_selector(selector, timeout=10000)
        self.page.click(selector)
        
        # 等待指定秒数
        if finish_wait > 0:
            time.sleep(finish_wait)
        
        logger.info(f"✓ 元素已点击，等待 {finish_wait} 秒")
    
    def _handle_wait(self, data: Dict[str, Any]) -> None:
        """处理等待命令"""
        seconds = data.get('seconds', 1)
        
        logger.info(f"等待 {seconds} 秒...")
        time.sleep(seconds)
        logger.info(f"✓ 等待完成")
    
    def _handle_get_text(self, data: Dict[str, Any]) -> None:
        """处理获取文本命令"""
        selector = data.get('querySelector', '')
        variable_name = data.get('variableName', '')
        text_type = data.get('textType', 'innerText')
        
        if not selector or not variable_name:
            raise ValueError("选择器和变量名不能为空")
        
        logger.info(f"获取文本: {selector} → ${variable_name}")
        
        # 等待元素
        self.page.wait_for_selector(selector, timeout=10000)
        
        # 获取文本
        element = self.page.query_selector(selector)
        if not element:
            raise ValueError(f"找不到元素: {selector}")
        
        if text_type == 'innerText':
            text = element.inner_text()
        elif text_type == 'innerHTML':
            text = element.inner_html()
        else:
            text = element.text_content() or ''
        
        # 存储到变量
        self.var_manager.set(variable_name, text)
        logger.info(f"✓ 已获取文本并存储到 ${variable_name}")
    
    def _handle_get_attribute(self, data: Dict[str, Any]) -> None:
        """处理获取属性命令"""
        selector = data.get('querySelector', '')
        variable_name = data.get('variableName', '')
        attribute_name = data.get('attributeName', '')
        
        if not selector or not variable_name or not attribute_name:
            raise ValueError("选择器、变量名和属性名不能为空")
        
        logger.info(f"获取属性: {selector}.{attribute_name} → ${variable_name}")
        
        # 等待元素
        self.page.wait_for_selector(selector, timeout=10000)
        
        # 获取属性
        element = self.page.query_selector(selector)
        if not element:
            raise ValueError(f"找不到元素: {selector}")
        
        value = element.get_attribute(attribute_name)
        
        # 存储到变量
        self.var_manager.set(variable_name, value)
        logger.info(f"✓ 已获取属性 {attribute_name} = {value}")
    
    def _handle_set_attribute(self, data: Dict[str, Any]) -> None:
        """处理设置属性命令"""
        selector = data.get('querySelector', '')
        attribute_name = data.get('attributeName', '')
        attribute_value = data.get('attributeValue', '')
        
        if not selector or not attribute_name:
            raise ValueError("选择器和属性名不能为空")
        
        logger.info(f"设置属性: {selector}.{attribute_name} = {attribute_value}")
        
        # 等待元素
        self.page.wait_for_selector(selector, timeout=10000)
        
        # 设置属性
        self.page.evaluate(f"""
            (() => {{
                const el = document.querySelector('{selector}');
                if (el) {{
                    el.setAttribute('{attribute_name}', '{attribute_value}');
                    // 触发 input 事件（用于表单元素）
                    if (['input', 'textarea', 'select'].includes(el.tagName.toLowerCase())) {{
                        el.value = '{attribute_value}';
                        el.dispatchEvent(new Event('input', {{ bubbles: true }}));
                        el.dispatchEvent(new Event('change', {{ bubbles: true }}));
                    }}
                }}
            }})()
        """)
        
        logger.info(f"✓ 已设置属性")
    
    def _handle_http_request(self, data: Dict[str, Any]) -> None:
        """处理 HTTP 请求命令"""
        method = data.get('method', 'GET')
        url = data.get('url', '')
        headers = data.get('headers', {})
        body = data.get('body', {})
        variable_name = data.get('variableName', '')
        timeout = data.get('timeout', 30)
        
        if not url or not variable_name:
            raise ValueError("URL 和变量名不能为空")
        
        logger.info(f"发送 HTTP 请求: {method} {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=timeout)
            elif method == 'POST':
                response = requests.post(url, headers=headers, json=body, timeout=timeout)
            elif method == 'PUT':
                response = requests.put(url, headers=headers, json=body, timeout=timeout)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=timeout)
            else:
                raise ValueError(f"不支持的 HTTP 方法: {method}")
            
            # 尝试解析 JSON
            try:
                response_data = response.json()
            except:
                response_data = response.text
            
            # 存储到变量
            self.var_manager.set(variable_name, response_data)
            logger.info(f"✓ HTTP 请求完成，状态码: {response.status_code}")
            
        except requests.RequestException as e:
            logger.error(f"HTTP 请求失败: {e}")
            raise
    
    def _handle_json_extract(self, data: Dict[str, Any]) -> None:
        """处理 JSON 提取命令"""
        source_variable = data.get('sourceVariable', '')
        json_path = data.get('jsonPath', '')
        variable_name = data.get('variableName', '')
        extract_all = data.get('extractAll', False)
        
        if not source_variable or not json_path or not variable_name:
            raise ValueError("来源变量、JSONPath 和变量名不能为空")
        
        logger.info(f"JSON 提取: {json_path} → ${variable_name}")
        
        # 获取源数据
        source_data = self.var_manager.get(source_variable)
        if source_data is None:
            raise ValueError(f"来源变量不存在: {source_variable}")
        
        # 如果是字符串，尝试解析为 JSON
        if isinstance(source_data, str):
            try:
                source_data = json.loads(source_data)
            except json.JSONDecodeError:
                raise ValueError(f"来源数据不是有效的 JSON: {source_variable}")
        
        # 使用 JSONPath 提取
        expr = jsonpath_parse(json_path)
        matches = expr.find(source_data)
        
        if not matches:
            logger.warning(f"JSONPath 未匹配到数据: {json_path}")
            result = [] if extract_all else None
        else:
            if extract_all:
                result = [match.value for match in matches]
            else:
                result = matches[0].value
        
        # 存储到变量
        self.var_manager.set(variable_name, result)
        logger.info(f"✓ 已提取数据: {type(result).__name__}")
    
    def _handle_loop(self, data: Dict[str, Any]) -> None:
        """处理循环命令"""
        loop_type = data.get('loopType', 'count')
        query_selector = data.get('querySelector', '')
        variable_source = data.get('variableSource', '')
        item_name = data.get('itemName', 'item')
        count = data.get('count', 10)
        commands = data.get('commands', [])
        
        logger.info(f"开始循环 (类型: {loop_type})")
        
        # 确定循环次数
        if loop_type == 'count':
            loop_count = count
            logger.info(f"按次数循环: {loop_count} 次")
            
        elif loop_type == 'variable':
            source_data = self.var_manager.get(variable_source)
            if source_data is None:
                raise ValueError(f"变量不存在: {variable_source}")
            if isinstance(source_data, list):
                loop_count = len(source_data)
                logger.info(f"按变量循环: {loop_count} 项")
            else:
                raise ValueError(f"变量不是数组: {variable_source}")
            
        elif loop_type == 'selector':
            elements = self.page.query_selector_all(query_selector)
            loop_count = len(elements)
            logger.info(f"按元素循环: {loop_count} 个")
            
        else:
            raise ValueError(f"未知的循环类型: {loop_type}")
        
        # 执行循环
        for i in range(loop_count):
            logger.info(f"--- 循环 {i + 1}/{loop_count} ---")
            
            # 设置当前项变量
            if loop_type == 'variable':
                source_data = self.var_manager.get(variable_source)
                self.var_manager.set(item_name, source_data[i])
            elif loop_type == 'selector':
                # 为元素循环设置索引
                self.var_manager.set(f'{item_name}_index', i)
            
            # 执行子命令
            for cmd in commands:
                self.execute(cmd)
        
        logger.info(f"✓ 循环完成: {loop_count} 次")
    
    def _handle_intercept_request(self, data: Dict[str, Any]) -> None:
        """处理拦截请求命令"""
        url_pattern = data.get('urlPattern', '')
        method = data.get('method', 'ALL')
        modify_headers = data.get('modifyHeaders', {})
        modify_body = data.get('modifyBody', {})
        modify_response = data.get('modifyResponse', {})
        variable_name = data.get('variableName', '')
        continue_request = data.get('continueRequest', True)
        
        if not url_pattern:
            raise ValueError("URL 匹配模式不能为空")
        
        logger.info(f"设置请求拦截: {url_pattern}")
        
        # 创建拦截处理函数
        def handle_route(route: Route):
            request = route.request
            
            # 检查请求方法
            if method != 'ALL' and request.method != method:
                route.continue_()
                return
            
            logger.info(f"拦截到请求: {request.method} {request.url}")
            
            # 收集请求数据
            request_data = {
                'url': request.url,
                'method': request.method,
                'headers': request.headers,
                'postData': request.post_data,
                'timestamp': time.time()
            }
            
            # 修改请求头
            headers = request.headers.copy()
            if modify_headers:
                headers.update(modify_headers)
            
            # 修改请求体
            post_data = request.post_data
            if modify_body and request.method in ['POST', 'PUT']:
                post_data = json.dumps(modify_body)
            
            # 如果设置了修改响应，直接返回
            if modify_response and not continue_request:
                logger.info("返回修改后的响应数据")
                route.fulfill(
                    status=200,
                    content_type='application/json',
                    body=json.dumps(modify_response)
                )
                request_data['response'] = modify_response
            else:
                # 继续请求（可能修改了参数）
                logger.info("继续发送请求")
                route.continue_(
                    headers=headers,
                    post_data=post_data
                )
            
            # 存储拦截数据
            if variable_name:
                self.intercepted_requests.append(request_data)
                self.var_manager.set(variable_name, self.intercepted_requests)
        
        # 注册路由拦截
        self.page.route(url_pattern, handle_route)
        logger.info(f"✓ 已设置请求拦截")
