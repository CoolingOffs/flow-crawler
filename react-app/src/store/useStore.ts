/**
 * 全局状态管理 (Zustand)
 * 图编辑器版本
 */
import { create } from 'zustand';
import { applyNodeChanges, applyEdgeChanges, addEdge as rfAddEdge, Connection, NodeChange, EdgeChange } from '@xyflow/react';
import { Folder, Step, CanvasData, FlowNode, FlowEdge, FlowNodeData, StepType, StepConfig } from '../types';
import { getFolders, saveFolders, getSteps, getCanvasData, saveCanvasData, generateId, isMigrated, setMigrated } from '../utils/storage';
import { migrateStepsToCanvas, getDefaultConfig, getDefaultName } from '../utils/migrateData';

/**
 * 按 Y 坐标重新给节点编号（1-based），用于删除节点后顺位
 */
function renumberNodesByPosition(nodes: FlowNode[]): FlowNode[] {
  return [...nodes]
    .sort((a, b) => a.position.y - b.position.y)
    .map((n, i) => ({
      ...n,
      data: { ...n.data, _order: i + 1 },
    }));
}

/**
 * 确保所有节点都有 _order（兼容旧数据）
 */
function ensureNodeOrders(canvasData: Record<string, CanvasData>): Record<string, CanvasData> {
  const result = { ...canvasData };
  Object.keys(result).forEach(folderId => {
    const canvas = result[folderId];
    if (!canvas?.nodes) return;
    const needsOrder = canvas.nodes.some(n => !(n.data as any)._order);
    if (needsOrder) {
      const sorted = [...canvas.nodes].sort((a, b) => a.position.y - b.position.y);
      result[folderId] = {
        ...canvas,
        nodes: sorted.map((n, i) => ({
          ...n,
          data: { ...n.data, _order: i + 1 },
        })),
      };
    }
  });
  return result;
}

/** BFS 检查从 start 到 end 是否存在有向路径 */
function hasPath(start: string, end: string, edges: FlowEdge[]): boolean {
  if (start === end) return true;
  const visited = new Set<string>();
  const queue = [start];
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current)) continue;
    visited.add(current);
    const nexts = edges.filter(e => e.source === current).map(e => e.target);
    for (const next of nexts) {
      if (next === end) return true;
      if (!visited.has(next)) queue.push(next);
    }
  }
  return false;
}

interface AppState {
  // 数据
  folders: Folder[];
  canvasData: Record<string, CanvasData>;   // key = folderId

  // UI 状态
  selectedFolderId: string | null;
  selectedNodeId: string | null;
  expandedFolderIds: Set<string>;

  // 文件夹操作
  addFolder: (name: string, parentId?: string | null) => void;
  updateFolder: (id: string, name: string) => void;
  deleteFolder: (id: string) => void;
  selectFolder: (id: string | null) => void;
  toggleFolderExpand: (id: string) => void;

  // 节点操作
  addNode: (folderId: string, type: StepType, position: { x: number; y: number }) => void;
  updateNode: (nodeId: string, updates: Partial<FlowNode>) => void;
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void;
  updateNodeConfig: (nodeId: string, config: Partial<StepConfig>) => void;
  deleteNode: (nodeId: string) => void;

