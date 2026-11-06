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

      case 'scheduledTask': {
        const scheduleConfig = config as any;
        return {
          action: 'scheduledTask',
          data: {
            run_type: scheduleConfig.run_type || 'cron',
            cron_expression: scheduleConfig.cron_expression || '',
            execute_once_time: scheduleConfig.execute_once_time || '',
            max_trigger_count: scheduleConfig.max_trigger_count || 10,
          },
        };
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
 * 将画布数据导出为配置（图编辑器版本）
 */
export const exportCanvasToConfig = (
  folder: Folder,
  nodes: FlowNode[],
  edges: FlowEdge[],
  nodeOrderMap?: Map<string, number>
): ExportedFlowConfig => {
  // 按 _order 排序（节点创建时已固定序号）
  const sortedNodes = nodeOrderMap
    ? [...nodes].sort(
        (a, b) => (nodeOrderMap.get(a.id) || 0) - (nodeOrderMap.get(b.id) || 0)
      )
    : [...nodes].sort((a, b) => {
        const oa = (a.data as any)?._order || 0;
        const ob = (b.data as any)?._order || 0;
        return oa - ob || a.position.y - b.position.y;
      });

  // 过滤掉 disabled 节点
  const activeNodes = sortedNodes.filter(
    n => !(n.data as unknown as FlowNodeData).disabled
  );

  // 转换为命令列表
  const commands: ExportedCommand[] = activeNodes.map(
    n => convertNodeToCommand(n.data as unknown as FlowNodeData)
  );

  // 根据图的连线关系，为定时任务计算循环范围
  // 规则：
  //   - 定时任务顶部(source)出线 = 回边，目标是循环起始步骤
  //   - 定时任务底部(target)入线 = 循环结束步骤
  const activeNodeIds = new Set(activeNodes.map(n => n.id));

  activeNodes.forEach((node, nodeIndex) => {
    const data = node.data as unknown as FlowNodeData;
    if (data.stepType !== 'scheduledTask') return;

    const schedNodeId = node.id;

    // 定时任务顶部出线(source) = 回边，目标是循环起始步骤
    const backEdges = edges.filter(
      e => e.source === schedNodeId && activeNodeIds.has(e.target)
    );

    if (backEdges.length === 0) {
      commands[nodeIndex].data._loop_start_index = -1;
      commands[nodeIndex].data._loop_end_index = -1;
      return;
    }

    // 取第一个回边目标作为循环起始
    const loopStartIndex = activeNodes.findIndex(n => n.id === backEdges[0].target);

    // 定时任务底部(target)入线 = 循环结束步骤
    const sourceEdges = edges.filter(
      e => e.target === schedNodeId && activeNodeIds.has(e.source)
    );

    let loopEndIndex = -1;
    for (const se of sourceEdges) {
      const idx = activeNodes.findIndex(n => n.id === se.source);
      if (idx > loopEndIndex) loopEndIndex = idx;
    }

    commands[nodeIndex].data._loop_start_index = loopStartIndex >= 0 ? loopStartIndex : -1;
    commands[nodeIndex].data._loop_end_index = loopEndIndex >= 0 ? loopEndIndex : -1;
  });

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
