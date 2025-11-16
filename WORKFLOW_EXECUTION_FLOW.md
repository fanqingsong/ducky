# BPMN 工作流执行流程图

## 系统整体执行流程

```mermaid
graph TD
    A[用户选择流程定义] --> B[点击创建流程实例]
    B --> C{检查流程定义}
    C -->|有效| D[解析 BPMN XML]
    C -->|无效| E[返回错误]
    D --> F[创建工作流实例]
    F --> G[执行引擎步骤]
    G --> H{是否有用户任务?}
    H -->|是| I{用户任务数据是否完整?}
    H -->|否| J{是否有脚本任务?}
    I -->|否| K[返回用户任务,等待输入]
    I -->|是| L[完成用户任务]
    J -->|是| M{脚本任务需要数据?}
    M -->|是,但数据缺失| N[捕获异常,返回用户任务]
    M -->|否或数据完整| O[执行脚本任务]
    L --> G
    O --> G
    N --> K
    K --> P[用户填写表单]
    P --> Q[提交表单数据]
    Q --> R[继续执行工作流]
    R --> G
    G --> S{工作流是否完成?}
    S -->|否| H
    S -->|是| T[返回 END 状态]
```

## 创建流程实例详细流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant API as 后端 API
    participant BR as BpmnRunner
    participant WF as 工作流引擎
    participant DB as 数据库

    U->>F: 选择流程定义
    U->>F: 点击创建流程实例
    F->>API: POST /test/create_process_instance/{id}
    API->>BR: create_process_instance(process)
    BR->>BR: 解析 BPMN XML
    BR->>BR: 提取 process id
    BR->>WF: 创建工作流实例
    BR->>BR: _run_to_next_state(workflow)
    BR->>WF: do_engine_steps()
    WF->>WF: 执行开始事件
    WF->>WF: 检查下一个任务
    
    alt 有用户任务
        WF-->>BR: 返回用户任务
        BR->>BR: 检查用户任务数据
        alt 数据不完整
            BR->>DB: 保存实例状态(用户任务)
            BR-->>API: 返回实例(当前任务=用户任务名)
            API-->>F: 返回实例数据
            F-->>U: 显示表单,等待输入
        end
    else 有脚本任务
        WF->>WF: 执行脚本任务
        alt 脚本任务需要数据但缺失
            WF-->>BR: 抛出 WorkflowTaskExecException
            BR->>BR: 捕获异常
            BR->>WF: 获取用户任务
            BR->>DB: 保存实例状态(用户任务)
            BR-->>API: 返回实例(当前任务=用户任务名)
            API-->>F: 返回实例数据
            F-->>U: 显示表单,等待输入
        else 脚本任务执行成功
            WF->>WF: 继续执行
            WF-->>BR: 返回下一个任务或 END
            BR->>DB: 保存实例状态
            BR-->>API: 返回实例
            API-->>F: 返回实例数据
            F-->>U: 显示结果
        end
    else 工作流完成
        WF-->>BR: 返回 END
        BR->>DB: 保存实例状态(END)
        BR-->>API: 返回实例
        API-->>F: 返回实例数据
        F-->>U: 显示完成状态
    end
```

## 执行工作流步骤详细流程

```mermaid
sequenceDiagram
    participant U as 用户
    participant F as 前端
    participant API as 后端 API
    participant BR as BpmnRunner
    participant WF as 工作流引擎
    participant DB as 数据库

    U->>F: 填写表单数据
    U->>F: 点击执行下一步
    F->>API: POST /test/run_process_instance/{id}
    API->>BR: run(instance, data)
    BR->>DB: 获取实例状态
    BR->>WF: 反序列化工作流
    BR->>BR: _run_to_next_state(workflow, data)
    BR->>WF: 更新工作流数据
    BR->>WF: do_engine_steps()
    
    loop 处理所有就绪的用户任务
        WF->>WF: 获取就绪的用户任务
        BR->>BR: 检查任务数据完整性
        alt 数据完整
            BR->>WF: 完成用户任务
            BR->>WF: 更新工作流数据
            WF->>WF: 执行后续引擎步骤
        else 数据不完整
            BR->>BR: 停止工作流
            BR->>DB: 保存实例状态
            BR-->>API: 返回实例(当前任务)
            API-->>F: 返回实例数据
            F-->>U: 显示表单,等待输入
        end
    end
    
    WF->>WF: 检查是否有脚本任务
    alt 有脚本任务
        WF->>WF: 执行脚本任务
        WF->>WF: 检查条件分支
        WF->>WF: 继续执行
    end
    
    WF->>WF: 检查工作流状态
    alt 工作流完成
        BR->>DB: 更新实例状态(END)
        BR-->>API: 返回实例(END)
        API-->>F: 返回实例数据
        F-->>U: 显示完成状态
    else 还有任务
        BR->>DB: 更新实例状态(下一个任务)
        BR-->>API: 返回实例(下一个任务)
        API-->>F: 返回实例数据
        F-->>U: 显示下一个表单或任务
    end
