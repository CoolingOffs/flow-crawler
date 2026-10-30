import { Folder, Step } from '../types';

const FOLDERS_KEY = 'crawler_folders';
const STEPS_KEY = 'crawler_steps';

// 从 LocalStorage 获取文件夹数据
export const getFolders = (): Folder[] => {
  try {
    const data = localStorage.getItem(FOLDERS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取文件夹数据失败:', error);
    return [];
  }
};

// 保存文件夹数据到 LocalStorage
export const saveFolders = (folders: Folder[]): void => {
  try {
    localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
  } catch (error) {
    console.error('保存文件夹数据失败:', error);
  }
};

// 从 LocalStorage 获取步骤数据
export const getSteps = (): Step[] => {
  try {
    const data = localStorage.getItem(STEPS_KEY);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('获取步骤数据失败:', error);
    return [];
  }
};

// 保存步骤数据到 LocalStorage
export const saveSteps = (steps: Step[]): void => {
  try {
    localStorage.setItem(STEPS_KEY, JSON.stringify(steps));
  } catch (error) {
    console.error('保存步骤数据失败:', error);
  }
};

// 生成唯一 ID
export const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};
