/**
 * 导出流程配置
 * 支持图编辑器（拓扑排序）和旧版线性步骤
 */
import { Folder, Step, FlowNode, FlowEdge, FlowNodeData, ExportedFlowConfig, ExportedTaskGroup, ExportedAction, ExportedCommand } from '../types';

/**
 * 将节点数据转换为命令格式（复用所有 16 种步骤的转换逻辑）
 */
const convertNodeToCommand = (nodeData: FlowNodeData): ExportedCommand => {
  const { stepType, config } = nodeData;

  const getCommandData = (): { action: string; data: Record<string, any> } => {
    switch (stepType) {
      case 'openUrl':
        const urlConfig = config as { url: string };
        return {
          action: 'openBrower',
          data: { webUrl: urlConfig.url, clearCache: true, finishwait: 2 },
        };

      case 'clickElement': {
        const clickConfig = config as any;
        let querySelector = clickConfig.selectorValue;
        if (clickConfig.selectorType === 'class') {
          querySelector = `.${clickConfig.selectorValue}`;
          if (clickConfig.elementIndex > 0) querySelector += `:nth-of-type(${clickConfig.elementIndex + 1})`;
        } else if (clickConfig.selectorType === 'id') {
          querySelector = `#${clickConfig.selectorValue}`;
        }
        return { action: 'clickBrowerElement', data: { querySelector, finishwait: 1 } };
      }

      case 'wait':
        return { action: 'wait', data: { seconds: (config as any).seconds } };

      case 'getText': {
        const getTextConfig = config as any;
        let textSelector = getTextConfig.selectorValue;
        if (getTextConfig.selectorType === 'class') {
          textSelector = `.${getTextConfig.selectorValue}`;
          if (getTextConfig.elementIndex > 0) textSelector += `:nth-of-type(${getTextConfig.elementIndex + 1})`;
        } else if (getTextConfig.selectorType === 'id') {
          textSelector = `#${getTextConfig.selectorValue}`;
        }
        return { action: 'getText', data: { querySelector: textSelector, variableName: getTextConfig.variableName, textType: getTextConfig.textType } };
      }

      case 'getAttribute': {
        const getAttrConfig = config as any;
        let attrSelector = getAttrConfig.selectorValue;
        if (getAttrConfig.selectorType === 'class') {
          attrSelector = `.${getAttrConfig.selectorValue}`;
          if (getAttrConfig.elementIndex > 0) attrSelector += `:nth-of-type(${getAttrConfig.elementIndex + 1})`;
        } else if (getAttrConfig.selectorType === 'id') {
          attrSelector = `#${getAttrConfig.selectorValue}`;
        }
        return { action: 'getAttribute', data: { querySelector: attrSelector, variableName: getAttrConfig.variableName, attributeName: getAttrConfig.attributeName } };
      }

      case 'setAttribute': {
        const setAttrConfig = config as any;
        let setSelector = setAttrConfig.selectorValue;
        if (setAttrConfig.selectorType === 'class') {
          setSelector = `.${setAttrConfig.selectorValue}`;
          if (setAttrConfig.elementIndex > 0) setSelector += `:nth-of-type(${setAttrConfig.elementIndex + 1})`;
        } else if (setAttrConfig.selectorType === 'id') {
          setSelector = `#${setAttrConfig.selectorValue}`;
        }
        return { action: 'setAttribute', data: { querySelector: setSelector, attributeName: setAttrConfig.attributeName, attributeValue: setAttrConfig.attributeValue } };
      }

      case 'httpRequest': {
        const httpConfig = config as any;
        return {
          action: 'httpRequest',
          data: {
            method: httpConfig.method,
            url: httpConfig.url,
            headers: httpConfig.headers ? safeParseJson(httpConfig.headers, {}) : {},
            body: httpConfig.body ? safeParseJson(httpConfig.body, {}) : {},
            variableName: httpConfig.variableName,
            timeout: httpConfig.timeout,
          },
        };
      }

      case 'jsonExtract': {
        const jsonConfig = config as any;
        return { action: 'jsonExtract', data: { sourceVariable: jsonConfig.sourceVariable, jsonPath: jsonConfig.jsonPath, variableName: jsonConfig.variableName, extractAll: jsonConfig.extractAll } };
      }

      case 'loop': {
        const loopConfig = config as any;
        let loopSelector = '';
        if (loopConfig.loopType === 'selector') {
          loopSelector = loopConfig.selectorValue;
          if (loopConfig.selectorType === 'class') loopSelector = `.${loopConfig.selectorValue}`;
          else if (loopConfig.selectorType === 'id') loopSelector = `#${loopConfig.selectorValue}`;
        }
        return {
          action: 'loop',
          data: {
            loopType: loopConfig.loopType,
            querySelector: loopSelector,
            variableSource: loopConfig.variableSource,
            itemName: loopConfig.itemName,
            count: loopConfig.count,
            commands: [], // 循环体内的命令由连线决定
          },
        };
      }

      case 'interceptRequest': {
        const interceptConfig = config as any;
        return {
          action: 'interceptRequest',
          data: {
            urlPattern: interceptConfig.urlPattern,
            method: interceptConfig.method,
            modifyHeaders: interceptConfig.modifyHeaders ? safeParseJson(interceptConfig.modifyHeaders, {}) : {},
            modifyBody: interceptConfig.modifyBody ? safeParseJson(interceptConfig.modifyBody, {}) : {},
            modifyResponse: interceptConfig.modifyResponse ? safeParseJson(interceptConfig.modifyResponse, {}) : {},
            variableName: interceptConfig.variableName,
            continueRequest: interceptConfig.continueRequest,
          },
        };
      }

      case 'executeScript':
        return { action: 'executeScript', data: { script: (config as any).script } };

      case 'localStorage': {
        const storageConfig = config as any;
        return { action: 'localStorage', data: { key: storageConfig.key, value: storageConfig.value, storageType: storageConfig.storageType, action: storageConfig.action, variableName: storageConfig.variableName } };
      }

      case 'keyboardAction': {
        const keyboardConfig = config as any;
        return { action: 'keyboardAction', data: { key: keyboardConfig.key, selector: keyboardConfig.selector, modifiers: keyboardConfig.modifiers, pressCount: keyboardConfig.pressCount } };
      }

      case 'elementMethod': {
        const elementMethodConfig = config as any;
        return { action: 'elementMethod', data: { selector: elementMethodConfig.selector, method: elementMethodConfig.method, args: elementMethodConfig.args, waitAfter: elementMethodConfig.waitAfter } };
      }

      case 'variableOperation': {
        const varOpConfig = config as any;
        return { action: 'variableOperation', data: { operation: varOpConfig.operation, sourceVariable: varOpConfig.sourceVariable, resultVariable: varOpConfig.resultVariable, operand: varOpConfig.operand, operand2: varOpConfig.operand2 } };
      }

      case 'dingTalkNotify': {
        const dingConfig = config as any;
        return { action: 'dingTalkNotify', data: { accessToken: dingConfig.accessToken, msgType: dingConfig.msgType, title: dingConfig.title, content: dingConfig.content } };
      }

      default:
        return { action: 'unknown', data: {} };
    }
  };

  const cmd = getCommandData();

  // 附带备注、打印日志和禁用状态
  if (nodeData.remark) cmd.data._remark = nodeData.remark;
  if (nodeData.logPrint) cmd.data._logPrint = true;
  if (nodeData.disabled) cmd.data._disabled = true;

  return cmd;
};

