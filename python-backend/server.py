"""
API 服务器启动脚本
"""
from app.api.server import start_server

if __name__ == "__main__":
    start_server(host="0.0.0.0", port=8000)
