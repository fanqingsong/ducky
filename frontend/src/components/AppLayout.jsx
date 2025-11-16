import { Layout, Menu } from 'antd'
import { useNavigate, useLocation } from 'react-router-dom'
import {
  HomeOutlined,
  FileTextOutlined,
  PlayCircleOutlined,
  DatabaseOutlined,
  ApartmentOutlined
} from '@ant-design/icons'

const { Header, Content, Sider } = Layout

function AppLayout({ children }) {
  const navigate = useNavigate()
  const location = useLocation()

  const menuItems = [
    {
      key: '/',
      icon: <HomeOutlined />,
      label: '首页'
    },
    {
      key: '/processes',
      icon: <FileTextOutlined />,
      label: '流程定义管理'
    },
    {
      key: '/instances',
      icon: <DatabaseOutlined />,
      label: '流程实例管理'
    },
    {
      key: '/demo',
      icon: <PlayCircleOutlined />,
      label: '工作流演示'
    },
    {
      key: '/flow',
      icon: <ApartmentOutlined />,
      label: '执行流程图'
    }
  ]

  const handleMenuClick = ({ key }) => {
    navigate(key)
  }

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider collapsible>
        <div style={{ 
          height: 32, 
          margin: 16, 
          background: 'rgba(255, 255, 255, 0.3)',
          borderRadius: 4,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold'
        }}>
          Ducky
        </div>
        <Menu
          theme="dark"
          selectedKeys={[location.pathname]}
          mode="inline"
          items={menuItems}
          onClick={handleMenuClick}
        />
      </Sider>
      <Layout>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
        }}>
          <h1 style={{ margin: 0, fontSize: 20 }}>BPMN 工作流管理系统</h1>
        </Header>
        <Content style={{ 
          margin: '24px 16px', 
          padding: 24, 
          background: '#fff',
          minHeight: 280
        }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  )
}

export default AppLayout

