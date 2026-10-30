# 使用示例 📚

## 示例 1：百度搜索

### 步骤配置

1. **打开网址** - `https://www.baidu.com`
2. **点击元素** - ID: `kw`（搜索框）
3. **点击元素** - ID: `su`（搜索按钮）

### 生成的 JSON

```json
{
  "name": "百度搜索",
  "version": "1.0",
  "description": "爬虫流程配置 - 百度搜索",
  "task": [
    {
      "name": "百度搜索",
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
                "webUrl": "https://www.baidu.com",
                "clearCache": true,
                "finishwait": 2
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#kw",
                "finishwait": 1
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#su",
                "finishwait": 1
              }
            }
          ]
        }
      ]
    }
  ]
}
```

### 在 Python 中使用

```python
import json
import tools.core as ToolCore

# 方式 1：直接粘贴 JSON
config_json = """
{
  "name": "百度搜索",
  "version": "1.0",
  "description": "爬虫流程配置 - 百度搜索",
  "task": [...]
}
"""

config = json.loads(config_json)
ToolCore.runRobot(config, robotRootPath)

# 方式 2：保存为文件
config = ToolCore.getRunConfig('百度搜索.json')
ToolCore.runRobot(config, robotRootPath)
```

---

## 示例 2：电商登录流程

### 文件夹结构

```
电商爬虫
├── 01-登录
│   ├── 步骤 1：打开网址 → https://example.com/login
│   ├── 步骤 2：点击元素 → ID: username
│   ├── 步骤 3：点击元素 → ID: password
│   └── 步骤 4：点击元素 → ID: submit
└── 02-采集数据（空文件夹）
```

### 生成的 JSON

```json
{
  "name": "电商爬虫",
  "version": "1.0",
  "description": "爬虫流程配置 - 电商爬虫",
  "task": [
    {
      "name": "01-登录",
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
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#username",
                "finishwait": 1
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#password",
                "finishwait": 1
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#submit",
                "finishwait": 1
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**注意：** `02-采集数据` 是空文件夹，所以被自动过滤了。

---

## 示例 3：多页面数据采集

### 文件夹结构

```
新闻爬虫
├── 01-访问首页
│   └── 步骤 1：打开网址 → https://news.example.com
├── 02-点击新闻
│   ├── 步骤 1：点击元素 → Class: news-item, 索引: 0
│   └── 步骤 2：点击元素 → Class: news-item, 索引: 1
└── 03-翻页
    └── 步骤 1：点击元素 → ID: next-page
```

### 生成的 JSON

```json
{
  "name": "新闻爬虫",
  "version": "1.0",
  "description": "爬虫流程配置 - 新闻爬虫",
  "task": [
    {
      "name": "01-访问首页",
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
                "webUrl": "https://news.example.com",
                "clearCache": true,
                "finishwait": 2
              }
            }
          ]
        }
      ]
    },
    {
      "name": "02-点击新闻",
      "action": [
        {
          "id": 2,
          "name": "流程任务_2",
          "codeName": "flowTask_2",
          "type": "once",
          "commands": [
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": ".news-item",
                "finishwait": 1
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": ".news-item:nth-of-type(2)",
                "finishwait": 1
              }
            }
          ]
        }
      ]
    },
    {
      "name": "03-翻页",
      "action": [
        {
          "id": 3,
          "name": "流程任务_3",
          "codeName": "flowTask_3",
          "type": "once",
          "commands": [
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#next-page",
                "finishwait": 1
              }
            }
          ]
        }
      ]
    }
  ]
}
```

**注意：**
- ID 自动生成：1, 2, 3
- Class 选择器自动转换
- 带索引的 Class 自动生成 `:nth-of-type()`

---

## 示例 4：选择器转换规则

### ID 选择器
- **输入：** `submit-btn`
- **输出：** `#submit-btn`

### Class 选择器
- **输入：** `btn-primary`
- **输出：** `.btn-primary`

### Class + 索引
- **输入：** `btn-primary`，索引 `0`
- **输出：** `.btn-primary`

- **输入：** `btn-primary`，索引 `1`
- **输出：** `.btn-primary:nth-of-type(2)`

### CSS 选择器
- **输入：** `div > button:first-child`
- **输出：** `div > button:first-child`（保持不变）

---

## 最佳实践

### 1. 命名规范
- ✅ 使用有意义的文件夹名称
- ✅ 按功能分组（如：登录、采集、翻页）
- ✅ 添加序号保持顺序（如：01-、02-、03-）

### 2. 步骤组织
- ✅ 每个文件夹专注于一个功能
- ✅ 步骤数量不要太多（建议 ≤10 个）
- ✅ 合理设置等待时间

### 3. JSON 使用
- ✅ 先在小规模测试
- ✅ 使用 `clearCache: true` 保持浏览器状态
- ✅ 错误处理：在 Python 代码中添加 try-catch

### 4. 调试技巧
- ✅ 使用"复制 JSON"功能快速测试
- ✅ 逐个步骤验证
- ✅ 查看 Python Robot 日志

---

## 常见问题

### Q: JSON 太长怎么办？
A: 可以复制后使用 JSON 格式化工具查看

### Q: 如何修改生成的 JSON？
A: 在 Python 中加载 JSON 后，可以修改配置

### Q: 可以批量运行多个 JSON 吗？
A: 可以，在 Python 中循环调用多个配置

---

**更多示例：** [examples/baidu-search.json](./examples/baidu-search.json)
