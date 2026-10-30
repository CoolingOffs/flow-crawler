# 爬虫流程创建工具 🕷️

一个基于 React + TypeScript 的可视化爬虫流程创建工具，通过拖拽式操作创建和管理爬虫流程。

## ✨ 功能特性

### 📁 左侧 - 文件夹管理
- ✅ 树形文件夹结构
- ✅ 支持增删改查（CRUD）
- ✅ 点击展开/折叠
- ✅ 数据本地存储（LocalStorage）

### 🔄 右侧 - 流程编辑器
- ✅ 可视化展示流程步骤
- ✅ 添加流程步骤
- ✅ 步骤类型选择
- ✅ 步骤详细配置

### 🎯 支持的步骤类型

#### 1. 打开网址
- 配置：URL 地址

#### 2. 点击元素
- 配置：选择器类型（ID / Class / CSS 选择器）
- 配置：选择器值
- 配置：第几个元素（索引）

### 📤 JSON 实时预览
- ✅ 右下角实时显示 JSON 配置
- ✅ 一键复制到剪贴板
- ✅ 专为 Python 爬虫优化
- ✅ 自动更新（修改步骤后实时变化）

详细了解：[JSON_PREVIEW.md](./JSON_PREVIEW.md)

## 🚀 快速开始

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 构建生产版本

```bash
npm run build
```

### 预览生产构建

```bash
npm run preview
```

### 代码检查

```bash
npm run lint
```

## 📁 项目结构

```
react-app/
├── src/
│   ├── components/
│   │   ├── FolderTree/
│   │   │   ├── FolderTree.tsx          # 文件夹树组件
│   │   │   └── FolderTree.css
│   │   └── FlowEditor/
│   │       ├── FlowEditor.tsx          # 流程编辑器
│   │       ├── StepCard.tsx            # 步骤卡片
│   │       ├── StepCard.css
│   │       └── FlowEditor.css
│   ├── store/
│   │   └── useStore.ts                 # Zustand 状态管理
│   ├── types/
│   │   └── index.ts                    # TypeScript 类型定义
│   ├── utils/
│   │   └── storage.ts                  # 本地存储工具
│   ├── App.tsx                         # 主应用
│   ├── App.css
│   ├── main.tsx
│   └── index.css
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── eslint.config.js
```

## 🛠️ 技术栈

- **React 19** - UI 框架
- **TypeScript** - 类型安全
- **Vite** - 构建工具
- **Ant Design** - UI 组件库
- **Zustand** - 状态管理
- **Tailwind CSS** - 样式方案
- **LocalStorage** - 数据持久化

## 📊 数据结构

### Folder（文件夹）

```typescript
interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}
```

### Step（流程步骤）

```typescript
interface Step {
  id: string;
  folderId: string;
  order: number;
  type: 'openUrl' | 'clickElement';
  name: string;
  config: StepConfig;
  createdAt: number;
  updatedAt: number;
}
```

## 💡 使用指南

### 1. 创建文件夹
1. 点击左侧顶部的"新建"按钮
2. 输入文件夹名称
3. 按 Enter 或点击确认

### 2. 添加子文件夹
1. 点击文件夹右侧的 ➕ 图标
2. 输入子文件夹名称
3. 确认创建

### 3. 创建流程步骤
1. 选中一个文件夹
2. 在右侧点击"添加步骤"下拉框
3. 选择步骤类型（打开网址 / 点击元素）
4. 配置步骤参数

### 4. 配置步骤

#### 打开网址
- 输入完整的 URL 地址

#### 点击元素
- 选择选择器类型（ID / Class / CSS 选择器）
- 输入选择器值
- 指定第几个元素（从 0 开始）

### 5. 管理步骤
- ⬆️ 上移：点击步骤卡片右上角的上箭头
- ⬇️ 下移：点击步骤卡片右上角的下箭头
- 🗑️ 删除：点击步骤卡片右上角的删除按钮

### 6. 使用 JSON
1. 选中包含步骤的文件夹
2. 查看右下角的 **JSON 预览面板**
3. 点击 **“复制 JSON”** 按钮
4. 粘贴到 Python 代码中使用
5. 或者保存为 `.json` 文件供 Python Robot 调用

## 🔮 后续扩展计划

### 步骤类型扩展
- [ ] 输入文本
- [ ] 等待元素
- [ ] 提取数据
- [ ] 滚动到位置
- [ ] 切换 iframe
- [ ] 执行 JavaScript

### 高级功能
- [ ] 流程导出/导入（JSON）
- [ ] 流程复制
- [ ] 批量操作
- [ ] 流程测试运行
- [ ] 与 Python Robot 项目集成

## 📝 注意事项

1. **数据保存**：所有数据自动保存在浏览器 LocalStorage，刷新页面不会丢失
2. **浏览器兼容**：建议使用 Chrome、Firefox 等现代浏览器
3. **清除数据**：清除浏览器数据会丢失所有流程，请注意备份

## 📄 License

MIT
