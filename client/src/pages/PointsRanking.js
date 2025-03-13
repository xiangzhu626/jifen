import React, { useState, useEffect } from 'react';
import { Card, Table, Typography, Spin, InputNumber, Button, Space } from 'antd';
import { TrophyOutlined, ReloadOutlined } from '@ant-design/icons';
import { getPointsRanking } from '../services/api';

const { Title } = Typography;

const PointsRanking = () => {
  const [loading, setLoading] = useState(true);
  const [ranking, setRanking] = useState([]);
  const [limit, setLimit] = useState(10);

  // 获取积分排行榜
  const fetchRanking = async (limitValue = limit) => {
    try {
      setLoading(true);
      const response = await getPointsRanking(limitValue);
      setRanking(response.data.data.ranking);
    } catch (error) {
      console.error('获取积分排行榜时出错:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRanking();
  }, []);

  // 处理刷新
  const handleRefresh = () => {
    fetchRanking();
  };

  // 处理限制数量变化
  const handleLimitChange = (value) => {
    setLimit(value);
  };

  // 应用新的限制数量
  const applyLimit = () => {
    fetchRanking(limit);
  };

  // 表格列
  const columns = [
    {
      title: '排名',
      key: 'rank',
      width: 80,
      render: (_, __, index) => (
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '36px',
          height: '36px',
          borderRadius: '50%',
          background: index < 3 ? ['#f56a00', '#ffc53d', '#bfbfbf'][index] : '#f0f0f0',
          color: index < 3 ? 'white' : 'rgba(0, 0, 0, 0.65)',
          fontWeight: 'bold',
          margin: '0 auto'
        }}>
          {index + 1}
        </div>
      )
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
        <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
          {points}
        </span>
      ),
      sorter: (a, b) => a.points - b.points,
      defaultSortOrder: 'descend'
    }
  ];

  return (
    <div className="points-ranking-page">
      <Card
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <TrophyOutlined style={{ marginRight: 8, color: '#ffc53d' }} />
            <Title level={4} style={{ margin: 0 }}>积分排行榜</Title>
          </div>
        }
        extra={
          <Space>
            <span>显示数量:</span>
            <InputNumber
              min={5}
              max={100}
              value={limit}
              onChange={handleLimitChange}
              style={{ width: 80 }}
            />
            <Button type="primary" onClick={applyLimit}>应用</Button>
            <Button icon={<ReloadOutlined />} onClick={handleRefresh}>刷新</Button>
          </Space>
        }
      >
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px' }}>
            <Spin size="large" />
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={ranking}
            rowKey="id"
            pagination={false}
          />
        )}
      </Card>
    </div>
  );
};

export default PointsRanking; 