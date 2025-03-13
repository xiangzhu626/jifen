import React, { useState, useEffect } from 'react';
import { 
  Card, Table, Input, Button, Typography, Row, Col, 
  Divider, Alert, Spin, Empty, Statistic, Badge, Layout
} from 'antd';
import { SearchOutlined, TrophyOutlined } from '@ant-design/icons';
import api from '../services/api';

const { Title, Text, Link } = Typography;
const { Header, Content, Footer } = Layout;

const PublicRanking = () => {
  const [loading, setLoading] = useState(false);
  const [rankingData, setRankingData] = useState([]);
  const [rankingError, setRankingError] = useState('');
  const [searchPlanetId, setSearchPlanetId] = useState('');
  const [searchResult, setSearchResult] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');

  // 获取排行榜数据
  const fetchRankingData = async () => {
    try {
      setLoading(true);
      setRankingError('');
      const response = await api.get('/points/ranking', {
        params: { limit: 10 }
      });
      
      if (response.data && response.data.success) {
        setRankingData(response.data.data || []);
      } else {
        setRankingError('获取排行榜数据失败');
      }
    } catch (error) {
      console.error('获取排行榜数据时出错:', error);
      setRankingError('无法加载排行榜数据，请稍后再试');
    } finally {
      setLoading(false);
    }
  };

  // 搜索会员积分
  const searchMemberPoints = async () => {
    if (!searchPlanetId.trim()) {
      setSearchError('请输入星球ID');
      return;
    }

    try {
      setSearchLoading(true);
      setSearchError('');
      setSearchResult(null);
      
      const response = await api.get('/points/search', {
        params: { planetId: searchPlanetId.trim() }
      });
      
      if (response.data && response.data.success && response.data.data) {
        setSearchResult(response.data.data);
      } else {
        setSearchError(response.data?.message || '未找到该星球ID对应的会员');
      }
    } catch (error) {
      console.error('搜索会员积分时出错:', error);
      if (error.response && error.response.status === 404) {
        setSearchError('未找到该星球ID对应的会员');
      } else {
        setSearchError('搜索失败，请稍后再试');
      }
    } finally {
      setSearchLoading(false);
    }
  };

  useEffect(() => {
    fetchRankingData();
  }, []);

  // 表格列配置
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <span className={`rank-${index < 3 ? index + 1 : 'normal'}`}>
          {index + 1}
        </span>
      )
    },
    {
      title: '会员昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '星球ID',
      dataIndex: 'planetId',
      key: 'planetId',
      render: text => text || '-'
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: points => (
        <Badge 
          count={points || 0} 
          showZero 
          overflowCount={9999}
          style={{ 
            backgroundColor: '#1890ff',
            fontWeight: 'bold'
          }} 
        />
      )
    }
  ];

  return (
    <Layout className="public-ranking-layout">
      <Header style={{ 
        background: '#fff', 
        padding: '0 50px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <TrophyOutlined style={{ fontSize: 24, color: '#1890ff', marginRight: 10 }} />
          <Title level={3} style={{ margin: 0 }}>会员积分排行榜</Title>
        </div>
      </Header>
      
      <Content style={{ padding: '24px 50px', maxWidth: 1200, margin: '0 auto' }}>
        <Row gutter={24}>
          <Col xs={24} md={16}>
            <Card 
              title={
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <TrophyOutlined style={{ marginRight: 8, color: '#faad14' }} />
                  <span>积分排行榜</span>
                </div>
              }
              extra={
                <Button type="link" onClick={fetchRankingData}>
                  刷新
                </Button>
              }
              bordered={false}
              style={{ marginBottom: 24 }}
            >
              {loading ? (
                <div style={{ textAlign: 'center', padding: '30px 0' }}>
                  <Spin size="large" />
                </div>
              ) : rankingError ? (
                <Alert 
                  message={rankingError} 
                  type="error" 
                  showIcon 
                  style={{ marginBottom: 16 }}
                />
              ) : rankingData.length > 0 ? (
                <Table 
                  columns={columns} 
                  dataSource={rankingData} 
                  rowKey="id"
                  pagination={false}
                  rowClassName={(record, index) => index < 3 ? `top-${index + 1}-row` : ''}
                />
              ) : (
                <Empty description="暂无排行数据" />
              )}
            </Card>
          </Col>
          
          <Col xs={24} md={8}>
            <Card 
              title="查询我的积分" 
              bordered={false}
              style={{ marginBottom: 24 }}
            >
              <div style={{ marginBottom: 16 }}>
                <Input
                  placeholder="请输入您的星球ID"
                  value={searchPlanetId}
                  onChange={e => setSearchPlanetId(e.target.value)}
                  onPressEnter={searchMemberPoints}
                  style={{ marginBottom: 16 }}
                />
                <Button 
                  type="primary" 
                  icon={<SearchOutlined />} 
                  loading={searchLoading}
                  onClick={searchMemberPoints}
                  block
                >
                  查询积分
                </Button>
              </div>
              
              {searchError && (
                <Alert 
                  message={searchError} 
                  type="error" 
                  showIcon 
                  style={{ marginBottom: 16 }}
                />
              )}
              
              {searchResult && (
                <div className="search-result">
                  <Divider>查询结果</Divider>
                  <div style={{ textAlign: 'center' }}>
                    <Title level={4}>{searchResult.nickname}</Title>
                    <Text type="secondary">星球ID: {searchResult.planetId || '未设置'}</Text>
                    <div style={{ margin: '16px 0' }}>
                      <Statistic 
                        title="当前积分" 
                        value={searchResult.points || 0} 
                        valueStyle={{ color: '#1890ff' }}
                      />
                    </div>
                    <Text type="secondary">
                      排名: {searchResult.rank ? `第 ${searchResult.rank} 名` : '暂无排名'}
                    </Text>
                  </div>
                </div>
              )}
            </Card>
            
            <Card bordered={false}>
              <Title level={5}>关于积分排行</Title>
              <Text type="secondary">
                积分排行榜每日更新，展示会员积分从高到低的排名情况。
                积分可通过参与活动、完成任务等方式获取。
              </Text>
            </Card>
          </Col>
        </Row>
      </Content>
      
      <Footer style={{ textAlign: 'center' }}>
        会员积分系统 ©{new Date().getFullYear()} Created with Ant Design
      </Footer>
      
      <style jsx="true">{`
        .top-1-row {
          background-color: rgba(255, 215, 0, 0.1);
        }
        .top-2-row {
          background-color: rgba(192, 192, 192, 0.1);
        }
        .top-3-row {
          background-color: rgba(205, 127, 50, 0.1);
        }
        .rank-1 {
          font-weight: bold;
          color: #ff4d4f;
          font-size: 18px;
        }
        .rank-2 {
          font-weight: bold;
          color: #faad14;
          font-size: 16px;
        }
        .rank-3 {
          font-weight: bold;
          color: #52c41a;
          font-size: 16px;
        }
      `}</style>
    </Layout>
  );
};

export default PublicRanking; 