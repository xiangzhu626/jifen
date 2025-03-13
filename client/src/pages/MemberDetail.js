import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Table, Tag, Spin, 
  message, Modal, Descriptions, Space, Divider, Alert
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, ArrowLeftOutlined,
  PlusCircleOutlined, MinusCircleOutlined, ReloadOutlined
} from '@ant-design/icons';
import { formatDate, hasValidToken } from '../utils/helpers';
import MemberForm from '../components/MemberForm';

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [rawData, setRawData] = useState(null); // 存储原始响应数据
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 检查认证状态
  useEffect(() => {
    if (!hasValidToken()) {
      message.error('您需要登录才能访问此页面');
      navigate('/login');
    }
  }, [navigate]);

  // 获取会员信息
  const fetchMember = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 直接使用fetch发送请求，确保包含认证头
      const token = localStorage.getItem('token');
      console.log('正在获取会员信息，ID:', id);
      
      const response = await fetch(`/api/members/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      console.log('获取到的会员数据:', data);
      
      // 保存原始响应数据用于调试
      setRawData(data);
      
      // 直接设置会员数据，不进行复杂的条件判断
      if (data && typeof data === 'object') {
        // 如果数据是一个对象，直接设置为会员数据
        console.log('直接设置会员数据:', data);
        setMember(data);
      } else {
        console.error('会员数据格式不正确');
        setError('会员数据格式不正确，请检查API返回格式');
      }
    } catch (error) {
      console.error('获取会员信息时出错:', error);
      setError('获取会员信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 获取积分交易记录
  const fetchTransactions = async () => {
    try {
      setTransactionsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/points/transactions/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      const data = await response.json();
      
      if (response.ok && data.success) {
        setTransactions(data.data.transactions);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('获取积分交易记录时出错:', error);
      setTransactions([]);
    } finally {
      setTransactionsLoading(false);
    }
  };

  // 初始加载数据
  useEffect(() => {
    if (hasValidToken() && id) {
      fetchMember();
      fetchTransactions();
    }
  }, [id]);

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    // 暂时不处理分页
  };

  // 处理删除会员
  const handleDelete = () => {
    // 获取正确的会员数据
    const memberData = getMemberData();
    
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员 "${memberData?.nickname || '未知'}" 吗？此操作不可撤销，会员的所有积分和交易记录都将被删除。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`/api/members/${id}`, {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          const data = await response.json();
          
          if (response.ok && data.success) {
            message.success('会员删除成功');
            navigate('/members');
          } else {
            message.error(data.message || '删除会员失败');
          }
        } catch (error) {
          console.error('删除会员时出错:', error);
          message.error('删除会员失败');
        }
      }
    });
  };

  // 处理编辑成功
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    fetchMember();
    fetchTransactions();
  };

  // 手动刷新数据
  const handleRefresh = () => {
    fetchMember();
    fetchTransactions();
    message.success('数据已刷新');
  };

  // 获取正确的会员数据，处理各种嵌套情况
  const getMemberData = () => {
    if (!member) return null;
    
    // 检查各种可能的数据路径
    if (member.data && member.data.member) {
      return member.data.member; // 处理 { data: { member: {...} } } 格式
    } else if (member.member) {
      return member.member; // 处理 { member: {...} } 格式
    } else if (member.data) {
      return member.data; // 处理 { data: {...} } 格式
    }
    
    return member; // 直接返回 member 对象
  };

  // 积分交易记录表格列
  const transactionColumns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === 'add' ? 'green' : 'red'}>
          {type === 'add' ? <PlusCircleOutlined /> : <MinusCircleOutlined />} {type === 'add' ? '增加' : '扣减'}
        </Tag>
      )
    },
    {
      title: '积分数量',
      dataIndex: 'points',
      key: 'points'
    },
    {
      title: '交易说明',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDate(text)
    }
  ];

  // 渲染会员信息
  const renderMemberInfo = () => {
    if (loading) {
      return (
        <div style={{ textAlign: 'center', padding: '20px' }}>
          <Spin size="large" />
          <p>正在加载会员信息...</p>
        </div>
      );
    }

    if (error) {
      return (
        <Alert
          message="加载错误"
          description={error}
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      );
    }

    if (!member) {
      return (
        <Alert
          message="未找到会员"
          description="无法获取会员信息，请检查会员ID是否正确"
          type="warning"
          showIcon
          action={
            <Button size="small" type="primary" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      );
    }

    // 获取正确的会员数据
    const memberData = getMemberData();
    console.log('渲染会员信息，使用的数据:', memberData);

    if (!memberData) {
      return (
        <Alert
          message="数据结构错误"
          description="无法从响应中提取会员数据，请检查API返回格式"
          type="error"
          showIcon
          action={
            <Button size="small" type="primary" onClick={handleRefresh}>
              重试
            </Button>
          }
        />
      );
    }

    return (
      <div>
        <Descriptions bordered column={2}>
          <Descriptions.Item label="会员ID">{memberData.id}</Descriptions.Item>
          <Descriptions.Item label="会员昵称">{memberData.nickname}</Descriptions.Item>
          <Descriptions.Item label="星球ID">{memberData.planetId}</Descriptions.Item>
          <Descriptions.Item label="当前积分">
            <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
              {memberData.points}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间" span={2}>
            {formatDate(memberData.created_at)}
          </Descriptions.Item>
        </Descriptions>
      </div>
    );
  };

  return (
    <div className="member-detail-page">
      <Card
        title={
          <Space>
            <Button 
              icon={<ArrowLeftOutlined />} 
              onClick={() => navigate('/members')}
              style={{ marginRight: 8 }}
            />
            会员详情
          </Space>
        }
        extra={
          <Space>
            <Button 
              icon={<ReloadOutlined />}
              onClick={handleRefresh}
            >
              刷新
            </Button>
            <Button 
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
              disabled={!getMemberData()}
            >
              编辑会员
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDelete}
              disabled={!getMemberData()}
            >
              删除会员
            </Button>
          </Space>
        }
      >
        {renderMemberInfo()}

        <Divider />

        <Card title="积分交易记录">
          <Table
            columns={transactionColumns}
            dataSource={transactions}
            rowKey="id"
            pagination={transactions.length > 10 ? { pageSize: 10 } : false}
            loading={transactionsLoading}
            onChange={handleTableChange}
            locale={{ emptyText: '暂无交易记录' }}
          />
        </Card>
      </Card>

      <Modal
        title="编辑会员"
        visible={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <MemberForm 
          mode="edit" 
          member={getMemberData()} 
          onSuccess={handleEditSuccess} 
        />
      </Modal>
    </div>
  );
};

export default MemberDetail;