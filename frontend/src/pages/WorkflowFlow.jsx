import { useEffect, useRef, useState } from 'react'
import { Card, Tabs } from 'antd'
import mermaid from 'mermaid'

function WorkflowFlow() {
  const systemFlowRef = useRef(null)
  const createInstanceRef = useRef(null)
  const executeFlowRef = useRef(null)
  const stateFlowRef = useRef(null)
  const errorFlowRef = useRef(null)
  const [activeTab, setActiveTab] = useState('system')

  useEffect(() => {
    // 初始化 Mermaid
    mermaid.initialize({ 
      startOnLoad: false,
      theme: 'default',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis'
      }
    })
  }, [])

  // 系统整体执行流程
  const systemFlow = `
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
    style A fill:#e1f5ff
    style T fill:#c8e6c9
    style E fill:#ffcdd2
    style K fill:#fff9c4
    style N fill:#fff9c4
`

    // 创建流程实例详细流程
    const createInstanceFlow = `
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
`

    // 执行工作流步骤详细流程
    const executeFlow = `
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
`

    // 工作流状态转换图
    const stateFlow = `
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
`

    // 错误处理流程
    const errorFlow = `
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
    style F fill:#ffcdd2
    style K fill:#ffcdd2
    style J fill:#fff9c4
    style N fill:#c8e6c9
`

  // 渲染流程图
  const renderDiagram = async (ref, diagram, id) => {
    if (ref.current && diagram) {
      try {
        // 清空容器
        ref.current.innerHTML = ''
        
        // 创建唯一的 ID
        const uniqueId = `${id}-${Date.now()}`
        
        // 使用 mermaid.run 方法
        const { svg } = await mermaid.render(uniqueId, diagram)
        ref.current.innerHTML = svg
      } catch (error) {
        console.error('Mermaid render error:', error)
        ref.current.innerHTML = `<div style="color: red; padding: 20px;">流程图渲染失败: ${error.message}</div>`
      }
    }
  }

  // 当标签页切换时渲染对应的流程图
  useEffect(() => {
    const renderCurrentDiagram = async () => {
      switch (activeTab) {
        case 'system':
          await renderDiagram(systemFlowRef, systemFlow, 'system-flow')
          break
        case 'create':
          await renderDiagram(createInstanceRef, createInstanceFlow, 'create-instance-flow')
          break
        case 'execute':
          await renderDiagram(executeFlowRef, executeFlow, 'execute-flow')
          break
        case 'state':
          await renderDiagram(stateFlowRef, stateFlow, 'state-flow')
          break
        case 'error':
          await renderDiagram(errorFlowRef, errorFlow, 'error-flow')
          break
      }
    }

    // 延迟渲染，确保 DOM 已经更新
    const timer = setTimeout(() => {
      renderCurrentDiagram()
    }, 100)

    return () => clearTimeout(timer)
  }, [activeTab])

  const tabItems = [
    {
      key: 'system',
      label: '系统整体流程',
      children: (
        <Card>
          <div ref={systemFlowRef} style={{ textAlign: 'center', overflow: 'auto' }}></div>
        </Card>
      )
    },
    {
      key: 'create',
      label: '创建实例流程',
      children: (
        <Card>
          <div ref={createInstanceRef} style={{ textAlign: 'center', overflow: 'auto' }}></div>
        </Card>
      )
    },
    {
      key: 'execute',
      label: '执行步骤流程',
      children: (
        <Card>
          <div ref={executeFlowRef} style={{ textAlign: 'center', overflow: 'auto' }}></div>
        </Card>
      )
    },
    {
      key: 'state',
      label: '状态转换图',
      children: (
        <Card>
          <div ref={stateFlowRef} style={{ textAlign: 'center', overflow: 'auto' }}></div>
        </Card>
      )
    },
    {
      key: 'error',
      label: '错误处理流程',
      children: (
        <Card>
          <div ref={errorFlowRef} style={{ textAlign: 'center', overflow: 'auto' }}></div>
        </Card>
      )
    }
  ]

  return (
    <div>
      <h2>工作流执行流程图</h2>
      <p style={{ marginBottom: 24, color: '#666' }}>
        以下流程图展示了 BPMN 工作流管理系统的完整执行过程，包括创建实例、执行步骤、状态转换和错误处理等各个环节。
      </p>
      <Tabs 
        items={tabItems} 
        activeKey={activeTab}
        onChange={setActiveTab}
      />
    </div>
  )
}

export default WorkflowFlow

