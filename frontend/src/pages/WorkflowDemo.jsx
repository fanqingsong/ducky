import { useState, useEffect } from 'react'
import { 
  Card, 
  Select, 
  Button, 
  Form, 
  Input, 
  Radio, 
  Switch,
  message,
  Steps,
  Space,
  Tag,
  Descriptions,
  Divider
} from 'antd'
import { PlayCircleOutlined, CheckCircleOutlined, LoadingOutlined } from '@ant-design/icons'
import { processApi, workflowApi, instanceApi } from '../services/api'

const { Option } = Select
const { TextArea } = Input

function WorkflowDemo() {
  const [processes, setProcesses] = useState([])
  const [selectedProcessId, setSelectedProcessId] = useState(null)
  const [currentInstance, setCurrentInstance] = useState(null)
  const [formData, setFormData] = useState({})
  const [formFields, setFormFields] = useState([])
  const [loading, setLoading] = useState(false)
  const [executing, setExecuting] = useState(false)
  const [form] = Form.useForm()
  const [step, setStep] = useState(0)

  useEffect(() => {
    loadProcesses()
  }, [])

  useEffect(() => {
    if (currentInstance) {
      parseFormFields()
    }
  }, [currentInstance, selectedProcessId, processes])

  useEffect(() => {
    if (currentInstance) {
      updateSteps()
    }
  }, [currentInstance, formFields])

  const loadProcesses = async () => {
    try {
      const data = await processApi.getAll()
      setProcesses(data || [])
    } catch (error) {
      message.error('加载流程列表失败: ' + error.message)
    }
  }

  const parseFormFields = () => {
    if (!currentInstance || !selectedProcessId) {
      setFormFields([])
      return
    }

    const process = processes.find(p => p.id === selectedProcessId)
    if (!process || !process.xml_definition) {
      setFormFields([])
      return
    }

    const currentTaskName = currentInstance.current_task
    if (!currentTaskName || currentTaskName === 'END') {
      setFormFields([])
      return
    }

    try {
      const parser = new DOMParser()
      const xmlDoc = parser.parseFromString(process.xml_definition, 'text/xml')
      
      // 检查解析错误
      const parserError = xmlDoc.querySelector('parsererror')
      if (parserError) {
        console.error('XML 解析错误:', parserError.textContent)
        setFormFields([])
        return
      }
      
      // 查找当前任务对应的用户任务节点
      const userTasks = xmlDoc.getElementsByTagNameNS('http://www.omg.org/spec/BPMN/20100524/MODEL', 'userTask')
      
      let fields = []
      
      for (let i = 0; i < userTasks.length; i++) {
        const task = userTasks[i]
        const taskName = task.getAttribute('name')
        // 更灵活的匹配：任务名称完全匹配或包含关系
        if (taskName === currentTaskName || 
            currentTaskName.includes(taskName) || 
            taskName.includes(currentTaskName)) {
          // 查找表单字段
          const formData = task.getElementsByTagNameNS('http://camunda.org/schema/1.0/bpmn', 'formData')[0]
          if (formData) {
            const formFields = formData.getElementsByTagNameNS('http://camunda.org/schema/1.0/bpmn', 'formField')
            for (let j = 0; j < formFields.length; j++) {
              const field = formFields[j]
              const fieldId = field.getAttribute('id')
              const label = field.getAttribute('label')
              const type = field.getAttribute('type')
              
              let options = []
              if (type === 'enum') {
                const values = field.getElementsByTagNameNS('http://camunda.org/schema/1.0/bpmn', 'value')
                for (let k = 0; k < values.length; k++) {
                  const value = values[k]
                  options.push({
                    id: value.getAttribute('id'),
                    name: value.getAttribute('name')
                  })
                }
              }
              
              fields.push({
                id: fieldId,
                label: label,
                type: type,
                options: options
              })
            }
          }
          break
        }
      }
      
      setFormFields(fields)
    } catch (error) {
      console.error('解析表单字段失败:', error)
      setFormFields([])
    }
  }

  const updateSteps = () => {
    if (!currentInstance) {
      setStep(0)
      return
    }

    if (currentInstance.current_task === 'END' || !currentInstance.current_task) {
      setStep(3) // 完成
    } else if (formFields.length > 0) {
      setStep(2) // 填写表单
    } else {
      setStep(1) // 等待执行
    }
  }

  const handleCreateInstance = async () => {
    if (!selectedProcessId) {
      message.warning('请先选择流程定义')
      return
    }

    setLoading(true)
    try {
      const instance = await workflowApi.createInstance(selectedProcessId)
      setCurrentInstance(instance)
      setFormData({})
      setFormFields([])
      form.resetFields()
      setStep(1)
      message.success('流程实例创建成功')
    } catch (error) {
      console.error('创建流程实例失败:', error)
      message.error('创建流程实例失败: ' + error.message)
    } finally {
      setLoading(false)
    }
  }

  const handleExecute = async () => {
    if (!currentInstance) {
      message.warning('请先创建流程实例')
      return
    }

    try {
      // 如果有表单字段，需要验证表单
      let values = {}
      if (formFields.length > 0) {
        values = await form.validateFields()
      }
      
      setExecuting(true)
      
      const instance = await workflowApi.runInstance(currentInstance.id, values)
      setCurrentInstance(instance)
      setFormData({})
      setFormFields([])
      form.resetFields()
      
      // 延迟一下再解析表单字段，确保状态更新
      setTimeout(() => {
        if (instance.current_task && instance.current_task !== 'END') {
          parseFormFields()
        }
      }, 100)
      
      if (instance.current_task === 'END' || !instance.current_task) {
        message.success('工作流执行完成！')
        setStep(3)
      } else {
        message.success('步骤执行成功，请继续填写表单')
        setStep(2)
      }
    } catch (error) {
      if (error.errorFields) {
        return
      }
      console.error('执行失败:', error)
      message.error('执行失败: ' + error.message)
    } finally {
      setExecuting(false)
    }
  }

  const handleReset = () => {
    setCurrentInstance(null)
    setFormFields([])
    setFormData({})
    setStep(0)
    form.resetFields()
  }

  const renderFormField = (field) => {
    switch (field.type) {
      case 'enum':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[{ required: true, message: `请输入${field.label}` }]}
          >
            <Radio.Group>
              {field.options.map(opt => (
                <Radio key={opt.id} value={opt.id}>
                  {opt.name}
                </Radio>
              ))}
            </Radio.Group>
          </Form.Item>
        )
      case 'boolean':
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            valuePropName="checked"
            rules={[{ required: true, message: `请选择${field.label}` }]}
          >
            <Switch checkedChildren="是" unCheckedChildren="否" />
          </Form.Item>
        )
      case 'string':
      default:
        return (
          <Form.Item
            key={field.id}
            name={field.id}
            label={field.label}
            rules={[{ required: true, message: `请输入${field.label}` }]}
          >
            <Input />
          </Form.Item>
        )
    }
  }

  const steps = [
    {
      title: '选择流程',
      icon: step === 0 ? <LoadingOutlined /> : <CheckCircleOutlined />
    },
    {
      title: '创建实例',
      icon: step === 1 ? <LoadingOutlined /> : step > 1 ? <CheckCircleOutlined /> : null
    },
    {
      title: '执行步骤',
      icon: step === 2 ? <LoadingOutlined /> : step > 2 ? <CheckCircleOutlined /> : null
    },
    {
      title: '完成',
      icon: step === 3 ? <CheckCircleOutlined /> : null
    }
  ]

  return (
    <div>
      <h2>工作流执行演示</h2>
      
      <Steps current={step} items={steps} style={{ marginBottom: 32 }} />

      <Card title="步骤 1: 选择流程定义" style={{ marginBottom: 16 }}>
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            placeholder="请选择流程定义"
            style={{ width: '100%' }}
            value={selectedProcessId}
            onChange={setSelectedProcessId}
            disabled={!!currentInstance}
            showSearch
            optionFilterProp="children"
          >
            {processes.map(process => (
              <Option key={process.id} value={process.id}>
                {process.name} (ID: {process.id})
              </Option>
            ))}
          </Select>
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={handleCreateInstance}
            loading={loading}
            disabled={!selectedProcessId || !!currentInstance}
          >
            创建流程实例
          </Button>
        </Space>
      </Card>

      {currentInstance && (
        <>
          <Card title="步骤 2: 当前实例信息" style={{ marginBottom: 16 }}>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label="实例 ID">{currentInstance.id}</Descriptions.Item>
              <Descriptions.Item label="当前任务">
                <Tag color={currentInstance.current_task === 'END' ? 'success' : 'processing'}>
                  {currentInstance.current_task || 'END'}
                </Tag>
              </Descriptions.Item>
            </Descriptions>
          </Card>

          {currentInstance.current_task && currentInstance.current_task !== 'END' && formFields.length > 0 && (
            <Card title="步骤 3: 填写表单并执行" style={{ marginBottom: 16 }}>
              <Form
                form={form}
                layout="vertical"
                onFinish={handleExecute}
              >
                {formFields.map(field => renderFormField(field))}
                <Form.Item>
                  <Space>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={executing}
                      icon={<PlayCircleOutlined />}
                    >
                      执行下一步
                    </Button>
                    <Button onClick={handleReset}>
                      重新开始
                    </Button>
                  </Space>
                </Form.Item>
              </Form>
            </Card>
          )}

          {currentInstance.current_task && currentInstance.current_task !== 'END' && formFields.length === 0 && (
            <Card title="步骤 3: 执行工作流" style={{ marginBottom: 16 }}>
              <p>当前任务: <strong>{currentInstance.current_task}</strong></p>
              <p>该任务不需要用户输入，将自动执行。</p>
              <Button
                type="primary"
                onClick={handleExecute}
                loading={executing}
                icon={<PlayCircleOutlined />}
              >
                继续执行
              </Button>
            </Card>
          )}

          {(!currentInstance.current_task || currentInstance.current_task === 'END') && (
            <Card title="工作流执行完成" style={{ marginBottom: 16 }}>
              <Space direction="vertical" style={{ width: '100%' }}>
                <Tag color="success" style={{ fontSize: 16, padding: '8px 16px' }}>
                  ✓ 工作流已成功执行完成
                </Tag>
                <Button onClick={handleReset}>
                  重新开始新的演示
                </Button>
              </Space>
            </Card>
          )}
        </>
      )}
    </div>
  )
}

export default WorkflowDemo

