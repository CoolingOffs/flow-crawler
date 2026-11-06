import React, { useState } from 'react';
import { Step, STEP_TYPES, SELECTOR_TYPES, OpenUrlConfig, ClickElementConfig, WaitConfig, GetTextConfig, GetAttributeConfig, SetAttributeConfig, HttpRequestConfig, JsonExtractConfig, InterceptRequestConfig, ExecuteScriptConfig, LocalStorageConfig, KeyboardActionConfig, ElementMethodConfig, VariableOperationConfig, DingTalkNotifyConfig } from '../../types';
import { useStore } from '../../store/useStore';
import { Card, Select, Input, InputNumber, Button, Space, AutoComplete, Switch } from 'antd';
import { 
  DeleteOutlined, 
  ArrowUpOutlined, 
  ArrowDownOutlined,
  GlobalOutlined,
  AimOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  EditOutlined,
  ApiOutlined,
  BranchesOutlined,
  StopOutlined,
  EyeOutlined,
  CodeOutlined,
  DatabaseOutlined,
  EnterOutlined,
  ThunderboltOutlined,
  FunctionOutlined,
  FormOutlined,
  BellOutlined
} from '@ant-design/icons';
import './StepCard.css';

interface StepCardProps {
  step: Step;
  index: number;
  total: number;
  parentId?: string;  // 父循环步骤 ID（用于子步骤）
}

