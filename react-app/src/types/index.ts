// 文件夹结构
export interface Folder {
  id: string;
  name: string;
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

// 流程步骤
export interface Step {
  id: string;
  folderId: string;
  order: number;                          // 执行顺序
  type: 'openUrl' | 'clickElement' | 'wait' | 'getText' | 'getAttribute' | 'setAttribute' | 'httpRequest' | 'jsonExtract' | 'loop' | 'interceptRequest' | 'executeScript' | 'localStorage' | 'keyboardAction' | 'elementMethod' | 'variableOperation' | 'dingTalkNotify';
  name: string;                           // 步骤名称
  config: StepConfig;
  remark?: string;                        // 步骤备注
  logPrint?: boolean;                     // 执行时打印日志
  disabled?: boolean;                     // 禁用步骤（执行时跳过）
  createdAt: number;
  updatedAt: number;
}

// 步骤配置类型
export type StepConfig = OpenUrlConfig | ClickElementConfig | WaitConfig | GetTextConfig | GetAttributeConfig | SetAttributeConfig | HttpRequestConfig | JsonExtractConfig | LoopConfig | InterceptRequestConfig | ExecuteScriptConfig | LocalStorageConfig | KeyboardActionConfig | ElementMethodConfig | VariableOperationConfig | DingTalkNotifyConfig;

// 打开网址配置
export interface OpenUrlConfig {
  url: string;
}

// 点击元素配置
export interface ClickElementConfig {
  selectorType: 'id' | 'class' | 'selector';
  selectorValue: string;
  elementIndex: number;                   // 第几个元素（从0开始）
}

// 等待配置
export interface WaitConfig {
  seconds: number;                        // 等待秒数
}

// 获取文本配置
export interface GetTextConfig {
  selectorType: 'id' | 'class' | 'selector';
  selectorValue: string;
  elementIndex: number;                   // 第几个元素（从0开始）
  variableName: string;                   // 存储文本的变量名
  textType: 'innerText' | 'innerHTML';    // 获取文本还是 HTML
}

// 获取属性配置
export interface GetAttributeConfig {
  selectorType: 'id' | 'class' | 'selector';
  selectorValue: string;
  elementIndex: number;                   // 第几个元素（从0开始）
  variableName: string;                   // 存储属性值的变量名
  attributeName: string;                  // 要获取的属性名（如 href、src、value）
}

// 设置属性配置
export interface SetAttributeConfig {
  selectorType: 'id' | 'class' | 'selector';
  selectorValue: string;
  elementIndex: number;                   // 第几个元素（从0开始）
  attributeName: string;                  // 要设置的属性名（如 value、href、src）
  attributeValue: string;                 // 要设置的属性值（可使用变量如 ${productName}）
}

// HTTP 请求配置
export interface HttpRequestConfig {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  headers: string;                        // JSON 格式的请求头
  body: string;                           // JSON 格式的请求体
  variableName: string;                   // 存储响应的变量名
  timeout: number;                        // 超时秒数
}

// JSON 提取配置
export interface JsonExtractConfig {
  sourceVariable: string;                 // 来源变量名（如 ${apiResponse}）
  jsonPath: string;                       // JSONPath 表达式（如 $.data.products[0].name）
  variableName: string;                   // 存储提取结果的变量名
  extractAll: boolean;                    // 是否提取所有匹配结果（数组）
}

// 循环配置
export interface LoopConfig {
  loopType: 'selector' | 'variable' | 'count';  // 循环方式：按元素/按变量/按次数
  selectorType: 'id' | 'class' | 'selector';
  selectorValue: string;
  variableSource: string;                 // 循环数据源变量（如 ${products}）
  itemName: string;                       // 当前项变量名（如 item）
  count: number;                          // 循环次数
  subSteps: Step[];                       // 子步骤列表
}

// 拦截请求配置
export interface InterceptRequestConfig {
  urlPattern: string;                     // URL 匹配模式（如 */api/products/*）
  method: 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE';  // 请求方法
  modifyHeaders: string;                  // 修改请求头（JSON 格式）
  modifyBody: string;                     // 修改请求体（JSON 格式）
  modifyResponse: string;                 // 修改响应数据（JSON 格式）
  variableName: string;                   // 存储拦截到的请求数据的变量名
  continueRequest: boolean;               // 是否继续请求（false 表示直接返回修改后的响应）
}

// 注入 JS 配置
export interface ExecuteScriptConfig {
  script: string;                         // JavaScript 代码
}

// 本地存储配置
export interface LocalStorageConfig {
  key: string;                            // 存储键名
  value: string;                          // 存储值（支持变量引用）
  storageType: 'local' | 'session';       // 本地存储或会话存储
  action: 'set' | 'get';                  // 写入或读取
  variableName: string;                   // 读取时存入的变量名（action=get 时使用）
}

// 键盘操作配置
export interface KeyboardActionConfig {
  key: string;                            // 按键名（Enter, Tab, Escape 等）
  selector: string;                       // 目标元素选择器（可选，先聚焦再按键）
  modifiers: string[];                    // 修饰键（Ctrl, Shift, Alt, Meta）
  pressCount: number;                     // 按键次数
}

// 调用元素方法配置
export interface ElementMethodConfig {
  selector: string;                       // CSS 选择器
  method: string;                         // 方法名（focus, dblclick, scrollIntoView 等）
  args: string;                           // 方法参数（可选，JSON 格式）
  waitAfter: number;                      // 调用后等待秒数
}

// 变量操作配置
export interface VariableOperationConfig {
  operation: 'template' | 'math' | 'jsonParse' | 'jsonStringify' | 'regex' | 'regexReplace' | 'replace' | 'split' | 'join' | 'length' | 'default';
  sourceVariable: string;                // 源变量名
  resultVariable: string;               // 结果存入的变量名
  operand: string;                       // 操作参数（模板/正则/运算符/分隔符等）
  operand2: string;                      // 第二参数（替换目标等）
}

// 钉钉推送配置
export interface DingTalkNotifyConfig {
  accessToken: string;                   // Webhook access_token
  msgType: 'text' | 'markdown';          // 消息类型
  title: string;                          // 标题（markdown 时使用）
  content: string;                        // 消息内容模板（支持 ${变量}）
}

// 步骤类型选项
export const STEP_TYPES = {
  openUrl: '打开网址',
  clickElement: '点击元素',
  wait: '等待',
  getText: '获取文本',
  getAttribute: '获取属性',
  setAttribute: '设置属性',
  httpRequest: 'HTTP 请求',
  jsonExtract: 'JSON 提取',
  loop: '循环',
  interceptRequest: '拦截请求',
  executeScript: '注入 JS',
  localStorage: '本地存储',
  keyboardAction: '键盘操作',
  elementMethod: '调用方法',
  variableOperation: '变量操作',
  dingTalkNotify: '钉钉推送',
} as const;

// 选择器类型选项
export const SELECTOR_TYPES = {
  id: 'ID',
  class: 'Class',
  selector: 'CSS 选择器',
} as const;

// 导出的流程配置格式（用于 Python Robot）
export interface ExportedFlowConfig {
  name: string;
  version: string;
  description: string;
  task: ExportedTaskGroup[];
}

export interface ExportedTaskGroup {
  name: string;
  action: ExportedAction[];
}

export interface ExportedAction {
  id: number;
  name: string;
  codeName: string;
  type: 'once' | 'loop' | 'function';
  commands: ExportedCommand[];
}

export interface ExportedCommand {
  action: string;
  data: Record<string, any>;
}

// 图编辑器类型（重新导出）
export type { FlowNodeData, FlowNode, FlowEdge, CanvasData, StepType } from './graph';
