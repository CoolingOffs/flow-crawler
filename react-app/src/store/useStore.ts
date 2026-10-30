import { create } from 'zustand';
import { Folder, Step, OpenUrlConfig, ClickElementConfig, WaitConfig, GetTextConfig, GetAttributeConfig, SetAttributeConfig, HttpRequestConfig, JsonExtractConfig, LoopConfig } from '../types';
import { getFolders, saveFolders, getSteps, saveSteps, generateId } from '../utils/storage';

interface AppState {
  // 数据
  folders: Folder[];
  steps: Step[];
  
  // UI 状态
  selectedFolderId: string | null;
  expandedFolderIds: Set<string>;
  
  // 文件夹操作
  addFolder: (name: string, parentId?: string | null) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  selectFolder: (id: string | null) => void;
  toggleFolderExpand: (id: string) => void;
  
  // 步骤操作
  addStep: (folderId: string, type: Step['type']) => void;
  updateStep: (id: string, updates: Partial<Step>) => void;
  deleteStep: (id: string) => void;
  moveStep: (id: string, direction: 'up' | 'down') => void;
  updateStepConfig: (id: string, config: Partial<OpenUrlConfig | ClickElementConfig | WaitConfig | GetTextConfig | GetAttributeConfig | SetAttributeConfig | HttpRequestConfig | JsonExtractConfig | LoopConfig>) => void;
  
  // 子步骤操作
  addSubStep: (parentId: string, type: Step['type']) => void;
  deleteSubStep: (parentId: string, subStepId: string) => void;
  updateSubStepConfig: (parentId: string, subStepId: string, config: Partial<OpenUrlConfig | ClickElementConfig | WaitConfig | GetTextConfig | GetAttributeConfig | SetAttributeConfig | HttpRequestConfig | JsonExtractConfig | LoopConfig>) => void;
  
  // 初始化
  initData: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  // 初始数据
  folders: [],
  steps: [],
  selectedFolderId: null,
  expandedFolderIds: new Set(),

  // 初始化数据
  initData: () => {
    const folders = getFolders();
    const steps = getSteps();
    set({ folders, steps });
  },

  // 添加文件夹
  addFolder: (name: string, parentId = null) => {
    const now = Date.now();
    const newFolder: Folder = {
      id: generateId(),
      name,
      parentId,
      createdAt: now,
      updatedAt: now,
    };
    
    const folders = [...get().folders, newFolder];
    saveFolders(folders);
    set({ folders });
  },

  // 更新文件夹
  updateFolder: (id: string, name: string) => {
    const folders = get().folders.map(folder =>
      folder.id === id
        ? { ...folder, name, updatedAt: Date.now() }
        : folder
    );
    saveFolders(folders);
    set({ folders });
  },

