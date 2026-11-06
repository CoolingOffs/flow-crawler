# 爬虫流程执行引擎

基于 Playwright 的自动化爬虫流程执行引擎，用于执行前端导出的 JSON 配置。

## 📁 项目结构

```
python-backend/
├── main.py                 # 主入口（命令行执行）
├── server.py               # API 服务器启动脚本
├── requirements.txt        # Python 依赖
├── app/
│   ├── __init__.py
│   ├── core/              # 核心模块
│   │   ├── __init__.py
│   │   ├── executor.py           # 流程执行器
│   │   ├── command_handler.py    # 命令处理器
│   │   ├── variable_manager.py   # 变量管理器
│   │   └── logger.py             # 日志配置
│   ├── api/               # API 模块
│   │   ├── __init__.py
│   │   └── server.py      # FastAPI 服务器
│   ├── models/            # 数据模型
│   │   └── __init__.py
│   └── utils/             # 工具模块
│       └── __init__.py
└── data/
    ├── flows/             # 流程配置文件
    └── outputs/           # 输出数据
```

## 🚀 快速开始

### 1. 安装依赖

```bash
cd python-backend
pip install -r requirements.txt
```

### 2. 安装 Playwright 浏览器

```bash
playwright install chromium
```

### 3. 命令行执行

```bash
python main.py data/flows/your_config.json
```

### 4. 启动 API 服务器

```bash
python server.py
```

服务器将在 `http://localhost:8000` 启动。

## 📋 支持的命令

### 1. openBrower - 打开网址
```json
{
  "action": "openBrower",
  "data": {
    "webUrl": "https://example.com",
    "clearCache": true,
    "finishwait": 2
  }
}
```

### 2. clickBrowerElement - 点击元素
```json
{
  "action": "clickBrowerElement",
  "data": {
    "querySelector": "#login-btn",
    "finishwait": 1
  }
}
```

### 3. wait - 等待
```json
{
  "action": "wait",
  "data": {
    "seconds": 3
  }
}
```

### 4. getText - 获取文本
```json
{
  "action": "getText",
  "data": {
    "querySelector": ".product-name",
    "variableName": "productName",
    "textType": "innerText"
  }
}
```

### 5. getAttribute - 获取属性
```json
{
  "action": "getAttribute",
  "data": {
    "querySelector": "a.link",
    "variableName": "linkUrl",
    "attributeName": "href"
  }
}
```

### 6. setAttribute - 设置属性
```json
{
  "action": "setAttribute",
  "data": {
    "querySelector": "#username",
    "attributeName": "value",
    "attributeValue": "admin"
  }
}
```

### 7. httpRequest - HTTP 请求
```json
{
  "action": "httpRequest",
  "data": {
    "method": "POST",
    "url": "https://api.example.com/data",
    "headers": {"Authorization": "Bearer token"},
    "body": {"key": "value"},
    "variableName": "apiResponse",
    "timeout": 30
  }
}
```

### 8. jsonExtract - JSON 提取
```json
{
  "action": "jsonExtract",
  "data": {
    "sourceVariable": "apiResponse",
    "jsonPath": "$.data.products[*].name",
    "variableName": "productNames",
    "extractAll": true
  }
}
```

### 9. loop - 循环
```json
{
  "action": "loop",
  "data": {
    "loopType": "count",
    "querySelector": "",
    "variableSource": "",
    "itemName": "item",
    "count": 10,
    "commands": []
  }
}
```

### 10. interceptRequest - 拦截请求
```json
{
  "action": "interceptRequest",
  "data": {
    "urlPattern": "*/api/products/*",
    "method": "POST",
    "modifyHeaders": {},
    "modifyBody": {"page": 1, "pageSize": 100},
    "modifyResponse": {},
    "variableName": "interceptedData",
    "continueRequest": true
  }
}
```

### 11. executeScript - 注入 JS
```json
{
  "action": "executeScript",
  "data": {
    "script": "document.title = 'Modified Title';"
  }
}
```

### 12. localStorage - 本地存储
```json
{
  "action": "localStorage",
  "data": {
    "key": "userToken",
    "value": "${token}",
    "storageType": "local",
    "action": "set",
    "variableName": ""
  }
}
```

**参数：**
- `key` - 存储键名
- `value` - 存储值（支持 `${变量}` 引用）
- `storageType` - `local`（持久化）或 `session`（会话内存）
- `action` - `set`（写入）或 `get`（读取）
- `variableName` - 读取时存入的变量名（action=get 时使用）

### 13. keyboardAction - 键盘操作
```json
{
  "action": "keyboardAction",
  "data": {
    "key": "Enter",
    "selector": "#search-input",
    "modifiers": [],
    "pressCount": 1
  }
}
```

**参数：**
- `key` - 按键名（Enter, Tab, Escape, ArrowDown 等）
- `selector` - 目标元素选择器（可选，先聚焦再按键）
- `modifiers` - 修饰键数组（Ctrl, Shift, Alt, Meta）
- `pressCount` - 按键次数

