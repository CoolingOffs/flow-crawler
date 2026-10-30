import React, { useEffect, useState, useRef } from 'react';
import FolderTree from './components/FolderTree/FolderTree';
import FlowEditor from './components/FlowEditor/FlowEditor';
import { useStore } from './store/useStore';
import { useDraggable } from './hooks/useDraggable';
import { Layout, Card, Typography, message } from 'antd';
import { FolderOutlined, EditOutlined, CodeOutlined, EyeOutlined, FolderOpenOutlined, CloseOutlined, CodeTwoTone } from '@ant-design/icons';
import './App.css';

const { Header, Content } = Layout;
const { Title } = Typography;

function App() {
  const { initData } = useStore();
  const [previewWindow, setPreviewWindow] = useState<{
    visible: boolean;
    url: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>({
    visible: false,
    url: '',
    x: 100,
    y: 100,
    width: 800,
    height: 600,
  });

  const headerRef = useRef<HTMLDivElement>(null);

  // 拖拽功能
  useDraggable({
    handleRef: headerRef,
    initialX: previewWindow.x,
    initialY: previewWindow.y,
    onDrag: (x, y) => {
      setPreviewWindow(prev => ({ ...prev, x, y }));
    },
  });

  // 初始化加载数据
  useEffect(() => {
    initData();
  }, [initData]);

  // 监听预览模式变化
  useEffect(() => {
    const handlePreviewEvent = (event: CustomEvent) => {
      if (event.detail.url) {
        // 居中显示窗口
        const x = (window.innerWidth - previewWindow.width) / 2;
        const y = (window.innerHeight - previewWindow.height) / 2;
        
        setPreviewWindow({
          visible: true,
          url: event.detail.url,
          x: Math.max(50, x),
          y: Math.max(50, y),
          width: previewWindow.width,
          height: previewWindow.height,
        });
      }
    };

    window.addEventListener('openPreview', handlePreviewEvent as EventListener);
    return () => {
      window.removeEventListener('openPreview', handlePreviewEvent as EventListener);
    };
  }, []);

  return (
    <Layout className="app">
      <Header className="app-header">
        <div className="header-content">
          <div className="logo">
            <CodeOutlined className="logo-icon" />
            <Title level={3} className="logo-title">
              流程创建工具
            </Title>
          </div>
        </div>
      </Header>
      
      <Content className="app-content">
        <div className="content-wrapper">
          <div className="left-panel">
            <Card 
              className="panel-card" 
              title={
                <div className="card-title">
                  <FolderOutlined className="title-icon" />
                  <span>文件夹管理</span>
                </div>
              }
            >
              <FolderTree />
            </Card>
          </div>
          
          <div className="right-panel">
            <Card 
              className="panel-card" 
              title={
                <div className="card-title">
                  <EditOutlined className="title-icon" />
                  <span>流程编辑器</span>
                </div>
              }
            >
              <FlowEditor />
            </Card>
          </div>
        </div>
      </Content>

      {/* 浮动预览窗口 */}
      {previewWindow.visible && (
        <div
          className="floating-preview-window"
          style={{
            left: previewWindow.x,
            top: previewWindow.y,
            width: previewWindow.width,
            height: previewWindow.height,
          }}
        >
          <div className="floating-window-header" ref={headerRef}>
            <div className="window-title">
              <EyeOutlined /> 网页预览
            </div>
            <div className="window-controls">
              <button
                className="control-btn"
                onClick={() => {
                  message.info({
                    content: (
                      <div>
                        <p style={{ margin: '0 0 8px 0', fontWeight: 'bold' }}>💡 打开开发者工具</p>
                        <p style={{ margin: '0 0 4px 0' }}>按 <kbd>F12</kbd> 或 <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+<kbd>I</kbd></p>
                        <p style={{ margin: '0', fontSize: '12px', color: '#8c8c8c' }}>右键点击元素 → 检查 → 复制选择器</p>
                      </div>
                    ),
                    duration: 5,
                  });
                }}
                title="打开开发者工具"
              >
                <CodeTwoTone />
              </button>
              <button
                className="control-btn close-btn"
                onClick={() => setPreviewWindow({ ...previewWindow, visible: false })}
                title="关闭窗口"
              >
                <CloseOutlined />
              </button>
            </div>
          </div>
          <div className="floating-window-content">
            <iframe
              src={previewWindow.url}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
              }}
              title="网页预览"
            />
          </div>
          <div className="floating-window-resize" />
        </div>
      )}
    </Layout>
  );
}

export default App;
