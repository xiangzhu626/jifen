import React, { useState, useEffect } from 'react';
import { 
  Table, Card, Button, Input, Space, Typography, Tag, Select, DatePicker,
  Form, Row, Col
} from 'antd';
import { SearchOutlined, FilterOutlined, ReloadOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;

const PointsHistory = () => {
  const [form] = Form.useForm();
  const [transactions, setTransactions] = useState([]);
  const [members, setMembers] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({
    memberId: undefined,
    type: undefined,
    dateRange: undefined
  });
  
  // 获取会员列表
  useEffect(() => {
    const fetchMembers = async () => {
      try {
        const response = await api.get('/api/members', {
          params: { limit: 100 }
        });
        
        if (response.data.success) {
          setMembers(response.data.data.members);
        }
      } catch (error) {
        console.error('获取会员列表时出错:', error);
      }
    };
    
    fetchMembers();
  }, []);
  
  // 获取积分交易记录
  const fetchTransactions = async (page = 1, limit = 10, filters = {}) => {
    try {
      setLoading(true);
      
      const params = {
        page,
        limit
      };
      
      // 添加筛选条件
      if (filters.memberId) {
        params.memberId = filters.memberId;
      }
      
      if (filters.type) {
        params.type = filters.type;
      }
      
      // 日期范围筛选（实际应在后端实现）
      // 这里简化处理，前端展示即可
      
      let url = '/api/points/transactions';
      if (filters.memberId) {
        url = `/api/points/transactions/member/${filters.memberId}`;
      }
      
      const response = await api.get(url, { params });
      
      if (response.data.success) {
        setTransactions(response.data.data.transactions);
        setPagination({
          current: response.data.data.pagination.page,
          pageSize: response.data.data.pagination.limit,
          total: response.data.data.pagination.total
        });
      }
    } catch (error) {
      console.error('获取积分交易记录时出错:', error);
    } finally {
      setLoading(false);
    }
  };
  
  // 初始加载
  useEffect(() => {
    fetchTransactions();
  }, []);
  
  // 处理表格分页变化
  const handleTableChange = (pagination) => {
    fetchTransactions(pagination.current, pagination.pageSize, filters);
  };
  
  // 处理筛选
  const handleFilter = (values) => {
    const newFilters = {
      memberId: values.memberId,
      type: values.type,
      dateRange: values.dateRange
    };
    
    setFilters(newFilters);
    fetchTransactions(1, pagination.pageSize, newFilters);
  };
  
  // 重置筛选
  const handleReset = () => {
    form.resetFields();
    setFilters({
      memberId: undefined,
      type: undefined,
      dateRange: undefined
    });
    fetchTransactions(1, pagination.pageSize, {});
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
      title: '会员',
      dataIndex: 'member_nickname',
      key: 'member_nickname'
    },
    {
      title: '类型',
      dataIndex: 'type',
      key: 'type',
      render: (text) => (
        <Tag color={text === '增加' ? 'green' : 'red'}>
          {text}
        </Tag>
      )
    },
    {
      title: '积分',
      dataIndex: 'points',
      key: 'points',
      render: (text, record) => (
        <span style={{ color: record.type === '增加' ? '#52c41a' : '#f5222d' }}>
          {record.type === '增加' ? '+' : '-'}{text}
        </span>
      )
    },
    {
      title: '描述',
      dataIndex: 'description',
      key: 'description'
    },
    {
      title: '操作人',
      dataIndex: 'admin_username',
      key: 'admin_username'
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
      <Title level={2}>积分历史记录</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Form
          form={form}
          layout="horizontal"
          onFinish={handleFilter}
          initialValues={{
            memberId: undefined,
            type: undefined,
            dateRange: undefined
          }}
        >
          <Row gutter={16}>
            <Col xs={24} sm={8}>
              <Form.Item name="memberId" label="会员">
                <Select
                  allowClear
                  placeholder="选择会员"
                  style={{ width: '100%' }}
                >
                  {members.map(member => (
                    <Option key={member.id} value={member.id}>
                      {member.nickname}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item name="type" label="类型">
                <Select
                  allowClear
                  placeholder="选择类型"
                  style={{ width: '100%' }}
                >
                  <Option value="增加">增加</Option>
                  <Option value="抵扣">抵扣</Option>
                </Select>
              </Form.Item>
            </Col>
            
            <Col xs={24} sm={8}>
              <Form.Item name="dateRange" label="日期范围">
                <RangePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
          
          <Row>
            <Col span={24} style={{ textAlign: 'right' }}>
              <Button type="primary" htmlType="submit" icon={<FilterOutlined />} style={{ marginRight: 8 }}>
                筛选
              </Button>
              <Button onClick={handleReset} icon={<ReloadOutlined />}>
                重置
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
      
      <Card>
        <Table
          columns={columns}
          dataSource={transactions}
          rowKey="id"
          pagination={pagination}
          loading={loading}
          onChange={handleTableChange}
        />
      </Card>
    </div>
  );
};

export default PointsHistory; 