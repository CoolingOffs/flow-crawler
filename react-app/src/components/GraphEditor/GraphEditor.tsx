/**
 * GraphEditor - 图编辑器主组件
 * 基于 React Flow 的节点连线画布
 */
import React, { useCallback, useRef, useMemo, useState } from 'react';
import {
  ReactFlow,
  ReactFlowProvider,
  Controls,
  MiniMap,
  Background,
  BackgroundVariant,
  useReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useStore } from '../../store/useStore';
import { exportCanvasToConfig, previewJsonString } from '../../utils/exportFlow';
import { FlowNode, StepType } from '../../types';
import StepNode from './StepNode';
import NodePalette from './NodePalette';
import NodeConfigPanel from './NodeConfigPanel';
import { Button, Modal, Input, message, Tooltip } from 'antd';
import {
  PlayCircleOutlined,
  CopyOutlined,
  ImportOutlined,
  DownloadOutlined,
  BookOutlined,
  ExpandOutlined,
  CompressOutlined,
} from '@ant-design/icons';
import './GraphEditor.css';

// 注册自定义节点类型
const nodeTypes = { stepNode: StepNode };

const GraphEditorInner: React.FC = () => {
  const {
    folders,
    canvasData,
    selectedFolderId,
    selectedNodeId,
    addNode,
    onNodesChange,
    onEdgesChange,
    onConnect,
    selectNode,
  } = useStore();

  const reactFlowInstance = useReactFlow();
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  const [executeJsonVisible, setExecuteJsonVisible] = useState(false);
  const [jsonInputValue, setJsonInputValue] = useState('');
  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const [importJsonValue, setImportJsonValue] = useState('');
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [jsonExpanded, setJsonExpanded] = useState(false);

  // 当前画布数据
  const selectedFolder = folders.find(f => f.id === selectedFolderId);
  const currentCanvas = selectedFolderId ? canvasData[selectedFolderId] : null;
  const rawNodes = currentCanvas?.nodes || [];
  const edges = currentCanvas?.edges || [];

  // 计算执行顺序（拓扑排序）并给节点添加编号
  const { nodes, nodeOrderMap } = useMemo(() => {
    const orderMap = new Map<string, number>();
    if (rawNodes.length === 0) return { nodes: rawNodes, nodeOrderMap: orderMap };

    // 计算入度
    const inDegree = new Map<string, number>();
    const adjacency = new Map<string, string[]>();
    rawNodes.forEach(n => {
      inDegree.set(n.id, 0);
      adjacency.set(n.id, []);
    });
    edges.forEach(e => {
      adjacency.get(e.source)?.push(e.target);
      inDegree.set(e.target, (inDegree.get(e.target) || 0) + 1);
    });

    // BFS 拓扑排序
    // 先收集所有入度为0的起始节点，按 Y 坐标排序（从上到下）
    const startNodes: string[] = [];
    inDegree.forEach((deg, id) => { if (deg === 0) startNodes.push(id); });
    startNodes.sort((a, b) => {
      const nodeA = rawNodes.find(n => n.id === a);
      const nodeB = rawNodes.find(n => n.id === b);
      return (nodeA?.position.y || 0) - (nodeB?.position.y || 0);
    });

    let order = 1;
    const processed = new Set<string>();
    // 对每个起始节点，沿链走到底
    for (const startId of startNodes) {
      if (processed.has(startId)) continue;
      let current = startId;
      while (current && !processed.has(current)) {
        processed.add(current);
        orderMap.set(current, order++);
        const nextEdge = edges.find(e => e.source === current);
        current = nextEdge ? nextEdge.target : '';
      }
    }

    // 未连线的节点按 Y 坐标排序
    const missing = rawNodes.filter(n => !orderMap.has(n.id)).sort((a, b) => a.position.y - b.position.y);
    missing.forEach(n => orderMap.set(n.id, order++));

    // 将 order 注入节点 data
    const nodesWithOrder = rawNodes.map(n => ({
      ...n,
      data: { ...n.data, executionOrder: orderMap.get(n.id) },
    }));

    return { nodes: nodesWithOrder, nodeOrderMap: orderMap };
  }, [rawNodes, edges]);

  // 导出配置（只包含有连线的节点）
  const exportedConfig = useMemo(() => {
    if (!selectedFolder || !currentCanvas) return null;
    // 只导出有连线的节点
    const connectedNodeIds = new Set<string>();
    edges.forEach(e => {
      connectedNodeIds.add(e.source);
      connectedNodeIds.add(e.target);
    });
    // 如果只有单个节点且没有边，也导出
    const connectedNodes = rawNodes.length === 1
      ? rawNodes
      : rawNodes.filter(n => connectedNodeIds.has(n.id));
    // 只导出有连线的边
    const connectedEdges = edges;
    return exportCanvasToConfig(selectedFolder, connectedNodes, connectedEdges, nodeOrderMap);
  }, [selectedFolder, rawNodes, edges, nodeOrderMap]);

  // 拖放处理
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/flow-crawler-node') as StepType;
      if (!type || !selectedFolderId) return;

      const bounds = reactFlowWrapper.current?.getBoundingClientRect();
      if (!bounds) return;

      const position = reactFlowInstance.screenToFlowPosition({
        x: event.clientX - bounds.left,
        y: event.clientY - bounds.top,
      });

      addNode(selectedFolderId, type, position);
    },
    [reactFlowInstance, selectedFolderId, addNode]
  );

  // 节点点击事件
  const onNodeClick = useCallback(
    (_: React.MouseEvent, node: FlowNode) => {
      selectNode(node.id);
    },
    [selectNode]
  );

  // 双击连线删除
  const onEdgeDoubleClick = useCallback(
    (_: React.MouseEvent, edge: any) => {
      const { removeEdge } = useStore.getState();
      removeEdge(edge.id);
    },
    []
  );

  // 画布点击取消选中
  const onPaneClick = useCallback(() => {
    selectNode(null);
  }, [selectNode]);

  // 复制 JSON
  const handleCopyJson = async () => {
    if (!exportedConfig) return;
    const json = previewJsonString(exportedConfig);
    try {
      await navigator.clipboard.writeText(json);
      message.success('JSON 已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 导出文件
  const handleExportFile = () => {
    if (!exportedConfig) return;
    const json = previewJsonString(exportedConfig);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportedConfig.name || 'flow'}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    message.success('文件已导出');
  };

  // 执行 JSON
  const handleExecuteJson = async () => {
    try {
      const config = JSON.parse(jsonInputValue);
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config),
      });
      const result = await response.json();
      if (result.success) {
        message.success('执行成功');
      } else {
        message.error(`执行失败: ${result.message}`);
      }
    } catch (e: any) {
      message.error(`请求失败: ${e.message}`);
    }
    setExecuteJsonVisible(false);
    setJsonInputValue('');
  };

  // 执行当前画布
  const handleExecuteCanvas = async () => {
    if (!exportedConfig) {
      message.warning('当前画布为空');
      return;
    }
    try {
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(exportedConfig),
      });
      const result = await response.json();
      if (result.success) {
        message.success('流程执行成功');
      } else {
        message.error(`执行失败: ${result.message}`);
      }
    } catch (e: any) {
      message.error(`请求失败: ${e.message || '请确保 Python 服务器已启动'}`);
    }
  };

  return (
    <div className="graph-editor">
      {/* 左侧节点面板 */}
      {selectedFolderId && <NodePalette />}

      {/* 画布主体 */}
      <div className="graph-canvas-wrapper" ref={reactFlowWrapper}>
        {selectedFolderId ? (
          <>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onDrop={onDrop}
            onDragOver={onDragOver}
            onNodeClick={onNodeClick}
            onEdgeDoubleClick={onEdgeDoubleClick}
            onPaneClick={onPaneClick}
            nodeTypes={nodeTypes}
            fitView
            deleteKeyCode="Delete"
            snapToGrid
            snapGrid={[15, 15]}
            defaultEdgeOptions={{ type: 'smoothstep', animated: true, style: { strokeWidth: 2.5 } }}
          >
            <Controls />
            <MiniMap
              nodeColor={() => '#1677ff'}
              maskColor="rgba(0,0,0,0.08)"
              style={{ width: 120, height: 80 }}
            />
            <Background variant={BackgroundVariant.Dots} gap={15} size={1} />
          </ReactFlow>

          {/* 工具栏 */}
          <div className="canvas-toolbar">
            <Tooltip title="执行当前画布流程">
              <Button type="primary" icon={<PlayCircleOutlined />} onClick={handleExecuteCanvas}>
                执行流程
              </Button>
            </Tooltip>
            <Tooltip title="手动输入 JSON 执行">
              <Button icon={<PlayCircleOutlined />} onClick={() => setExecuteJsonVisible(true)}>
                执行 JSON
              </Button>
            </Tooltip>
            <Tooltip title="复制 JSON">
              <Button icon={<CopyOutlined />} onClick={handleCopyJson}>
                复制
              </Button>
            </Tooltip>
            <Tooltip title="导出为文件">
              <Button icon={<DownloadOutlined />} onClick={handleExportFile}>
                导出
              </Button>
            </Tooltip>
            <Tooltip title="导入 JSON">
              <Button icon={<ImportOutlined />} onClick={() => setImportJsonVisible(true)}>
                导入
              </Button>
            </Tooltip>
            <Tooltip title="使用教程">
              <Button icon={<BookOutlined />} onClick={() => setTutorialVisible(true)}>
                教程
              </Button>
            </Tooltip>
          </div>
          </>
        ) : (
          <div className="empty-canvas">
            <p>👈 请在左侧选择一个文件夹</p>
            <p style={{ fontSize: 12, color: '#999' }}>每个文件夹对应一个独立的画布</p>
          </div>
        )}
      </div>

      {/* 右侧配置面板 */}
      {selectedNodeId && <NodeConfigPanel />}

      {/* JSON 预览（右下角） */}
      {exportedConfig && (
        jsonExpanded ? (
          <div className="json-preview-panel">
            <div className="json-preview-header" onClick={() => setJsonExpanded(false)}>
              <span>JSON 预览</span>
              <button className="json-expand-btn" title="收起"><CompressOutlined /></button>
            </div>
            <pre className="json-preview-content">{previewJsonString(exportedConfig)}</pre>
          </div>
        ) : (
          <div className="json-preview-collapsed" onClick={() => setJsonExpanded(true)} title="展开 JSON 预览">
            <span className="json-collapsed-label">JSON 预览</span>
          </div>
        )
      )}

      {/* 执行 JSON 弹窗 */}
      <Modal
        title="执行 JSON 配置"
        open={executeJsonVisible}
        onCancel={() => { setExecuteJsonVisible(false); setJsonInputValue(''); }}
        onOk={handleExecuteJson}
        okText="发送到 Python 执行"
        cancelText="取消"
        width={700}
      >
        <p style={{ fontSize: 12, color: '#8c8c8c', marginBottom: 8 }}>
          输入 JSON 配置，发送到 Python 后端由 Playwright 驱动浏览器执行。确保 <code>python server.py</code> 已启动。
        </p>
        <Input.TextArea
          rows={12}
          value={jsonInputValue}
          onChange={(e) => setJsonInputValue(e.target.value)}
          placeholder={'{\n  "name": "流程名称",\n  "task": [...]\n}'}
        />
      </Modal>

      {/* 导入弹窗 */}
      <Modal
        title="导入 JSON 配置"
        open={importJsonVisible}
        onCancel={() => { setImportJsonVisible(false); setImportJsonValue(''); }}
        onOk={() => { message.info('导入功能开发中'); setImportJsonVisible(false); }}
        okText="导入"
        cancelText="取消"
        width={700}
      >
        <Input.TextArea
          rows={12}
          value={importJsonValue}
          onChange={(e) => setImportJsonValue(e.target.value)}
          placeholder="粘贴 JSON 配置..."
        />
      </Modal>

      {/* 教程弹窗 */}
      <Modal
        title="使用教程"
        open={tutorialVisible}
        onCancel={() => setTutorialVisible(false)}
        footer={null}
        width={600}
      >
        <div className="tutorial-content">
          <h4>🎯 快速开始</h4>
          <ol>
            <li>在左侧选择文件夹</li>
            <li>从左侧面板<strong>拖拽节点</strong>到画布上</li>
            <li>从节点底部连接点<strong>拖线</strong>到另一个节点顶部的连接点</li>
            <li>点击节点打开右侧配置面板进行参数设置</li>
            <li>点击"执行流程"按钮发送到 Python 后端执行</li>
          </ol>
          <h4>💡 提示</h4>
          <ul>
            <li>拖拽节点可以调整位置</li>
            <li>选中节点后按 Delete 键删除</li>
            <li>右下角实时预览导出的 JSON</li>
            <li>使用鼠标滚轮缩放画布</li>
          </ul>
        </div>
      </Modal>
    </div>
  );
};

const GraphEditor: React.FC = () => {
  return (
    <ReactFlowProvider>
      <GraphEditorInner />
    </ReactFlowProvider>
  );
};

export default GraphEditor;
