import { useState, useEffect } from 'react'
import { 
  Table, 
  Button, 
  Modal, 
  Form, 
  Input, 
  message, 
  Popconfirm,
  Space,
  Tag,
  Descriptions,
  Tabs
} from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined, EyeOutlined } from '@ant-design/icons'
import MonacoEditor from '../components/MonacoEditor'
import { processApi } from '../services/api'

function ProcessList() {
  const [processes, setProcesses] = useState([])
  const [loading, setLoading] = useState(false)
  const [modalVisible, setModalVisible] = useState(false)
  const [viewModalVisible, setViewModalVisible] = useState(false)
  const [editingProcess, setEditingProcess] = useState(null)
  const [form] = Form.useForm()

  useEffect(() => {
    loadProcesses()
  }, [])

  const loadProcesses = async () => {
    setLoading(true)
    try {
      const data = await processApi.getAll()
      setProcesses(data || [])
    } catch (error) {
      message.error('加载流程列表失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingProcess(null)
    form.resetFields()
    form.setFieldsValue({
      name: '',
      xml_definition: '<?xml version="1.0" encoding="UTF-8"?>\n<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL" xmlns:camunda="http://camunda.org/schema/1.0/bpmn" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n  <bpmn:process id="simple_process" name="简单流程" isExecutable="true">\n    <bpmn:startEvent id="StartEvent_1">\n      <bpmn:outgoing>Flow_1</bpmn:outgoing>\n    </bpmn:startEvent>\n    <bpmn:endEvent id="EndEvent_1">\n      <bpmn:incoming>Flow_1</bpmn:incoming>\n    </bpmn:endEvent>\n    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="EndEvent_1" />\n  </bpmn:process>\n</bpmn:definitions>'
    })
    setModalVisible(true)
  }

  const handleEdit = (record) => {
    setEditingProcess(record)
    form.setFieldsValue({
      name: record.name,
      xml_definition: record.xml_definition
    })
    setModalVisible(true)
  }

  const handleView = (record) => {
    setEditingProcess(record)
    setViewModalVisible(true)
  }

  const handleDelete = async (id) => {
    try {
      await processApi.delete(id)
      message.success('删除成功')
      loadProcesses()
    } catch (error) {
      message.error('删除失败: ' + error.message)
    }
  }

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields()
      if (editingProcess) {
        await processApi.update(editingProcess.id, values)
        message.success('更新成功')
      } else {
        await processApi.create(values)
        message.success('创建成功')
      }
      setModalVisible(false)
      loadProcesses()
    } catch (error) {
      if (error.errorFields) {
        return
      }
      message.error((editingProcess ? '更新' : '创建') + '失败: ' + error.message)
    }
  }

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '名称',
      dataIndex: 'name',
      key: 'name'
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
      width: 200,
      render: (_, record) => (
        <Space>
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这个流程定义吗？"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ]

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>流程定义管理</h2>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={handleCreate}
        >
          创建流程定义
        </Button>
      </div>

      <Table
        columns={columns}
        dataSource={processes}
        rowKey="id"
        loading={loading}
        pagination={{
          pageSize: 10,
          showSizeChanger: true,
          showTotal: (total) => `共 ${total} 条记录`
        }}
      />

      <Modal
        title={editingProcess ? '编辑流程定义' : '创建流程定义'}
        open={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
        width={900}
        okText="保存"
        cancelText="取消"
      >
        <Form
          form={form}
          layout="vertical"
        >
          <Form.Item
            name="name"
            label="流程名称"
            rules={[{ required: true, message: '请输入流程名称' }]}
          >
            <Input placeholder="请输入流程名称" />
          </Form.Item>
          <Form.Item
            name="xml_definition"
            label="BPMN XML 定义"
            rules={[{ required: true, message: '请输入 BPMN XML 定义' }]}
          >
            <MonacoEditor
              height="400px"
              defaultLanguage="xml"
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                wordWrap: 'on',
                automaticLayout: true
              }}
            />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title="查看流程定义"
        open={viewModalVisible}
        onCancel={() => setViewModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setViewModalVisible(false)}>
            关闭
          </Button>
        ]}
        width={1000}
      >
        {editingProcess && (
          <div>
            <Descriptions column={2} bordered style={{ marginBottom: 16 }}>
              <Descriptions.Item label="名称">{editingProcess.name}</Descriptions.Item>
              <Descriptions.Item label="ID">{editingProcess.id}</Descriptions.Item>
              <Descriptions.Item label="创建时间">
                {editingProcess.created_at ? new Date(editingProcess.created_at).toLocaleString() : '-'}
              </Descriptions.Item>
              <Descriptions.Item label="更新时间">
                {editingProcess.updated_at ? new Date(editingProcess.updated_at).toLocaleString() : '-'}
              </Descriptions.Item>
            </Descriptions>
            <div style={{ marginTop: 16 }}>
              <Tabs
                defaultActiveKey="text"
                items={[
                  {
                    key: 'text',
                    label: '文本视图',
                    children: (
                      <Input.TextArea
                        value={editingProcess.xml_definition || ''}
                        readOnly
                        rows={20}
                        style={{
                          fontFamily: 'monospace',
                          fontSize: 13,
                          backgroundColor: '#f5f5f5'
                        }}
                      />
                    )
                  },
                  {
                    key: 'editor',
                    label: '代码编辑器',
                    children: (
                      <div style={{ border: '1px solid #d9d9d9', borderRadius: 4, overflow: 'hidden', minHeight: '500px' }}>
                        {editingProcess.xml_definition ? (
                          <MonacoEditor
                            height="500px"
                            defaultLanguage="xml"
                            value={editingProcess.xml_definition}
                            options={{
                              readOnly: true,
                              minimap: { enabled: false },
                              fontSize: 13,
                              wordWrap: 'on',
                              automaticLayout: true,
                              scrollBeyondLastLine: false,
                              lineNumbers: 'on',
                              folding: true,
                              renderWhitespace: 'selection',
                              theme: 'vs'
                            }}
                            loading={<div style={{ padding: 20, textAlign: 'center' }}>加载编辑器...</div>}
                          />
                        ) : (
                          <div style={{ padding: 20, color: '#999' }}>暂无 XML 定义</div>
                        )}
                      </div>
                    )
                  },
                  {
                    key: 'raw',
                    label: '原始格式',
                    children: (
                      <pre style={{ 
                        background: '#f5f5f5', 
                        padding: 16, 
                        borderRadius: 4, 
                        overflow: 'auto',
                        maxHeight: '500px',
                        fontSize: 12,
                        margin: 0,
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word'
                      }}>
                        {editingProcess.xml_definition || '无内容'}
                      </pre>
                    )
                  }
                ]}
              />
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

export default ProcessList

