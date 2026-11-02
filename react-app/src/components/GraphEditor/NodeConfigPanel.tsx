/**
 * NodeConfigPanel - 节点配置面板
 * 选中节点后右侧滑出的配置面板
 * 复用所有 16 种步骤配置表单
 */
import React, { useState, useMemo } from 'react';
import { useStore } from '../../store/useStore';
import { FlowNodeData, StepConfig } from '../../types';
import { Input, InputNumber, Select, AutoComplete, Switch, Button } from 'antd';
import { CloseOutlined, DeleteOutlined, FormOutlined } from '@ant-design/icons';
import './NodeConfigPanel.css';

const { Option } = Select;

const NodeConfigPanel: React.FC = () => {
  const { selectedNodeId, selectedFolderId, canvasData, updateNodeData, updateNodeConfig, deleteNode, selectNode } = useStore();

  const [remarkVisible, setRemarkVisible] = useState(false);

  if (!selectedNodeId || !selectedFolderId) return null;

  const canvas = canvasData[selectedFolderId];
  if (!canvas) return null;

  const node = canvas.nodes.find(n => n.id === selectedNodeId);
  if (!node) return null;

  const data = node.data as unknown as FlowNodeData;
  const config = data.config as any;

  // 计算当前节点的执行编号
  const executionOrder = useMemo(() => {
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    canvas.nodes.forEach(n => {
      inDegree.set(n.id, 0);
      adjacency.set(n.id, []);
    });
    canvas.edges.forEach(e => {
      adjacency.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });
    const queue: string[] = [];
    inDegree.forEach((deg, id) => { if (deg === 0) queue.push(id); });
    let order = 1;
    const orderMap = new Map<string, number>();
    while (queue.length > 0) {
      const current = queue.shift()!;
      orderMap.set(current, order++);
      (adjacency.get(current) || []).forEach(nid => {
        const newDeg = (inDegree.get(nid) || 1) - 1;
        inDegree.set(nid, newDeg);
        if (newDeg === 0) queue.push(nid);
      });
    }
    return orderMap.get(selectedNodeId) || '-';
  }, [canvas, selectedNodeId]);

  const handleUpdateConfig = (partial: Partial<StepConfig>) => {
    updateNodeConfig(selectedNodeId, partial);
  };

  const handleUpdateData = (partial: Partial<FlowNodeData>) => {
    updateNodeData(selectedNodeId, partial);
  };

  // 禁用节点时，同时移除与其关联的所有连线
  const handleToggleDisabled = (checked: boolean) => {
    handleUpdateData({ disabled: checked });
    if (checked && selectedFolderId) {
      const canvas = useStore.getState().canvasData[selectedFolderId];
      if (canvas) {
        const relatedEdges = canvas.edges.filter(
          e => e.source === selectedNodeId || e.target === selectedNodeId
        );
        const { removeEdge } = useStore.getState();
        relatedEdges.forEach(e => removeEdge(e.id));
      }
    }
  };

  const handleClose = () => {
    selectNode(null);
  };

  const handleDelete = () => {
    deleteNode(selectedNodeId);
  };

  return (
    <div className="node-config-panel">
      {/* 面板头部 */}
      <div className="panel-header">
        <div className="panel-header-title">
          <span className="panel-order-badge">{executionOrder}</span>
          <Input
            size="small"
            value={data.name}
            onChange={(e) => handleUpdateData({ name: e.target.value })}
            style={{ fontWeight: 600, fontSize: 14 }}
          />
        </div>
        <div className="panel-header-actions">
          <Button type="text" size="small" danger icon={<DeleteOutlined />} onClick={handleDelete} />
          <Button type="text" size="small" icon={<CloseOutlined />} onClick={handleClose} />
        </div>
      </div>

      {/* 配置表单 */}
      <div className="panel-body">
        <div className="config-form">
          {renderConfigForm(data.stepType, config, handleUpdateConfig)}
        </div>

        {/* 步骤增强选项 */}
        <div className="step-extra-options">
          <div className="step-extra-row">
            <Button
              type="text"
              size="small"
              icon={<FormOutlined />}
              className={`remark-toggle-btn ${data.remark ? 'has-remark' : ''}`}
              onClick={() => setRemarkVisible(!remarkVisible)}
            >
              备注{data.remark ? ' ✓' : ''}
            </Button>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div className="extra-switch">
                <span className="extra-label">禁用</span>
                <Switch
                  size="small"
                  checked={data.disabled || false}
                  onChange={(checked) => handleToggleDisabled(checked)}
                  checkedChildren="开"
                  unCheckedChildren="关"
                />
              </div>
              <div className="extra-switch">
                <span className="extra-label">打印日志</span>
                <Switch
                  size="small"
                  checked={data.logPrint || false}
                  onChange={(checked) => handleUpdateData({ logPrint: checked })}
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
                value={data.remark || ''}
                onChange={(e) => handleUpdateData({ remark: e.target.value })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * 渲染配置表单（复用 16 种步骤类型）
 */
function renderConfigForm(stepType: string, config: any, onUpdate: (partial: any) => void): React.ReactNode {
  switch (stepType) {
    case 'openUrl':
      return (
        <>
          <div className="form-item">
            <label>网址：</label>
            <Input placeholder="https://example.com" value={config.url} onChange={(e) => onUpdate({ url: e.target.value })} />
          </div>
        </>
      );

    case 'clickElement':
      return (
        <>
          <div className="form-item">
            <label>选择器类型：</label>
            <Select value={config.selectorType} onChange={(v) => onUpdate({ selectorType: v })} style={{ width: '100%' }}>
              <Option value="id">ID</Option>
              <Option value="class">Class</Option>
              <Option value="selector">CSS 选择器</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>选择器值：</label>
            <Input placeholder="元素选择器" value={config.selectorValue} onChange={(e) => onUpdate({ selectorValue: e.target.value })} />
          </div>
          {config.selectorType !== 'id' && (
            <div className="form-item">
              <label>第几个元素：</label>
              <InputNumber min={0} value={config.elementIndex} onChange={(v) => onUpdate({ elementIndex: v || 0 })} style={{ width: '100%' }} />
            </div>
          )}
        </>
      );

    case 'wait':
      return (
        <div className="form-item">
          <label>等待秒数：</label>
          <InputNumber min={0} step={0.5} value={config.seconds} onChange={(v) => onUpdate({ seconds: v || 0 })} style={{ width: '100%' }} />
        </div>
      );

    case 'getText':
      return (
        <>
          <div className="form-item">
            <label>选择器类型：</label>
            <Select value={config.selectorType} onChange={(v) => onUpdate({ selectorType: v })} style={{ width: '100%' }}>
              <Option value="id">ID</Option>
              <Option value="class">Class</Option>
              <Option value="selector">CSS 选择器</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>选择器值：</label>
            <Input value={config.selectorValue} onChange={(e) => onUpdate({ selectorValue: e.target.value })} />
          </div>
          {config.selectorType !== 'id' && (
            <div className="form-item">
              <label>第几个元素：</label>
              <InputNumber min={0} value={config.elementIndex} onChange={(v) => onUpdate({ elementIndex: v || 0 })} style={{ width: '100%' }} />
            </div>
          )}
          <div className="form-item">
            <label>文本类型：</label>
            <Select value={config.textType} onChange={(v) => onUpdate({ textType: v })} style={{ width: '100%' }}>
              <Option value="innerText">innerText</Option>
              <Option value="innerHTML">innerHTML</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>保存变量名：</label>
            <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
          </div>
        </>
      );

    case 'getAttribute':
      return (
        <>
          <div className="form-item">
            <label>选择器类型：</label>
            <Select value={config.selectorType} onChange={(v) => onUpdate({ selectorType: v })} style={{ width: '100%' }}>
              <Option value="id">ID</Option>
              <Option value="class">Class</Option>
              <Option value="selector">CSS 选择器</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>选择器值：</label>
            <Input value={config.selectorValue} onChange={(e) => onUpdate({ selectorValue: e.target.value })} />
          </div>
          {config.selectorType !== 'id' && (
            <div className="form-item">
              <label>第几个元素：</label>
              <InputNumber min={0} value={config.elementIndex} onChange={(v) => onUpdate({ elementIndex: v || 0 })} style={{ width: '100%' }} />
            </div>
          )}
          <div className="form-item">
            <label>属性名：</label>
            <Input value={config.attributeName} onChange={(e) => onUpdate({ attributeName: e.target.value })} />
          </div>
          <div className="form-item">
            <label>保存变量名：</label>
            <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
          </div>
        </>
      );

    case 'setAttribute':
      return (
        <>
          <div className="form-item">
            <label>选择器类型：</label>
            <Select value={config.selectorType} onChange={(v) => onUpdate({ selectorType: v })} style={{ width: '100%' }}>
              <Option value="id">ID</Option>
              <Option value="class">Class</Option>
              <Option value="selector">CSS 选择器</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>选择器值：</label>
            <Input value={config.selectorValue} onChange={(e) => onUpdate({ selectorValue: e.target.value })} />
          </div>
          {config.selectorType !== 'id' && (
            <div className="form-item">
              <label>第几个元素：</label>
              <InputNumber min={0} value={config.elementIndex} onChange={(v) => onUpdate({ elementIndex: v || 0 })} style={{ width: '100%' }} />
            </div>
          )}
          <div className="form-item">
            <label>属性名：</label>
            <Input value={config.attributeName} onChange={(e) => onUpdate({ attributeName: e.target.value })} />
          </div>
          <div className="form-item">
            <label>属性值：</label>
            <Input value={config.attributeValue} onChange={(e) => onUpdate({ attributeValue: e.target.value })} />
            <span className="hint">（支持 ${"变量名"} 引用）</span>
          </div>
        </>
      );

    case 'httpRequest':
      return (
        <>
          <div className="form-item">
            <label>请求方法：</label>
            <Select value={config.method} onChange={(v) => onUpdate({ method: v })} style={{ width: '100%' }}>
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>URL：</label>
            <Input value={config.url} onChange={(e) => onUpdate({ url: e.target.value })} />
          </div>
          <div className="form-item">
            <label>请求头 (JSON)：</label>
            <Input.TextArea rows={3} value={config.headers} onChange={(e) => onUpdate({ headers: e.target.value })} placeholder='{"Authorization": "Bearer ..."}' />
          </div>
          <div className="form-item">
            <label>请求体 (JSON)：</label>
            <Input.TextArea rows={3} value={config.body} onChange={(e) => onUpdate({ body: e.target.value })} />
          </div>
          <div className="form-item">
            <label>保存变量名：</label>
            <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
          </div>
          <div className="form-item">
            <label>超时 (秒)：</label>
            <InputNumber min={1} value={config.timeout} onChange={(v) => onUpdate({ timeout: v || 30 })} style={{ width: '100%' }} />
          </div>
        </>
      );

    case 'jsonExtract':
      return (
        <>
          <div className="form-item">
            <label>源变量：</label>
            <Input value={config.sourceVariable} onChange={(e) => onUpdate({ sourceVariable: e.target.value })} placeholder="apiResponse" />
          </div>
          <div className="form-item">
            <label>JSONPath：</label>
            <Input value={config.jsonPath} onChange={(e) => onUpdate({ jsonPath: e.target.value })} placeholder="$.data.items" />
          </div>
          <div className="form-item">
            <label>保存变量名：</label>
            <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
          </div>
          <div className="form-item">
            <label>提取全部：</label>
            <Switch checked={config.extractAll} onChange={(v) => onUpdate({ extractAll: v })} />
          </div>
        </>
      );

    case 'loop':
      return (
        <>
          <div className="form-item">
            <label>循环类型：</label>
            <Select value={config.loopType} onChange={(v) => onUpdate({ loopType: v })} style={{ width: '100%' }}>
              <Option value="count">按次数</Option>
              <Option value="selector">按元素</Option>
              <Option value="variable">按变量</Option>
            </Select>
          </div>
          {config.loopType === 'count' && (
            <div className="form-item">
              <label>循环次数：</label>
              <InputNumber min={1} value={config.count} onChange={(v) => onUpdate({ count: v || 1 })} style={{ width: '100%' }} />
            </div>
          )}
          {config.loopType === 'selector' && (
            <>
              <div className="form-item">
                <label>选择器类型：</label>
                <Select value={config.selectorType} onChange={(v) => onUpdate({ selectorType: v })} style={{ width: '100%' }}>
                  <Option value="id">ID</Option>
                  <Option value="class">Class</Option>
                  <Option value="selector">CSS 选择器</Option>
                </Select>
              </div>
              <div className="form-item">
                <label>选择器值：</label>
                <Input value={config.selectorValue} onChange={(e) => onUpdate({ selectorValue: e.target.value })} />
              </div>
            </>
          )}
          {config.loopType === 'variable' && (
            <div className="form-item">
              <label>数据源变量：</label>
              <Input value={config.variableSource} onChange={(e) => onUpdate({ variableSource: e.target.value })} placeholder="${products}" />
            </div>
          )}
          <div className="form-item">
            <label>当前项变量：</label>
            <Input value={config.itemName} onChange={(e) => onUpdate({ itemName: e.target.value })} />
          </div>
          <span className="hint">（循环体内的步骤通过连线连接到循环节点的子图中）</span>
        </>
      );

    case 'interceptRequest':
      return (
        <>
          <div className="form-item">
            <label>URL 匹配：</label>
            <Input value={config.urlPattern} onChange={(e) => onUpdate({ urlPattern: e.target.value })} placeholder="*/api/*" />
          </div>
          <div className="form-item">
            <label>请求方法：</label>
            <Select value={config.method} onChange={(v) => onUpdate({ method: v })} style={{ width: '100%' }}>
              <Option value="ALL">ALL</Option>
              <Option value="GET">GET</Option>
              <Option value="POST">POST</Option>
              <Option value="PUT">PUT</Option>
              <Option value="DELETE">DELETE</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>修改请求头 (JSON)：</label>
            <Input.TextArea rows={2} value={config.modifyHeaders} onChange={(e) => onUpdate({ modifyHeaders: e.target.value })} />
          </div>
          <div className="form-item">
            <label>修改请求体 (JSON)：</label>
            <Input.TextArea rows={3} value={config.modifyBody} onChange={(e) => onUpdate({ modifyBody: e.target.value })} />
          </div>
          <div className="form-item">
            <label>修改响应 (JSON)：</label>
            <Input.TextArea rows={3} value={config.modifyResponse} onChange={(e) => onUpdate({ modifyResponse: e.target.value })} />
          </div>
          <div className="form-item">
            <label>保存变量名：</label>
            <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
          </div>
          <div className="form-item">
            <label>继续请求：</label>
            <Switch checked={config.continueRequest} onChange={(v) => onUpdate({ continueRequest: v })} />
          </div>
        </>
      );

    case 'executeScript':
      return (
        <div className="form-item">
          <label>JavaScript 代码：</label>
          <Input.TextArea rows={6} value={config.script} onChange={(e) => onUpdate({ script: e.target.value })} placeholder="// 注入并执行 JS 代码" style={{ fontFamily: 'Monaco, Consolas, monospace', fontSize: 12 }} />
        </div>
      );

    case 'localStorage':
      return (
        <>
          <div className="form-item">
            <label>操作类型：</label>
            <Select value={config.action} onChange={(v) => onUpdate({ action: v })} style={{ width: '100%' }}>
              <Option value="set">写入 (set)</Option>
              <Option value="get">读取 (get)</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>存储类型：</label>
            <Select value={config.storageType} onChange={(v) => onUpdate({ storageType: v })} style={{ width: '100%' }}>
              <Option value="local">localStorage</Option>
              <Option value="session">sessionStorage</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>键名：</label>
            <Input value={config.key} onChange={(e) => onUpdate({ key: e.target.value })} />
          </div>
          {config.action === 'set' && (
            <div className="form-item">
              <label>值：</label>
              <Input value={config.value} onChange={(e) => onUpdate({ value: e.target.value })} />
              <span className="hint">（支持 ${"变量名"} 引用）</span>
            </div>
          )}
          {config.action === 'get' && (
            <div className="form-item">
              <label>保存变量名：</label>
              <Input value={config.variableName} onChange={(e) => onUpdate({ variableName: e.target.value })} />
            </div>
          )}
        </>
      );

    case 'keyboardAction':
      return (
        <>
          <div className="form-item">
            <label>按键：</label>
            <AutoComplete
              value={config.key}
              onChange={(v) => onUpdate({ key: v })}
              style={{ width: '100%' }}
              options={['Enter', 'Tab', 'Escape', 'Backspace', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space', 'Delete'].map(k => ({ value: k, label: k }))}
              placeholder="Enter"
            />
          </div>
          <div className="form-item">
            <label>目标选择器：</label>
            <Input value={config.selector} onChange={(e) => onUpdate({ selector: e.target.value })} placeholder="可选，先聚焦元素再按键" />
          </div>
          <div className="form-item">
            <label>修饰键：</label>
            <Select mode="multiple" value={config.modifiers || []} onChange={(v) => onUpdate({ modifiers: v })} style={{ width: '100%' }}>
              <Option value="Control">Ctrl</Option>
              <Option value="Shift">Shift</Option>
              <Option value="Alt">Alt</Option>
              <Option value="Meta">Meta</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>按键次数：</label>
            <InputNumber min={1} value={config.pressCount} onChange={(v) => onUpdate({ pressCount: v || 1 })} style={{ width: '100%' }} />
          </div>
        </>
      );

    case 'elementMethod':
      return (
        <>
          <div className="form-item">
            <label>CSS 选择器：</label>
            <Input value={config.selector} onChange={(e) => onUpdate({ selector: e.target.value })} placeholder=".my-element" />
          </div>
          <div className="form-item">
            <label>方法名：</label>
            <AutoComplete
              value={config.method}
              onChange={(v) => onUpdate({ method: v })}
              style={{ width: '100%' }}
              options={['focus', 'blur', 'click', 'dblclick', 'scrollIntoView', 'select', 'submit', 'reset', 'remove', 'play', 'pause', 'reportValidity'].map(m => ({ value: m, label: m }))}
            />
          </div>
          <div className="form-item">
            <label>参数 (JSON)：</label>
            <Input value={config.args} onChange={(e) => onUpdate({ args: e.target.value })} placeholder='可选，如 {"behavior":"smooth"}' />
          </div>
          <div className="form-item">
            <label>调用后等待 (秒)：</label>
            <InputNumber min={0} value={config.waitAfter} onChange={(v) => onUpdate({ waitAfter: v || 0 })} style={{ width: '100%' }} />
          </div>
        </>
      );

    case 'variableOperation':
      const needsOperand = !['jsonParse', 'jsonStringify', 'length'].includes(config.operation);
      const needsOperand2 = ['regexReplace', 'replace', 'math'].includes(config.operation);
      return (
        <>
          <div className="form-item">
            <label>操作类型：</label>
            <Select value={config.operation} onChange={(v) => onUpdate({ operation: v })} style={{ width: '100%' }}>
              <Option value="template">📝 模板拼接</Option>
              <Option value="math">🔢 数学运算</Option>
              <Option value="jsonParse">📥 JSON 解析</Option>
              <Option value="jsonStringify">📤 JSON 字符串化</Option>
              <Option value="regex">🔍 正则提取</Option>
              <Option value="regexReplace">🔄 正则替换</Option>
              <Option value="replace">✏️ 字符串替换</Option>
              <Option value="split">✂️ 分割</Option>
              <Option value="join">🔗 合并</Option>
              <Option value="length">📏 取长度</Option>
              <Option value="default">⚡ 默认值</Option>
            </Select>
          </div>
          <div className="form-item">
            <label>源变量：</label>
            <Input value={config.sourceVariable} onChange={(e) => onUpdate({ sourceVariable: e.target.value })} />
          </div>
          {needsOperand && (
            <div className="form-item">
              <label>操作参数：</label>
              {config.operation === 'template' ? (
                <Input.TextArea rows={2} value={config.operand} onChange={(e) => onUpdate({ operand: e.target.value })} placeholder="模板，如：Hello ${name}" />
              ) : (
                <Input value={config.operand} onChange={(e) => onUpdate({ operand: e.target.value })} />
              )}
            </div>
          )}
          {needsOperand2 && (
            <div className="form-item">
              <label>第二参数：</label>
              <Input value={config.operand2} onChange={(e) => onUpdate({ operand2: e.target.value })} />
            </div>
          )}
          <div className="form-item">
            <label>结果变量：</label>
            <Input value={config.resultVariable} onChange={(e) => onUpdate({ resultVariable: e.target.value })} />
          </div>
        </>
      );

    case 'dingTalkNotify':
      return (
        <>
          <div className="form-item">
            <label>Access Token：</label>
            <Input.Password value={config.accessToken} onChange={(e) => onUpdate({ accessToken: e.target.value })} placeholder="钉钉机器人的 access_token" />
          </div>
          <div className="form-item">
            <label>消息类型：</label>
            <Select value={config.msgType} onChange={(v) => onUpdate({ msgType: v })} style={{ width: '100%' }}>
              <Option value="text">文本消息</Option>
              <Option value="markdown">Markdown 消息</Option>
            </Select>
          </div>
          {config.msgType === 'markdown' && (
            <div className="form-item">
              <label>消息标题：</label>
              <Input value={config.title} onChange={(e) => onUpdate({ title: e.target.value })} />
            </div>
          )}
          <div className="form-item">
            <label>消息内容：</label>
            <Input.TextArea rows={config.msgType === 'markdown' ? 6 : 3} value={config.content} onChange={(e) => onUpdate({ content: e.target.value })} placeholder="支持 ${变量} 引用" style={config.msgType === 'markdown' ? { fontFamily: 'Monaco, Consolas, monospace', fontSize: 12 } : {}} />
          </div>
        </>
      );

    default:
      return <div style={{ padding: 12, color: '#999' }}>未识别的步骤类型</div>;
  }
}

export default NodeConfigPanel;
