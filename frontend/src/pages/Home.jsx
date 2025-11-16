import { Card, Row, Col, Typography, Space } from 'antd'
import { FileTextOutlined, DatabaseOutlined, PlayCircleOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Title, Paragraph } = Typography

function Home() {
  const navigate = useNavigate()

  const cards = [
    {
      title: '流程定义管理',
      icon: <FileTextOutlined style={{ fontSize: 48, color: '#1890ff' }} />,
      description: '创建、编辑和管理 BPMN 流程定义',
      path: '/processes'
    },
    {
      title: '流程实例管理',
      icon: <DatabaseOutlined style={{ fontSize: 48, color: '#52c41a' }} />,
      description: '查看和管理所有流程实例',
      path: '/instances'
    },
    {
      title: '工作流演示',
      icon: <PlayCircleOutlined style={{ fontSize: 48, color: '#faad14' }} />,
      description: '创建流程实例并执行完整的工作流',
      path: '/demo'
    }
  ]

  return (
    <div>
      <Title level={2}>欢迎使用 Ducky 工作流管理系统</Title>
      <Paragraph>
        Ducky 是一个基于 BPMN 2.0 标准的工作流引擎，支持流程定义、实例管理和工作流执行。
      </Paragraph>
      <Row gutter={[24, 24]} style={{ marginTop: 32 }}>
        {cards.map((card, index) => (
          <Col xs={24} sm={24} md={8} key={index}>
            <Card
              hoverable
              style={{ textAlign: 'center', height: '100%' }}
              onClick={() => navigate(card.path)}
            >
              <Space direction="vertical" size="large" style={{ width: '100%' }}>
                {card.icon}
                <Title level={4}>{card.title}</Title>
                <Paragraph>{card.description}</Paragraph>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  )
}

export default Home

