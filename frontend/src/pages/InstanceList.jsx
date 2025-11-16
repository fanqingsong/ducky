import { useState, useEffect, useRef } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  message, 
  Tag,
  Descriptions,
  Space,
  Tabs,
  Card,
  Spin
} from 'antd'
import { EyeOutlined } from '@ant-design/icons'
import { instanceApi, processApi } from '../services/api'
import TaskTopologyView from '../components/TaskTopologyView'

function InstanceList() {
  const [instances, setInstances] = useState([])
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [selectedInstance, setSelectedInstance] = useState(null)
  const [topologyData, setTopologyData] = useState(null)
  const [topologyLoading, setTopologyLoading] = useState(false)
  const topologyRef = useRef(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [instancesData, processesData] = await Promise.all([
        instanceApi.getAll(),
        processApi.getAll()
      ])
      setInstances(instancesData || [])
      setProcesses(processesData || [])
    } catch (error) {
      message.error('加载数据失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleView = async (record) => {
    setSelectedInstance(record)
    setViewModalVisible(true)
    setTopologyData(null)
    
    // 加载拓扑图数据
    try {
      setTopologyLoading(true)
      const response = await fetch(`/api/bpmn_process_instances/${record.id}/task_topology`)
      if (response.ok) {
        const data = await response.json()
        setTopologyData(data)
      } else {
        console.warn('Failed to load topology data')
      }
    } catch (error) {
      console.error('Error loading topology:', error)
    } finally {
      setTopologyLoading(false)
    }
  }

  const getProcessName = (processId) => {
    const process = processes.find(p => p.id === processId)
    return process ? process.name : `流程 #${processId}`
  }

  const getStatusTag = (currentTask) => {
    if (currentTask === 'END' || !currentTask) {
      return <Tag color="success">已完成</Tag>
    }
    return <Tag color="processing">进行中</Tag>
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '流程定义',
      key: 'process_name',
      render: (_, record) => getProcessName(record.bpmn_process_id)
    },
    {
      title: '当前任务',
      dataIndex: 'current_task',
      key: 'current_task',
      render: (text) => text || 'END'
    },
    {
      title: '状态',
      key: 'status',
      render: (_, record) => getStatusTag(record.current_task)
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '更新时间',
      dataIndex: 'updated_at',
      key: 'updated_at',
      render: (text) => text ? new Date(text).toLocaleString() : '-'
    },
    {
      title: '操作',
      key: 'action',
      width: 100,
      render: (_, record) => (
        <Button
          type="link"
          icon={<EyeOutlined />}
          onClick={() => handleView(record)}
        >
          查看详情
        </Button>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>流程实例管理</h2>
        <Button onClick={loadData}>
          刷新
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={instances}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title="流程实例详情"
        open={viewModalVisible}
        onCancel={() => {
          setViewModalVisible(false)
          setTopologyData(null)
        }}
        footer={[
          <Button key="close" onClick={() => {
            setViewModalVisible(false)
            setTopologyData(null)
          }}>
            关闭
          </Button>
        ]}
        width={1200}
      >
        {selectedInstance && (
          <Tabs
            defaultActiveKey="info"
            items={[
              {
                key: 'info',
                label: '基本信息',
                children: (
                  <Descriptions column={1} bordered>
                    <Descriptions.Item label="实例 ID">
                      {selectedInstance.id}
                    </Descriptions.Item>
                    <Descriptions.Item label="流程定义">
                      {getProcessName(selectedInstance.bpmn_process_id)}
                    </Descriptions.Item>
                    <Descriptions.Item label="当前任务">
                      <Space>
                        {selectedInstance.current_task || 'END'}
                        {getStatusTag(selectedInstance.current_task)}
                      </Space>
                    </Descriptions.Item>
                    <Descriptions.Item label="创建时间">
                      {selectedInstance.created_at ? new Date(selectedInstance.created_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="更新时间">
                      {selectedInstance.updated_at ? new Date(selectedInstance.updated_at).toLocaleString() : '-'}
                    </Descriptions.Item>
                    <Descriptions.Item label="状态数据">
                      <div style={{ 
                        maxHeight: 300, 
                        overflow: 'auto',
                        background: '#f5f5f5',
                        padding: 8,
                        borderRadius: 4,
                        fontFamily: 'monospace',
                        fontSize: 12
                      }}>
                        {selectedInstance.state ? 
                          JSON.stringify(JSON.parse(selectedInstance.state), null, 2) : 
                          '无状态数据'
                        }
                      </div>
                    </Descriptions.Item>
                  </Descriptions>
                )
              },
              {
                key: 'topology',
                label: '任务拓扑图',
                children: (
                  <TaskTopologyView 
                    instance={selectedInstance}
                    topologyData={topologyData}
                    topologyLoading={topologyLoading}
                    topologyRef={topologyRef}
                  />
                )
              }
            ]}
          />
        )}
      </Modal>
    </div>
  )
}

export default InstanceList

