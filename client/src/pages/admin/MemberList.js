import React, { useState, useEffect } from 'react';
import { Table, Card, Button, Input, Space, Popconfirm, message, Typography, Tag } from 'antd';
import { PlusOutlined, SearchOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';

const { Title } = Typography;

const MemberList = () => {
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();
  
  // 获取会员列表
  const fetchMembers = async (page = 1, limit = 10, searchTerm = '') => {
    try {
      setLoading(true);
      const response = await api.get('/api/members', {
        params: {
          page,
          limit,
          search: searchTerm
        }
      });
      
      if (response.data.success) {
        setMembers(response.data.data.members);
        setPagination({
          current: response.data.data.pagination.page,
          pageSize: response.data.data.pagination.limit,
          total: response.data.data.pagination.total
        });
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error('获取会员列表时出错:', error);
      message.error('获取会员列表失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchMembers();
  }, []);
  
  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    fetchMembers(pagination.current, pagination.pageSize, search);
  };
  
  // 处理搜索
  const handleSearch = () => {
    fetchMembers(1, pagination.pageSize, search);
  };
  
  // 处理搜索输入变化
  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };
  
  // 处理搜索按键事件
  const handleSearchKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };
  
  // 处理删除会员
  const handleDelete = async (id) => {
    try {
      const response = await api.delete(`/api/members/${id}`);
      
      if (response.data.success) {
        message.success('会员删除成功');
        fetchMembers(pagination.current, pagination.pageSize, search);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error('删除会员时出错:', error);
      message.error('删除会员失败，请稍后重试');
    }
  };
  
  // 表格列定义
  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
      width: 80
    },
    {
      title: '昵称',
      dataIndex: 'nickname',
      key: 'nickname'
    },
    {
      title: '手机号',
      dataIndex: 'phone',
      key: 'phone',
      render: (text) => text || '-'
    },
    {
      title: '邮箱',
      dataIndex: 'email',
      key: 'email',
      render: (text) => text || '-'
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (text) => (
        <Tag color={text > 0 ? 'green' : 'default'}>
          {text || 0}
        </Tag>
      ),
      sorter: (a, b) => a.points - b.points
    },
    {
      title: '注册时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (text) => new Date(text).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (_, record) => (
        <Space size="middle">
          <Button
            type="primary"
            icon={<EditOutlined />}
            size="small"
            onClick={() => navigate(`/admin/members/edit/${record.id}`)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除此会员吗？"
            description="删除后将无法恢复，会员的所有积分记录也将被删除。"
            onConfirm={() => handleDelete(record.id)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="primary"
              danger
              icon={<DeleteOutlined />}
              size="small"
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      )
    }
  ];
  
  return (
    <div>
      <Title level={2}>会员管理</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Space style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between' }}>
          <Input
            placeholder="搜索会员昵称、手机号或邮箱"
            value={search}
            onChange={handleSearchChange}
            onKeyPress={handleSearchKeyPress}
            style={{ width: 300 }}
            prefix={<SearchOutlined />}
            allowClear
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => navigate('/admin/members/add')}
          >
            添加会员
          </Button>
        </Space>
        
        <Table
          columns={columns}
          dataSource={members}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default MemberList; 