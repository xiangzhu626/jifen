import React, { useState, useEffect, useContext } from 'react';
import { Row, Col, Card, Statistic, Table, Typography, Button } from 'antd';
import { TeamOutlined, GiftOutlined, RiseOutlined, FallOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const { Title } = Typography;

const Dashboard = () => {
  const { admin } = useContext(AuthContext);
  const [stats, setStats] = useState({
    totalMembers: 0,
    totalPoints: 0,
    addedPointsToday: 0,
    deductedPointsToday: 0
  });
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // 获取统计数据
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        
        // 获取会员总数
        const membersResponse = await api.get('/api/members');
        const totalMembers = membersResponse.data.data.pagination.total;
        
        // 获取最近的积分交易记录
        const transactionsResponse = await api.get('/api/points/transactions', {
          params: { limit: 5 }
        });
        
        // 计算积分统计数据
        let totalPoints = 0;
        let addedPointsToday = 0;
        let deductedPointsToday = 0;
        
        // 使用交易记录中的数据计算统计信息
        const transactions = transactionsResponse.data.data.transactions;
        setRecentTransactions(transactions);
        
        // 简单模拟统计数据
        totalPoints = transactions.reduce((sum, transaction) => {
          if (transaction.type === '增加') {
            return sum + transaction.points;
          } else {
            return sum - transaction.points;
          }
        }, 0);
        
        // 今日数据（简化处理，实际应从后端获取）
        const today = new Date().toISOString().split('T')[0];
        transactions.forEach(transaction => {
          const transactionDate = transaction.created_at.split('T')[0];
          if (transactionDate === today) {
            if (transaction.type === '增加') {
              addedPointsToday += transaction.points;
            } else {
              deductedPointsToday += transaction.points;
            }
          }
        });
        
        setStats({
          totalMembers,
          totalPoints: Math.max(0, totalPoints),
          addedPointsToday,
          deductedPointsToday
        });
      } catch (error) {
        console.error('获取统计数据时出错:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchStats();
  }, []);
  
  // 表格列定义
  const columns = [
    {
      title: '会员',
      dataIndex: 'member_nickname',
      key: 'member_nickname'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <span style={{ color: text === '增加' ? '#52c41a' : '#f5222d' }}>
          {text}
        </span>
      )
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points'
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    }
  ];
  
  return (
    <div>
      <Title level={2}>控制面板</Title>
      <Title level={4}>欢迎回来，{admin?.username}</Title>
      
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="会员总数"
              value={stats.totalMembers}
              prefix={<TeamOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="积分总量"
              value={stats.totalPoints}
              prefix={<GiftOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日增加积分"
              value={stats.addedPointsToday}
              prefix={<RiseOutlined />}
              valueStyle={{ color: '#3f8600' }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="今日抵扣积分"
              value={stats.deductedPointsToday}
              prefix={<FallOutlined />}
              valueStyle={{ color: '#cf1322' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>
      
      <Card
        title="最近积分交易"
        extra={
          <Link to="/admin/points/history">
            <Button type="link">查看更多</Button>
          </Link>
        }
      >
        <Table
          columns={columns}
          dataSource={recentTransactions}
          rowKey="id"
          loading={loading}
          pagination={false}
        />
      </Card>
    </div>
  );
};

export default Dashboard; 