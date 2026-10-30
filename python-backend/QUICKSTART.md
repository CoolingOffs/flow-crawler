# 快速开始指南

## 📦 环境要求

- Python 3.8+
- Windows / macOS / Linux

## 🚀 安装步骤

### 方法 1: 自动安装（推荐）

```bash
cd python-backend
python setup.py
```

### 方法 2: 手动安装

```bash
cd python-backend

# 1. 安装 Python 依赖
pip install -r requirements.txt

# 2. 安装 Playwright 浏览器
playwright install chromium
```

## 💻 使用方式

### 1. 命令行执行

```bash
# 执行示例配置
python main.py data/flows/example_config.json

# 执行自定义配置
python main.py path/to/your/config.json
```

### 2. API 服务器

```bash
# 启动服务器
python server.py

# 服务器将在 http://localhost:8000 启动
```

#### API 调用示例

**使用 curl:**
```bash
# 执行流程（JSON 数据）
curl -X POST http://localhost:8000/execute \
  -H "Content-Type: application/json" \
  -d @data/flows/example_config.json

# 健康检查
curl http://localhost:8000/health
```

**使用 Python:**
```python
import requests
import json

# 读取配置
with open('data/flows/example_config.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 调用 API
response = requests.post('http://localhost:8000/execute', json=config)
result = response.json()

print(f"执行结果: {result['success']}")
print(f"变量: {result['variables']}")
```

## 📋 支持的命令

| 命令 | 说明 | 示例 |
|------|------|------|
| `openBrower` | 打开网址 | 打开 https://example.com |
| `clickBrowerElement` | 点击元素 | 点击登录按钮 |
| `wait` | 等待 | 等待 3 秒 |
| `getText` | 获取文本 | 获取元素文本存入变量 |
| `getAttribute` | 获取属性 | 获取元素 href 属性 |
| `setAttribute` | 设置属性 | 设置输入框 value |
| `httpRequest` | HTTP 请求 | 发送 GET/POST 请求 |
| `jsonExtract` | JSON 提取 | 使用 JSONPath 提取数据 |
| `loop` | 循环 | 循环执行子命令 |
| `interceptRequest` | 拦截请求 | 拦截并修改请求 |

## 🔧 变量使用

使用 `${变量名}` 引用变量：

```json
{
  "action": "httpRequest",
  "data": {
    "url": "https://api.example.com/search?q=${keyword}",
    "variableName": "searchResult"
  }
}
```

## 🎯 完整示例

### 前端导出的 JSON

```json
{
  "name": "电商采集流程",
  "version": "1.0",
  "task": [
    {
      "name": "登录",
      "action": [
        {
          "id": 1,
          "name": "流程任务_1",
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

### 执行结果

```
12:34:56 | INFO     | ============================================================
12:34:56 | INFO     | 开始执行流程: 电商采集流程
12:34:56 | INFO     | 版本: 1.0
12:34:56 | INFO     | ============================================================
12:34:56 | INFO     | 正在启动浏览器...
12:34:58 | INFO     | ✓ 浏览器已启动
12:34:58 | INFO     | 
12:34:58 | INFO     | ============================================================
12:34:58 | INFO     | 任务组 1: 登录
12:34:58 | INFO     | ============================================================
12:34:58 | INFO     | ──────────────────────────────────────────────────────────────
12:34:58 | INFO     | 执行 Action 1: 流程任务_1 (类型: once)
12:34:58 | INFO     | ──────────────────────────────────────────────────────────────
12:34:58 | INFO     | 
12:34:58 | INFO     | [步骤 1/3]
12:34:58 | INFO     | 执行命令: openBrower
12:34:58 | INFO     | 打开网址: https://example.com/login
12:35:00 | INFO     | ✓ 网址已打开，等待 2 秒
12:35:02 | INFO     | 
12:35:02 | INFO     | [步骤 2/3]
12:35:02 | INFO     | 执行命令: setAttribute
12:35:02 | INFO     | 设置属性: #username.value = admin
12:35:02 | INFO     | ✓ 已设置属性
12:35:02 | INFO     | 
12:35:02 | INFO     | [步骤 3/3]
12:35:02 | INFO     | 执行命令: clickBrowerElement
12:35:02 | INFO     | 点击元素: #login-btn
12:35:04 | INFO     | ✓ 元素已点击，等待 2 秒
12:35:06 | INFO     | ✓ Action 1 执行完成
12:35:06 | INFO     | 
12:35:06 | INFO     | ============================================================
12:35:06 | INFO     | ✓ 所有任务执行完成
12:35:06 | INFO     | ============================================================
```

## 🐛 调试技巧

### 1. 启用详细日志

修改 `app/core/logger.py`:
```python
console_handler.setLevel(logging.DEBUG)  # 改为 DEBUG
```

### 2. 可见模式运行

修改 `app/core/executor.py`:
```python
self.browser = self.playwright.chromium.launch(
    headless=False,  # 保持 False 可以看到浏览器
    slow_mo=500,       # 增加延迟到 500ms
)
```

### 3. 检查变量

执行结束后会自动打印所有变量，也可以在执行过程中查看：

```python
# 在 command_handler.py 中添加
print(self.var_manager.list_all())
```

## ⚠️ 常见问题

### Q: Playwright 安装失败？
```bash
# 尝试使用国内镜像
pip install playwright -i https://pypi.tuna.tsinghua.edu.cn/simple
playwright install chromium
```

### Q: 浏览器启动失败？
```bash
# 重新安装浏览器
playwright install chromium
```

### Q: 找不到元素？
- 检查选择器是否正确
- 增加 `finishwait` 等待时间
- 使用 `wait` 命令等待页面加载

### Q: 变量替换不生效？
- 确保使用 `${变量名}` 格式
- 检查变量是否已创建
- 启用 DEBUG 日志查看详情

## 📚 更多资源

- [完整文档](README.md)
- [API 文档](http://localhost:8000/docs) - 启动服务器后访问
- [示例配置](data/flows/example_config.json)

## 🎉 完成！

现在你已经可以开始使用爬虫流程执行引擎了！

**下一步:**
1. 在前端创建你的流程
2. 导出 JSON 配置
3. 使用本引擎执行配置
4. 查看执行结果和变量
