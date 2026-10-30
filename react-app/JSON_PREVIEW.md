# 实时 JSON 预览功能 📋

## 功能说明

现在，右侧面板会**实时显示**当前文件夹的 JSON 配置，无需导出，随时可以查看和复制。

## 使用方式

### 1. 自动显示
- 选中包含步骤的文件夹
- 右下角自动出现 JSON 预览面板

### 2. 一键复制
- 点击面板顶部的 **"复制 JSON"** 按钮
- JSON 配置自动复制到剪贴板
- 提示"已复制到剪贴板！"

### 3. 实时更新
- 添加/删除步骤时，JSON 自动更新
- 修改步骤配置时，JSON 实时变化
- 无需手动刷新

## JSON 格式说明

### 完整示例

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
            }
          ]
        }
      ]
    }
  ]
}
```

### 字段说明

#### 顶层字段
- `name` - 项目名称（文件夹名称）
- `version` - 配置版本号（当前为 "1.0"）
- `description` - 配置描述
- `task` - 任务组列表

#### task（任务组）
- `name` - 任务组名称
- `action` - 动作列表

#### action（动作）
- `id` - 动作 ID（自动生成，从 1 开始）
- `name` - 动作名称（如：流程任务_1）
- `codeName` - 代码名称（如：flowTask_1）
- `type` - 任务类型（默认：once）
- `commands` - 命令列表

#### commands（命令）
- `action` - 命令类型
- `data` - 命令参数

## 在 Python 中使用

### 方式 1：直接粘贴

```python
import json
import tools.core as ToolCore

# 从剪贴板粘贴 JSON
config_json = """
{
  "name": "我的爬虫",
  "version": "1.0",
  "description": "...",
  "task": [...]
}
"""

# 解析 JSON
config = json.loads(config_json)

# 运行机器人
ToolCore.runRobot(config, robotRootPath)
```

### 方式 2：保存为文件

```python
import tools.core as ToolCore

# 将 JSON 保存为文件：my_spider.json
config = ToolCore.getRunConfig('my_spider.json')
ToolCore.runRobot(config, robotRootPath)
```

## 命令类型

### openBrower - 打开网址

```json
{
  "action": "openBrower",
  "data": {
    "webUrl": "https://www.example.com",
    "clearCache": true,
    "finishwait": 2
  }
}
```

**参数：**
- `webUrl` - 网址
- `clearCache` - 是否清除缓存（默认 true）
- `finishwait` - 等待时间（秒）

### clickBrowerElement - 点击元素

```json
{
  "action": "clickBrowerElement",
  "data": {
    "querySelector": "#submit-btn",
    "finishwait": 1
  }
}
```

**参数：**
- `querySelector` - CSS 选择器
- `finishwait` - 等待时间（秒）

**选择器转换规则：**
- ID：`submit-btn` → `#submit-btn`
- Class：`btn-primary` → `.btn-primary`
- Class + 索引：`btn` + 索引 1 → `.btn:nth-of-type(2)`

## 特性

### ✅ 实时生成
- 修改步骤后立即更新
- 无需手动刷新
- 所见即所得

### ✅ 一键复制
- 点击按钮即可复制
- 支持剪贴板 API
- 复制成功提示

### ✅ 智能过滤
- 自动过滤空文件夹
- 只包含有步骤的内容
- 保持层级结构

### ✅ 格式优化
- 专为 Python 优化
- 清晰的命名规范
- 完整的版本信息

## 注意事项

1. **空文件夹不显示** - 如果文件夹没有步骤，不会生成 JSON
2. **自动排序** - 步骤按 order 字段自动排序
3. **子文件夹包含** - 会自动包含所有子文件夹的步骤
4. **ID 生成** - 按照文件夹顺序自动生成

## 常见问题

### Q: 为什么右下角没有显示？
A: 确保选中的文件夹至少有一个步骤

### Q: JSON 会实时更新吗？
A: 会的，任何修改都会实时反映

### Q: 如何复制多行 JSON？
A: 点击"复制 JSON"按钮，会自动复制完整的多行格式

### Q: 可以在 Python 中直接使用吗？
A: 可以，格式完全兼容 Python Robot 项目

---

**更新日期：** 2026-10-27  
**版本：** v1.2.0
