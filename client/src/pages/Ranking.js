import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Layout, Card, List, Typography, Button, Spin, Empty, Badge, Avatar, Alert } from 'antd';
import { TrophyOutlined, UserOutlined, LoginOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Header, Content, Footer } = Layout;
const { Title, Text } = Typography;

// 模拟数据，当API不可用时使用
const mockRanking = [
  { id: 1, nickname: '张三', points: 1200 },
  { id: 2, nickname: '李四', points: 980 },
  { id: 3, nickname: '王五', points: 850 },
  { id: 4, nickname: '赵六', points: 720 },
  { id: 5, nickname: '钱七', points: 650 }
];

const Ranking = () => {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [apiAvailable, setApiAvailable] = useState(true);
  
  // 获取积分排行榜数据
  useEffect(() => {
    const fetchRanking = async () => {
      try {
        setLoading(true);
        const response = await api.get('/api/points/ranking', {
          params: { limit: 20 },
          timeout: 5000 // 设置超时时间为5秒
        });
        
        if (response.data.success) {
          setRanking(response.data.data.ranking);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        console.error('获取积分排行榜时出错:', error);
        setError('获取积分排行榜失败，可能是后端服务未启动');
        setApiAvailable(false);
        // 使用模拟数据
        setRanking(mockRanking);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRanking();
  }, []);
  
  // 渲染排名标记
  const renderRankBadge = (index) => {
    if (index === 0) {
      return <Badge count={1} style={{ backgroundColor: '#ffcc00' }} />;
    } else if (index === 1) {
      return <Badge count={2} style={{ backgroundColor: '#c0c0c0' }} />;
    } else if (index === 2) {
      return <Badge count={3} style={{ backgroundColor: '#cd7f32' }} />;
    } else {
      return <Badge count={index + 1} style={{ backgroundColor: '#52c41a' }} />;
    }
  };
  
  return (
    <Layout className="layout">
      <Header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="logo">积分系统</div>
        <Link to="/login">
          <Button type="primary" icon={<LoginOutlined />}>
            管理员登录
          </Button>
        </Link>
      </Header>
      
      <Content style={{ padding: '0 50px' }}>
        <div className="site-layout-content">
          {!apiAvailable && (
            <Alert
              message="后端服务未启动"
              description="当前显示的是模拟数据。请启动后端服务以查看实际数据。"
              type="warning"
              showIcon
              style={{ marginBottom: 16 }}
            />
          )}
          
          <Card className="ranking-card">
            <Title level={2} className="ranking-title">
              <TrophyOutlined style={{ marginRight: 8 }} />
              会员积分排行榜
            </Title>
            
            {loading ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Spin size="large" tip="加载中..." />
              </div>
            ) : error && apiAvailable ? (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <Empty description={error} />
              </div>
            ) : (
              <List
                dataSource={ranking}
                renderItem={(item, index) => (
                  <List.Item>
                    <div className="ranking-item" style={{ width: '100%' }}>
                      <div className={`ranking-number ranking-number-${index < 3 ? index + 1 : ''}`}>
                        {index + 1}
                      </div>
                      <div className="ranking-info">
                        <div className="ranking-name">
                          <Avatar icon={<UserOutlined />} style={{ marginRight: 8 }} />
                          {item.nickname}
                        </div>
                      </div>
                      <div className="ranking-points">
                        {item.points} 积分
                      </div>
                    </div>
                  </List.Item>
                )}
                locale={{ emptyText: '暂无积分数据' }}
              />
            )}
          </Card>
        </div>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        会员积分系统 ©{new Date().getFullYear()} 版权所有
      </Footer>
    </Layout>
  );
};

export default Ranking; 