"""
日志配置
"""
import logging
import sys
from pathlib import Path

def setup_logger(name: str = "FlowExecutor", log_file: str = None) -> logging.Logger:
    """
    配置并返回 logger
    
    Args:
        name: logger 名称
        log_file: 日志文件路径（可选）
    
    Returns:
        logging.Logger: 配置好的 logger
    """
    logger = logging.getLogger(name)
    logger.setLevel(logging.DEBUG)
    
    # 避免重复添加 handler
    if logger.handlers:
        return logger
    
    # 控制台输出
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)
    
    # 格式化器
    formatter = logging.Formatter(
        '%(asctime)s | %(levelname)-8s | %(message)s',
        datefmt='%H:%M:%S'
    )
    console_handler.setFormatter(formatter)
    logger.addHandler(console_handler)
    
    # 文件输出（可选）
    if log_file:
        file_handler = logging.FileHandler(log_file, encoding='utf-8')
        file_handler.setLevel(logging.DEBUG)
        file_handler.setFormatter(formatter)
        logger.addHandler(file_handler)
    
    return logger
