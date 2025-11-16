# Ducky - BPMN 工作流管理系统

一个基于 FastAPI 和 SpiffWorkflow 的 BPMN 2.0 工作流管理系统，提供完整的流程定义管理、实例执行和可视化功能。

## 功能特性

### 核心功能
- ✅ **流程定义管理**：创建、编辑、删除 BPMN 流程定义
- ✅ **流程实例管理**：查看和管理流程执行实例
- ✅ **工作流执行**：支持用户任务、脚本任务、条件分支等
- ✅ **任务拓扑图**：可视化展示任务执行状态（已完成/当前/待执行）
- ✅ **执行流程图**：展示完整的工作流执行过程

### 技术特性
- 🚀 **FastAPI**：高性能异步 Web 框架
- 🔄 **SpiffWorkflow**：BPMN 2.0 工作流引擎
- ⚛️ **React + Ant Design**：现代化前端界面
- 🐳 **Docker**：容器化部署
- 📊 **SQLite**：轻量级数据库

## 项目结构

```
ducky/
├── app.py                      # FastAPI 应用入口
├── bpmn/                      # BPMN 工作流相关
│   ├── bpmn_runner.py         # 工作流执行器
│   └── __init__.py
├── db/                        # 数据库相关
│   ├── models/                # 数据模型
│   ├── repos/                 # 数据访问层
│   └── __init__.py
├── routers/                   # API 路由
│   ├── bpmn_process_router.py
│   └── bpmn_process_instance_router.py
├── schemas/                   # Pydantic 模式
│   └── __init__.py
├── scripts/                   # 脚本
│   └── init_sample_processes.py  # 初始化示例流程
├── frontend/                  # React 前端
│   ├── src/
│   │   ├── pages/             # 页面组件
│   │   ├── components/        # 通用组件
│   │   ├── services/          # API 服务
│   │   └── routes/            # 路由配置
│   ├── Dockerfile
│   └── nginx.conf
├── docker-compose.yml         # Docker Compose 配置
├── Dockerfile                 # 后端 Dockerfile
├── start.sh                   # 启动脚本
└── stop.sh                    # 停止脚本
```

## 快速开始

### 前置要求

- Docker 和 Docker Compose
- 或 Python 3.9+ 和 Node.js 18+

### 使用 Docker（推荐）

1. **克隆项目**
   ```bash
   git clone git@github.com:fanqingsong/ducky.git
   cd ducky
   ```

2. **启动服务**
   ```bash
   chmod +x start.sh
   ./start.sh
   ```

3. **访问应用**
   - 前端：http://localhost:3002
   - 后端 API：http://localhost:2222
   - API 文档：http://localhost:2222/docs

4. **停止服务**
   ```bash
   ./stop.sh
   ```

### 本地开发

#### 后端

1. **安装依赖**
   ```bash
   pip install -r requirements.txt
   ```

2. **初始化数据库**
   ```bash
   python create_tables.py
   ```

3. **初始化示例流程（可选）**
   ```bash
   python scripts/init_sample_processes.py
   ```

4. **启动服务**
   ```bash
   uvicorn app:app --host 0.0.0.0 --port 2222 --reload
   ```

#### 前端

