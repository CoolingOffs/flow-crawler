import { Folder, Step, ExportedFlowConfig, ExportedTaskGroup, ExportedAction, ExportedCommand } from '../types';

/**
 * 将步骤配置转换为 Python Robot 的命令格式
 */
const convertStepToCommand = (step: Step): ExportedCommand => {
  const { type, config } = step;

  switch (type) {
    case 'openUrl':
      const urlConfig = config as { url: string };
      return {
        action: 'openBrower',
        data: {
          webUrl: urlConfig.url,
          clearCache: true,
          finishwait: 2,
        },
      };

    case 'clickElement':
      const clickConfig = config as {
        selectorType: 'id' | 'class' | 'selector';
        selectorValue: string;
        elementIndex: number;
      };
      
      // 根据选择器类型生成 querySelector
      let querySelector = clickConfig.selectorValue;
      if (clickConfig.selectorType === 'class') {
        querySelector = `.${clickConfig.selectorValue}`;
        if (clickConfig.elementIndex > 0) {
          querySelector += `:nth-of-type(${clickConfig.elementIndex + 1})`;
        }
      } else if (clickConfig.selectorType === 'id') {
        querySelector = `#${clickConfig.selectorValue}`;
      }
      
      return {
        action: 'clickBrowerElement',
        data: {
          querySelector,
          finishwait: 1,
        },
      };

    case 'wait':
      const waitConfig = config as { seconds: number };
      return {
        action: 'wait',
        data: {
          seconds: waitConfig.seconds,
        },
      };

    case 'getText':
      const getTextConfig = config as {
        selectorType: 'id' | 'class' | 'selector';
        selectorValue: string;
        elementIndex: number;
        variableName: string;
        textType: 'innerText' | 'innerHTML';
      };
      let textSelector = getTextConfig.selectorValue;
      if (getTextConfig.selectorType === 'class') {
        textSelector = `.${getTextConfig.selectorValue}`;
        if (getTextConfig.elementIndex > 0) {
          textSelector += `:nth-of-type(${getTextConfig.elementIndex + 1})`;
        }
      } else if (getTextConfig.selectorType === 'id') {
        textSelector = `#${getTextConfig.selectorValue}`;
      }
      return {
        action: 'getText',
        data: {
          querySelector: textSelector,
          variableName: getTextConfig.variableName,
          textType: getTextConfig.textType,
        },
      };

    case 'getAttribute':
      const getAttrConfig = config as {
        selectorType: 'id' | 'class' | 'selector';
        selectorValue: string;
        elementIndex: number;
        variableName: string;
        attributeName: string;
      };
      let attrSelector = getAttrConfig.selectorValue;
      if (getAttrConfig.selectorType === 'class') {
        attrSelector = `.${getAttrConfig.selectorValue}`;
        if (getAttrConfig.elementIndex > 0) {
          attrSelector += `:nth-of-type(${getAttrConfig.elementIndex + 1})`;
        }
      } else if (getAttrConfig.selectorType === 'id') {
        attrSelector = `#${getAttrConfig.selectorValue}`;
      }
      return {
        action: 'getAttribute',
        data: {
          querySelector: attrSelector,
          variableName: getAttrConfig.variableName,
          attributeName: getAttrConfig.attributeName,
        },
      };

    case 'setAttribute':
      const setAttrConfig = config as {
        selectorType: 'id' | 'class' | 'selector';
        selectorValue: string;
        elementIndex: number;
        attributeName: string;
        attributeValue: string;
      };
      let setSelector = setAttrConfig.selectorValue;
      if (setAttrConfig.selectorType === 'class') {
        setSelector = `.${setAttrConfig.selectorValue}`;
        if (setAttrConfig.elementIndex > 0) {
          setSelector += `:nth-of-type(${setAttrConfig.elementIndex + 1})`;
        }
      } else if (setAttrConfig.selectorType === 'id') {
        setSelector = `#${setAttrConfig.selectorValue}`;
      }
      return {
        action: 'setAttribute',
        data: {
          querySelector: setSelector,
          attributeName: setAttrConfig.attributeName,
          attributeValue: setAttrConfig.attributeValue,
        },
      };

    case 'httpRequest':
      const httpConfig = config as {
        method: 'GET' | 'POST' | 'PUT' | 'DELETE';
        url: string;
        headers: string;
        body: string;
        variableName: string;
        timeout: number;
      };
      return {
        action: 'httpRequest',
        data: {
          method: httpConfig.method,
          url: httpConfig.url,
          headers: httpConfig.headers ? JSON.parse(httpConfig.headers) : {},
          body: httpConfig.body ? JSON.parse(httpConfig.body) : {},
          variableName: httpConfig.variableName,
          timeout: httpConfig.timeout,
        },
      };

    case 'jsonExtract':
      const jsonConfig = config as {
        sourceVariable: string;
        jsonPath: string;
        variableName: string;
        extractAll: boolean;
      };
      return {
        action: 'jsonExtract',
        data: {
          sourceVariable: jsonConfig.sourceVariable,
          jsonPath: jsonConfig.jsonPath,
          variableName: jsonConfig.variableName,
          extractAll: jsonConfig.extractAll,
        },
      };

    case 'loop':
      const loopConfig = config as {
        loopType: 'selector' | 'variable' | 'count';
        selectorType: 'id' | 'class' | 'selector';
        selectorValue: string;
        variableSource: string;
        itemName: string;
        count: number;
        subSteps: Step[];
      };
      const subCommands = loopConfig.subSteps
        .sort((a, b) => a.order - b.order)
        .map(convertStepToCommand);
      
      let loopSelector = '';
      if (loopConfig.loopType === 'selector') {
        loopSelector = loopConfig.selectorValue;
        if (loopConfig.selectorType === 'class') {
          loopSelector = `.${loopConfig.selectorValue}`;
        } else if (loopConfig.selectorType === 'id') {
          loopSelector = `#${loopConfig.selectorValue}`;
        }
      }
      
      return {
        action: 'loop',
        data: {
          loopType: loopConfig.loopType,
          querySelector: loopSelector,
          variableSource: loopConfig.variableSource,
          itemName: loopConfig.itemName,
          count: loopConfig.count,
          commands: subCommands,
        },
      };

    case 'interceptRequest':
      const interceptConfig = config as {
        urlPattern: string;
        method: 'ALL' | 'GET' | 'POST' | 'PUT' | 'DELETE';
        modifyHeaders: string;
        modifyBody: string;
        modifyResponse: string;
        variableName: string;
        continueRequest: boolean;
      };
      return {
        action: 'interceptRequest',
        data: {
          urlPattern: interceptConfig.urlPattern,
          method: interceptConfig.method,
          modifyHeaders: interceptConfig.modifyHeaders ? JSON.parse(interceptConfig.modifyHeaders) : {},
          modifyBody: interceptConfig.modifyBody ? JSON.parse(interceptConfig.modifyBody) : {},
          modifyResponse: interceptConfig.modifyResponse ? JSON.parse(interceptConfig.modifyResponse) : {},
          variableName: interceptConfig.variableName,
          continueRequest: interceptConfig.continueRequest,
        },
      };

    default:
      return {
        action: 'unknown',
        data: {},
      };
  }
};