```

## 工作流状态转换图

```mermaid
stateDiagram-v2
    [*] --> 选择流程: 用户操作
    选择流程 --> 创建实例: 点击创建按钮
    创建实例 --> 解析XML: 后端处理
    解析XML --> 执行引擎步骤: 创建工作流
    执行引擎步骤 --> 用户任务: 遇到用户任务
    执行引擎步骤 --> 脚本任务: 遇到脚本任务
    执行引擎步骤 --> 完成: 工作流完成
    
    用户任务 --> 等待输入: 数据不完整
    等待输入 --> 用户任务: 用户提交数据
    用户任务 --> 执行引擎步骤: 任务完成
    
    脚本任务 --> 执行引擎步骤: 执行成功
    脚本任务 --> 用户任务: 需要数据但缺失
    
    完成 --> [*]
```

## 错误处理流程

```mermaid
graph TD
    A[执行工作流] --> B{执行 do_engine_steps}
    B --> C{遇到脚本任务}
    C -->|是| D{脚本任务需要数据?}
    D -->|是| E{数据是否存在?}
    E -->|否| F[抛出 WorkflowTaskExecException]
    E -->|是| G[执行脚本任务]
    F --> H[捕获异常]
    H --> I{是否有用户任务?}
    I -->|是| J[返回用户任务]
    I -->|否| K[抛出异常]
    G --> L[继续执行]
    C -->|否| L
    L --> M{工作流完成?}
    M -->|是| N[返回 END]
    M -->|否| B
    J --> O[保存实例状态]
    N --> O
    O --> P[返回结果]
```

## 典型流程示例

### 1. 简单流程（无用户任务）
```mermaid
graph LR
    A[开始] --> B[结束]
```

### 2. 用户任务流程
```mermaid
graph LR
    A[开始] --> B[用户任务:填写信息]
    B --> C[结束]
```

### 3. 条件分支流程
```mermaid
graph TD
    A[开始] --> B[用户任务:输入数字]
    B --> C[脚本任务:检查数字]
    C --> D{判断大小}
    D -->|大于10| E[脚本任务:处理大数字]
    D -->|小于等于10| F[脚本任务:处理小数字]
    E --> G[结束]
    F --> G
```

### 4. 审批流程
```mermaid
graph TD
    A[开始] --> B[用户任务:提交申请]
    B --> C[脚本任务:计算处理]
    C --> D{需要审批?}
    D -->|是| E[用户任务:审批]
    D -->|否| F[脚本任务:自动通过]
    E --> G[结束]
    F --> G
```

### 5. 订单处理流程
```mermaid
graph TD
    A[开始] --> B[用户任务:创建订单]
    B --> C[脚本任务:计算总价]
    C --> D[脚本任务:检查库存]
    D --> E{库存检查}
    E -->|有库存| F[用户任务:确认订单]
    E -->|无库存| G[脚本任务:拒绝订单]
    F --> H[结束:成功]
    G --> I[结束:失败]
```

## 数据流转图

```mermaid
graph LR
    A[用户输入] --> B[前端表单]
    B --> C[API 请求]
    C --> D[工作流数据]
    D --> E[用户任务数据]
    E --> F[脚本任务数据]
    F --> G[工作流状态]
    G --> H[数据库存储]
    H --> I[返回前端]
    I --> J[显示结果]
```

## 关键决策点

```mermaid
graph TD
    A[执行工作流] --> B{检查任务类型}
    B -->|用户任务| C{数据是否完整?}
    B -->|脚本任务| D{数据是否存在?}
    B -->|网关| E{条件是否满足?}
    B -->|结束事件| F[工作流完成]
    
    C -->|是| G[完成任务]
    C -->|否| H[等待用户输入]
    
    D -->|是| I[执行脚本]
    D -->|否| J[捕获异常,返回用户任务]
    
    E -->|是| K[走分支1]
    E -->|否| L[走分支2]
    
    G --> M[继续执行]
    I --> M
    K --> M
    L --> M
    H --> N[用户提交数据]
    N --> M
    M --> B
    F --> O[结束]
```

