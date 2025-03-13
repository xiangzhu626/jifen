import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Card, Button, Table, Input, Space, Tag, 
  Modal, message, Tooltip, Badge 
} from 'antd';
import { 
  PlusOutlined, SearchOutlined, EditOutlined, 
  DeleteOutlined, EyeOutlined 
} from '@ant-design/icons';
import api from '../services/api';
import MemberForm from '../components/MemberForm';

const { Search } = Input;

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

const Members = () => {
  const navigate = useNavigate();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [search, setSearch] = useState('');
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [currentMember, setCurrentMember] = useState(null);

  // 获取会员列表
  const fetchMembers = async (page = 1, pageSize = 10, searchTerm = '') => {
    try {
      setLoading(true);
      const response = await api.get('/members', {
        params: {
          page,
          limit: pageSize,
          search: searchTerm
        }
      });
      
      setMembers(response.data.data.members);
      setPagination({
        current: page,
        pageSize,
        total: response.data.data.pagination.total
      });
    } catch (error) {
      console.error('获取会员列表时出错:', error);
      message.error('获取会员列表失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMembers(pagination.current, pagination.pageSize, search);
  }, []);

  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    fetchMembers(pagination.current, pagination.pageSize, search);
  };

  // 处理搜索
  const handleSearch = (value) => {
    setSearch(value);
    fetchMembers(1, pagination.pageSize, value);
  };

  // 处理删除会员
  const handleDelete = (member) => {
    Modal.confirm({
      title: '确认删除',
      content: `确定要删除会员 "${member.nickname}" 吗？此操作不可撤销，会员的所有积分和交易记录都将被删除。`,
      okText: '确认',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        try {
          await api.delete(`/members/${member.id}`);
          message.success('会员删除成功');
          fetchMembers(pagination.current, pagination.pageSize, search);
        } catch (error) {
          console.error('删除会员时出错:', error);
          message.error('删除会员失败');
        }
      }
    });
  };

  // 处理编辑会员
  const handleEdit = (member) => {
    setCurrentMember(member);
    setEditModalVisible(true);
  };

  // 处理创建成功
  const handleCreateSuccess = () => {
    setCreateModalVisible(false);
    fetchMembers(1, pagination.pageSize, search);
  };

  // 处理编辑成功
  const handleEditSuccess = () => {
    setEditModalVisible(false);
    setCurrentMember(null);
    fetchMembers(pagination.current, pagination.pageSize, search);
  };

  // 表格列
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '会员昵称',
      dataIndex: 'nickname',
      key: 'nickname',
      render: (text, record) => (
        <a onClick={() => navigate(`/members/${record.id}`)}>{text}</a>
      )
    },
    {
      title: '星球ID',
      dataIndex: 'planetId',
      key: 'planetId',
      render: (text) => text || '-'
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (points) => (
        <Badge 
          count={points || 0} 
          showZero 
          overflowCount={9999}
          style={{ 
            backgroundColor: points > 0 ? '#1890ff' : '#d9d9d9',
            fontWeight: 'bold'
          }} 
        />
      ),
      sorter: (a, b) => (a.points || 0) - (b.points || 0)
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => formatDate(text)
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="查看详情">
            <Button 
              type="text" 
              icon={<EyeOutlined />} 
              onClick={() => navigate(`/members/${record.id}`)}
            />
          </Tooltip>
          <Tooltip title="编辑会员">
            <Button 
              type="text" 
              icon={<EditOutlined />} 
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="删除会员">
            <Button 
              type="text" 
              danger
              icon={<DeleteOutlined />} 
              onClick={() => handleDelete(record)}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  return (
    <div className="members-page">
      <Card
        title="会员管理"
        extra={
          <Space>
            <Search
              placeholder="搜索会员昵称/星球ID"
              allowClear
              enterButton={<SearchOutlined />}
              onSearch={handleSearch}
              style={{ width: 250 }}
            />
            <Button 
              type="primary" 
              icon={<PlusOutlined />}
              onClick={() => setCreateModalVisible(true)}
            >
              新增会员
            </Button>
          </Space>
        }
      >
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>

      {/* 新增会员弹窗 */}
      <Modal
        title="新增会员"
        visible={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <MemberForm 
          mode="create" 
          onSuccess={handleCreateSuccess} 
        />
      </Modal>

      {/* 编辑会员弹窗 */}
      <Modal
        title="编辑会员"
        visible={editModalVisible}
        onCancel={() => {
          setEditModalVisible(false);
          setCurrentMember(null);
        }}
        footer={null}
        width={600}
      >
        {currentMember && (
          <MemberForm 
            mode="edit" 
            member={currentMember} 
            onSuccess={handleEditSuccess} 
          />
        )}
      </Modal>
    </div>
  );
};

export default Members;