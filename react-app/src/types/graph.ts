/**
 * Graph Editor 类型定义
 * 基于 @xyflow/react (React Flow v12)
 */
import { Node, Edge } from '@xyflow/react';
import { StepConfig } from './index';

// 步骤类型（与 Step.type 保持一致）
export type StepType =
  | 'openUrl'
  | 'clickElement'
  | 'wait'
  | 'getText'
  | 'getAttribute'
  | 'setAttribute'
  | 'httpRequest'
  | 'jsonExtract'
  | 'loop'
  | 'interceptRequest'
  | 'executeScript'
  | 'localStorage'
  | 'keyboardAction'
  | 'elementMethod'
  | 'variableOperation'
  | 'dingTalkNotify';

// 节点携带的数据
export interface FlowNodeData {
  stepType: StepType;                  // 步骤类型
  name: string;                        // 步骤名称
  config: StepConfig;                  // 步骤配置（复用现有 16 种）
  remark?: string;                     // 备注
  logPrint?: boolean;                  // 打印日志
  disabled?: boolean;                  // 禁用
  [key: string]: unknown;              // React Flow 要求索引签名
}

// 流程节点 = React Flow Node + FlowNodeData
export type FlowNode = Node<FlowNodeData>;

// 流程边 = React Flow Edge
export type FlowEdge = Edge;

// 每个文件夹的画布数据
export interface CanvasData {
  nodes: FlowNode[];
  edges: FlowEdge[];
}
