#!/bin/bash

# 一键停止脚本

echo "=========================================="
echo "  停止 Ducky 项目"
echo "=========================================="

# 检查 docker compose 是否安装
if ! command -v docker &> /dev/null; then
    echo "错误: 未找到 docker，请先安装 Docker"
    exit 1
fi

if ! docker compose version &> /dev/null; then
    echo "错误: 未找到 docker compose，请先安装 Docker Compose"
    exit 1
fi

# 停止并删除容器
echo "停止服务..."
docker compose down

echo ""
echo "=========================================="
echo "  服务已停止"
echo "=========================================="
echo "启动服务: ./start.sh"
echo "=========================================="