  // 画布变更 (React Flow 回调)
  onNodesChange: (changes: NodeChange<FlowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;

  // 边操作
  removeEdge: (edgeId: string) => void;

  // 选中节点
  selectNode: (nodeId: string | null) => void;

  // 初始化
  initData: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  folders: [],
  canvasData: {},
  selectedFolderId: null,
  selectedNodeId: null,
  expandedFolderIds: new Set(),

  // 初始化数据（含自动迁移）
  initData: () => {
    const folders = getFolders();
    let canvasData = getCanvasData();

    // 如果还没迁移过，执行迁移
    if (!isMigrated()) {
      const oldSteps = getSteps();
      if (oldSteps.length > 0) {
        // 按 folderId 分组
        const stepsByFolder: Record<string, Step[]> = {};
        oldSteps.forEach(step => {
          if (!stepsByFolder[step.folderId]) {
            stepsByFolder[step.folderId] = [];
          }
          stepsByFolder[step.folderId].push(step);
        });

        // 转换每个文件夹的步骤为画布数据
        Object.entries(stepsByFolder).forEach(([folderId, steps]) => {
          canvasData[folderId] = migrateStepsToCanvas(steps);
        });

        saveCanvasData(canvasData);
      }
      setMigrated();
    }

    // 确保所有节点都有 _order（兼容旧数据）
    canvasData = ensureNodeOrders(canvasData);
    set({ folders, canvasData });
  },

  // ---- 文件夹操作 ----

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

  updateFolder: (id: string, name: string) => {
    const folders = get().folders.map(f =>
      f.id === id ? { ...f, name, updatedAt: Date.now() } : f
    );
    saveFolders(folders);
    set({ folders });
  },

  deleteFolder: (id: string) => {
    const folders = get().folders;

    const getDescendantIds = (parentId: string): string[] => {
      const children = folders.filter(f => f.parentId === parentId);
      const ids = [parentId];
      children.forEach(child => ids.push(...getDescendantIds(child.id)));
      return ids;
    };

    const folderIdsToDelete = getDescendantIds(id);
    const newFolders = folders.filter(f => !folderIdsToDelete.includes(f.id));

    // 同时删除画布数据
    const canvasData = { ...get().canvasData };
    folderIdsToDelete.forEach(fid => delete canvasData[fid]);

    saveFolders(newFolders);
    saveCanvasData(canvasData);

    set({
      folders: newFolders,
      canvasData,
      selectedFolderId: get().selectedFolderId === id ? null : get().selectedFolderId,
      selectedNodeId: null,
    });
  },

  selectFolder: (id: string | null) => {
    set({ selectedFolderId: id, selectedNodeId: null });
  },

  toggleFolderExpand: (id: string) => {
    const expanded = new Set(get().expandedFolderIds);
    if (expanded.has(id)) {
      expanded.delete(id);
    } else {
      expanded.add(id);
    }
    set({ expandedFolderIds: expanded });
  },

  // ---- 节点操作 ----

  addNode: (folderId: string, type: StepType, position: { x: number; y: number }) => {
    const canvasData = { ...get().canvasData };
    if (!canvasData[folderId]) {
      canvasData[folderId] = { nodes: [], edges: [] };
    }

    // 新节点始终追加到末尾（序号 = 当前最大 + 1），不受拖放位置影响
    const existingNodes = canvasData[folderId].nodes;
    const maxOrder = existingNodes.reduce((max, n) => Math.max(max, (n.data as any)._order || 0), 0);
    const nextOrder = maxOrder + 1;

    const nodeData: FlowNodeData = {
      stepType: type,
      name: getDefaultName(type),
      config: getDefaultConfig(type),
      _order: nextOrder,
    };

    const newNode: FlowNode = {
      id: generateId(),
      type: 'stepNode',
      position,
      data: nodeData,
    };

    canvasData[folderId] = {
      ...canvasData[folderId],
      nodes: [...existingNodes, newNode],
    };
    saveCanvasData(canvasData);
    set({ canvasData, selectedNodeId: newNode.id });
  },

  updateNode: (nodeId: string, updates: Partial<FlowNode>) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    canvasData[folderId] = {
      ...canvas,
      nodes: canvas.nodes.map(n =>
        n.id === nodeId ? { ...n, ...updates } : n
      ),
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    canvasData[folderId] = {
      ...canvas,
      nodes: canvas.nodes.map(n =>
        n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n
      ),
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  updateNodeConfig: (nodeId: string, config: Partial<StepConfig>) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    canvasData[folderId] = {
      ...canvas,
      nodes: canvas.nodes.map(n =>
        n.id === nodeId
          ? { ...n, data: { ...n.data, config: { ...n.data.config, ...config } as StepConfig } }
          : n
      ),
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  deleteNode: (nodeId: string) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    // 删除节点和关联边，然后按 Y 位置重新编号
    const remainingNodes = canvas.nodes.filter(n => n.id !== nodeId);
    canvasData[folderId] = {
      nodes: renumberNodesByPosition(remainingNodes),
      edges: canvas.edges.filter(e => e.source !== nodeId && e.target !== nodeId),
    };
    saveCanvasData(canvasData);
    set({
      canvasData,
      selectedNodeId: get().selectedNodeId === nodeId ? null : get().selectedNodeId,
    });
  },

  // ---- 画布变更回调 (React Flow) ----

  onNodesChange: (changes: NodeChange<FlowNode>[]) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    const updatedNodes = applyNodeChanges(changes, canvas.nodes);

    // 如果有节点被删除，重新编号剩余节点
    const hasRemoval = changes.some(c => c.type === 'remove');
    const finalNodes = hasRemoval ? renumberNodesByPosition(updatedNodes) : updatedNodes;

    canvasData[folderId] = {
      ...canvas,
      nodes: finalNodes,
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  onEdgesChange: (changes: EdgeChange[]) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    // 禁止键盘删除边（仅允许双击删除）
    // 过滤掉 remove 变更，其他（select 等）放行
    const allowed = changes.filter(c => c.type !== 'remove');
    if (allowed.length === 0) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    canvasData[folderId] = {
      ...canvas,
      edges: applyEdgeChanges(allowed, canvas.edges),
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  onConnect: (connection: Connection) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;
    if (!connection.source || !connection.target) return;

    // 防止自连
    if (connection.source === connection.target) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    const sourceNode = canvas.nodes.find(n => n.id === connection.source);
    const targetNode = canvas.nodes.find(n => n.id === connection.target);
    const sourceIsST = (sourceNode?.data as any)?.stepType === 'scheduledTask';
    const targetIsST = (targetNode?.data as any)?.stepType === 'scheduledTask';

    if (sourceIsST) {
      // 定时任务顶部(source) → 其他节点顶部(target)：回边
      // 最多 2 条出线
      const outgoingCount = canvas.edges.filter(e => e.source === connection.source).length;
      if (outgoingCount >= 2) return;
      // 如果底部已有连线，检查顶点目标和底点目标之间的路径连通性
      const bottomEdge = canvas.edges.find(e => e.target === connection.source);
      if (bottomEdge) {
        if (!hasPath(connection.target, bottomEdge.source, canvas.edges)) return;
      }
    } else if (targetIsST) {
      // 普通节点底部(source) → 定时任务底部(target)：正常流入
      // 如果顶部已有连线，检查顶点目标和底点目标之间的路径连通性
      const topEdge = canvas.edges.find(e => e.source === connection.target);
      if (topEdge) {
        if (!hasPath(topEdge.target, connection.source, canvas.edges)) return;
      }
    } else {
      // 普通节点：只能有一个出边和一个入边
      const hasOutgoing = canvas.edges.some(e => e.source === connection.source);
      const hasIncoming = canvas.edges.some(e => e.target === connection.target);
      if (hasOutgoing || hasIncoming) return;

      // 防止循环
      const wouldCreateCycle = (): boolean => {
        let current = connection.target;
        const visited = new Set<string>();
        while (current) {
          if (current === connection.source) return true;
          if (visited.has(current)) return false;
          visited.add(current);
          const nextEdge = canvas.edges.find(e => e.source === current);
          current = nextEdge ? nextEdge.target : '';
        }
        return false;
      };
      if (wouldCreateCycle()) return;
    }

    const newEdges = rfAddEdge(
      { ...connection, type: 'smoothstep' },
      canvas.edges
    );

    canvasData[folderId] = {
      ...canvas,
      edges: newEdges,
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  // ---- 边操作 ----

  removeEdge: (edgeId: string) => {
    const folderId = get().selectedFolderId;
    if (!folderId) return;

    const canvasData = { ...get().canvasData };
    const canvas = canvasData[folderId];
    if (!canvas) return;

    canvasData[folderId] = {
      ...canvas,
      edges: canvas.edges.filter(e => e.id !== edgeId),
    };
    saveCanvasData(canvasData);
    set({ canvasData });
  },

  // ---- 选中节点 ----

  selectNode: (nodeId: string | null) => {
    set({ selectedNodeId: nodeId });
  },
}));
