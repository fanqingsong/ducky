# Ducky Frontend

Ducky 工作流管理系统的前端应用，基于 React + Ant Design 构建。

## 开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

应用将在 http://localhost:3000 启动。

### 构建生产版本

```bash
npm run build
```

## Docker

### 构建镜像

```bash
docker build -t ducky-frontend .
```

### 运行容器

```bash
docker run -p 3000:80 ducky-frontend
```

## 功能

- 流程定义管理：创建、编辑、删除 BPMN 流程定义
- 流程实例管理：查看所有流程实例及其状态
- 工作流演示：创建流程实例并执行完整的工作流

## 技术栈

- React 18
- Ant Design 5
- Vite
- React Router 6
- Axios
- Monaco Editor