  // 删除文件夹（同时删除子文件夹和步骤）
  deleteFolder: (id: string) => {
    const folders = get().folders;
    const steps = get().steps;
    
    // 递归获取所有要删除的文件夹 ID
    const getDescendantIds = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId);
      const ids = [parentId];
      children.forEach(child => {
        ids.push(...getDescendantIds(child.id));
      });
      return ids;
    };
    
    const folderIdsToDelete = getDescendantIds(id);
    
    // 删除文件夹和关联步骤
    const newFolders = folders.filter(f => !folderIdsToDelete.includes(f.id));
    const newSteps = steps.filter(s => !folderIdsToDelete.includes(s.folderId));
    
    saveFolders(newFolders);
    saveSteps(newSteps);
    
    set({
      folders: newFolders,
      steps: newSteps,
      selectedFolderId: get().selectedFolderId === id ? null : get().selectedFolderId,
    });
  },

  // 选择文件夹
  selectFolder: (id: string | null) => {
    set({ selectedFolderId: id });
  },

  // 切换文件夹展开/折叠
  toggleFolderExpand: (id: string) => {
    const expanded = new Set(get().expandedFolderIds);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedFolderIds: expanded });
  },

  // 添加步骤
  addStep: (folderId: string, type: Step['type']) => {
    const now = Date.now();
    const steps = get().steps.filter(s => s.folderId === folderId);
    const maxOrder = steps.length > 0 ? Math.max(...steps.map(s => s.order)) : -1;
    
    const defaultConfig: OpenUrlConfig | ClickElementConfig | WaitConfig | GetTextConfig | GetAttributeConfig | SetAttributeConfig | HttpRequestConfig | JsonExtractConfig | LoopConfig = 
      type === 'openUrl' 
        ? { url: '' }
        : type === 'clickElement'
        ? { selectorType: 'id', selectorValue: '', elementIndex: 0 }
        : type === 'wait'
        ? { seconds: 3 }
        : type === 'getText'
        ? { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedText', textType: 'innerText' }
        : type === 'getAttribute'
        ? { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedAttr', attributeName: 'href' }
        : type === 'setAttribute'
        ? { selectorType: 'id', selectorValue: '', elementIndex: 0, attributeName: 'value', attributeValue: '' }
        : type === 'httpRequest'
        ? { method: 'GET', url: '', headers: '', body: '', variableName: 'apiResponse', timeout: 30 }
        : type === 'jsonExtract'
        ? { sourceVariable: '', jsonPath: '$.', variableName: 'extractedData', extractAll: false }
        : { loopType: 'count', selectorType: 'class', selectorValue: '', variableSource: '', itemName: 'item', count: 10, subSteps: [] };
    
    const newStep: Step = {
      id: generateId(),
      folderId,
      order: maxOrder + 1,
      type,
      name: type === 'openUrl' ? '打开网址' : type === 'clickElement' ? '点击元素' : type === 'wait' ? '等待' : type === 'getText' ? '获取文本' : type === 'getAttribute' ? '获取属性' : type === 'setAttribute' ? '设置属性' : type === 'httpRequest' ? 'HTTP 请求' : type === 'jsonExtract' ? 'JSON 提取' : '循环',
      config: defaultConfig,
      createdAt: now,
      updatedAt: now,
    };
    
    const allSteps = [...get().steps, newStep];
    saveSteps(allSteps);
    set({ steps: allSteps });
  },

  // 更新步骤
  updateStep: (id: string, updates: Partial<Step>) => {
    const steps = get().steps.map(step =>
      step.id === id
        ? { ...step, ...updates, updatedAt: Date.now() }
        : step
    );
    saveSteps(steps);
    set({ steps });
  },

  // 删除步骤
  deleteStep: (id: string) => {
    const steps = get().steps.filter(s => s.id !== id);
    saveSteps(steps);
    set({ steps });
  },

  // 移动步骤（上移/下移）
  moveStep: (id: string, direction: 'up' | 'down') => {
    const step = get().steps.find(s => s.id === id);
    if (!step) return;
    
    const folderSteps = get().steps
      .filter(s => s.folderId === step.folderId)
      .sort((a, b) => a.order - b.order);
    
    const currentIndex = folderSteps.findIndex(s => s.id === id);
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    
    if (targetIndex < 0 || targetIndex >= folderSteps.length) return;
    
    // 交换顺序
    const targetStep = folderSteps[targetIndex];
    const steps = get().steps.map(s => {
      if (s.id === id) {
        return { ...s, order: targetStep.order, updatedAt: Date.now() };
      }
      if (s.id === targetStep.id) {
        return { ...s, order: step.order, updatedAt: Date.now() };
      }
      return s;
    });
    
    saveSteps(steps);
    set({ steps });
  },

  // 更新步骤配置
  updateStepConfig: (id: string, config: Partial<OpenUrlConfig | ClickElementConfig | WaitConfig | GetTextConfig | GetAttributeConfig | SetAttributeConfig | HttpRequestConfig | JsonExtractConfig | LoopConfig>) => {
    const steps = get().steps.map(step => {
      if (step.id === id) {
        return {
          ...step,
          config: { ...step.config, ...config },
          updatedAt: Date.now(),
        };
      }
      return step;
    });
    saveSteps(steps);
    set({ steps });
  },

  // 添加子步骤
  addSubStep: (parentId: string, type: Step['type']) => {
    const now = Date.now();
    const defaultConfig: any = 
      type === 'openUrl' ? { url: '' }
      : type === 'clickElement' ? { selectorType: 'id', selectorValue: '', elementIndex: 0 }
      : type === 'wait' ? { seconds: 3 }
      : type === 'getText' ? { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedText', textType: 'innerText' }
      : type === 'getAttribute' ? { selectorType: 'id', selectorValue: '', elementIndex: 0, variableName: 'extractedAttr', attributeName: 'href' }
      : type === 'setAttribute' ? { selectorType: 'id', selectorValue: '', elementIndex: 0, attributeName: 'value', attributeValue: '' }
      : type === 'httpRequest' ? { method: 'GET', url: '', headers: '', body: '', variableName: 'apiResponse', timeout: 30 }
      : type === 'jsonExtract' ? { sourceVariable: '', jsonPath: '$.', variableName: 'extractedData', extractAll: false }
      : type === 'interceptRequest' ? { urlPattern: '', method: 'ALL', modifyHeaders: '', modifyBody: '', modifyResponse: '', variableName: 'interceptedData', continueRequest: true }
      : { loopType: 'count', selectorType: 'class', selectorValue: '', variableSource: '', itemName: 'item', count: 10, subSteps: [] };

    const stepName = type === 'openUrl' ? '打开网址' : type === 'clickElement' ? '点击元素' : type === 'wait' ? '等待' : type === 'getText' ? '获取文本' : type === 'getAttribute' ? '获取属性' : type === 'setAttribute' ? '设置属性' : type === 'httpRequest' ? 'HTTP 请求' : type === 'jsonExtract' ? 'JSON 提取' : type === 'interceptRequest' ? '拦截请求' : '循环';

    // 找到父步骤以获取其 folderId
    const parentStep = get().steps.find(s => s.id === parentId);
    const folderId = parentStep?.folderId || '';

    const newSubStep: Step = {
      id: generateId(),
      folderId,  // 继承父步骤的 folderId
      order: 0,
      type,
      name: stepName,
      config: defaultConfig,
      createdAt: now,
      updatedAt: now,
    };

    const steps = get().steps.map(step => {
      if (step.id === parentId) {
        const loopConfig = step.config as LoopConfig;
        const subSteps = [...(loopConfig.subSteps || []), { ...newSubStep, order: (loopConfig.subSteps || []).length }];
        return {
          ...step,
          config: { ...loopConfig, subSteps },
          updatedAt: now,
        };
      }
      return step;
    });
    saveSteps(steps);
    set({ steps });
  },

  // 删除子步骤
  deleteSubStep: (parentId: string, subStepId: string) => {
    const steps = get().steps.map(step => {
      if (step.id === parentId) {
        const loopConfig = step.config as LoopConfig;
        const subSteps = (loopConfig.subSteps || []).filter(s => s.id !== subStepId).map((s, i) => ({ ...s, order: i }));
        return {
          ...step,
          config: { ...loopConfig, subSteps },
          updatedAt: Date.now(),
        };
      }
      return step;
    });
    saveSteps(steps);
    set({ steps });
  },

  // 更新子步骤配置
  updateSubStepConfig: (parentId: string, subStepId: string, config: any) => {
    const steps = get().steps.map(step => {
      if (step.id === parentId) {
        const loopConfig = step.config as LoopConfig;
        const subSteps = (loopConfig.subSteps || []).map(s =>
          s.id === subStepId ? { ...s, config: { ...s.config, ...config }, updatedAt: Date.now() } : s
        );
        return {
          ...step,
          config: { ...loopConfig, subSteps },
          updatedAt: Date.now(),
        };
      }
      return step;
    });
    saveSteps(steps);
    set({ steps });
  },
}));
