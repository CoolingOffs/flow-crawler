import React from 'react';
import { Step, STEP_TYPES, SELECTOR_TYPES, OpenUrlConfig, ClickElementConfig, WaitConfig, GetTextConfig, GetAttributeConfig, SetAttributeConfig, HttpRequestConfig, JsonExtractConfig, LoopConfig, InterceptRequestConfig } from '../../types';
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
  SyncOutlined,
  StopOutlined,
  EyeOutlined
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

  const { Option } = Select;

  // 判断是否为子步骤
  const isSubStep = !!parentId;

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
      case 'loop':
        return <SyncOutlined />;
      case 'interceptRequest':
        return <StopOutlined />;
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

      case 'loop':
        const loopConfig = step.config as LoopConfig;
        return (
          <div className="config-form">
            <div className="form-item">
              <label>循环方式：</label>
              <Select
                value={loopConfig.loopType}
                onChange={(value) => handleUpdateConfig({ loopType: value })}
                style={{ width: '100%' }}
              >
                <Option value="count">按次数循环</Option>
                <Option value="selector">按元素循环</Option>
                <Option value="variable">按变量数据循环</Option>
              </Select>
            </div>

            {loopConfig.loopType === 'count' && (
              <div className="form-item">
                <label>循环次数：</label>
                <InputNumber
                  min={1}
                  max={1000}
                  value={loopConfig.count}
                  onChange={(value) => handleUpdateConfig({ count: value || 10 })}
                  style={{ width: 120 }}
                />
                <span className="hint">（1-1000 次）</span>
              </div>
            )}

            {loopConfig.loopType === 'selector' && (
              <>
                <div className="form-item">
                  <label>选择器类型：</label>
                  <Select
                    value={loopConfig.selectorType}
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
                    placeholder="例如：product-item"
                    value={loopConfig.selectorValue}
                    onChange={(e) => handleUpdateConfig({ selectorValue: e.target.value })}
                  />
                  <span className="hint">（将循环每个匹配的元素）</span>
                </div>
              </>
            )}

            {loopConfig.loopType === 'variable' && (
              <div className="form-item">
                <label>数据源变量：</label>
                <Input
                  placeholder="例如：products"
                  value={loopConfig.variableSource}
                  onChange={(e) => handleUpdateConfig({ variableSource: e.target.value })}
                />
                <span className="hint">（从变量中读取数组数据，如之前提取的结果）</span>
              </div>
            )}

            {loopConfig.loopType !== 'count' && (
              <div className="form-item">
                <label>当前项变量：</label>
                <Input
                  placeholder="例如：item"
                  value={loopConfig.itemName}
                  onChange={(e) => handleUpdateConfig({ itemName: e.target.value })}
                />
                <span className="hint">（子步骤中可使用此变量引用当前项）</span>
              </div>
            )}

            <div className="form-item">
              <label>子步骤：</label>
              <div className="loop-substeps-container">
                {loopConfig.subSteps && loopConfig.subSteps.length > 0 ? (
                  <div className="substeps-list">
                    {loopConfig.subSteps.map((subStep, subIndex) => (
                      <StepCard
                        key={subStep.id}
                        step={subStep}
                        index={subIndex}
                        total={loopConfig.subSteps.length}
                        parentId={step.id}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="loop-substeps-empty">
                    <SyncOutlined /> 暂无子步骤，点击下方按钮添加
                  </div>
                )}
                
                <Select
                  placeholder="+ 添加子步骤"
                  onChange={(value) => {
                    if (value) {
                      addSubStep(step.id, value as any);
                    }
                  }}
                  style={{ width: '100%', marginTop: 8 }}
                  value={undefined}
                >
                  <Option value="openUrl">打开网址</Option>
                  <Option value="clickElement">点击元素</Option>
                  <Option value="wait">等待</Option>
                  <Option value="getText">获取文本</Option>
                  <Option value="getAttribute">获取属性</Option>
                  <Option value="setAttribute">设置属性</Option>
                  <Option value="httpRequest">HTTP 请求</Option>
                  <Option value="jsonExtract">JSON 提取</Option>
                  <Option value="interceptRequest">拦截请求</Option>
                </Select>
              </div>
              <span className="hint">（子步骤将在每次循环时执行）</span>
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

      default:
        return null;
    }
  };

  return (
    <Card
      className="step-card"
      style={{ 
        animation: `slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.1}s both`,
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
    </Card>
  );
};

export default StepCard;
