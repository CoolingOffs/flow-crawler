# 导出功能使用指南 📤

## 快速开始

### 1. 创建流程

首先，确保你的文件夹中至少有一个步骤：

```
我的第一个爬虫
├── 步骤 1：打开网址 → https://www.baidu.com
├── 步骤 2：点击元素 → ID: kw（搜索框）
└── 步骤 3：点击元素 → ID: su（搜索按钮）
```

### 2. 预览 JSON

点击右上角的 **"预览 JSON"** 按钮，查看生成的 JSON：

```json
{
  "name": "我的第一个爬虫",
  "task": [
    {
      "name": "我的第一个爬虫",
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
                "webUrl": "https://www.baidu.com",
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

### 3. 导出 JSON

点击 **"导出 JSON"** 按钮，文件会自动下载。

### 4. 使用文件

将下载的 JSON 文件放入 Python Robot 项目中：

```
D:\project\python-robot\
└── 我的爬虫配置.json  ← 放在这里
```

然后在 Python Robot 中加载：

```python
import tools.core as ToolCore

# 加载配置
config = ToolCore.getRunConfig('我的爬虫配置.json')

# 运行机器人
ToolCore.runRobot(config, robotRootPath)
```

## 选择器转换规则

### ID 选择器
- **输入：** `submit-btn`
- **输出：** `#submit-btn`

### Class 选择器
- **输入：** `btn-primary`
- **输出：** `.btn-primary`

### Class + 索引
- **输入：** `btn-primary`，索引 `1`（第二个元素）
- **输出：** `.btn-primary:nth-of-type(2)`

### CSS 选择器
- **输入：** `div > button:first-child`
- **输出：** `div > button:first-child`（保持不变）

## 多文件夹导出

### 示例结构

```
电商爬虫
├── 01-登录
│   ├── 步骤 1：打开网址
│   └── 步骤 2：点击登录按钮
├── 02-商品列表
│   └── 步骤 1：打开商品页
└── 03-采集数据（空文件夹）
```

### 生成的 JSON

```json
{
  "name": "电商爬虫",
  "task": [
    {
      "name": "01-登录",
      "action": [...]
    },
    {
      "name": "02-商品列表",
      "action": [...]
    }
    // 注意：03-采集数据 被跳过了，因为它是空的
  ]
}
```

## 实际应用示例

### 示例 1：简单搜索

**步骤：**
1. 打开网址：`https://www.baidu.com`
2. 点击搜索框（ID: kw）
3. 点击搜索按钮（ID: su）

**导出：** `baidu-search.json`

**在 Python Robot 中使用：**
```python
config = ToolCore.getRunConfig('baidu-search.json')
ToolCore.runRobot(config, robotRootPath)
```

### 示例 2：电商网站流程

**步骤：**
1. 打开网址：`https://www.example.com`
2. 点击登录（Class: login-btn）
3. 点击商品列表（Class: product-item，索引 0）

**导出：** `ecommerce-flow.json`

## 调试技巧

### 1. 检查生成的 JSON

使用"预览 JSON"功能，确保：
- ✅ 所有步骤都包含在内
- ✅ 顺序正确
- ✅ 选择器格式正确

### 2. 手动测试

在浏览器控制台测试 JSON：
```javascript
const config = { /* 你的 JSON */ };
console.log(JSON.stringify(config, null, 2));
```

### 3. 分步测试

先用 Python Robot 测试前 1-2 个步骤，确认无误后再运行完整流程。

## 常见问题

### Q: 导出的文件在哪里？
A: 浏览器会自动下载，通常在"下载"文件夹中。

### Q: 可以修改导出的 JSON 吗？
A: 可以，但要保持格式正确。

### Q: 为什么导出失败？
A: 确保文件夹中至少有一个步骤。

### Q: 如何导入到 Python Robot？
A: 使用 `ToolCore.getRunConfig('文件路径')` 加载。

## 最佳实践

1. **命名规范** - 使用有意义的文件名
2. **测试先行** - 小规模测试后再完整运行
3. **备份配置** - 重要流程要备份 JSON 文件
4. **版本管理** - 使用 Git 管理 JSON 配置文件

---

**详细文档：** [EXPORT_FORMAT.md](./EXPORT_FORMAT.md)
