import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Statistic, Table, Spin, Typography } from 'antd';
import { TeamOutlined, TrophyOutlined, RiseOutlined } from '@ant-design/icons';
import { getAllMembers, getPointsRanking } from '../services/api';

const { Title } = Typography;

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPoints: 0,
    avgPoints: 0
  });
  const [topMembers, setTopMembers] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // 获取会员数据
        const membersResponse = await getAllMembers({ limit: 1000 });
        const members = membersResponse.data.data.members;
        
        // 计算统计数据
        const totalMembers = members.length;
        const totalPoints = members.reduce((sum, member) => sum + (member.points || 0), 0);
        const avgPoints = totalMembers > 0 ? Math.round(totalPoints / totalMembers) : 0;
        
        setStats({
          totalMembers,
          totalPoints,
          avgPoints
        });
        
        // 获取积分排行榜
        const rankingResponse = await getPointsRanking(5);
        setTopMembers(rankingResponse.data.data.ranking);
        
      } catch (error) {
        console.error('获取仪表盘数据时出错:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // 排行榜表格列
  const columns = [
    {
      title: '排名',
      key: 'rank',
      render: (_, __, index) => index + 1
    },
    {
      title: '会员昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <span style={{ color: '#1890ff', fontWeight: 'bold' }}>
          {points}
        </span>
      )
    }
  ];

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <Title level={2}>仪表盘</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="会员总数"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="积分总量"
              value={stats.totalPoints}
              prefix={<TrophyOutlined />}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="平均积分"
              value={stats.avgPoints}
              prefix={<RiseOutlined />}
            />
          </Card>
        </Col>
      </Row>
      
      <Card title="积分排行榜 TOP 5" style={{ marginBottom: 24 }}>
        <Table
          columns={columns}
          dataSource={topMembers}
          rowKey="id"
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 