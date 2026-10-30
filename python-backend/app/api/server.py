"""
FastAPI 服务器 - 提供 Web API 接口（同步模式，避免 asyncio 冲突）
"""
import json
from pathlib import Path
from typing import Dict, Any, List
from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from app.core.executor import FlowExecutor
from app.core.logger import setup_logger

logger = setup_logger()

app = FastAPI(
    title="爬虫流程执行引擎 API",
    description="用于执行前端导出的 JSON 配置",
    version="1.0.0"
)

# 配置 CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class FlowConfig(BaseModel):
    """流程配置模型"""
    name: str
    version: str
    description: str
    task: List[Dict[str, Any]]


class ExecutionResult(BaseModel):
    """执行结果模型"""
    success: bool
    message: str
    variables: Dict[str, Any] = {}


@app.get("/")
def root():
    """根路径"""
    return {
        "message": "爬虫流程执行引擎 API",
        "version": "1.0.0",
        "status": "running"
    }


@app.post("/execute", response_model=ExecutionResult)
def execute_flow(config: FlowConfig):
    """
    执行流程（通过 JSON 数据）
    
    Args:
        config: 流程配置 JSON
    
    Returns:
        执行结果
    """
    logger.info(f"接收到执行请求: {config.name}")
    
    try:
        # 转换为字典
        config_dict = config.dict()
        
        # 直接在主线程中执行（不使用线程池）
        executor = FlowExecutor(config_dict)
        executor.run()
        variables = executor.var_manager.list_all()
        
        # 不关闭浏览器
        executor.cleanup(close_browser=False)
        
        return ExecutionResult(
            success=True,
            message="流程执行成功",
            variables=variables
        )
        
    except Exception as e:
        logger.error(f"执行失败: {e}", exc_info=True)
        return ExecutionResult(
            success=False,
            message=f"执行失败: {str(e)}",
            variables={}
        )


@app.post("/execute/file", response_model=ExecutionResult)
def execute_flow_from_file(file: UploadFile = File(...)):
    """
    执行流程（通过上传 JSON 文件）
    
    Args:
        file: JSON 配置文件
    
    Returns:
        执行结果
    """
    logger.info(f"接收到文件上传: {file.filename}")
    
    try:
        # 读取文件内容
        content = file.read()
        config = json.loads(content.decode('utf-8'))
        
        # 直接在主线程中执行
        executor = FlowExecutor(config)
        executor.run()
        variables = executor.var_manager.list_all()
        
        # 不关闭浏览器
        executor.cleanup(close_browser=False)
        
        return ExecutionResult(
            success=True,
            message="流程执行成功",
            variables=variables
        )
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON 解析失败: {e}")
        raise HTTPException(status_code=400, detail=f"无效的 JSON 文件: {str(e)}")
        
    except Exception as e:
        logger.error(f"执行失败: {e}", exc_info=True)
        return ExecutionResult(
            success=False,
            message=f"执行失败: {str(e)}",
            variables={}
        )


@app.get("/health")
def health_check():
    """健康检查"""
    return {
        "status": "healthy",
        "service": "flow-executor"
    }


def start_server(host: str = "0.0.0.0", port: int = 8000):
    """
    启动 API 服务器
    
    Args:
        host: 主机地址
        port: 端口号
    """
    import uvicorn
    logger.info(f"启动 API 服务器: http://{host}:{port}")
    uvicorn.run(app, host=host, port=port, log_level="info")


if __name__ == "__main__":
    start_server()
