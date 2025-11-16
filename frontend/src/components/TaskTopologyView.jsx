import { useEffect, useRef, useState } from 'react'
import { Card, Spin, Tag, Descriptions, Space, Empty } from 'antd'
import { CheckCircleOutlined, PlayCircleOutlined, ClockCircleOutlined } from '@ant-design/icons'
import mermaid from 'mermaid'

function TaskTopologyView({ instance, topologyData, topologyLoading, topologyRef }) {
  const [mermaidInitialized, setMermaidInitialized] = useState(false)

  useEffect(() => {
    if (!mermaidInitialized) {
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
      setMermaidInitialized(true)
    }
  }, [mermaidInitialized])

  useEffect(() => {
    if (topologyData && topologyRef.current && mermaidInitialized) {
      renderTopology()
    }
  }, [topologyData, mermaidInitialized])

  const renderTopology = async () => {
    if (!topologyData || !topologyRef.current) return

    try {
      // 构建 Mermaid 流程图
      const mermaidDiagram = buildMermaidDiagram(topologyData)
      
      // 清空容器
      topologyRef.current.innerHTML = ''
      
      // 创建临时 div
      const tempDiv = document.createElement('div')
      const uniqueId = `topology-${instance.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      tempDiv.className = 'mermaid'
      tempDiv.id = uniqueId
      tempDiv.textContent = mermaidDiagram
      
      topologyRef.current.appendChild(tempDiv)
      
      // 渲染
      await mermaid.run({
        nodes: [tempDiv],
        suppressErrors: false
      })
    } catch (error) {
      console.error('Mermaid render error:', error)
      if (topologyRef.current) {
        topologyRef.current.innerHTML = `<div style="color: red; padding: 20px;">拓扑图渲染失败: ${error.message}</div>`
      }
    }
  }

  const buildMermaidDiagram = (data) => {
    if (!data || !data.nodes || !data.edges) {
      return 'graph TD\n    A[无数据]'
    }

    let diagram = 'graph TD\n'
    
    // 添加节点样式定义
    diagram += '    classDef completed fill:#c8e6c9,stroke:#4caf50,stroke-width:2px,color:#000\n'
    diagram += '    classDef current fill:#fff9c4,stroke:#fbc02d,stroke-width:3px,color:#000\n'
    diagram += '    classDef future fill:#e3f2fd,stroke:#2196f3,stroke-width:2px,color:#000\n'
    diagram += '    classDef start fill:#e1f5ff,stroke:#03a9f4,stroke-width:2px,color:#000\n'
    diagram += '    classDef endEvent fill:#f3e5f5,stroke:#9c27b0,stroke-width:2px,color:#000\n'
    diagram += '\n'
    
    // 添加节点
    const nodeMap = {}
    data.nodes.forEach(node => {
      // 清理节点 ID，确保符合 Mermaid 语法
      const nodeId = node.id.replace(/[^a-zA-Z0-9_]/g, '_').replace(/^(\d)/, 'N$1')
      nodeMap[node.id] = nodeId
      
      let nodeLabel = (node.name || node.id).replace(/"/g, '&quot;')
      let nodeClass = 'future'
      
      if (node.type === 'startEvent') {
        nodeClass = 'start'
        nodeLabel = '开始'
      } else if (node.type === 'endEvent') {
        nodeClass = 'endEvent'
        nodeLabel = '结束'
      } else if (node.state === 'completed') {
        nodeClass = 'completed'
        nodeLabel = `✓ ${nodeLabel}`
      } else if (node.state === 'current') {
        nodeClass = 'current'
        nodeLabel = `▶ ${nodeLabel}`
      }
      
      diagram += `    ${nodeId}["${nodeLabel}"]\n`
    })
    
    // 添加边
    data.edges.forEach(edge => {
      const sourceId = nodeMap[edge.source]
      const targetId = nodeMap[edge.target]
      
      if (sourceId && targetId) {
        const edgeLabel = edge.name ? `|"${edge.name.replace(/"/g, '&quot;')}"|` : ''
        diagram += `    ${sourceId} -->${edgeLabel} ${targetId}\n`
      }
    })
    
    // 最后添加样式类
    diagram += '\n'
    data.nodes.forEach(node => {
      const nodeId = nodeMap[node.id]
      if (nodeId) {
        let nodeClass = 'future'
        if (node.type === 'startEvent') {
          nodeClass = 'start'
        } else if (node.type === 'endEvent') {
          nodeClass = 'endEvent'
        } else if (node.state === 'completed') {
          nodeClass = 'completed'
        } else if (node.state === 'current') {
          nodeClass = 'current'
        }
        diagram += `    class ${nodeId} ${nodeClass}\n`
      }
    })
    
    return diagram
  }

  if (topologyLoading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin size="large" tip="加载拓扑图数据..." />
      </div>
    )
  }

  if (!topologyData) {
    return (
      <Empty description="暂无拓扑图数据" />
    )
  }

  return (
    <div>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        {/* 任务状态统计 */}
        <Card title="任务状态" size="small">
          <Space size="large">
            <div>
              <Tag color="success" icon={<CheckCircleOutlined />}>
                已完成: {topologyData.completed_tasks?.length || 0}
              </Tag>
            </div>
            <div>
              <Tag color="processing" icon={<PlayCircleOutlined />}>
                当前任务: {topologyData.current_tasks?.length || 0}
              </Tag>
            </div>
            <div>
              <Tag color="default" icon={<ClockCircleOutlined />}>
                待执行: {topologyData.future_tasks?.length || 0}
              </Tag>
            </div>
            <div>
              <Tag color={topologyData.is_completed ? 'success' : 'processing'}>
                {topologyData.is_completed ? '已完成' : '进行中'}
              </Tag>
            </div>
          </Space>
        </Card>

        {/* 任务列表 */}
        <Card title="任务详情" size="small">
          <Descriptions column={1} bordered size="small">
            {topologyData.completed_tasks && topologyData.completed_tasks.length > 0 && (
              <Descriptions.Item label="已完成任务">
                <Space wrap>
                  {topologyData.completed_tasks.map((task, index) => (
                    <Tag key={index} color="success" icon={<CheckCircleOutlined />}>
                      {task.name}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {topologyData.current_tasks && topologyData.current_tasks.length > 0 && (
              <Descriptions.Item label="当前任务">
                <Space wrap>
                  {topologyData.current_tasks.map((task, index) => (
                    <Tag key={index} color="processing" icon={<PlayCircleOutlined />}>
                      {task.name}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
            {topologyData.future_tasks && topologyData.future_tasks.length > 0 && (
              <Descriptions.Item label="待执行任务">
                <Space wrap>
                  {topologyData.future_tasks.map((task, index) => (
                    <Tag key={index} color="default" icon={<ClockCircleOutlined />}>
                      {task.name}
                    </Tag>
                  ))}
                </Space>
              </Descriptions.Item>
            )}
          </Descriptions>
        </Card>

        {/* 拓扑图 */}
        <Card title="任务执行拓扑图" size="small">
          <div 
            ref={topologyRef} 
            style={{ 
              textAlign: 'center', 
              overflow: 'auto',
              minHeight: 400,
              padding: 20
            }}
          />
          <div style={{ marginTop: 16, fontSize: 12, color: '#666' }}>
            <Space>
              <Tag color="success">绿色：已完成</Tag>
              <Tag color="processing">黄色：当前任务</Tag>
              <Tag color="default">蓝色：待执行</Tag>
            </Space>
          </div>
        </Card>
      </Space>
    </div>
  )
}

export default TaskTopologyView

