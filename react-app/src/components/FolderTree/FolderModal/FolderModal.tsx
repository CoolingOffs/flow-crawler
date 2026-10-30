import React from 'react';
import { Folder } from '../../../types';
import { Input, Modal } from 'antd';

interface FolderModalProps {
  visible: boolean;
  type: 'add' | 'edit';
  inputValue: string;
  onInputChange: (value: string) => void;
  onConfirm: () => void;
  onCancel: () => void;
}

const FolderModal: React.FC<FolderModalProps> = ({
  visible,
  type,
  inputValue,
  onInputChange,
  onConfirm,
  onCancel,
}) => {
  return (
    <Modal
      title={
        <div style={{ animation: 'slideDown 0.3s ease-out' }}>
          {type === 'add' ? '✨ 新建文件夹' : '✏️ 编辑文件夹'}
        </div>
      }
      open={visible}
      onOk={onConfirm}
      onCancel={onCancel}
      okText="确认"
      cancelText="取消"
      centered
      width={450}
      styles={{
        body: { padding: '24px', animation: 'fadeIn 0.3s ease-out' }
      }}
    >
      <Input
        placeholder="请输入文件夹名称"
        value={inputValue}
        onChange={(e) => onInputChange(e.target.value)}
        onPressEnter={onConfirm}
        autoFocus
        size="large"
        style={{ 
          borderRadius: '8px',
          animation: 'fadeIn 0.4s ease-out'
        }}
      />
    </Modal>
  );
};

export default FolderModal;
