import React, { useState } from 'react';
import { Layout, Menu, Tooltip } from 'antd';
import { 
  TeamOutlined, 
  GiftOutlined, 
  TrophyOutlined,
  GlobalOutlined
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider } = Layout;

const AppSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  // 确定当前选中的菜单项
  const getSelectedKeys = () => {
    const path = location.pathname;
    if (path.startsWith('/members')) return ['members'];
    if (path === '/points') return ['points'];
    if (path === '/points/ranking') return ['ranking'];
    return [];
  };

  return (
    <Sider 
      collapsible 
      collapsed={collapsed} 
      onCollapse={setCollapsed}
      style={{
        overflow: 'auto',
        height: '100vh',
        position: 'sticky',
        top: 0,
        left: 0,
      }}
    >
      <div className="logo" style={{ 
        height: '32px', 
        margin: '16px', 
        background: 'rgba(255, 255, 255, 0.3)',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: collapsed ? '14px' : '18px',
        fontWeight: 'bold'
      }}>
        {collapsed ? '积分' : '会员积分系统'}
      </div>
      <Menu 
        theme="dark" 
        mode="inline" 
        selectedKeys={getSelectedKeys()}
        items={[
          {
            key: 'members',
            icon: <TeamOutlined />,
            label: '会员管理',
            onClick: () => navigate('/members')
          },
          {
            key: 'points',
            icon: <GiftOutlined />,
            label: '积分交易记录',
            onClick: () => navigate('/points')
          },
          {
            key: 'publicRanking',
            icon: (
              <Tooltip title="此页面可公开访问，无需登录" placement="right">
                <GlobalOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            ),
            label: (
              <span>
                公开排行榜
                <span style={{ 
                  marginLeft: 8, 
                  fontSize: '12px', 
                  padding: '0 6px', 
                  background: '#52c41a', 
                  color: 'white', 
                  borderRadius: '10px',
                  display: collapsed ? 'none' : 'inline-block'
                }}>
                  公开
                </span>
              </span>
            ),
            onClick: () => window.open('/public/ranking', '_blank')
          }
        ]}
      />
    </Sider>
  );
};

export default AppSidebar; 