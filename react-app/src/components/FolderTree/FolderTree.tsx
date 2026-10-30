import React, { useState } from 'react';
import { Folder } from '../../types';
import { useStore } from '../../store/useStore';
import { 
  FolderOutlined, 
  PlusOutlined,
  FileOutlined
} from '@ant-design/icons';
import { Modal, Button } from 'antd';
import FolderNode from './FolderNode/FolderNode';
import FolderModal from './FolderModal/FolderModal';
import './FolderTree.css';

const FolderTree: React.FC = () => {
  const { 
    folders, 
    selectedFolderId, 
    expandedFolderIds,
    addFolder, 
    updateFolder, 
    deleteFolder, 
    selectFolder, 
    toggleFolderExpand 
  } = useStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<'add' | 'edit'>('add');
  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);

  // 获取根文件夹（parentId 为 null）
  const rootFolders = folders.filter(f => f.parentId === null);

  // 获取子文件夹
  const getChildren = (folderId: string) => {
    return folders.filter(f => f.parentId === folderId);
  };

  // 打开新建文件夹弹窗
  const handleAddFolder = (parentFolderId: string | null = null) => {
    setModalType('add');
    setParentId(parentFolderId);
    setInputValue('');
    setModalVisible(true);
  };

  // 打开编辑文件夹弹窗
  const handleEditFolder = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    setModalType('edit');
    setEditingFolder(folder);
    setInputValue(folder.name);
    setModalVisible(true);
  };

  // 确认添加/编辑
  const handleConfirm = () => {
    if (!inputValue.trim()) return;

    if (modalType === 'add') {
      addFolder(inputValue.trim(), parentId);
    } else if (editingFolder) {
      updateFolder(editingFolder.id, inputValue.trim());
    }

    setModalVisible(false);
    setInputValue('');
    setEditingFolder(null);
  };

  // 确认删除
  const handleDelete = (e: React.MouseEvent, folder: Folder) => {
    e.stopPropagation();
    Modal.confirm({
      title: '确认删除',
      content: (
        <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
          确定要删除文件夹 <strong>"{folder.name}"</strong> 吗？
          <br />
          其下的所有流程也将被删除。
        </div>
      ),
      onOk: () => deleteFolder(folder.id),
      okText: '删除',
      cancelText: '取消',
      okButtonProps: { danger: true },
      centered: true,
    });
  };

  return (
    <div className="folder-tree">
      <div className="folder-tree-header">
        <div className="header-title">
          <FolderOutlined className="header-icon" />
          <span>流程管理</span>
        </div>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => handleAddFolder(null)}
          size="small"
          shape="round"
        >
          新建
        </Button>
      </div>

      <div className="folder-tree-content" style={{ animation: 'fadeIn 0.5s ease-out' }}>
        {rootFolders.length === 0 ? (
          <div className="empty-state">
            <FileOutlined className="empty-icon" style={{ animation: 'bounceIn 0.6s ease-out' }} />
            <p className="empty-text">暂无文件夹</p>
            <p className="empty-hint">点击“新建”按钮开始创建</p>
          </div>
        ) : (
          rootFolders.map(folder => (
            <FolderNode
              key={folder.id}
              folder={folder}
              level={0}
              onAddChild={handleAddFolder}
              onEdit={handleEditFolder}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      {/* 新建/编辑弹窗 */}
      <FolderModal
        visible={modalVisible}
        type={modalType}
        inputValue={inputValue}
        onInputChange={setInputValue}
        onConfirm={handleConfirm}
        onCancel={() => setModalVisible(false)}
      />
    </div>
  );
};

export default FolderTree;
