# JSON 配置格式说明 📄

## 概述

每个文件夹的流程会**实时生成** JSON 配置，显示在右下角面板中，可以随时复制使用。该格式与 Python Robot 项目完全兼容。

## 使用方式

### 实时预览

1. **选中文件夹** - 在左侧点击要查看的文件夹
2. **查看 JSON** - 右下角自动显示当前配置
3. **复制 JSON** - 点击右上角“复制 JSON”按钮
4. **使用配置** - 粘贴到 Python 代码中使用

### 注意事项

- ✅ 实时生成：修改步骤时 JSON 自动更新
- ✅ 一键复制：点击按钮即可复制
- ✅ 格式优化：专为 Python 爬虫优化

## JSON 格式结构

### 完整格式示例

```json
{
  "name": "我的爬虫项目",
  "task": [
    {
      "name": "登录流程",
      "action": [
        {
          "id": 1,
          "name": "流程任务",
          "codeName": "flowTask",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://www.example.com/login",
                "finishwait": 2
              }
            },
            {
              "action": "clickBrowerElement",
              "data": {
                "querySelector": "#username",
                "finishwait": 1
              }
            }
          ]
        }
      ]
    },
    {
      "name": "数据采集",
      "action": [
        {
          "id": 2,
          "name": "流程任务",
          "codeName": "flowTask",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://www.example.com/data",
                "finishwait": 3
              }
            }
          ]
        }
      ]
    }
  ]
}
```

## 字段说明

### 顶层结构

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 项目名称（文件夹名称） |
| `version` | string | 配置版本号（当前为 "1.0"） |
| `description` | string | 配置描述 |
| `task` | array | 任务组列表 |

### task（任务组）

| 字段 | 类型 | 说明 |
|------|------|------|
| `name` | string | 任务组名称（文件夹名称） |
| `action` | array | 动作列表 |

### action（动作）

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | number | 动作 ID（自动生成，从 1 开始） |
| `name` | string | 动作名称（如：流程任务_1） |
| `codeName` | string | 代码名称（如：flowTask_1） |
| `type` | string | 任务类型：`once` / `loop` / `function` |
| `commands` | array | 命令列表 |

### commands（命令）

| 字段 | 类型 | 说明 |
|------|------|------|
| `action` | string | 命令类型 |
| `data` | object | 命令参数 |

## 命令类型映射

### 1. 打开网址 → `openBrower`

**配置：**
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

**参数说明：**
- `webUrl` - 要打开的网址
- `clearCache` - 是否清除浏览器缓存（默认 true）
- `finishwait` - 等待时间（秒），默认 2 秒

### 2. 点击元素 → `clickBrowerElement`

**配置：**
```json
{
  "action": "clickBrowerElement",
  "data": {
    "querySelector": "#submit-btn",
    "finishwait": 1
  }
}
```

**参数说明：**
- `querySelector` - CSS 选择器（自动转换）
- `finishwait` - 等待时间（秒），默认 1 秒

**选择器转换规则：**

| 原始类型 | 转换规则 | 示例 |
|---------|---------|------|
| ID | `#value` | `#submit-btn` |
| Class | `.value` | `.btn-primary` |
| Class + 索引 | `.value:nth-of-type(n+1)` | `.btn-primary:nth-of-type(2)` |
| CSS 选择器 | 保持原样 | `div > button:first-child` |

## 生成规则

### 1. 文件夹层级处理

```
父文件夹
├── 子文件夹 1（有步骤）→ 生成 task[0]
├── 子文件夹 2（无步骤）→ 跳过
└── 子文件夹 3（有步骤）→ 生成 task[1]
```

### 2. 步骤排序

- 按照 `order` 字段升序排列
- 转换为 `commands` 数组

### 3. ID 生成

- 从文件夹 ID 提取数字部分
- 截取前 8 位作为整数
- 如果无法提取，使用默认值 1

## 与 Python Robot 的兼容性

### 兼容特性

✅ **完全兼容** - 导出的 JSON 可以直接被 Python Robot 读取  
✅ **任务分组** - 支持多任务组配置  
✅ **命令格式** - 使用相同的命令名称和参数  

### 使用示例

```python
# Python Robot 中使用
import json

# 加载配置
with open('我的爬虫项目.json', 'r', encoding='utf-8') as f:
    config = json.load(f)

# 运行机器人
ToolCore.runRobot(config, robotRootPath)
```

## 注意事项

### 1. 空文件夹处理

- 没有任何步骤的文件夹不会被导出
- 如果整个项目没有步骤，会提示无法导出

### 2. 选择器格式

确保选择器值正确：
- ✅ ID: `submit-btn` → `#submit-btn`
- ✅ Class: `btn-primary` → `.btn-primary`
- ✅ CSS: `div > button` → `div > button`

### 3. 子文件夹

- 子文件夹的流程会一起导出
- 保持原有的层级结构

## 示例场景

### 场景 1：简单登录流程

**步骤：**
1. 打开网址：`https://example.com/login`
2. 点击元素：ID = `username`
3. （待开发：输入文本）
4. 点击元素：ID = `password`
5. （待开发：输入文本）
6. 点击元素：ID = `submit`

**生成 JSON：**
```json
{
  "name": "登录流程",
  "task": [
    {
      "name": "登录流程",
      "action": [
        {
          "id": 1,
          "name": "流程任务",
          "codeName": "flowTask",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://example.com/login",
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

### 场景 2：多页面数据采集

**文件夹结构：**
```
电商数据采集
├── 01-登录
├── 02-商品列表
└── 03-商品详情
```

**生成 JSON：**
```json
{
  "name": "电商数据采集",
  "task": [
    {
      "name": "01-登录",
      "action": [...]
    },
    {
      "name": "02-商品列表",
      "action": [...]
    },
    {
      "name": "03-商品详情",
      "action": [...]
    }
  ]
}
```

## 调试技巧

### 1. 预览 JSON

使用"预览 JSON"功能检查生成的配置是否正确

### 2. 手动验证

```javascript
// 在浏览器控制台验证
const config = { /* 粘贴 JSON */ };
console.log(JSON.stringify(config, null, 2));
```

### 3. 测试运行

先在 Python Robot 中测试小规模流程，确认无误后再运行完整流程

## 常见问题

### Q: 导出的 JSON 文件保存在哪里？
A: 下载到你指定的位置，通常在"下载"文件夹

### Q: 为什么导出的 JSON 没有内容？
A: 确保文件夹中至少有一个步骤

### Q: 可以修改导出的 JSON 吗？
A: 可以，但需要保持格式正确，否则 Python Robot 无法读取

### Q: 如何批量导出多个文件夹？
A: 暂时不支持，需要逐个导出

---

**更新日期：** 2026-10-27  
**版本：** v1.1.0