### 14. elementMethod - 调用方法
```json
{
  "action": "elementMethod",
  "data": {
    "selector": "#username",
    "method": "focus",
    "args": "",
    "waitAfter": 0
  }
}
```

**参数：**
- `selector` - CSS 选择器
- `method` - 方法名（focus, dblclick, scrollIntoView, click, blur, select 等）
- `args` - 方法参数（可选，JSON 格式）
- `waitAfter` - 调用后等待秒数

### 15. variableOperation - 变量操作
```json
{
  "action": "variableOperation",
  "data": {
    "operation": "template",
    "sourceVariable": "productName",
    "resultVariable": "greeting",
    "operand": "您好，${productName}！",
    "operand2": ""
  }
}
```

**支持的操作：**
- `template` - 模板拼接
- `math` - 数学运算
- `jsonParse` / `jsonStringify` - JSON 解析/字符串化
- `regex` / `regexReplace` - 正则提取/替换
- `replace` - 字符串替换
- `split` / `join` - 分割/合并
- `length` - 取长度
- `default` - 默认值

### 16. dingTalkNotify - 钉钉推送
```json
{
  "action": "dingTalkNotify",
  "data": {
    "accessToken": "your_webhook_token",
    "msgType": "markdown",
    "title": "采集报告",
    "content": "共采集 ${count} 条数据"
  }
}
```

### 17. scheduledTask - 定时任务
```json
{
  "action": "scheduledTask",
  "data": {
    "run_type": "cron",
    "cron_expression": "*/5 * * * *",
    "execute_once_time": "",
    "max_trigger_count": 10,
    "_loop_start_index": 1,
    "_loop_end_index": 4
  }
}
```

**参数：**
- `run_type` - `cron`（Cron 表达式）或 `once`（指定时间执行一次）
- `cron_expression` - Cron 表达式（如 `*/5 * * * *` 每 5 分钟）
- `execute_once_time` - 指定时间（如 `2026-11-06 12:00:00`）
- `max_trigger_count` - 最大触发次数（防止无限触发）
- `_loop_start_index` - 循环起始步骤索引（由前端自动计算）
- `_loop_end_index` - 循环结束步骤索引（由前端自动计算）

## 🔧 变量系统

使用 `${变量名}` 语法引用变量：

```json
{
  "action": "httpRequest",
  "data": {
    "url": "https://api.example.com/search?keyword=${searchKey}",
    "variableName": "searchResult"
  }
}
```

## 🌐 API 接口

### POST /execute
执行流程（通过 JSON 数据）

**请求体:**
```json
{
  "name": "流程名称",
  "version": "1.0",
  "description": "流程描述",
  "task": [...]
}
```

**响应:**
```json
{
  "success": true,
  "message": "流程执行成功",
  "variables": {
    "productName": "示例产品",
    "apiResponse": {...}
  }
}
```

### POST /execute/file
执行流程（通过上传文件）

**请求:** multipart/form-data，包含 `file` 字段

### GET /health
健康检查

**响应:**
```json
{
  "status": "healthy",
  "service": "flow-executor"
}
```

## 📝 配置示例

完整的 JSON 配置示例：

```json
{
  "name": "电商产品采集",
  "version": "1.0",
  "description": "采集电商产品信息",
  "task": [
    {
      "name": "登录并采集",
      "action": [
        {
          "id": 1,
          "name": "流程任务_1",
          "codeName": "flowTask_1",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://example.com/login",
                "clearCache": true,
                "finishwait": 2
              }
            },
            {
              "action": "setAttribute",
              "data": {
                "querySelector": "#username",
                "attributeName": "value",
                "attributeValue": "admin"
              }
            },
            {
              "action": "setAttribute",
              "data": {
                "querySelector": "#password",
                "attributeName": "value",
                "attributeValue": "password123"
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#login-btn",
                "finishwait": 2
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## ⚙️ 配置说明

### 浏览器配置

在 `executor.py` 中修改浏览器设置：

```python
self.browser = self.playwright.chromium.launch(
    headless=False,      # True=无头模式, False=可见模式
    slow_mo=100,           # 操作延迟（毫秒）
    args=['--start-maximized']
)
```

### 日志级别

在 `logger.py` 中修改日志级别：

```python
console_handler.setLevel(logging.INFO)  # 改为 DEBUG 查看更多细节
```

## 🐛 调试技巧

1. **启用详细日志**：修改 `logger.py` 中的日志级别为 `DEBUG`
2. **可见模式运行**：设置 `headless=False` 查看浏览器操作
3. **减慢执行速度**：增加 `slow_mo` 值
4. **检查变量**：执行结束后会打印所有变量

## 📦 依赖说明

- `playwright`: 浏览器自动化
- `requests`: HTTP 请求
- `jsonpath-ng`: JSONPath 解析
- `fastapi`: Web API 框架
- `uvicorn`: ASGI 服务器
- `pydantic`: 数据验证
- `croniter`: Cron 表达式解析（定时任务）

## 📄 许可证

MIT License