1. **进入前端目录**
   ```bash
   cd frontend
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

4. **构建生产版本**
   ```bash
   npm run build
   ```

## 使用指南

### 1. 流程定义管理

在"流程定义管理"页面，你可以：
- **创建流程**：点击"新建"按钮，填写流程名称和 BPMN XML 定义
- **编辑流程**：点击"编辑"按钮修改流程定义
- **查看流程**：点击"查看"按钮查看完整的 BPMN XML
- **删除流程**：点击"删除"按钮删除流程定义

### 2. 工作流演示

在"工作流演示"页面，你可以：
1. **选择流程**：从下拉列表中选择一个流程定义
2. **创建实例**：点击"创建流程实例"按钮
3. **填写表单**：根据当前任务填写表单数据
4. **执行步骤**：点击"执行下一步"继续工作流
5. **查看结果**：工作流完成后查看执行结果

### 3. 流程实例管理

在"流程实例管理"页面，你可以：
- **查看实例列表**：查看所有流程实例及其状态
- **查看详情**：点击"查看详情"查看实例信息
- **查看拓扑图**：在详情页切换到"任务拓扑图"标签，查看任务执行拓扑

### 4. 执行流程图

在"执行流程图"页面，你可以查看：
- **系统整体流程**：从选择流程到完成的整体流程
- **创建实例流程**：创建流程实例的详细步骤
- **执行步骤流程**：执行工作流步骤的详细流程
- **状态转换图**：工作流状态之间的转换
- **错误处理流程**：错误处理和恢复机制

## BPMN 流程定义

### 支持的元素

- **开始事件** (Start Event)
- **结束事件** (End Event)
- **用户任务** (User Task)：需要用户输入
- **脚本任务** (Script Task)：自动执行 Python 脚本
- **排他网关** (Exclusive Gateway)：条件分支
- **顺序流** (Sequence Flow)：连接元素

### 用户任务表单字段

支持的表单字段类型：
- `string`：文本输入
- `boolean`：布尔值（是/否）
- `enum`：枚举选择
- `long`：整数
- `double`：浮点数

### 示例流程

项目预置了 5 个示例流程，用于学习和测试：
1. **01-简单流程**：最简单的流程，无任务
2. **02-用户任务流程**：包含用户任务的流程
3. **03-条件分支流程**：包含条件判断的流程
4. **04-审批流程**：包含审批逻辑的流程
5. **05-订单处理流程**：复杂的订单处理流程

详细说明请参考 [README_SAMPLES.md](./README_SAMPLES.md)

## API 文档

启动服务后，访问 http://localhost:2222/docs 查看完整的 API 文档。

### 主要 API 端点

- `GET /bpmn_processes` - 获取所有流程定义
- `POST /bpmn_processes` - 创建流程定义
- `GET /bpmn_processes/{id}` - 获取单个流程定义
- `PUT /bpmn_processes/{id}` - 更新流程定义
- `DELETE /bpmn_processes/{id}` - 删除流程定义
- `GET /bpmn_process_instances` - 获取所有流程实例
- `GET /bpmn_process_instances/{id}` - 获取单个流程实例
- `GET /bpmn_process_instances/{id}/task_topology` - 获取任务拓扑图
- `POST /test/create_process_instance/{id}` - 创建流程实例
- `POST /test/run_process_instance/{id}` - 执行流程实例

## 技术栈

### 后端
- **FastAPI**：现代、快速的 Web 框架
- **SpiffWorkflow**：BPMN 2.0 工作流引擎
- **SQLAlchemy**：ORM 框架
- **Alembic**：数据库迁移工具
- **SQLite**：轻量级数据库
- **Loguru**：日志库

### 前端
- **React 18**：UI 框架
- **Ant Design 5**：UI 组件库
- **Vite**：构建工具
- **React Router 6**：路由管理
- **Axios**：HTTP 客户端
- **Monaco Editor**：代码编辑器
- **Mermaid.js**：流程图渲染

### 部署
- **Docker**：容器化
- **Docker Compose**：服务编排
- **Nginx**：前端 Web 服务器

## 开发

### 代码结构

项目采用分层架构：
- **路由层** (routers/)：处理 HTTP 请求
- **业务逻辑层** (bpmn/)：工作流执行逻辑
- **数据访问层** (db/repos/)：数据库操作
- **数据模型层** (db/models/)：数据模型定义

### 数据库

数据库文件位于 `data/db.sqlite`，首次运行时会自动创建。

### 日志

日志使用 Loguru，默认输出到控制台。

## 常见问题

### 1. 创建流程实例时脚本任务报错

如果流程中包含脚本任务，且脚本任务需要用户任务的数据，在创建实例时会报错。这是正常行为，系统会自动恢复并返回第一个用户任务。

### 2. 前端无法访问后端 API

检查：
- 后端服务是否正常运行（端口 2222）
- Nginx 配置是否正确（检查 `frontend/nginx.conf`）
- 网络连接是否正常

### 3. 流程图无法渲染

确保：
- Mermaid.js 已正确安装
- 浏览器控制台没有 JavaScript 错误
- 流程图语法正确

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT License

## 相关文档

- [示例流程说明](./README_SAMPLES.md)
- [工作流执行流程图](./WORKFLOW_EXECUTION_FLOW.md)
- [BPMN 编写指南](./frontend/BPMN_GUIDE.md)

