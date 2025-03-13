import React, { useState, useContext } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, Button, Dropdown, Space, Avatar } from 'antd';
import {
  DashboardOutlined,
  TeamOutlined,
  GiftOutlined,
  HistoryOutlined,
  UserOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined
} from '@ant-design/icons';
import { AuthContext } from '../context/AuthContext';

const { Header, Sider, Content } = Layout;

const AdminLayout = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { admin, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  
  // 获取当前选中的菜单项
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path === '/admin') return ['dashboard'];
    if (path.includes('/admin/members') && !path.includes('/add') && !path.includes('/edit')) return ['members'];
    if (path.includes('/admin/members/add') || path.includes('/admin/members/edit')) return ['members'];
    if (path === '/admin/points') return ['points'];
    if (path === '/admin/points/history') return ['points_history'];
    return ['dashboard'];
  };
  
  // 处理登出
  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  
  // 用户菜单
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: '个人信息'
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: '退出登录'
      }
    ],
    onClick: ({ key }) => {
      if (key === 'logout') {
        handleLogout();
      }
    }
  };
  
  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sider trigger={null} collapsible collapsed={collapsed} breakpoint="lg" 
        collapsedWidth={window.innerWidth < 768 ? 0 : 80}>
        <div className="logo">
          {!collapsed ? '会员积分系统' : '积分'}
        </div>
        <Menu
          theme="dark"
          mode="inline"
          selectedKeys={getSelectedKey()}
          items={[
            {
              key: 'dashboard',
              icon: <DashboardOutlined />,
              label: <Link to="/admin">控制面板</Link>
            },
            {
              key: 'members',
              icon: <TeamOutlined />,
              label: <Link to="/admin/members">会员管理</Link>
            },
            {
              key: 'points',
              icon: <GiftOutlined />,
              label: <Link to="/admin/points">积分管理</Link>
            },
            {
              key: 'points_history',
              icon: <HistoryOutlined />,
              label: <Link to="/admin/points/history">积分历史</Link>
            }
          ]}
        />
      </Sider>
      <Layout className="site-layout">
        <Header className="site-layout-background" style={{ padding: 0, background: '#fff' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingRight: 24 }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={() => setCollapsed(!collapsed)}
              style={{ fontSize: '16px', width: 64, height: 64 }}
            />
            <Space>
              <Button type="link" onClick={() => navigate('/')}>
                前台首页
              </Button>
              <Dropdown menu={userMenu}>
                <Space style={{ cursor: 'pointer' }}>
                  <Avatar icon={<UserOutlined />} />
                  {admin?.username}
                </Space>
              </Dropdown>
            </Space>
          </div>
        </Header>
        <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280, background: '#fff' }}>
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminLayout; 