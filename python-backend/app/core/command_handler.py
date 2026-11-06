"""
命令处理器 - 处理各种 action 类型
"""
import time
import json
import os
import requests
from typing import Dict, Any, List, Optional
from datetime import datetime
from croniter import croniter
from playwright.sync_api import Page, Browser, Route
from jsonpath_ng import parse as jsonpath_parse
from app.core.logger import setup_logger
from app.core.variable_manager import VariableManager

logger = setup_logger()

# 本地存储文件路径
LOCAL_STORAGE_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), 'data', 'local_storage.json')

# 会话存储（内存中）
_session_storage: Dict[str, str] = {}

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
        
        # 提取备注、日志标记和禁用状态
        remark = data.pop('_remark', None)
        log_print = data.pop('_logPrint', False)
        is_disabled = data.pop('_disabled', False)
        
        # 替换变量引用
        data = self.var_manager.replace_in_dict(data)
        
        # 等待 1 秒再执行（让用户看到浏览器操作过程）
        logger.info(f"等待 1 秒后执行命令: {action}")
        time.sleep(1)
        
        # 跳过禁用步骤
        if is_disabled:
            skip_label = f"[{remark}] {action}" if remark else action
            logger.info(f"⏭ 跳过禁用步骤: {skip_label}")
            if log_print:
                print(f"⏭ 跳过禁用步骤: {skip_label}")
            return
        
        # 构建日志信息
        step_label = f"命令: {action}"
        if remark:
            step_label = f"[{remark}] {step_label}"
        
        logger.info(f"执行{step_label}")
        logger.debug(f"命令数据: {data}")
        
        # 打印日志模式：输出详细信息到控制台
        if log_print:
            print(f"\n{'='*50}")
            print(f"📋 步骤执行: {step_label}")
            print(f"📂 命令类型: {action}")
            if remark:
                print(f"💬 备注: {remark}")
            print(f"📝 参数: {json.dumps(data, ensure_ascii=False, indent=2)[:500]}")
            print(f"{'='*50}\n")
        
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
            elif action == 'executeScript':
                self._handle_execute_script(data)
            elif action == 'localStorage':
                self._handle_local_storage(data)
            elif action == 'keyboardAction':
                self._handle_keyboard_action(data)
            elif action == 'elementMethod':
                self._handle_element_method(data)
            elif action == 'variableOperation':
                self._handle_variable_operation(data)
            elif action == 'dingTalkNotify':
                self._handle_dingtalk_notify(data)
            elif action == 'scheduledTask':
                self._handle_scheduled_task(data)
            else:
                logger.warning(f"未知命令: {action}")
        except Exception as e:
            logger.error(f"执行命令 {action} 失败: {e}", exc_info=True)
            if log_print:
                print(f"❌ 步骤执行失败: {step_label} -> {e}")
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
    
    def _handle_execute_script(self, data: Dict[str, Any]) -> None:
        """处理注入 JavaScript 命令"""
        script = data.get('script', '')
        
        if not script:
            raise ValueError("JavaScript 代码不能为空")
        
        logger.info(f"注入 JavaScript 脚本")
        logger.debug(f"脚本内容: {script[:200]}...")
        
        # 在页面中执行 JavaScript
        self.page.evaluate(script)
        
        logger.info(f"✓ JavaScript 已注入执行")
    
    def _handle_local_storage(self, data: Dict[str, Any]) -> None:
        """处理本地存储命令"""
        action = data.get('action', 'set')
        key = data.get('key', '')
        value = data.get('value', '')
        storage_type = data.get('storageType', 'local')
        variable_name = data.get('variableName', '')
        
        if not key:
            raise ValueError("存储键名不能为空")
        
        storage_label = '本地' if storage_type == 'local' else '会话'
        
        if action == 'set':
            # 写入
            if storage_type == 'local':
                self._save_to_local(key, value)
            else:
                _session_storage[key] = value
            logger.info(f"✓ [{storage_label}存储] 已保存: {key} = {value[:50]}{'...' if len(str(value)) > 50 else ''}")
        
        elif action == 'get':
            # 读取
            if storage_type == 'local':
                result = self._load_from_local(key)
            else:
                result = _session_storage.get(key)
            
            if result is None:
                logger.warning(f"[{storage_label}存储] 键不存在: {key}")
                result = ''
            
            if variable_name:
                self.var_manager.set(variable_name, result)
                logger.info(f"✓ [{storage_label}存储] 已读取: {key} → ${variable_name}")
            else:
                logger.info(f"✓ [{storage_label}存储] 已读取: {key} = {result}")
    
    def _save_to_local(self, key: str, value: Any) -> None:
        """保存到本地文件"""
        data = {}
        if os.path.exists(LOCAL_STORAGE_FILE):
            try:
                with open(LOCAL_STORAGE_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
            except (json.JSONDecodeError, IOError):
                data = {}
        
        data[key] = value
        
        os.makedirs(os.path.dirname(LOCAL_STORAGE_FILE), exist_ok=True)
        with open(LOCAL_STORAGE_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
    
    def _load_from_local(self, key: str) -> Any:
        """从本地文件读取"""
        if not os.path.exists(LOCAL_STORAGE_FILE):
            return None
        
        try:
            with open(LOCAL_STORAGE_FILE, 'r', encoding='utf-8') as f:
                data = json.load(f)
            return data.get(key)
        except (json.JSONDecodeError, IOError):
            return None
    
    def _handle_keyboard_action(self, data: Dict[str, Any]) -> None:
        """处理键盘操作命令"""
        key = data.get('key', '')
        selector = data.get('selector', '')
        modifiers = data.get('modifiers', [])
        press_count = data.get('pressCount', 1)
        
        if not key:
            raise ValueError("按键名不能为空")
        
        # 构建按键字符串（如 Control+A）
        key_combo = '+'.join(modifiers + [key])
        
        logger.info(f"键盘操作: {key_combo}")
        
        # 如果指定了选择器，先聚焦元素
        if selector:
            logger.info(f"先聚焦元素: {selector}")
            self.page.wait_for_selector(selector, timeout=10000)
            self.page.focus(selector)
        
        # 执行按键
        for i in range(press_count):
            # 先按下修饰键
            for mod in modifiers:
                self.page.keyboard.down(mod)
            
            # 按下主按键
            self.page.keyboard.press(key)
            
            # 释放修饰键
            for mod in reversed(modifiers):
                self.page.keyboard.up(mod)
            
            if press_count > 1:
                logger.debug(f"已按 {i + 1}/{press_count} 次")
        
        logger.info(f"✓ 已按键: {key_combo}" + (f" ×{press_count}" if press_count > 1 else ""))

    def _handle_element_method(self, data: Dict[str, Any]) -> None:
        """处理调用元素方法命令"""
        selector = data.get('selector', '')
        method = data.get('method', '')
        args_str = data.get('args', '')
        wait_after = data.get('waitAfter', 0)
        
        if not selector:
            raise ValueError("CSS 选择器不能为空")
        if not method:
            raise ValueError("方法名不能为空")
        
        logger.info(f"调用元素方法: {selector}.{method}()")
        
        # 等待元素
        self.page.wait_for_selector(selector, timeout=10000)
        
        # 解析参数
        args_js = ''
        if args_str:
            try:
                # 验证是有效的 JSON
                parsed = json.loads(args_str)
                args_js = json.dumps(parsed)
            except json.JSONDecodeError:
                # 当作普通字符串
                args_js = json.dumps(args_str)
        
        # 通过 evaluate 调用元素方法
        result = self.page.evaluate(f"""
            (() => {{
                const el = document.querySelector('{selector}');
                if (!el) throw new Error('找不到元素: {selector}');
                const args = {args_js if args_js else 'null'};
                if (args !== null && typeof args === 'object') {{
                    return el.{method}(args);
                }} else {{
                    return el.{method}();
                }}
            }})()
        """)
        
        # 等待指定秒数
        if wait_after > 0:
            time.sleep(wait_after)
        
        logger.info(f"✓ 已调用 {selector}.{method}()")

    def _handle_variable_operation(self, data: Dict[str, Any]) -> None:
        """处理变量操作命令"""
        import re as re_module
        
        operation = data.get('operation', 'template')
        source_var = data.get('sourceVariable', '')
        result_var = data.get('resultVariable', '')
        operand = data.get('operand', '')
        operand2 = data.get('operand2', '')
        
        if not result_var:
            raise ValueError("结果变量名不能为空")
        
        logger.info(f"变量操作: {operation}")
        
        # 获取源变量值
        source_value = None
        if source_var:
            source_value = self.var_manager.get(source_var)
        
        if operation == 'template':
            # 模板拼接：operand 中包含 ${var} 引用，已被 var_manager.replace_in_dict 替换
            result = operand
            logger.info(f"✓ 模板拼接结果: {str(result)[:100]}")
        
        elif operation == 'math':
            # 数学运算：operand 格式如 "+ 10" 或 "* 2"
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            
            try:
                num = float(source_value)
            except (ValueError, TypeError):
                raise ValueError(f"源变量不是数字: {source_var} = {source_value}")
            
            # 解析运算符和操作数
            match = re_module.match(r'^([+\-*/%])\s+([\d.]+)$', operand.strip())
            if not match:
                raise ValueError(f"数学表达式格式错误: {operand}（应为 '+ 10' 或 '* 2'）")
            
            op, val_str = match.groups()
            val = float(val_str)
            
            if op == '+':
                result = num + val
            elif op == '-':
                result = num - val
            elif op == '*':
                result = num * val
            elif op == '/':
                if val == 0:
                    raise ValueError("除数不能为 0")
                result = num / val
            elif op == '%':
                if val == 0:
                    raise ValueError("模数不能为 0")
                result = num % val
            else:
                raise ValueError(f"不支持的运算符: {op}")
            
            # 如果结果是整数则转为 int
            if result == int(result):
                result = int(result)
            
            logger.info(f"✓ 数学运算: {num} {op} {val} = {result}")
        
        elif operation == 'jsonParse':
            # JSON 解析
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            if isinstance(source_value, str):
                result = json.loads(source_value)
            else:
                result = source_value
            logger.info(f"✓ JSON 解析完成")
        
        elif operation == 'jsonStringify':
            # JSON 字符串化
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            result = json.dumps(source_value, ensure_ascii=False)
            logger.info(f"✓ JSON 字符串化完成")
        
        elif operation == 'regex':
            # 正则提取
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            if not operand:
                raise ValueError("正则表达式不能为空")
            
            match = re_module.search(operand, str(source_value))
            if match:
                # 优先返回第一个捕获组，没有则返回整个匹配
                result = match.group(1) if match.lastindex else match.group(0)
            else:
                result = ''
            logger.info(f"✓ 正则提取结果: {str(result)[:100]}")
        
        elif operation == 'regexReplace':
            # 正则替换
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            if not operand:
                raise ValueError("正则表达式不能为空")
            result = re_module.sub(operand, operand2, str(source_value))
            logger.info(f"✓ 正则替换完成")
        
        elif operation == 'replace':
            # 字符串替换
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            result = str(source_value).replace(operand, operand2)
            logger.info(f"✓ 字符串替换完成")
        
        elif operation == 'split':
            # 字符串分割为数组
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            result = str(source_value).split(operand)
            logger.info(f"✓ 分割为 {len(result)} 项")
        
        elif operation == 'join':
            # 数组合并为字符串
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            if isinstance(source_value, list):
                result = operand.join(str(item) for item in source_value)
            else:
                result = str(source_value)
            logger.info(f"✓ 数组合并为字符串")
        
        elif operation == 'length':
            # 取长度
            if source_value is None:
                raise ValueError(f"源变量不存在: {source_var}")
            if isinstance(source_value, (str, list, dict)):
                result = len(source_value)
            else:
                result = len(str(source_value))
            logger.info(f"✓ 长度: {result}")
        
        elif operation == 'default':
            # 设置默认值
            if source_var:
                existing = self.var_manager.get(source_var)
                if existing is not None and existing != '':
                    result = existing
                else:
                    result = operand
            else:
                result = operand
            logger.info(f"✓ 默认值: {str(result)[:100]}")
        
        else:
            raise ValueError(f"未知的变量操作: {operation}")
        
        # 存储结果
        self.var_manager.set(result_var, result)

    def _handle_dingtalk_notify(self, data: Dict[str, Any]) -> None:
        """处理钉钉 Webhook 推送命令"""
        access_token = data.get('accessToken', '')
        msg_type = data.get('msgType', 'text')
        title = data.get('title', '')
        content = data.get('content', '')
        
        if not access_token:
            raise ValueError("钉钉 Webhook access_token 不能为空")
        if not content:
            raise ValueError("消息内容不能为空")
        
        webhook_url = f"https://oapi.dingtalk.com/robot/send?access_token={access_token}"
        
        logger.info(f"钉钉推送: {msg_type} 消息")
        
        # 构建请求体
        if msg_type == 'markdown':
            payload = {
                "msgtype": "markdown",
                "markdown": {
                    "title": title or "通知",
                    "text": content
                }
            }
        else:
            payload = {
                "msgtype": "text",
                "text": {
                    "content": content
                }
            }
        
        try:
            response = requests.post(
                webhook_url,
                json=payload,
                headers={'Content-Type': 'application/json'},
                timeout=10
            )
            
            result = response.json()
            
            if result.get('errcode') == 0:
                logger.info(f"✓ 钉钉推送成功")
            else:
                error_msg = result.get('errmsg', '未知错误')
                logger.error(f"❌ 钉钉推送失败: {error_msg}")
                raise ValueError(f"钉钉推送失败: {error_msg}")
        
        except requests.RequestException as e:
            logger.error(f"钉钉推送请求失败: {e}")
            raise

    def _handle_scheduled_task(self, data: Dict[str, Any]) -> None:
        """
        处理定时任务命令
        
        定时任务是额外的触发器，主流程正常执行完毕后，
        会根据定时任务的配置周期性地触发执行指定范围的步骤。
        
        此方法仅记录定时任务配置，实际的调度执行由 executor 处理。
        """
        run_type = data.get('run_type', 'cron')
        cron_expression = data.get('cron_expression', '')
        execute_once_time = data.get('execute_once_time', '')
        max_trigger_count = data.get('max_trigger_count', 10)
        
        logger.info(f"注册定时任务: 触发方式={run_type}")
        
        if run_type == 'cron':
            if not cron_expression:
                raise ValueError("Cron 表达式不能为空")
            # 验证 Cron 表达式合法性
            try:
                cron = croniter(cron_expression, datetime.now())
                next_time = cron.get_next(datetime)
                logger.info(f"Cron 表达式: {cron_expression}")
                logger.info(f"下次触发时间: {next_time.strftime('%Y-%m-%d %H:%M:%S')}")
            except (ValueError, KeyError) as e:
                raise ValueError(f"Cron 表达式无效: {cron_expression} - {e}")
        elif run_type == 'once':
            if not execute_once_time:
                raise ValueError("执行时间不能为空")
            try:
                target_time = datetime.strptime(execute_once_time, '%Y-%m-%d %H:%M:%S')
                logger.info(f"执行一次时间: {execute_once_time}")
            except ValueError:
                raise ValueError(f"时间格式无效，应为 YYYY-MM-DD HH:mm:ss: {execute_once_time}")
        
        logger.info(f"触发步骤范围: 由图中连线决定")
        logger.info(f"最大触发次数: {max_trigger_count}")
        
        # 将定时任务配置存储到变量管理器中，供 executor 后续使用
        scheduled_task_config = {
            'run_type': run_type,
            'cron_expression': cron_expression,
            'execute_once_time': execute_once_time,
            'max_trigger_count': max_trigger_count,
            'loop_start_index': data.get('_loop_start_index', -1),
            'loop_end_index': data.get('_loop_end_index', -1),
        }
        
        # 存入特殊变量 _scheduled_tasks（数组形式，支持多个定时任务）
        existing_tasks = self.var_manager.get('_scheduled_tasks')
        if not isinstance(existing_tasks, list):
            existing_tasks = []
        existing_tasks.append(scheduled_task_config)
        self.var_manager.set('_scheduled_tasks', existing_tasks)
        
        logger.info(f"✓ 定时任务已注册（当前共 {len(existing_tasks)} 个定时任务）")
