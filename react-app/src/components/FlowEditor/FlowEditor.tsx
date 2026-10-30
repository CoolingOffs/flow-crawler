import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useStore } from '../../store/useStore';
import { exportFolderToConfig, previewJsonString } from '../../utils/exportFlow';
import StepCard from './StepCard';
import { PlusOutlined, FolderOpenOutlined, CopyOutlined, EditOutlined, DownOutlined, UpOutlined, GlobalOutlined, AimOutlined, ClockCircleOutlined, FileTextOutlined, LinkOutlined, CodeOutlined, ApiOutlined, BranchesOutlined, SyncOutlined, QuestionCircleOutlined, BookOutlined, StopOutlined, PlayCircleOutlined, ImportOutlined } from '@ant-design/icons';
import { Button, Modal, Tree, message, Input } from 'antd';
import type { TreeProps } from 'antd';
import type { DataNode } from 'antd/es/tree';
import './FlowEditor.css';

const FlowEditor: React.FC = () => {
  const { folders, steps, selectedFolderId, addStep, updateStepConfig } = useStore();
  const [jsonPanelVisible, setJsonPanelVisible] = useState(true);
  const [variablesPanelVisible, setVariablesPanelVisible] = useState(true);
  const [stepModalVisible, setStepModalVisible] = useState(false);
  const [tutorialVisible, setTutorialVisible] = useState(false);
  const [executeJsonVisible, setExecuteJsonVisible] = useState(false);
  const [importJsonVisible, setImportJsonVisible] = useState(false);
  const [jsonInputValue, setJsonInputValue] = useState('');
  const [importJsonValue, setImportJsonValue] = useState('');

  const jsonPanelRef = useRef<HTMLDivElement>(null);
  const variablesPanelRef = useRef<HTMLDivElement>(null);

  // 点击外部关闭面板
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // 检查是否点击在 JSON 面板外部
      if (
        jsonPanelRef.current && 
        !jsonPanelRef.current.contains(event.target as Node) &&
        jsonPanelVisible
      ) {
        setJsonPanelVisible(false);
      }
      
      // 检查是否点击在变量面板外部
      if (
        variablesPanelRef.current && 
        !variablesPanelRef.current.contains(event.target as Node) &&
        variablesPanelVisible
      ) {
        setVariablesPanelVisible(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [jsonPanelVisible, variablesPanelVisible]);

  // 获取当前选中的文件夹
  const selectedFolder = folders.find(f => f.id === selectedFolderId);

  // 获取当前文件夹的步骤（按 order 排序）
  const currentSteps = steps
    .filter(s => s.folderId === selectedFolderId)
    .sort((a, b) => a.order - b.order);

  // 添加步骤
  const handleAddStep = (type: 'openUrl' | 'clickElement' | 'wait' | 'getText' | 'getAttribute' | 'setAttribute' | 'httpRequest' | 'jsonExtract' | 'loop' | 'interceptRequest') => {
    if (!selectedFolderId) return;
    addStep(selectedFolderId, type);
  };

  // 树形分类数据
  const stepTreeData: DataNode[] = [
    {
      title: '🌐 导航',
      key: 'nav',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <GlobalOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">打开网址</span>
                <span className="tree-step-desc">访问指定 URL 页面</span>
              </div>
            </div>
          ),
          key: 'openUrl',
          isLeaf: true,
        },
      ],
    },
    {
      title: '👆 交互',
      key: 'interact',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <AimOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">点击元素</span>
                <span className="tree-step-desc">点击页面上的元素</span>
              </div>
            </div>
          ),
          key: 'clickElement',
          isLeaf: true,
        },
      ],
    },
    {
      title: '⏱️ 控制',
      key: 'control',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <ClockCircleOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">等待</span>
                <span className="tree-step-desc">等待指定秒数</span>
              </div>
            </div>
          ),
          key: 'wait',
          isLeaf: true,
        },
        {
          title: (
            <div className="tree-step-item">
              <SyncOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">循环</span>
                <span className="tree-step-desc">按次数、元素或变量数据循环</span>
              </div>
            </div>
          ),
          key: 'loop',
          isLeaf: true,
        },
      ],
    },
    {
      title: '✍️ 操作',
      key: 'operate',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <EditOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">设置属性</span>
                <span className="tree-step-desc">给元素属性赋值（支持变量）</span>
              </div>
            </div>
          ),
          key: 'setAttribute',
          isLeaf: true,
        },
      ],
    },
    {
      title: '📄 采集',
      key: 'collect',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <FileTextOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">获取文本</span>
                <span className="tree-step-desc">抓取元素 innerText / innerHTML</span>
              </div>
            </div>
          ),
          key: 'getText',
          isLeaf: true,
        },
        {
          title: (
            <div className="tree-step-item">
              <LinkOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">获取属性</span>
                <span className="tree-step-desc">提取 href、src、value 等属性值</span>
              </div>
            </div>
          ),
          key: 'getAttribute',
          isLeaf: true,
        },
      ],
    },
    {
      title: '🌐 网络',
      key: 'network',
      selectable: false,
      children: [
        {
          title: (
            <div className="tree-step-item">
              <ApiOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">HTTP 请求</span>
                <span className="tree-step-desc">请求 API 接口（GET/POST）</span>
              </div>
            </div>
          ),
          key: 'httpRequest',
          isLeaf: true,
        },
        {
          title: (
            <div className="tree-step-item">
              <BranchesOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">JSON 提取</span>
                <span className="tree-step-desc">用 JSONPath 从变量中提取数据</span>
              </div>
            </div>
          ),
          key: 'jsonExtract',
          isLeaf: true,
        },
        {
          title: (
            <div className="tree-step-item">
              <StopOutlined className="tree-step-icon" />
              <div className="tree-step-info">
                <span className="tree-step-name">拦截请求</span>
                <span className="tree-step-desc">拦截并修改请求/响应数据</span>
              </div>
            </div>
          ),
          key: 'interceptRequest',
          isLeaf: true,
        },
      ],
    },
  ];

  // 树节点选择回调
  const handleTreeSelect: TreeProps['onSelect'] = (selectedKeys) => {
    const key = selectedKeys[0] as string;
    const validTypes = ['openUrl', 'clickElement', 'wait', 'getText', 'getAttribute', 'setAttribute', 'httpRequest', 'jsonExtract', 'loop', 'interceptRequest'];
    if (validTypes.includes(key)) {
      handleAddStep(key as 'openUrl' | 'clickElement' | 'wait' | 'getText' | 'getAttribute' | 'setAttribute' | 'httpRequest' | 'jsonExtract' | 'loop' | 'interceptRequest');
      setStepModalVisible(false);
    }
  };

  // 提取变量列表（递归处理子步骤）
  const extractVariablesFromSteps = (steps: any[], parentIndex: string = '') => {
    const varList: Array<{
      name: string;
      stepIndex: string;
      stepType: string;
      description: string;
    }> = [];

    steps.forEach((step, index) => {
      const currentIndex = parentIndex ? `${parentIndex}.${index + 1}` : `${index + 1}`;
      
      if (step.type === 'getText') {
        const config = step.config as any;
        if (config.variableName) {
          varList.push({
            name: config.variableName,
            stepIndex: currentIndex,
            stepType: '获取文本',
            description: config.textType === 'innerHTML' ? 'HTML 内容' : '纯文本',
          });
        }
      } else if (step.type === 'getAttribute') {
        const config = step.config as any;
        if (config.variableName) {
          varList.push({
            name: config.variableName,
            stepIndex: currentIndex,
            stepType: '获取属性',
            description: `${config.attributeName} 属性`,
          });
        }
      } else if (step.type === 'httpRequest') {
        const config = step.config as any;
        if (config.variableName) {
          varList.push({
            name: config.variableName,
            stepIndex: currentIndex,
            stepType: 'HTTP 请求',
            description: `${config.method} ${config.url || '...'}`,
          });
        }
      } else if (step.type === 'jsonExtract') {
        const config = step.config as any;
        if (config.variableName) {
          varList.push({
            name: config.variableName,
            stepIndex: currentIndex,
            stepType: 'JSON 提取',
            description: config.jsonPath || '$.',
          });
        }
      } else if (step.type === 'interceptRequest') {
        const config = step.config as any;
        if (config.variableName) {
          varList.push({
            name: config.variableName,
            stepIndex: currentIndex,
            stepType: '拦截请求',
            description: `${config.method} ${config.urlPattern || '...'}`,
          });
        }
      } else if (step.type === 'loop') {
        // 递归提取循环子步骤中的变量
        const loopConfig = step.config as any;
        if (loopConfig.subSteps && loopConfig.subSteps.length > 0) {
          const subVars = extractVariablesFromSteps(loopConfig.subSteps, currentIndex);
          varList.push(...subVars);
        }
      }
    });

    return varList;
  };

  const variables = useMemo(() => {
    return extractVariablesFromSteps(currentSteps);
  }, [currentSteps]);

  // 复制变量引用
  const handleCopyVariable = async (varName: string) => {
    try {
      await navigator.clipboard.writeText(`\${${varName}}`);
      message.success({
        content: `✅ 已复制：\${${varName}}`,
        duration: 2,
        style: {
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      });
    } catch (error) {
      message.error({
        content: '❌ 复制失败',
        duration: 2,
      });
    }
  };

  // 实时生成 JSON
  const currentJson = useMemo(() => {
    if (!selectedFolder || currentSteps.length === 0) {
      return null;
    }
    return exportFolderToConfig(selectedFolder, folders, steps);
  }, [selectedFolder, folders, steps, currentSteps]);

  const jsonString = currentJson ? previewJsonString(currentJson) : '';

  // 复制 JSON 到剪贴板
  const handleCopyJson = async () => {
    if (!jsonString) {
      message.warning({
        content: '⚠️ 没有可复制的内容',
        duration: 2,
      });
      return;
    }
    
    try {
      await navigator.clipboard.writeText(jsonString);
      message.success({
        content: '✅ 已复制到剪贴板！',
        duration: 2,
        style: {
          animation: 'slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
        },
      });
    } catch (error) {
      message.error({
        content: '❌ 复制失败，请手动复制',
        duration: 3,
      });
    }
  };

  // 执行 JSON
  const handleExecuteJson = async () => {
    if (!jsonInputValue.trim()) {
      message.warning({
        content: '请输入 JSON 配置',
        duration: 3,
      });
      return;
    }

    try {
      // 解析 JSON
      const config = JSON.parse(jsonInputValue);
      
      message.loading({
        content: '正在调用 Python 后端执行...',
        key: 'execute',
        duration: 0,
      });

      // 调用 Python API
      const response = await fetch('http://localhost:8000/execute', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(config),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();

      message.destroy('execute');

      if (result.success) {
        message.success({
          content: `✅ 执行成功！创建了 ${Object.keys(result.variables || {}).length} 个变量`,
          duration: 5,
        });
        
        // 关闭弹窗
        setExecuteJsonVisible(false);
        
        // 打印变量
        console.log('执行结果:', result);
        console.log('变量列表:', result.variables);
      } else {
        message.error({
          content: `❌ 执行失败: ${result.message}`,
          duration: 5,
        });
      }
    } catch (error: any) {
      message.destroy('execute');
      
      if (error instanceof SyntaxError) {
        message.error({
          content: '❌ JSON 格式错误，请检查',
          duration: 5,
        });
      } else if (error.message.includes('Failed to fetch')) {
        message.error({
          content: '❌ 无法连接到 Python 后端，请确保服务器已启动 (python server.py)',
          duration: 5,
        });
      } else {
        message.error({
          content: `❌ 执行失败: ${error.message}`,
          duration: 5,
        });
      }
    }
  };

  // 导入 JSON
  const handleImportJson = () => {
    if (!importJsonValue.trim()) {
      message.warning({
        content: '请输入 JSON 配置',
        duration: 3,
      });
      return;
    }

    if (!selectedFolderId) {
      message.warning({
        content: '请先选择一个文件夹',
        duration: 3,
      });
      return;
    }

    try {
      // 解析 JSON
      const config = JSON.parse(importJsonValue);
      
      // 验证格式
      if (!config.task || !Array.isArray(config.task)) {
        throw new Error('无效的 JSON 格式：缺少 task 字段');
      }

      // 获取当前文件夹的步骤数量（用于计算 order）
      const currentSteps = steps.filter(s => s.folderId === selectedFolderId);
      let maxOrder = currentSteps.length > 0 ? Math.max(...currentSteps.map(s => s.order)) : -1;

      let importedCount = 0;

      // 遍历所有任务组
      config.task.forEach((taskGroup: any) => {
        if (taskGroup.action && Array.isArray(taskGroup.action)) {
          taskGroup.action.forEach((action: any) => {
            if (action.commands && Array.isArray(action.commands)) {
              action.commands.forEach((command: any) => {
                const stepType = convertCommandToStepType(command.action) as any;
                if (stepType) {
                  maxOrder++;
                  const stepConfig = convertCommandToStepConfig(command);
                  addStep(selectedFolderId, stepType);
                  
                  // 获取新添加的步骤并更新配置
                  const newSteps = useStore.getState().steps;
                  const newStep = newSteps.find(s => s.folderId === selectedFolderId && s.order === maxOrder);
                  if (newStep) {
                    updateStepConfig(newStep.id, stepConfig);
                  }
                  
                  importedCount++;
                }
              });
            }
          });
        }
      });

      if (importedCount > 0) {
        message.success({
          content: `✅ 成功导入 ${importedCount} 个步骤`,
          duration: 3,
        });
        
        // 关闭弹窗
        setImportJsonVisible(false);
        setImportJsonValue('');
      } else {
        message.warning({
          content: '⚠️ 未找到有效的步骤',
          duration: 3,
        });
      }
    } catch (error: any) {
      if (error instanceof SyntaxError) {
        message.error({
          content: '❌ JSON 格式错误，请检查',
          duration: 5,
        });
      } else {
        message.error({
          content: `❌ 导入失败: ${error.message}`,
          duration: 5,
        });
      }
    }
  };

  // 转换命令类型为步骤类型
  const convertCommandToStepType = (action: string): string | null => {
    const mapping: Record<string, string> = {
      'openBrower': 'openUrl',
      'clickBrowerElement': 'clickElement',
      'wait': 'wait',
      'getText': 'getText',
      'getAttribute': 'getAttribute',
      'setAttribute': 'setAttribute',
      'httpRequest': 'httpRequest',
      'jsonExtract': 'jsonExtract',
      'loop': 'loop',
      'interceptRequest': 'interceptRequest',
    };
    return mapping[action] || null;
  };

  // 转换命令为步骤配置
  const convertCommandToStepConfig = (command: any): any => {
    const { action, data } = command;
    
    switch (action) {
      case 'openBrower':
        return { url: data.webUrl || '' };
      
      case 'clickBrowerElement':
        return {
          selectorType: 'selector',
          selectorValue: data.querySelector || '',
          elementIndex: 0,
        };
      
      case 'wait':
        return { seconds: data.seconds || 3 };
      
      case 'getText':
        return {
          selectorType: 'selector',
          selectorValue: data.querySelector || '',
          elementIndex: 0,
          variableName: data.variableName || 'extractedText',
          textType: data.textType || 'innerText',
        };
      
      case 'getAttribute':
        return {
          selectorType: 'selector',
          selectorValue: data.querySelector || '',
          elementIndex: 0,
          variableName: data.variableName || 'extractedAttr',
          attributeName: data.attributeName || 'href',
        };
      
      case 'setAttribute':
        return {
          selectorType: 'selector',
          selectorValue: data.querySelector || '',
          elementIndex: 0,
          attributeName: data.attributeName || 'value',
          attributeValue: data.attributeValue || '',
        };
      
      case 'httpRequest':
        return {
          method: data.method || 'GET',
          url: data.url || '',
          headers: JSON.stringify(data.headers || {}, null, 2),
          body: JSON.stringify(data.body || {}, null, 2),
          variableName: data.variableName || 'apiResponse',
          timeout: data.timeout || 30,
        };
      
      case 'jsonExtract':
        return {
          sourceVariable: data.sourceVariable || '',
          jsonPath: data.jsonPath || '',
          variableName: data.variableName || 'extractedData',
          extractAll: data.extractAll || false,
        };
      
      case 'interceptRequest':
        return {
          urlPattern: data.urlPattern || '',
          method: data.method || 'ALL',
          modifyHeaders: JSON.stringify(data.modifyHeaders || {}, null, 2),
          modifyBody: JSON.stringify(data.modifyBody || {}, null, 2),
          modifyResponse: JSON.stringify(data.modifyResponse || {}, null, 2),
          variableName: data.variableName || 'interceptedData',
          continueRequest: data.continueRequest !== false,
        };
      
      default:
        return {};
    }
  };

  // 未选择文件夹时的提示
  if (!selectedFolderId) {
    return (
      <div className="flow-editor">
        <div className="flow-editor-empty">
          <div className="empty-content" style={{ animation: 'bounceIn 0.6s ease-out' }}>
            <FolderOpenOutlined className="empty-icon" />
            <h3 className="empty-title">请在左侧选择一个文件夹</h3>
            <p className="empty-text">选择或创建文件夹后，即可编辑流程</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flow-editor" style={{ animation: 'fadeIn 0.4s ease-out' }}>
      <div className="flow-editor-header">
        <div className="header-info">
          <div className="header-title">
            <EditOutlined className="title-icon" style={{ animation: 'scaleIn 0.3s ease-out' }} />
            <h3>{selectedFolder?.name}</h3>
          </div>
          <p className="subtitle">共 {currentSteps.length} 个步骤</p>
        </div>
        
        <div className="header-actions">
          <Button
            icon={<BookOutlined />}
            onClick={() => setTutorialVisible(true)}
            title="新手教程"
          >
            新手教程
          </Button>
          <Button
            icon={<PlayCircleOutlined />}
            onClick={() => setExecuteJsonVisible(true)}
            title="执行 JSON"
          >
            执行 JSON
          </Button>
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => setStepModalVisible(true)}
            size="large"
          >
            添加步骤
          </Button>
        </div>
      </div>

      {/* 添加步骤弹窗 */}
      <Modal
        title="选择步骤类型"
        open={stepModalVisible}
        onCancel={() => setStepModalVisible(false)}
        footer={null}
        width={480}
        centered
        className="step-type-modal"
      >
        <Tree
          treeData={stepTreeData}
          onSelect={handleTreeSelect}
          defaultExpandAll
          blockNode
          className="step-type-tree"
        />
      </Modal>

      <div className="flow-editor-content">
        {currentSteps.length === 0 ? (
          <div className="empty-steps">
            <div className="empty-content-wrapper">
              <div className="empty-icon-wrapper">
                <PlusOutlined className="empty-icon" />
              </div>
              <h3 className="empty-title">开始创建流程</h3>
              <p className="empty-text">点击下方按钮添加第一个步骤</p>
              <div className="quick-add-buttons">
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={() => handleAddStep('openUrl')}
                  size="large"
                  shape="round"
                >
                  打开网址
                </Button>
                <Button
                  icon={<PlusOutlined />}
                  onClick={() => handleAddStep('clickElement')}
                  size="large"
                  shape="round"
                >
                  点击元素
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="steps-list">
            {currentSteps.map((step, index) => (
              <StepCard
                key={step.id}
                step={step}
                index={index}
                total={currentSteps.length}
              />
            ))}
          </div>
        )}
      </div>

      {/* 左下角变量管理面板 */}
      {currentSteps.length > 0 && variables.length > 0 && (
        <div 
          ref={variablesPanelRef}
          className={`variables-panel ${variablesPanelVisible ? 'visible' : 'collapsed'}`}
        >
          <div 
            className="variables-panel-header"
            onClick={() => setVariablesPanelVisible(!variablesPanelVisible)}
          >
            <span>
              <CodeOutlined /> 变量管理 ({variables.length})
            </span>
            <Button
              type="text"
              icon={variablesPanelVisible ? <DownOutlined /> : <UpOutlined />}
              size="small"
              style={{ color: '#fff' }}
            />
          </div>
          {variablesPanelVisible && (
            <div 
              className="variables-panel-content"
              onClick={(e) => e.stopPropagation()}  // 阻止点击内容区时收起
            >
              {variables.map((variable, index) => (
                <div 
                  key={index} 
                  className="variable-item"
                  onClick={() => handleCopyVariable(variable.name)}
                  title="点击复制变量引用"
                >
                  <div className="variable-info">
                    <div className="variable-name">${variable.name}</div>
                    <div className="variable-source">
                      ← 步骤 {variable.stepIndex}：{variable.stepType}
                    </div>
                  </div>
                  <div className="variable-desc">{variable.description}</div>
                  <CopyOutlined className="variable-copy-icon" />
                </div>
              ))}
              <div className="variable-hint">
                💡 点击变量可复制引用，后续步骤使用 ${'{变量名}'} 格式
              </div>
            </div>
          )}
        </div>
      )}

      {/* 右下角 JSON 预览面板 */}
      {currentSteps.length > 0 && (
        <div 
          ref={jsonPanelRef}
          className={`json-preview-panel ${jsonPanelVisible ? 'visible' : 'collapsed'}`}
        >
          <div 
            className="json-panel-header"
            onClick={() => setJsonPanelVisible(!jsonPanelVisible)}
          >
            <span>JSON 配置</span>
            <div className="header-buttons">
              {jsonPanelVisible && (
                <>
                  <Button
                    type="primary"
                    icon={<CopyOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleCopyJson();
                    }}
                  >
                    复制
                  </Button>
                  <Button
                    icon={<ImportOutlined />}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setImportJsonVisible(true);
                    }}
                  >
                    导入
                  </Button>
                </>
              )}
              <Button
                type="text"
                icon={jsonPanelVisible ? <DownOutlined /> : <UpOutlined />}
                size="small"
                style={{ color: '#fff' }}
              />
            </div>
          </div>
          {jsonPanelVisible && (
            <div 
              className="json-panel-content"
              onClick={(e) => e.stopPropagation()}  // 阻止点击内容区时收起
            >
              <pre>{jsonString}</pre>
            </div>
          )}
        </div>
      )}

      {/* 新手教程弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <BookOutlined style={{ color: '#1890ff' }} />
            <span>新手教程</span>
          </div>
        }
        open={tutorialVisible}
        onCancel={() => setTutorialVisible(false)}
        footer={[
          <Button 
            key="close" 
            type="primary"
            onClick={() => setTutorialVisible(false)}
          >
            我知道了
          </Button>
        ]}
        width={700}
        centered
        className="tutorial-modal"
      >
        <div className="tutorial-content">
          <h4>📚 欢迎使用爬虫流程编辑器！</h4>
          <p>这是一个可视化的 JSON 配置工具，用于创建爬虫流程。配置完成后，可以导出 JSON 供 Python 后端执行，或直接在编辑器中执行。</p>

          <div className="tutorial-section">
            <h5>🎯 快速开始（4 步完成配置）</h5>
            <div className="tutorial-steps">
              <div className="tutorial-step">
                <div className="step-number">1</div>
                <div className="step-content">
                  <strong>选择文件夹</strong>
                  <p>在左侧树形结构中选择一个文件夹，用于存放你的流程步骤。</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">2</div>
                <div className="step-content">
                  <strong>添加步骤</strong>
                  <p>点击"添加步骤"按钮，从弹窗中选择步骤类型，配置参数。</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">3</div>
                <div className="step-content">
                  <strong>执行或导出</strong>
                  <p>点击"执行 JSON"按钮直接在浏览器中运行流程，或点击"复制 JSON"/"导出文件"按钮获取配置供 Python 使用。</p>
                </div>
              </div>
              
              <div className="tutorial-step">
                <div className="step-number">4</div>
                <div className="step-content">
                  <strong>导入配置（可选）</strong>
                  <p>点击"导入"按钮，可以将现有的 JSON 配置导入到当前文件夹中。</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tutorial-section">
            <h5>🚀 执行功能详解</h5>
            <ul className="tutorial-list">
              <li>
                <strong>执行 JSON：</strong>点击顶部"执行 JSON"按钮，输入 JSON 配置后执行。浏览器会自动打开并执行所有步骤，执行完成后保持打开状态。
              </li>
              <li>
                <strong>导入 JSON：</strong>点击右下角"导入"按钮，可以将 JSON 配置导入到当前选中的文件夹中。导入后会生成对应的步骤。
              </li>
              <li>
                <strong>复制 JSON：</strong>点击右下角"复制"按钮，将当前文件夹的配置复制到剪贴板。
              </li>
            </ul>
          </div>

          <div className="tutorial-section">
            <h5>🔥 实战示例：登录并采集数据</h5>
            <p>以下是一个完整的流程示例，演示从登录到数据拦截的全过程：</p>
            
            <div className="tutorial-example">
              <div className="example-step">
                <div className="example-icon"><GlobalOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 1：打开网址</div>
                  <div className="example-code">
                    URL 地址：<span className="code-highlight">https://example.com/login</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><EditOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 2：设置属性（输入账号）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">ID</span><br/>
                    选择器值：<span className="code-highlight">username</span><br/>
                    属性名：<span className="code-highlight">value</span><br/>
                    属性值：<span className="code-highlight">your_username</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><EditOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 3：设置属性（输入密码）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">ID</span><br/>
                    选择器值：<span className="code-highlight">password</span><br/>
                    属性名：<span className="code-highlight">value</span><br/>
                    属性值：<span className="code-highlight">your_password</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><AimOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 4：点击元素（登录按钮）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">ID</span><br/>
                    选择器值：<span className="code-highlight">login-btn</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><ClockCircleOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 5：等待</div>
                  <div className="example-code">
                    等待时间：<span className="code-highlight">3 秒</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><AimOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 6：点击元素（进入菜单）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">CSS 选择器</span><br/>
                    选择器值：<span className="code-highlight">.menu-item:nth-child(2)</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><AimOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 7：点击元素（切换 Tab）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">CSS 选择器</span><br/>
                    选择器值：<span className="code-highlight">.tab-item[data-tab="products"]</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><AimOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 8：点击元素（查询按钮）</div>
                  <div className="example-code">
                    选择器类型：<span className="code-highlight">ID</span><br/>
                    选择器值：<span className="code-highlight">search-btn</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><StopOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 9：拦截请求 ⭐ 重点</div>
                  <div className="example-code">
                    URL 匹配模式：<span className="code-highlight">*/api/products/list*</span><br/>
                    请求方法：<span className="code-highlight">POST</span><br/>
                    修改请求体：<br/>
                    <pre className="code-block">{`{
  "page": 1,
  "pageSize": 100,
  "keyword": ""
}`}</pre>
                    是否继续请求：<span className="code-highlight">继续 ✓</span><br/>
                    保存为变量：<span className="code-highlight">interceptedRequest</span>
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><ClockCircleOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 10：等待</div>
                  <div className="example-code">
                    等待时间：<span className="code-highlight">5 秒</span>（等待数据加载完成）
                  </div>
                </div>
              </div>

              <div className="example-step">
                <div className="example-icon"><SyncOutlined /></div>
                <div className="example-content">
                  <div className="example-title">步骤 11：循环（提取数据）</div>
                  <div className="example-code">
                    循环方式：<span className="code-highlight">按元素循环</span><br/>
                    选择器类型：<span className="code-highlight">Class</span><br/>
                    选择器值：<span className="code-highlight">product-item</span><br/>
                    当前项变量：<span className="code-highlight">product</span><br/><br/>
                    <strong>子步骤：</strong><br/>
                    ├─ 获取文本（商品名称）→ <span className="code-highlight">productName</span><br/>
                    ├─ 获取文本（价格）→ <span className="code-highlight">productPrice</span><br/>
                    └─ 获取属性（链接 href）→ <span className="code-highlight">productLink</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="tutorial-tip">
              💡 <strong>提示：</strong>这个示例展示了完整的操作流程。关键点：
              <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                <li>步骤 8 先点击查询按钮，触发数据请求</li>
                <li>步骤 9 使用"拦截请求"拦截查询请求，修改分页参数，强制返回 100 条数据</li>
                <li>步骤 11 使用循环批量提取页面数据</li>
                <li>所有变量都可在后续步骤中用 <code>{'${变量名}'}</code> 引用</li>
              </ul>
            </div>
          </div>

          <div className="tutorial-section">
            <h5>📋 支持的步骤类型</h5>
            <div className="step-types-grid">
              <div className="type-item">
                <GlobalOutlined className="type-icon" />
                <div>
                  <strong>打开网址</strong>
                  <p>访问指定网页</p>
                </div>
              </div>
              <div className="type-item">
                <AimOutlined className="type-icon" />
                <div>
                  <strong>点击元素</strong>
                  <p>点击页面元素</p>
                </div>
              </div>
              <div className="type-item">
                <ClockCircleOutlined className="type-icon" />
                <div>
                  <strong>等待</strong>
                  <p>等待指定秒数</p>
                </div>
              </div>
              <div className="type-item">
                <FileTextOutlined className="type-icon" />
                <div>
                  <strong>获取文本</strong>
                  <p>提取元素文本</p>
                </div>
              </div>
              <div className="type-item">
                <LinkOutlined className="type-icon" />
                <div>
                  <strong>获取属性</strong>
                  <p>提取 href、src 等属性</p>
                </div>
              </div>
              <div className="type-item">
                <EditOutlined className="type-icon" />
                <div>
                  <strong>设置属性</strong>
                  <p>给元素属性赋值</p>
                </div>
              </div>
              <div className="type-item">
                <ApiOutlined className="type-icon" />
                <div>
                  <strong>HTTP 请求</strong>
                  <p>调用 API 接口</p>
                </div>
              </div>
              <div className="type-item">
                <BranchesOutlined className="type-icon" />
                <div>
                  <strong>JSON 提取</strong>
                  <p>解析 JSON 数据</p>
                </div>
              </div>
              <div className="type-item">
                <SyncOutlined className="type-icon" />
                <div>
                  <strong>循环</strong>
                  <p>批量处理数据</p>
                </div>
              </div>
            </div>
          </div>

          <div className="tutorial-section">
            <h5>💡 变量使用技巧</h5>
            <ul className="tutorial-list">
              <li>
                <strong>创建变量：</strong>在“获取文本”、“获取属性”、“HTTP 请求”等步骤中，填写“保存为变量”字段
              </li>
              <li>
                <strong>使用变量：</strong>在后续步骤中使用 <code>{'${变量名}'}</code> 格式引用，如 <code>{'${productName}'}</code>
              </li>
              <li>
                <strong>查看变量：</strong>左下角“变量管理”面板显示所有可用变量，点击可复制引用
              </li>
            </ul>
          </div>

          <div className="tutorial-section">
            <h5>🔄 循环功能</h5>
            <ul className="tutorial-list">
              <li>
                <strong>三种循环方式：</strong>
                <ul>
                  <li>按次数循环：执行固定次数</li>
                  <li>按元素循环：遍历页面元素（如 .product-item）</li>
                  <li>按变量循环：遍历数组数据（如之前提取的结果）</li>
                </ul>
              </li>
              <li>
                <strong>子步骤：</strong>循环内可以添加其他步骤（除循环外），子步骤会在每次循环时执行
              </li>
              <li>
                <strong>当前项变量：</strong>设置“当前项变量”（如 item），子步骤中使用 <code>{'${item}'}</code> 引用当前项
              </li>
            </ul>
          </div>

          <div className="tutorial-section">
            <h5>💡 Python 后端执行</h5>
            <ul className="tutorial-list">
              <li>
                <strong>启动后端：</strong>在 <code>python-backend</code> 目录下执行 <code>python server.py</code>
              </li>
              <li>
                <strong>访问 API 文档：</strong><a href="http://localhost:8000/docs" target="_blank" rel="noopener noreferrer">http://localhost:8000/docs</a>
              </li>
              <li>
                <strong>自动等待：</strong>每个步骤执行前会自动等待 1 秒，让浏览器操作更平滑
              </li>
              <li>
                <strong>浏览器保持打开：</strong>执行完成后浏览器不会自动关闭，方便查看结果
              </li>
            </ul>
          </div>

          <div className="tutorial-section">
            <h5>⚙️ 高级技巧</h5>
            <ul className="tutorial-list">
              <li>
                <strong>JSON 预览：</strong>右下角实时查看导出的配置格式，方便调试
              </li>
              <li>
                <strong>JSON 回填：</strong>点击"导入"按钮，可以将 JSON 配置导入回编辑器进行修改
              </li>
              <li>
                <strong>执行测试：</strong>点击"执行 JSON"可以直接在浏览器中测试流程，无需启动 Python 后端
              </li>
              <li>
                <strong>步骤排序：</strong>使用上移/下移按钮调整执行顺序
              </li>
              <li>
                <strong>嵌套循环：</strong>不支持循环内嵌套循环，保持配置简洁
              </li>
              <li>
                <strong>选择器类型：</strong>支持 ID、Class、CSS 选择器三种方式定位元素
              </li>
              <li>
                <strong>执行注意事项：</strong>执行时请确保 Python 后端已启动（http://localhost:8000）
              </li>
            </ul>
          </div>

          <div className="tutorial-tip">
            💡 <strong>提示：</strong>配置完成后，点击“复制 JSON”按钮，将配置粘贴给 Python 后端使用！
          </div>
        </div>
      </Modal>

      {/* 执行 JSON 弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlayCircleOutlined style={{ color: '#52c41a' }} />
            <span>执行 JSON 配置</span>
          </div>
        }
        open={executeJsonVisible}
        onCancel={() => {
          setExecuteJsonVisible(false);
          setJsonInputValue('');
        }}
        footer={[
          <Button 
            key="cancel"
            onClick={() => {
              setExecuteJsonVisible(false);
              setJsonInputValue('');
            }}
          >
            取消
          </Button>,
          <Button 
            key="execute" 
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleExecuteJson}
          >
            执行
          </Button>
        ]}
        width={800}
        centered
        className="execute-json-modal"
      >
        <div className="execute-json-content">
          <div className="execute-json-tip">
            💡 <strong>提示：</strong>输入 JSON 配置，点击执行按钮调用 Python 后端执行流程。
            <br />
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              确保 Python 服务器已启动：<code>python server.py</code>
            </span>
          </div>
          
          <Input.TextArea
            value={jsonInputValue}
            onChange={(e) => setJsonInputValue(e.target.value)}
            placeholder={`{
  "name": "流程名称",
  "version": "1.0",
  "description": "流程描述",
  "task": [
    {
      "name": "任务组名称",
      "action": [
        {
          "id": 1,
          "name": "流程任务_1",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://example.com",
                "clearCache": true,
                "finishwait": 2
              }
            }
          ]
        }
      ]
    }
  ]
}`}
            rows={20}
            style={{ 
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '13px',
              marginTop: '16px'
            }}
          />
        </div>
      </Modal>

      {/* 导入 JSON 弹窗 */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <ImportOutlined style={{ color: '#1890ff' }} />
            <span>导入 JSON 配置</span>
          </div>
        }
        open={importJsonVisible}
        onCancel={() => {
          setImportJsonVisible(false);
          setImportJsonValue('');
        }}
        footer={[
          <Button 
            key="cancel"
            onClick={() => {
              setImportJsonVisible(false);
              setImportJsonValue('');
            }}
          >
            取消
          </Button>,
          <Button 
            key="import" 
            type="primary"
            icon={<ImportOutlined />}
            onClick={handleImportJson}
          >
            导入到当前文件夹
          </Button>
        ]}
        width={800}
        centered
        className="import-json-modal"
      >
        <div className="import-json-content">
          <div className="import-json-tip">
            💡 <strong>提示：</strong>输入 JSON 配置，点击导入按钮将步骤添加到当前文件夹。
            <br />
            <span style={{ fontSize: '12px', color: '#8c8c8c' }}>
              支持导入从本工具导出的 JSON 配置
            </span>
          </div>
          
          <Input.TextArea
            value={importJsonValue}
            onChange={(e) => setImportJsonValue(e.target.value)}
            placeholder={`{
  "name": "流程名称",
  "version": "1.0",
  "description": "流程描述",
  "task": [
    {
      "name": "任务组名称",
      "action": [
        {
          "id": 1,
          "name": "流程任务_1",
          "type": "once",
          "commands": [
            {
              "action": "openBrower",
              "data": {
                "webUrl": "https://example.com",
                "clearCache": true,
                "finishwait": 2
              }
            }
          ]
        }
      ]
    }
  ]
}`}
            rows={20}
            style={{ 
              fontFamily: 'Monaco, Consolas, monospace',
              fontSize: '13px',
              marginTop: '16px'
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default FlowEditor;
