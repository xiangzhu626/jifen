import React, { useContext } from 'react';
import { Layout, Menu, Dropdown, Space, Avatar, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import AuthContext from '../context/AuthContext';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const { admin, logout } = useContext(AuthContext);

  // 用户菜单
  const userMenu = (
    <Menu
      items={[
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '退出登录',
          onClick: () => {
            if (typeof logout === 'function') {
              logout();
              // 重定向到登录页
              window.location.href = '/login';
            } else {
              console.error('logout is not a function');
              // 如果logout不是函数，手动清除token并重定向
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }
        }
      ]}
    />
  );

  return (
    <Header style={{ 
      background: '#fff', 
      padding: '0 16px',
      display: 'flex',
      justifyContent: 'flex-end',
      alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0,21,41,.08)'
    }}>
      <Dropdown overlay={userMenu} placement="bottomRight">
        <Space style={{ cursor: 'pointer' }}>
          <Avatar icon={<UserOutlined />} />
          <Text>{admin?.username || '管理员'}</Text>
        </Space>
      </Dropdown>
    </Header>
  );
};

export default AppHeader; 