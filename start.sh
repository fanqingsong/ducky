#!/bin/bash

# 一键启动脚本

echo "=========================================="
echo "  启动 Ducky 项目"
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

# 创建数据目录（如果不存在）
mkdir -p data

# 停止并删除旧容器（如果存在）
echo "清理旧容器..."
docker compose down 2>/dev/null

# 构建并启动服务
echo "构建 Docker 镜像..."
docker compose build

echo "启动服务..."
docker compose up -d

# 等待服务启动
echo "等待服务启动..."
sleep 3

# 检查服务状态
if docker compose ps | grep -q "Up"; then
    echo ""
    echo "=========================================="
    echo "  服务启动成功！"
    echo "=========================================="
    echo "前端访问地址: http://localhost:3002"
    echo "后端 API 地址: http://localhost:2222"
    echo "API 文档地址: http://localhost:2222/docs"
    echo ""
    echo "查看日志: docker compose logs -f"
    echo "停止服务: ./stop.sh"
    echo "=========================================="
else
    echo ""
    echo "=========================================="
    echo "  服务启动失败，请检查日志"
    echo "=========================================="
    echo "查看日志: docker compose logs"
    exit 1
fi

