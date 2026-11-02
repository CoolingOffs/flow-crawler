/**
 * 数据迁移工具
 * 将旧的线性步骤数据迁移为画布节点+边数据
 */
import { Step, CanvasData, FlowNode, FlowEdge, FlowNodeData } from '../types';

// 默认步骤名称映射
const STEP_NAME_MAP: Record<string, string> = {
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
};

// 默认配置映射
const DEFAULT_CONFIG_MAP: Record<string, any> = {
  openUrl: { url: '' },
  clickElement: { selectorType: 'id', selectorValue: '', elementIndex: 0 },
  wait: { seconds: 3 },
  getText: { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedText', textType: 'innerText' },
  getAttribute: { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedAttr', attributeName: 'href' },
  setAttribute: { selectorType: 'id', selectorValue: '', elementIndex: 0, attributeName: 'value', attributeValue: '' },
  httpRequest: { method: 'GET', url: '', headers: '', body: '', variableName: 'apiResponse', timeout: 30 },
  jsonExtract: { sourceVariable: '', jsonPath: '$.', variableName: 'extractedData', extractAll: false },
  executeScript: { script: '' },
  localStorage: { key: '', value: '', storageType: 'local', action: 'set', variableName: '' },
  keyboardAction: { key: 'Enter', selector: '', modifiers: [], pressCount: 1 },
  elementMethod: { selector: '', method: 'focus', args: '', waitAfter: 0 },
  variableOperation: { operation: 'template', sourceVariable: '', resultVariable: '', operand: '', operand2: '' },
  dingTalkNotify: { accessToken: '', msgType: 'text', title: '', content: '' },
  interceptRequest: { urlPattern: '', method: 'ALL', modifyHeaders: '', modifyBody: '', modifyResponse: '', variableName: 'interceptedData', continueRequest: true },
  loop: { loopType: 'count', selectorType: 'class', selectorValue: '', variableSource: '', itemName: 'item', count: 10, subSteps: [] },
};

/**
 * 将步骤数组转换为画布数据
 */
export const migrateStepsToCanvas = (steps: Step[]): CanvasData => {
  const sortedSteps = [...steps].sort((a, b) => a.order - b.order);
  const nodes: FlowNode[] = [];
  const edges: FlowEdge[] = [];

  sortedSteps.forEach((step, index) => {
    const nodeData: FlowNodeData = {
      stepType: step.type,
      name: step.name || STEP_NAME_MAP[step.type] || step.type,
      config: step.config || DEFAULT_CONFIG_MAP[step.type] || {},
      remark: step.remark,
      logPrint: step.logPrint,
      disabled: step.disabled,
    };

    const node: FlowNode = {
      id: step.id,
      type: 'stepNode',
      position: { x: 250, y: index * 150 },
      data: nodeData,
    };

    nodes.push(node);

    // 自动生成边：连接到下一个节点
    if (index > 0) {
      edges.push({
        id: `e-${sortedSteps[index - 1].id}-${step.id}`,
        source: sortedSteps[index - 1].id,
        target: step.id,
        type: 'smoothstep',
      });
    }
  });

  return { nodes, edges };
};

/**
 * 获取指定步骤类型的默认配置
 */
export const getDefaultConfig = (type: string): any => {
  return DEFAULT_CONFIG_MAP[type] || {};
};

/**
 * 获取指定步骤类型的默认名称
 */
export const getDefaultName = (type: string): string => {
  return STEP_NAME_MAP[type] || type;
};
