/**
 * NodePalette - 节点面板
 * 拖拽步骤节点到画布上
 */
import React from 'react';
import {
  GlobalOutlined,
  AimOutlined,
  ClockCircleOutlined,
  FileTextOutlined,
  LinkOutlined,
  CodeOutlined,
  ApiOutlined,
  BranchesOutlined,
  StopOutlined,
  DatabaseOutlined,
  EnterOutlined,
  ThunderboltOutlined,
  FunctionOutlined,
  BellOutlined,
  ScheduleOutlined,
} from '@ant-design/icons';
import './NodePalette.css';

// 步骤分组定义
const NODE_GROUPS = [
  {
    name: '🌐 导航',
    items: [
      { type: 'openUrl', icon: <GlobalOutlined />, name: '打开网址' },
    ],
  },
  {
    name: '👆 交互',
    items: [
      { type: 'clickElement', icon: <AimOutlined />, name: '点击元素' },
      { type: 'setAttribute', icon: <CodeOutlined />, name: '设置属性' },
      { type: 'keyboardAction', icon: <EnterOutlined />, name: '键盘操作' },
      { type: 'elementMethod', icon: <ThunderboltOutlined />, name: '调用方法' },
    ],
  },
  {
    name: '📄 采集',
    items: [
      { type: 'getText', icon: <FileTextOutlined />, name: '获取文本' },
      { type: 'getAttribute', icon: <LinkOutlined />, name: '获取属性' },
    ],
  },
  {
    name: '⏱️ 控制',
    items: [
      { type: 'wait', icon: <ClockCircleOutlined />, name: '等待' },
      { type: 'scheduledTask', icon: <ScheduleOutlined />, name: '定时任务' },
    ],
  },
  {
    name: '🌐 网络',
    items: [
      { type: 'httpRequest', icon: <ApiOutlined />, name: 'HTTP 请求' },
      { type: 'jsonExtract', icon: <BranchesOutlined />, name: 'JSON 提取' },
      { type: 'interceptRequest', icon: <StopOutlined />, name: '拦截请求' },
    ],
  },
  {
    name: '⚙️ 高级',
    items: [
      { type: 'executeScript', icon: <CodeOutlined />, name: '注入 JS' },
      { type: 'localStorage', icon: <DatabaseOutlined />, name: '本地存储' },
      { type: 'variableOperation', icon: <FunctionOutlined />, name: '变量操作' },
      { type: 'dingTalkNotify', icon: <BellOutlined />, name: '钉钉推送' },
    ],
  },
];

const NodePalette: React.FC = () => {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData('application/flow-crawler-node', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="node-palette">
      <div className="palette-title">节点面板</div>
      <div className="palette-hint">拖拽节点到画布</div>
      <div className="palette-groups">
        {NODE_GROUPS.map((group) => (
          <div key={group.name} className="palette-group">
            <div className="group-title">{group.name}</div>
            <div className="group-items">
              {group.items.map((item) => (
                <div
                  key={item.type}
                  className="palette-item"
                  draggable
                  onDragStart={(e) => onDragStart(e, item.type)}
                >
                  <span className="palette-item-icon">{item.icon}</span>
                  <span className="palette-item-name">{item.name}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NodePalette;
