import React from 'react';
import { Folder } from '../../../types';
import { useStore } from '../../../store/useStore';
import { 
  FolderOutlined, 
  FolderOpenOutlined, 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined,
  RightOutlined,
  DownOutlined
} from '@ant-design/icons';
import { Button, Modal } from 'antd';
import './FolderNode.css';

interface FolderNodeProps {
  folder: Folder;
  level: number;
  onAddChild: (parentId: string) => void;
  onEdit: (e: React.MouseEvent, folder: Folder) => void;
  onDelete: (e: React.MouseEvent, folder: Folder) => void;
}

const FolderNode: React.FC<FolderNodeProps> = ({ 
  folder, 
  level, 
  onAddChild, 
  onEdit, 
  onDelete 
}) => {
  const { 
    folders, 
    selectedFolderId, 
    expandedFolderIds,
    selectFolder, 
    toggleFolderExpand 
  } = useStore();

  // 获取子文件夹
  const getChildren = (folderId: string) => {
    return folders.filter(f => f.parentId === folderId);
  };

  const children = getChildren(folder.id);
  const isExpanded = expandedFolderIds.has(folder.id);
  const isSelected = selectedFolderId === folder.id;
  const hasChildren = children.length > 0;

  return (
    <div 
      className="folder-node"
      style={{ animation: `fadeIn 0.3s ease-out ${level * 0.05}s both` }}
    >
      <div
        className={`folder-item ${isSelected ? 'selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 10}px` }}
        onClick={() => selectFolder(folder.id)}
      >
        {/* 展开/折叠按钮 */}
        {hasChildren ? (
          <span 
            className="expand-btn" 
            onClick={(e) => {
              e.stopPropagation();
              toggleFolderExpand(folder.id);
            }}
          >
            {isExpanded ? <DownOutlined /> : <RightOutlined />}
          </span>
        ) : (
          <span className="expand-btn-placeholder"></span>
        )}

        {/* 文件夹图标 */}
        {isExpanded && hasChildren ? (
          <FolderOpenOutlined className="folder-icon" />
        ) : (
          <FolderOutlined className="folder-icon" />
        )}

        {/* 文件夹名称 */}
        <span className="folder-name">{folder.name}</span>

        {/* 操作按钮 */}
        <div className="folder-actions">
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(folder.id);
            }}
            title="添加子文件夹"
            shape="circle"
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => onEdit(e, folder)}
            title="编辑"
            shape="circle"
          />
          <Button
            type="text"
            size="small"
            icon={<DeleteOutlined />}
            onClick={(e) => onDelete(e, folder)}
            title="删除"
            danger
            shape="circle"
          />
        </div>
      </div>

      {/* 渲染子文件夹 */}
      {isExpanded && children.length > 0 && (
        <div className="folder-children">
          {children.map(child => (
            <FolderNode
              key={child.id}
              folder={child}
              level={level + 1}
              onAddChild={onAddChild}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FolderNode;
