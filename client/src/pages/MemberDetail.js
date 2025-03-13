import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Card, Button, Tabs, Table, Tag, Spin, 
  message, Modal, Descriptions, Space, Divider 
} from 'antd';
import { 
  EditOutlined, DeleteOutlined, ArrowLeftOutlined,
  PlusCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import api from '../services/api';
import MemberForm from '../components/MemberForm';

const { TabPane } = Tabs;

// 格式化日期
const formatDate = (dateString) => {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
};

const MemberDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [editModalVisible, setEditModalVisible] = useState(false);

  // 获取会员信息
  const fetchMember = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/members/${id}`);
      setMember(response.data.data.member);
    } catch (error) {
      console.error('获取会员信息时出错:', error);
      message.error('获取会员信息失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取积分交易记录
  const fetchTransactions = async (page = 1, pageSize = 10) => {
    try {
      setTransactionsLoading(true);
      const response = await api.get(`/points/transactions/member/${id}`, {
        params: {
          page,
          limit: pageSize
        }
      });
      
      setTransactions(response.data.data.transactions);
      setPagination({
        current: page,
        pageSize,
        total: response.data.data.pagination.total
      });
    } catch (error) {
      console.error('获取积分交易记录时出错:', error);
      message.error('获取积分交易记录失败');
    } finally {
      setTransactionsLoading(false);
    }
  };

  useEffect(() => {
    fetchMember();
    fetchTransactions();
  }, [id]);

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    fetchTransactions(pagination.current, pagination.pageSize);
  };

  // 处理删除会员
  const handleDelete = () => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员 "${member?.nickname}" 吗？此操作不可撤销，会员的所有积分和交易记录都将被删除。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/members/${id}`);
          message.success('会员删除成功');
          navigate('/members');
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

  // 积分交易记录表格列
  const transactionColumns = [
    {
      title: '交易类型',
      dataIndex: 'type',
      key: 'type',
      render: (type) => (
        <Tag color={type === '增加' ? 'green' : 'red'}>
          {type === '增加' ? <PlusCircleOutlined /> : <MinusCircleOutlined />} {type}
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
      title: '操作人',
      dataIndex: 'admin_username',
      key: 'admin_username',
      render: (text) => text || '-'
    },
    {
      title: '交易时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDate(text)
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
              type="primary" 
              icon={<EditOutlined />}
              onClick={() => setEditModalVisible(true)}
            >
              编辑会员
            </Button>
            <Button 
              danger 
              icon={<DeleteOutlined />}
              onClick={handleDelete}
            >
              删除会员
            </Button>
          </Space>
        }
      >
        <Descriptions bordered column={2}>
          <Descriptions.Item label="会员ID">{member?.id}</Descriptions.Item>
          <Descriptions.Item label="会员昵称">{member?.nickname}</Descriptions.Item>
          <Descriptions.Item label="星球ID">{member?.planetId || '-'}</Descriptions.Item>
          <Descriptions.Item label="当前积分">
            <span style={{ color: '#1890ff', fontWeight: 'bold', fontSize: '16px' }}>
              {member?.points || 0}
            </span>
          </Descriptions.Item>
          <Descriptions.Item label="注册时间" span={2}>{formatDate(member?.created_at)}</Descriptions.Item>
        </Descriptions>

        <Divider />

        <Tabs defaultActiveKey="transactions">
          <TabPane tab="积分交易记录" key="transactions">
            <Table
              columns={transactionColumns}
              dataSource={transactions}
              rowKey="id"
              pagination={pagination}
              loading={transactionsLoading}
              onChange={handleTableChange}
            />
          </TabPane>
        </Tabs>
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
          member={member} 
          onSuccess={handleEditSuccess} 
        />
      </Modal>
    </div>
  );
};

export default MemberDetail;