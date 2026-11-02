/**
 * StepNode - 自定义流程节点组件
 * 在画布上显示的步骤节点
 */
import React, { memo } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { FlowNodeData } from '../../types';
import {
  GlobalOutlined,
  AimOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  CodeOutlined,
  ApiOutlined,
  BranchesOutlined,
  SyncOutlined,
  StopOutlined,
  DatabaseOutlined,
  EnterOutlined,
  ThunderboltOutlined,
  FunctionOutlined,
  BellOutlined,
  FormOutlined,
} from '@ant-design/icons';
import './StepNode.css';

const StepNode: React.FC<NodeProps> = ({ data, selected, id }) => {
  const nodeData = data as unknown as FlowNodeData & { executionOrder?: number };
  const isDisabled = nodeData.disabled;
  const order = nodeData.executionOrder;

  // 渲染图标
  const renderIcon = () => {
    switch (nodeData.stepType) {
      case 'openUrl': return <GlobalOutlined />;
      case 'clickElement': return <AimOutlined />;
      case 'wait': return <ClockCircleOutlined />;
      case 'getText': return <FileTextOutlined />;
      case 'getAttribute': return <LinkOutlined />;
      case 'setAttribute': return <CodeOutlined />;
      case 'httpRequest': return <ApiOutlined />;
      case 'jsonExtract': return <BranchesOutlined />;
      case 'loop': return <SyncOutlined />;
      case 'interceptRequest': return <StopOutlined />;
      case 'executeScript': return <CodeOutlined />;
      case 'localStorage': return <DatabaseOutlined />;
      case 'keyboardAction': return <EnterOutlined />;
      case 'elementMethod': return <ThunderboltOutlined />;
      case 'variableOperation': return <FunctionOutlined />;
      case 'dingTalkNotify': return <BellOutlined />;
      default: return null;
    }
  };

  // 生成配置摘要
  const getConfigSummary = (): string => {
    const config = nodeData.config as any;
    if (!config) return '';
    switch (nodeData.stepType) {
      case 'openUrl': return config.url ? truncate(config.url, 30) : '未配置 URL';
      case 'clickElement': return config.selectorValue || '未配置选择器';
      case 'wait': return `等待 ${config.seconds || 0} 秒`;
      case 'getText': return `→ ${config.variableName || '变量'}`;
      case 'getAttribute': return `${config.attributeName} → ${config.variableName || '变量'}`;
      case 'setAttribute': return `${config.attributeName} = ${truncate(config.attributeValue || '', 15)}`;
      case 'httpRequest': return `${config.method || 'GET'} ${truncate(config.url || '', 25)}`;
      case 'jsonExtract': return `${config.jsonPath || '$.'} → ${config.variableName || '变量'}`;
      case 'loop': return config.loopType === 'count' ? `循环 ${config.count} 次` : `循环: ${config.loopType}`;
      case 'interceptRequest': return truncate(config.urlPattern || '未配置', 30);
      case 'executeScript': return config.script ? truncate(config.script, 30) : '未配置脚本';
      case 'localStorage': return `${config.action || 'set'}: ${config.key || '未配置'}`;
      case 'keyboardAction': return `${config.modifiers?.join('+') || ''}${config.key || 'Enter'}`;
      case 'elementMethod': return `.${config.method || 'focus'}()`;
      case 'variableOperation': return `${config.operation || 'template'} → ${config.resultVariable || '变量'}`;
      case 'dingTalkNotify': return config.msgType === 'markdown' ? 'Markdown 消息' : '文本消息';
      default: return '';
    }
  };

  const truncate = (str: string, maxLen: number) =>
    str.length > maxLen ? str.substring(0, maxLen) + '...' : str;

  return (
    <div className={`step-node ${selected ? 'step-node-selected' : ''} ${isDisabled ? 'step-node-disabled' : ''}`}>
      {/* 执行编号 */}
      {order != null && (
        <div className="step-node-order">{order}</div>
      )}

      {/* 顶部入口 */}
      <Handle
        type="target"
        position={Position.Top}
        className="step-node-handle"
      />

      {/* 节点头部 */}
      <div className="step-node-header">
        <span className="step-node-icon">{renderIcon()}</span>
        <span className="step-node-name">{nodeData.name}</span>
      </div>

      {/* 配置摘要 */}
      <div className="step-node-body">
        <div className="step-node-summary">{getConfigSummary()}</div>
      </div>

      {/* 底部标记栏 */}
      {(nodeData.remark || nodeData.logPrint || isDisabled) && (
        <div className="step-node-footer">
          {nodeData.remark && <span className="node-badge remark" title={nodeData.remark}><FormOutlined /></span>}
          {nodeData.logPrint && <span className="node-badge log">LOG</span>}
          {isDisabled && <span className="node-badge disabled">禁用</span>}
        </div>
      )}

      {/* 底部出口 */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="step-node-handle"
      />
    </div>
  );
};

export default memo(StepNode);