/**
 * 安全解析 JSON
 */
const safeParseJson = (str: string, fallback: any): any => {
  try {
    return JSON.parse(str);
  } catch {
    return fallback;
  }
};

/**
 * 拓扑排序：根据边的关系将节点排序为执行顺序
 * 使用 Kahn 算法（入度排序）
 */
const topologicalSort = (nodes: FlowNode[], edges: FlowEdge[]): FlowNode[] => {
  if (nodes.length === 0) return [];

  // 构建邻接表和入度表
  const inDegree = new Map<string, number>();
  const adjacency = new Map<string, string[]>();

  nodes.forEach(n => {
    inDegree.set(n.id, 0);
    adjacency.set(n.id, []);
  });

  edges.forEach(e => {
    adjacency.get(e.source)?.push(e.target);
    inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
  });

  // BFS
  const queue: string[] = [];
  inDegree.forEach((deg, id) => {
    if (deg === 0) queue.push(id);
  });

  const sorted: FlowNode[] = [];
  const nodeMap = new Map(nodes.map(n => [n.id, n]));

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const node = nodeMap.get(currentId);
    if (node) sorted.push(node);

    const neighbors = adjacency.get(currentId) || [];
    neighbors.forEach(neighborId => {
      const newDeg = (inDegree.get(neighborId) || 1) - 1;
      inDegree.set(neighborId, newDeg);
      if (newDeg === 0) queue.push(neighborId);
    });
  }

  // 如果排序结果不包含所有节点（有环），按位置 Y 坐标排序兜底
  if (sorted.length < nodes.length) {
    const missing = nodes.filter(n => !sorted.find(s => s.id === n.id));
    missing.sort((a, b) => a.position.y - b.position.y);
    sorted.push(...missing);
  }

  return sorted;
};

/**
 * 将画布数据导出为配置（图编辑器版本）
 */
export const exportCanvasToConfig = (
  folder: Folder,
  nodes: FlowNode[],
  edges: FlowEdge[],
  nodeOrderMap?: Map<string, number>
): ExportedFlowConfig => {
  // 拓扑排序（disabled 节点不参与执行，但保留链条）
  const sortedNodes = nodeOrderMap
    ? [...nodes].sort(
        (a, b) => (nodeOrderMap.get(a.id) || 0) - (nodeOrderMap.get(b.id) || 0)
      )
    : topologicalSort(nodes, edges);

  // 过滤掉 disabled 节点，转换为命令列表
  const commands: ExportedCommand[] = sortedNodes
    .filter(n => !(n.data as unknown as FlowNodeData).disabled)
    .map(n => convertNodeToCommand(n.data as unknown as FlowNodeData));

  const action: ExportedAction = {
    id: 1,
    name: folder.name || '流程任务',
    codeName: 'flowTask_1',
    type: 'once',
    commands,
  };

  return {
    name: folder.name,
    version: '1.0',
    description: `爬虫流程配置 - ${folder.name}`,
    task: [{ name: folder.name, action: [action] }],
  };
};

/**
 * 预览 JSON 字符串
 */
export const previewJsonString = (config: ExportedFlowConfig): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * 兼容旧版：将步骤配置转换为命令格式（供迁移使用）
 */
export const convertStepToCommand = (step: Step): ExportedCommand => {
  const nodeData: FlowNodeData = {
    stepType: step.type,
    name: step.name,
    config: step.config,
    remark: step.remark,
    logPrint: step.logPrint,
    disabled: step.disabled,
  };
  return convertNodeToCommand(nodeData);
};
