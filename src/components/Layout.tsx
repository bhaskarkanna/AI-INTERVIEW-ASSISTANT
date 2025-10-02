import React from 'react';
import { Layout as AntLayout, Tabs, Typography } from 'antd';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';

const { Header, Content } = AntLayout;
const { Title } = Typography;

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActiveKey = () => {
    if (location.pathname.includes('/interviewee')) return 'interviewee';
    if (location.pathname.includes('/interviewer')) return 'interviewer';
    return 'interviewee';
  };

  const handleTabChange = (key: string) => {
    if (key === 'interviewee') {
      navigate('/interviewee');
    } else if (key === 'interviewer') {
      navigate('/interviewer');
    }
  };

  const tabItems = [
    {
      key: 'interviewee',
      label: (
        <span>
          <UserOutlined />
          Interviewee
        </span>
      ),
    },
    {
      key: 'interviewer',
      label: (
        <span>
          <DashboardOutlined />
          Interviewer
        </span>
      ),
    },
  ];

  return (
    <AntLayout style={{ 
      minHeight: '100vh', 
      height: '100vh', 
      width: '100vw',
      display: 'flex',
      flexDirection: 'column'
    }}>
      <Header style={{ 
        background: '#fff', 
        padding: '0 24px', 
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0
      }}>
        <Title level={3} style={{ margin: 0, color: '#1890ff' }}>
          AI Interview Assistant
        </Title>
        <Tabs
          activeKey={getActiveKey()}
          onChange={handleTabChange}
          items={tabItems}
          style={{ margin: 0 }}
        />
      </Header>
      <Content style={{ 
        padding: '24px', 
        background: '#f5f5f5',
        flex: 1,
        overflow: 'auto',
        height: 'calc(100vh - 64px)'
      }}>
        {children}
      </Content>
    </AntLayout>
  );
};

export default Layout;
