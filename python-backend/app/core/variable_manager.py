"""
变量管理器 - 负责变量的存储、替换和引用
"""
import re
from typing import Any, Dict, Optional
from app.core.logger import setup_logger

logger = setup_logger()

class VariableManager:
    """变量管理器"""
    
    def __init__(self):
        """初始化变量存储"""
        self.variables: Dict[str, Any] = {}
        # 变量替换正则：匹配 ${变量名}
        self.var_pattern = re.compile(r'\$\{([^}]+)\}')
    
    def set(self, name: str, value: Any) -> None:
        """
        设置变量
        
        Args:
            name: 变量名
            value: 变量值
        """
        self.variables[name] = value
        logger.debug(f"设置变量: {name} = {value}")
    
    def get(self, name: str, default: Any = None) -> Any:
        """
        获取变量值
        
        Args:
            name: 变量名
            default: 默认值（变量不存在时返回）
        
        Returns:
            变量值
        """
        return self.variables.get(name, default)
    
    def exists(self, name: str) -> bool:
        """
        检查变量是否存在
        
        Args:
            name: 变量名
        
        Returns:
            bool: 是否存在
        """
        return name in self.variables
    
    def replace(self, text: str) -> str:
        """
        替换文本中的变量引用
        
        将 ${变量名} 替换为实际值
        
        Args:
            text: 原始文本
        
        Returns:
            str: 替换后的文本
        """
        if not isinstance(text, str):
            return text
        
        def replacer(match):
            var_name = match.group(1)
            if self.exists(var_name):
                value = self.get(var_name)
                return str(value)
            else:
                logger.warning(f"变量不存在: {var_name}")
                return match.group(0)  # 保持原样
        
        return self.var_pattern.sub(replacer, text)
    
    def replace_in_dict(self, data: Dict[str, Any]) -> Dict[str, Any]:
        """
        递归替换字典中的变量引用
        
        Args:
            data: 原始字典
        
        Returns:
            Dict[str, Any]: 替换后的字典
        """
        result = {}
        for key, value in data.items():
            if isinstance(value, str):
                result[key] = self.replace(value)
            elif isinstance(value, dict):
                result[key] = self.replace_in_dict(value)
            elif isinstance(value, list):
                result[key] = [
                    self.replace_in_dict(item) if isinstance(item, dict)
                    else self.replace(item) if isinstance(item, str)
                    else item
                    for item in value
                ]
            else:
                result[key] = value
        return result
    
    def clear(self) -> None:
        """清空所有变量"""
        self.variables.clear()
        logger.debug("已清空所有变量")
    
    def list_all(self) -> Dict[str, Any]:
        """
        列出所有变量
        
        Returns:
            Dict[str, Any]: 所有变量的副本
        """
        return self.variables.copy()
    
    def __str__(self) -> str:
        """字符串表示"""
        return f"VariableManager({len(self.variables)} variables)"