const StepCard: React.FC<StepCardProps> = ({ step, index, total, parentId }) => {
  const { updateStep, deleteStep, moveStep, updateStepConfig, addSubStep, deleteSubStep, updateSubStepConfig } = useStore();
  const [remarkVisible, setRemarkVisible] = useState(false);

  const { Option } = Select;

  // 判断是否为子步骤
  const isSubStep = !!parentId;

  // 更新步骤顶层字段（remark/logPrint/disabled）
  const handleUpdateStepField = (field: string, value: any) => {
    if (isSubStep) {
      const steps = useStore.getState().steps;
      const parentStep = steps.find(s => s.id === parentId);
      if (parentStep) {
        const loopConfig = parentStep.config as any;
        const newSubSteps = (loopConfig.subSteps || []).map((s: any) =>
          s.id === step.id ? { ...s, [field]: value } : s
        );
        useStore.setState(state => ({
          steps: state.steps.map(s =>
            s.id === parentId
              ? { ...s, config: { ...loopConfig, subSteps: newSubSteps }, updatedAt: Date.now() }
              : s
          )
        }));
      }
    } else {
      updateStep(step.id, { [field]: value, updatedAt: Date.now() } as any);
    }
  };

  // 子步骤使用特殊的更新/删除函数
  const handleUpdateConfig = (config: any) => {
    if (isSubStep) {
      updateSubStepConfig(parentId!, step.id, config);
    } else {
      updateStepConfig(step.id, config);
    }
  };

  const handleDelete = () => {
    if (isSubStep) {
      deleteSubStep(parentId!, step.id);
    } else {
      deleteStep(step.id);
    }
  };

  // 属性名选项（用于获取属性和设置属性）
  const getAttrOptions = [
    { value: 'href', label: 'href（链接地址）' },
    { value: 'src', label: 'src（图片/资源地址）' },
    { value: 'value', label: 'value（输入框值）' },
    { value: 'alt', label: 'alt（图片替代文本）' },
    { value: 'title', label: 'title（标题）' },
    { value: 'data-id', label: 'data-id（自定义属性）' },
  ];

  const setAttrOptions = [
    { value: 'value', label: 'value（输入框值）' },
    { value: 'href', label: 'href（链接地址）' },
    { value: 'src', label: 'src（图片/资源地址）' },
    { value: 'alt', label: 'alt（图片替代文本）' },
    { value: 'title', label: 'title（标题）' },
    { value: 'innerHTML', label: 'innerHTML（HTML 内容）' },
    { value: 'innerText', label: 'innerText（纯文本内容）' },
    { value: 'disabled', label: 'disabled（禁用状态）' },
    { value: 'checked', label: 'checked（勾选状态）' },
    { value: 'class', label: 'class（样式类名）' },
    { value: 'style', label: 'style（内联样式）' },
  ];
  
  // 获取当前配置
  const clickConfig = step.type === 'clickElement' ? (step.config as ClickElementConfig) : null;
  const urlConfig = step.type === 'openUrl' ? (step.config as OpenUrlConfig) : null;
  const waitConfig = step.type === 'wait' ? (step.config as WaitConfig) : null;

  // 渲染图标
  const renderIcon = () => {
    switch (step.type) {
      case 'openUrl':
        return <GlobalOutlined />;
      case 'clickElement':
        return <AimOutlined />;
      case 'wait':
        return <ClockCircleOutlined />;
      case 'getText':
        return <FileTextOutlined />;
      case 'getAttribute':
        return <LinkOutlined />;
      case 'setAttribute':
        return <EditOutlined />;
      case 'httpRequest':
        return <ApiOutlined />;
      case 'jsonExtract':
        return <BranchesOutlined />;
      case 'interceptRequest':
        return <StopOutlined />;
      case 'executeScript':
        return <CodeOutlined />;
      case 'localStorage':
        return <DatabaseOutlined />;
      case 'keyboardAction':
        return <EnterOutlined />;
      case 'elementMethod':
        return <ThunderboltOutlined />;
      case 'variableOperation':
        return <FunctionOutlined />;
      case 'dingTalkNotify':
        return <BellOutlined />;
      default:
        return null;
    }
  };

  // 渲染配置表单
  const renderConfigForm = () => {
    switch (step.type) {
      case 'openUrl':
        return (
          <div className="config-form">
            <div className="form-item">
              <label>URL 地址：</label>
              <Input
                placeholder="请输入网址，例如：https://www.example.com"
                value={urlConfig?.url || ''}
                onChange={(e) => handleUpdateConfig({ url: e.target.value })}
              />
            </div>
            <div className="form-item">
              <Button
                type="primary"
                icon={<EyeOutlined />}
                onClick={() => {
                  if (urlConfig?.url) {
                    const event = new CustomEvent('openPreview', { detail: { url: urlConfig.url } });
                    window.dispatchEvent(event);
                  }
                }}
                disabled={!urlConfig?.url}
              >
                打开预览
              </Button>
              <span className="hint" style={{ marginLeft: 12 }}>
                （在左侧面板预览网页，方便查找元素）
              </span>
            </div>
          </div>
        );

      case 'clickElement':
        return (
          <div className="config-form">
            <div className="form-item">
              <label>选择器类型：</label>
              <Select
                value={clickConfig?.selectorType || 'id'}
                onChange={(value) => handleUpdateConfig({ selectorType: value })}
                style={{ width: '100%' }}
              >
                {Object.entries(SELECTOR_TYPES).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </div>
            <div className="form-item">
              <label>选择器值：</label>
              <Input
                placeholder="例如：submit-btn"
                value={clickConfig?.selectorValue || ''}
                onChange={(e) => handleUpdateConfig({ selectorValue: e.target.value })}
              />
            </div>
            {clickConfig?.selectorType !== 'id' && (
              <div className="form-item">
                <label>第几个元素：</label>
                <InputNumber
                  min={0}
                  value={clickConfig?.elementIndex || 0}
                  onChange={(value) => handleUpdateConfig({ elementIndex: value || 0 })}
                  style={{ width: 120 }}
                />
                <span className="hint">（从 0 开始计数，ID 选择器不需要此字段）</span>
              </div>
            )}
          </div>
        );

      case 'wait':
        return (
          <div className="config-form">
            <div className="form-item">
              <label>等待时间（秒）：</label>
              <InputNumber
                min={1}
                max={60}
                value={waitConfig?.seconds || 3}
                onChange={(value) => handleUpdateConfig({ seconds: value || 3 })}
                style={{ width: 120 }}
              />
            </div>
          </div>
        );

      case 'getText':
        const getTextConfig = step.config as GetTextConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>选择器类型：</label>
              <Select
                value={getTextConfig.selectorType}
                onChange={(value) => handleUpdateConfig({ selectorType: value })}
                style={{ width: '100%' }}
              >
                {Object.entries(SELECTOR_TYPES).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </div>
            <div className="form-item">
              <label>选择器值：</label>
              <Input
                placeholder="例如：product-title"
                value={getTextConfig.selectorValue}
                onChange={(e) => handleUpdateConfig({ selectorValue: e.target.value })}
              />
            </div>
            {getTextConfig.selectorType !== 'id' && (
              <div className="form-item">
                <label>第几个元素：</label>
                <InputNumber
                  min={0}
                  value={getTextConfig.elementIndex}
                  onChange={(value) => handleUpdateConfig({ elementIndex: value || 0 })}
                  style={{ width: 120 }}
                />
                <span className="hint">（从 0 开始计数，ID 选择器不需要此字段）</span>
              </div>
            )}

            <div className="form-item">
              <label>获取类型：</label>
              <Select
                key={`textType-${step.id}-${(step.config as GetTextConfig).textType}`}
                value={getTextConfig.textType || 'innerText'}
                onChange={(value) => handleUpdateConfig({ textType: value })}
                style={{ width: '100%' }}
              >
                <Option value="innerText">innerText（纯文本）</Option>
                <Option value="innerHTML">innerHTML（HTML 内容）</Option>
              </Select>
            </div>

            <div className="form-item">
              <label>保存为变量：</label>
              <Input
                placeholder="例如：productTitle"
                value={getTextConfig.variableName}
                onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
              />
              <span className="hint">（后续步骤可通过此变量名引用提取的内容）</span>
            </div>
          </div>
        );

      case 'getAttribute':
        const getAttrConfig = step.config as GetAttributeConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>选择器类型：</label>
              <Select
                value={getAttrConfig.selectorType}
                onChange={(value) => handleUpdateConfig({ selectorType: value })}
                style={{ width: '100%' }}
              >
                {Object.entries(SELECTOR_TYPES).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </div>
            <div className="form-item">
              <label>选择器值：</label>
              <Input
                placeholder="例如：product-link"
                value={getAttrConfig.selectorValue}
                onChange={(e) => handleUpdateConfig({ selectorValue: e.target.value })}
              />
            </div>
            {getAttrConfig.selectorType !== 'id' && (
              <div className="form-item">
                <label>第几个元素：</label>
                <InputNumber
                  min={0}
                  value={getAttrConfig.elementIndex}
                  onChange={(value) => handleUpdateConfig({ elementIndex: value || 0 })}
                  style={{ width: 120 }}
                />
                <span className="hint">（从 0 开始计数，ID 选择器不需要此字段）</span>
              </div>
            )}

            <div className="form-item">
              <label>属性名：</label>
              <AutoComplete
                options={getAttrOptions}
                placeholder="选择或输入属性名"
                value={getAttrConfig.attributeName}
                onChange={(value) => handleUpdateConfig({ attributeName: value })}
                style={{ width: '100%' }}
                allowClear
              />
              <span className="hint">（支持使用变量，格式：${'{变量名}'}）</span>
            </div>

            <div className="form-item">
              <label>保存为变量：</label>
              <Input
                placeholder="例如：productLink"
                value={getAttrConfig.variableName}
                onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
              />
              <span className="hint">（后续步骤可通过此变量名引用提取的属性）</span>
            </div>
          </div>
        );

      case 'setAttribute':
        const setAttrConfig = step.config as SetAttributeConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>选择器类型：</label>
              <Select
                value={setAttrConfig.selectorType}
                onChange={(value) => handleUpdateConfig({ selectorType: value })}
                style={{ width: '100%' }}
              >
                {Object.entries(SELECTOR_TYPES).map(([value, label]) => (
                  <Option key={value} value={value}>{label}</Option>
                ))}
              </Select>
            </div>
            <div className="form-item">
              <label>选择器值：</label>
              <Input
                placeholder="例如：search-input"
                value={setAttrConfig.selectorValue}
                onChange={(e) => handleUpdateConfig({ selectorValue: e.target.value })}
              />
            </div>
            {setAttrConfig.selectorType !== 'id' && (
              <div className="form-item">
                <label>第几个元素：</label>
                <InputNumber
                  min={0}
                  value={setAttrConfig.elementIndex}
                  onChange={(value) => handleUpdateConfig({ elementIndex: value || 0 })}
                  style={{ width: 120 }}
                />
                <span className="hint">（从 0 开始计数，ID 选择器不需要此字段）</span>
              </div>
            )}

            <div className="form-item">
              <label>属性名：</label>
              <AutoComplete
                options={setAttrOptions}
                placeholder="选择或输入属性名"
                value={setAttrConfig.attributeName}
                onChange={(value) => handleUpdateConfig({ attributeName: value })}
                style={{ width: '100%' }}
                allowClear
              />
            </div>

            <div className="form-item">
              <label>属性值：</label>
              <Input
                placeholder="输入要设置的值（支持变量）"
                value={setAttrConfig.attributeValue}
                onChange={(e) => handleUpdateConfig({ attributeValue: e.target.value })}
              />
              <span className="hint">（支持使用变量，如：${'{productName}'}）</span>
            </div>
          </div>
        );

      case 'httpRequest':
        const httpConfig = step.config as HttpRequestConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>请求方法：</label>
              <Select
                value={httpConfig.method}
                onChange={(value) => handleUpdateConfig({ method: value })}
                style={{ width: '100%' }}
              >
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </div>

            <div className="form-item">
              <label>URL：</label>
              <Input
                placeholder="https://api.example.com/products"
                value={httpConfig.url}
                onChange={(e) => handleUpdateConfig({ url: e.target.value })}
              />
              <span className="hint">（支持使用变量，如：${'{baseUrl}'}/products）</span>
            </div>

            <div className="form-item">
              <label>请求头：</label>
              <Input.TextArea
                rows={3}
                placeholder={`{\n  "Authorization": "Bearer ${'{token}'}",\n  "Content-Type": "application/json"\n}`}
                value={httpConfig.headers}
                onChange={(e) => handleUpdateConfig({ headers: e.target.value })}
              />
              <span className="hint">（JSON 格式，可选）</span>
            </div>

            {(httpConfig.method === 'POST' || httpConfig.method === 'PUT') && (
              <div className="form-item">
                <label>请求体：</label>
                <Input.TextArea
                  rows={4}
                  placeholder={`{\n  "keyword": "${'{searchKey}'}",\n  "page": 1\n}`}
                  value={httpConfig.body}
                  onChange={(e) => handleUpdateConfig({ body: e.target.value })}
                />
                <span className="hint">（JSON 格式，POST/PUT 时使用，支持变量）</span>
              </div>
            )}

            <div className="form-item">
              <label>保存为变量：</label>
              <Input
                placeholder="例如：apiResponse"
                value={httpConfig.variableName}
                onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
              />
              <span className="hint">（响应内容将存入此变量，后续步骤可引用）</span>
            </div>

            <div className="form-item">
              <label>超时时间（秒）：</label>
              <InputNumber
                min={1}
                max={120}
                value={httpConfig.timeout || 30}
                onChange={(value) => handleUpdateConfig({ timeout: value || 30 })}
                style={{ width: 120 }}
              />
            </div>
          </div>
        );

      case 'jsonExtract':
        const jsonConfig = step.config as JsonExtractConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>数据源变量：</label>
              <Input
                placeholder="例如：apiResponse"
                value={jsonConfig.sourceVariable}
                onChange={(e) => handleUpdateConfig({ sourceVariable: e.target.value })}
              />
              <span className="hint">（从哪个变量中提取 JSON，如之前请求的响应）</span>
            </div>

            <div className="form-item">
              <label>JSONPath：</label>
              <Input
                placeholder="例如：$.data.products[0].name"
                value={jsonConfig.jsonPath}
                onChange={(e) => handleUpdateConfig({ jsonPath: e.target.value })}
              />
              <span className="hint">（JSONPath 表达式，如：$.store.book[*].author）</span>
            </div>

            <div className="form-item">
              <label>保存为变量：</label>
              <Input
                placeholder="例如：productName"
                value={jsonConfig.variableName}
                onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
              />
              <span className="hint">（提取的结果将存入此变量）</span>
            </div>
          </div>
        );

      case 'interceptRequest':
        const interceptConfig = step.config as InterceptRequestConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>URL 匹配模式：</label>
              <Input
                placeholder="例如：*/api/products/* 或 https://api.example.com/*"
                value={interceptConfig.urlPattern}
                onChange={(e) => handleUpdateConfig({ urlPattern: e.target.value })}
              />
              <span className="hint">（使用通配符匹配 URL，如 * 表示任意字符）</span>
            </div>

            <div className="form-item">
              <label>请求方法：</label>
              <Select
                value={interceptConfig.method}
                onChange={(value) => handleUpdateConfig({ method: value })}
                style={{ width: '100%' }}
              >
                <Option value="ALL">全部</Option>
                <Option value="GET">GET</Option>
                <Option value="POST">POST</Option>
                <Option value="PUT">PUT</Option>
                <Option value="DELETE">DELETE</Option>
              </Select>
            </div>

            <div className="form-item">
              <label>修改请求头：</label>
              <Input.TextArea
                rows={3}
                placeholder={`{
  "Authorization": "Bearer ${'{newToken}'}",
  "X-Custom-Header": "custom-value"
}`}
                value={interceptConfig.modifyHeaders}
                onChange={(e) => handleUpdateConfig({ modifyHeaders: e.target.value })}
              />
              <span className="hint">（JSON 格式，可选。留空表示不修改请求头）</span>
            </div>

            <div className="form-item">
              <label>修改请求体：</label>
              <Input.TextArea
                rows={4}
                placeholder={`{
  "page": 1,
  "pageSize": 50,
  "keyword": "${'{searchKey}'}"
}`}
                value={interceptConfig.modifyBody}
                onChange={(e) => handleUpdateConfig({ modifyBody: e.target.value })}
              />
              <span className="hint">（JSON 格式，POST/PUT 时使用。留空表示不修改请求体）</span>
            </div>

            <div className="form-item">
              <label>修改响应数据：</label>
              <Input.TextArea
                rows={4}
                placeholder={`{
  "code": 200,
  "data": ${'{customData}'},
  "message": "success"
}`}
                value={interceptConfig.modifyResponse}
                onChange={(e) => handleUpdateConfig({ modifyResponse: e.target.value })}
              />
              <span className="hint">（JSON 格式。填写后将修改响应数据，留空表示使用原始响应）</span>
            </div>

            <div className="form-item">
              <label>是否继续请求：</label>
              <Switch
                checked={interceptConfig.continueRequest}
                onChange={(checked) => handleUpdateConfig({ continueRequest: checked })}
                checkedChildren="继续"
                unCheckedChildren="拦截"
              />
              <span className="hint" style={{ marginLeft: 12 }}>
                {interceptConfig.continueRequest 
                  ? '（继续发送请求，拦截并修改参数）' 
                  : '（直接返回修改后的响应，不发送真实请求）'}
              </span>
            </div>

            <div className="form-item">
              <label>保存为变量：</label>
              <Input
                placeholder="例如：interceptedData"
                value={interceptConfig.variableName}
                onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
              />
              <span className="hint">（拦截到的请求/响应数据将存入此变量）</span>
            </div>
          </div>
        );

      case 'executeScript':
        const scriptConfig = step.config as ExecuteScriptConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>JavaScript 代码：</label>
              <Input.TextArea
                rows={8}
                placeholder={`// 在页面中执行的 JavaScript 代码\n// 示例 1：修改页面标题\ndocument.title = '新标题';\n\n// 示例 2：移除元素\ndocument.querySelector('.ads').remove();\n\n// 示例 3：注入脚本\nvar s = document.createElement('script');\ns.src = 'https://example.com/inject.js';\ndocument.head.appendChild(s);`}
                value={scriptConfig.script}
                onChange={(e) => handleUpdateConfig({ script: e.target.value })}
                style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px' }}
              />
              <span className="hint">（在页面中注入并执行 JS 代码，支持使用 <code>{'${变量名}'}</code> 引用变量）</span>
            </div>
          </div>
        );

      case 'localStorage':
        const storageConfig = step.config as LocalStorageConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>操作类型：</label>
              <Select
                value={storageConfig.action}
                onChange={(value) => handleUpdateConfig({ action: value })}
                style={{ width: '100%' }}
              >
                <Option value="set">写入（保存值）</Option>
                <Option value="get">读取（获取值）</Option>
              </Select>
            </div>

            <div className="form-item">
              <label>存储方式：</label>
              <Select
                value={storageConfig.storageType}
                onChange={(value) => handleUpdateConfig({ storageType: value })}
                style={{ width: '100%' }}
              >
                <Option value="local">本地（跨会话保留）</Option>
                <Option value="session">会话（运行结束清除）</Option>
              </Select>
            </div>

            <div className="form-item">
              <label>存储键名：</label>
              <Input
                placeholder="例如：loginToken"
                value={storageConfig.key}
                onChange={(e) => handleUpdateConfig({ key: e.target.value })}
              />
            </div>

            {storageConfig.action === 'set' ? (
              <div className="form-item">
                <label>存储值：</label>
                <Input
                  placeholder="输入要保存的值（支持变量，如 ${'{token}'}）"
                  value={storageConfig.value}
                  onChange={(e) => handleUpdateConfig({ value: e.target.value })}
                />
                <span className="hint">（支持使用变量引用，如 <code>{'${token}'}</code>）</span>
              </div>
            ) : (
              <div className="form-item">
                <label>读取后存入变量：</label>
                <Input
                  placeholder="例如：savedToken"
                  value={storageConfig.variableName}
                  onChange={(e) => handleUpdateConfig({ variableName: e.target.value })}
                />
                <span className="hint">（读取到的值将存入此变量，后续步骤可通过 <code>{'${变量名}'}</code> 引用）</span>
              </div>
            )}
          </div>
        );

      case 'keyboardAction':
        const keyboardConfig = step.config as KeyboardActionConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>按键：</label>
              <AutoComplete
                options={[
                  { value: 'Enter', label: 'Enter（回车）' },
                  { value: 'Tab', label: 'Tab（切换焦点）' },
                  { value: 'Escape', label: 'Escape（关闭/取消）' },
                  { value: 'Backspace', label: 'Backspace（退格）' },
                  { value: 'Delete', label: 'Delete（删除）' },
                  { value: 'ArrowUp', label: '↑ 上移' },
                  { value: 'ArrowDown', label: '↓ 下移' },
                  { value: 'ArrowLeft', label: '← 左移' },
                  { value: 'ArrowRight', label: '→ 右移' },
                  { value: 'Space', label: 'Space（空格）' },
                  { value: 'Home', label: 'Home（到开头）' },
                  { value: 'End', label: 'End（到末尾）' },
                  { value: 'PageUp', label: 'PageUp（上翻页）' },
                  { value: 'PageDown', label: 'PageDown（下翻页）' },
                ]}
                placeholder="选择或输入按键名"
                value={keyboardConfig.key}
                onChange={(value) => handleUpdateConfig({ key: value })}
                style={{ width: '100%' }}
                allowClear
              />
              <span className="hint">（支持常用按键，也可输入自定义按键名）</span>
            </div>

            <div className="form-item">
              <label>目标元素选择器（可选）：</label>
              <Input
                placeholder="例如：#search-input 或 .search-box（留空表示在当前焦点元素上按键）"
                value={keyboardConfig.selector}
                onChange={(e) => handleUpdateConfig({ selector: e.target.value })}
              />
              <span className="hint">（填写后会先聚焦该元素，再按键。留空表示直接按键）</span>
            </div>

            <div className="form-item">
              <label>修饰键：</label>
              <Select
                mode="multiple"
                placeholder="可选：Ctrl / Shift / Alt"
                value={keyboardConfig.modifiers}
                onChange={(value) => handleUpdateConfig({ modifiers: value })}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="Control">Ctrl</Option>
                <Option value="Shift">Shift</Option>
                <Option value="Alt">Alt</Option>
                <Option value="Meta">Meta (Win/Cmd)</Option>
              </Select>
              <span className="hint">（例如 Ctrl+A 全选、Ctrl+C 复制）</span>
            </div>

            <div className="form-item">
              <label>按键次数：</label>
              <InputNumber
                min={1}
                max={100}
                value={keyboardConfig.pressCount}
                onChange={(value) => handleUpdateConfig({ pressCount: value || 1 })}
                style={{ width: 120 }}
              />
            </div>
          </div>
        );

      case 'elementMethod':
        const methodConfig = step.config as ElementMethodConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>CSS 选择器：</label>
              <Input
                placeholder="例如：#search-input 或 .btn-submit"
                value={methodConfig.selector}
                onChange={(e) => handleUpdateConfig({ selector: e.target.value })}
              />
              <span className="hint">（要调用方法的页面元素）</span>
            </div>

            <div className="form-item">
              <label>方法名：</label>
              <AutoComplete
                options={[
                  { value: 'focus', label: 'focus() — 聚焦元素' },
                  { value: 'blur', label: 'blur() — 失去焦点' },
                  { value: 'click', label: 'click() — 单击' },
                  { value: 'dblclick', label: 'dblclick() — 双击' },
                  { value: 'scrollIntoView', label: 'scrollIntoView() — 滚动到可见' },
                  { value: 'select', label: 'select() — 选中内容' },
                  { value: 'submit', label: 'submit() — 提交表单' },
                  { value: 'reset', label: 'reset() — 重置表单' },
                  { value: 'remove', label: 'remove() — 删除元素' },
                  { value: 'play', label: 'play() — 播放媒体' },
                  { value: 'pause', label: 'pause() — 暂停媒体' },
                  { value: 'reportValidity', label: 'reportValidity() — 校验表单' },
                ]}
                placeholder="选择或输入方法名"
                value={methodConfig.method}
                onChange={(value) => handleUpdateConfig({ method: value })}
                style={{ width: '100%' }}
                allowClear
              />
              <span className="hint">（常用 DOM 方法，也可输入自定义方法名）</span>
            </div>

            <div className="form-item">
              <label>方法参数（可选）：</label>
              <Input
                placeholder='例如：{ "behavior": "smooth" } 或留空'
                value={methodConfig.args}
                onChange={(e) => handleUpdateConfig({ args: e.target.value })}
              />
              <span className="hint">（JSON 格式，如 scrollIntoView 可传 <code>{'{ "behavior": "smooth" }'}</code>）</span>
            </div>

            <div className="form-item">
              <label>调用后等待（秒）：</label>
              <InputNumber
                min={0}
                max={30}
                value={methodConfig.waitAfter}
                onChange={(value) => handleUpdateConfig({ waitAfter: value || 0 })}
                style={{ width: 120 }}
              />
              <span className="hint">（方法执行后等待的秒数，0 表示不等待）</span>
            </div>
          </div>
        );

      case 'variableOperation':
        const varOpConfig = step.config as VariableOperationConfig;
        const needsOperand = ['template', 'math', 'regex', 'regexReplace', 'replace', 'split', 'join', 'default'].includes(varOpConfig.operation);
        const needsOperand2 = ['regexReplace', 'replace'].includes(varOpConfig.operation);
        const needsSource = !['template'].includes(varOpConfig.operation);

        // 操作参数标签映射
        const operandLabels: Record<string, string> = {
          template: '模板表达式',
          math: '运算符与数值',
          regex: '正则表达式',
          regexReplace: '正则表达式',
          replace: '查找内容',
          split: '分隔符',
          join: '连接符',
          default: '默认值',
        };
        const operandPlaceholders: Record<string, string> = {
          template: '例如：Hello ${name}, 价格：${price}',
          math: '例如：+ 10 或 * 2 或 / 3',
          regex: '例如：\\d+ 或 (https?://[^\\s]+)',
          regexReplace: '例如：\\d+',
          replace: '要替换的字符串',
          split: '例如：, 或 \\n 或 |',
          join: '例如：, 或 - 或 空格',
          default: '当变量不存在时使用的默认值',
        };

        return (
          <div className="config-form">
            <div className="form-item">
              <label>操作类型：</label>
              <Select
                value={varOpConfig.operation}
                onChange={(value) => handleUpdateConfig({ operation: value })}
                style={{ width: '100%' }}
              >
                <Option value="template">📝 模板拼接</Option>
                <Option value="math">🔢 数学运算</Option>
                <Option value="jsonParse">📥 JSON 解析（字符串→对象）</Option>
                <Option value="jsonStringify">📤 JSON 字符串化（对象→字符串）</Option>
                <Option value="regex">🔍 正则提取</Option>
                <Option value="regexReplace">🔄 正则替换</Option>
                <Option value="replace">✂️ 字符串替换</Option>
                <Option value="split">📊 字符串分割为数组</Option>
                <Option value="join">📊 数组合并为字符串</Option>
                <Option value="length">📏 取长度</Option>
                <Option value="default">🔀 设置默认值</Option>
              </Select>
            </div>

            {varOpConfig.operation === 'template' ? (
              <div className="form-item">
                <label>模板表达式：</label>
                <Input.TextArea
                  rows={3}
                  placeholder="例如：Hello ${name}, 价格：${price} 元"
                  value={varOpConfig.operand}
                  onChange={(e) => handleUpdateConfig({ operand: e.target.value })}
                />
                <span className="hint">（使用 <code>{'${变量名}'}</code> 插入变量值，支持多个变量拼接）</span>
              </div>
            ) : (
              <>
                {needsSource && (
                  <div className="form-item">
                    <label>源变量名：</label>
                    <Input
                      placeholder="例如：productPrice"
                      value={varOpConfig.sourceVariable}
                      onChange={(e) => handleUpdateConfig({ sourceVariable: e.target.value })}
                    />
                    <span className="hint">（要操作的变量名）</span>
                  </div>
                )}

                {needsOperand && (
                  <div className="form-item">
                    <label>{operandLabels[varOpConfig.operation] || '操作参数'}：</label>
                    <Input
                      placeholder={operandPlaceholders[varOpConfig.operation] || ''}
                      value={varOpConfig.operand}
                      onChange={(e) => handleUpdateConfig({ operand: e.target.value })}
                    />
                    {varOpConfig.operation === 'math' && (
                      <span className="hint">（格式：运算符 + 空格 + 数值，如 <code>+ 10</code>、<code>* 2</code>、<code>% 3</code>）</span>
                    )}
                    {varOpConfig.operation === 'regex' && (
                      <span className="hint">（提取第一个匹配组或整个匹配，支持变量引用）</span>
                    )}
                  </div>
                )}

                {needsOperand2 && (
                  <div className="form-item">
                    <label>替换为：</label>
                    <Input
                      placeholder="替换后的内容（支持变量引用）"
                      value={varOpConfig.operand2}
                      onChange={(e) => handleUpdateConfig({ operand2: e.target.value })}
                    />
                  </div>
                )}
              </>
            )}

            <div className="form-item">
              <label>结果存入变量名：</label>
              <Input
                placeholder="例如：formattedPrice"
                value={varOpConfig.resultVariable}
                onChange={(e) => handleUpdateConfig({ resultVariable: e.target.value })}
              />
              <span className="hint">（操作结果将存入此变量，后续步骤可用 <code>{'${变量名}'}</code> 引用）</span>
            </div>
          </div>
        );

      case 'dingTalkNotify':
        const dingConfig = step.config as DingTalkNotifyConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>Webhook Access Token：</label>
              <Input.Password
                placeholder="输入钉钉机器人的 access_token"
                value={dingConfig.accessToken}
                onChange={(e) => handleUpdateConfig({ accessToken: e.target.value })}
              />
              <span className="hint">（在钉钉群设置 → 智能群助手 → 添加机器人 → Webhook 中获取）</span>
            </div>

            <div className="form-item">
              <label>消息类型：</label>
              <Select
                value={dingConfig.msgType}
                onChange={(value) => handleUpdateConfig({ msgType: value })}
                style={{ width: '100%' }}
              >
                <Option value="text">文本消息（text）</Option>
                <Option value="markdown">Markdown 消息</Option>
              </Select>
            </div>

            {dingConfig.msgType === 'markdown' && (
              <div className="form-item">
                <label>消息标题：</label>
                <Input
                  placeholder="例如：爬虫执行报告"
                  value={dingConfig.title}
                  onChange={(e) => handleUpdateConfig({ title: e.target.value })}
                />
              </div>
            )}

            <div className="form-item">
              <label>消息内容：</label>
              <Input.TextArea
                rows={dingConfig.msgType === 'markdown' ? 8 : 4}
                placeholder={dingConfig.msgType === 'markdown'
                  ? '支持 Markdown 格式，例如：\n## 爬虫执行报告\n- 采集数量：**${count}** 条\n- 执行时间：${time}'
                  : '输入消息内容，支持变量引用，如：采集完成，共 ${count} 条数据'
                }
                value={dingConfig.content}
                onChange={(e) => handleUpdateConfig({ content: e.target.value })}
                style={dingConfig.msgType === 'markdown' ? { fontFamily: 'Monaco, Consolas, monospace', fontSize: '13px' } : {}}
              />
              <span className="hint">（使用 <code>{'${变量名}'}</code> 插入变量值）</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Card
      className={`step-card ${step.disabled ? 'step-card-disabled' : ''}`}
      style={{ 
        animation: `slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
        opacity: step.disabled ? 0.5 : 1,
      }}
      title={
        <div className="step-card-header">
          <span className="step-icon" style={{ animation: `bounceIn 0.5s ease-out ${index * 0.1 + 0.2}s both` }}>
            {renderIcon()}
          </span>
          <span className="step-title">
            步骤 {index + 1}：{STEP_TYPES[step.type]}
          </span>
        </div>
      }
      extra={
        <Space>
          {!isSubStep && (
            <>
              <Button
                type="text"
                icon={<ArrowUpOutlined />}
                disabled={index === 0}
                onClick={(e) => {
                  e.stopPropagation();
                  moveStep(step.id, 'up');
                }}
                title="上移"
                shape="circle"
                size="small"
              />
              <Button
                type="text"
                icon={<ArrowDownOutlined />}
                disabled={index === total - 1}
                onClick={(e) => {
                  e.stopPropagation();
                  moveStep(step.id, 'down');
                }}
                title="下移"
                shape="circle"
                size="small"
              />
            </>
          )}
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="删除"
            shape="circle"
            size="small"
          />
        </Space>
      }
    >
      {renderConfigForm()}

      {/* 步骤备注 & 打印日志 */}
      <div className="step-extra-options">
        <div className="step-extra-row">
          <Button
            type="text"
            size="small"
            icon={<FormOutlined />}
            className={`remark-toggle-btn ${step.remark ? 'has-remark' : ''}`}
            onClick={() => setRemarkVisible(!remarkVisible)}
          >
            备注{step.remark ? ' ✓' : ''}
          </Button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="log-print-switch">
              <span className="log-label">禁用</span>
              <Switch
                size="small"
                checked={step.disabled || false}
                onChange={(checked) => handleUpdateStepField('disabled', checked)}
                checkedChildren="开"
                unCheckedChildren="关"
              />
            </div>
            <div className="log-print-switch">
              <span className="log-label">打印日志</span>
              <Switch
                size="small"
                checked={step.logPrint || false}
                onChange={(checked) => handleUpdateStepField('logPrint', checked)}
              />
            </div>
          </div>
        </div>
        {remarkVisible && (
          <div className="remark-input-wrapper">
            <Input.TextArea
              size="small"
              rows={2}
              placeholder="输入步骤备注说明…"
              value={step.remark || ''}
              onChange={(e) => handleUpdateStepField('remark', e.target.value)}
            />
          </div>
        )}
      </div>
    </Card>
  );
};

export default StepCard;