/**
 * 将步骤转换为 Python Robot 的 Action
 */
const convertStepsToAction = (steps: Step[], folderId: string, index: number): ExportedAction => {
  const sortedSteps = steps
    .filter(s => s.folderId === folderId)
    .sort((a, b) => a.order - b.order);

  const commands = sortedSteps.map(convertStepToCommand);

  // 检查是否有循环步骤
  const hasLoop = sortedSteps.some(s => s.type === 'loop');

  return {
    id: index + 1,
    name: `流程任务_${index + 1}`,
    codeName: `flowTask_${index + 1}`,
    type: hasLoop ? 'loop' : 'once',
    commands,
  };
};

/**
 * 导出单个文件夹为 Python Robot 配置
 */
export const exportFolderToConfig = (
  folder: Folder,
  allFolders: Folder[],
  allSteps: Step[]
): ExportedFlowConfig => {
  // 获取当前文件夹及其所有子文件夹
  const getDescendants = (parentId: string): string[] => {
    const children = allFolders.filter(f => f.parentId === parentId);
    const ids = [parentId];
    children.forEach(child => {
      ids.push(...getDescendants(child.id));
    });
    return ids;
  };

  const folderIds = getDescendants(folder.id);

  // 构建任务组（只包含有步骤的文件夹）
  const taskGroups: ExportedTaskGroup[] = [];
  
  folderIds.forEach((folderId, index) => {
    const currentFolder = allFolders.find(f => f.id === folderId);
    const folderSteps = allSteps.filter(s => s.folderId === folderId);
    
    if (folderSteps.length > 0) {
      taskGroups.push({
        name: currentFolder?.name || '未命名',
        action: [convertStepsToAction(folderSteps, folderId, index)],
      });
    }
  });

  return {
    name: folder.name,
    version: '1.0',
    description: `爬虫流程配置 - ${folder.name}`,
    task: taskGroups,
  };
};

/**
 * 导出 JSON 文件
 */
export const exportToJsonFile = (config: ExportedFlowConfig, filename?: string) => {
  const jsonString = JSON.stringify(config, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename || `${config.name}.json`;
  document.body.appendChild(a);
  a.click();
  
  // 清理
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * 复制 JSON 到剪贴板
 */
export const copyJsonToClipboard = async (config: ExportedFlowConfig): Promise<boolean> => {
  try {
    const jsonString = JSON.stringify(config, null, 2);
    await navigator.clipboard.writeText(jsonString);
    return true;
  } catch (error) {
    console.error('复制到剪贴板失败:', error);
    return false;
  }
};

/**
 * 预览 JSON 字符串
 */
export const previewJsonString = (config: ExportedFlowConfig): string => {
  return JSON.stringify(config, null, 2);
};
