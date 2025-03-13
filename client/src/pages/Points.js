import React, { useState, useEffect, useCallback } from 'react';
import { 
  Card, Table, Typography, Space, 
  Button, Tag, Select, DatePicker, message 
} from 'antd';
import { 
  ReloadOutlined,
  PlusCircleOutlined, MinusCircleOutlined
} from '@ant-design/icons';
import { getPointsTransactions, getAllMembers } from '../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

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

const Points = () => {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState([]);
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10,
    total: 0
  });
  const [dateRange, setDateRange] = useState(null);
  const [members, setMembers] = useState([]);
  const [selectedMemberId, setSelectedMemberId] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const [membersLoaded, setMembersLoaded] = useState(false);

  // 获取所有会员
  const fetchMembers = async () => {
    try {
      setMembersLoaded(false);
      const response = await getAllMembers({ limit: 1000 });
      if (response.data && response.data.success) {
        const fetchedMembers = response.data.data.members;
        setMembers(fetchedMembers);
        setMembersLoaded(true);
        return fetchedMembers;
      }
      setMembersLoaded(true);
      return [];
    } catch (error) {
      console.error('获取会员列表时出错:', error);
      message.error('获取会员列表失败');
      setMembersLoaded(true);
      return [];
    }
  };

  // 获取积分交易记录
  const fetchTransactions = useCallback(async (page = 1, pageSize = 10, memberId = selectedMemberId, dates = dateRange) => {
    try {
      setLoading(true);
      
      // 确保会员数据已加载
      let membersToUse = members;
      if (!membersLoaded) {
        membersToUse = await fetchMembers();
      }
      
      if (!memberId) {
        // 如果没有选择会员，获取所有会员的交易记录（分页）
        const params = {
          page,
          limit: pageSize
        };
        
        // 如果有日期范围，添加到查询参数
        if (dates && dates.length === 2) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        
        // 使用一个特殊的API端点获取所有交易记录
        const response = await getPointsTransactions('all', params);
        
        if (response.data && response.data.success) {
          // 处理交易记录，确保每条记录都有会员信息
          const transactionsWithMember = response.data.data.transactions.map(tx => {
            // 查找对应的会员
            const member = membersToUse.find(m => m.id === tx.member_id);
            return {
              ...tx,
              member_nickname: member ? member.nickname : '未知会员'
            };
          });
          
          setTransactions(transactionsWithMember);
          setPagination({
            current: page,
            pageSize,
            total: response.data.data.pagination.total
          });
        } else {
          setTransactions([]);
          setPagination({
            current: page,
            pageSize,
            total: 0
          });
        }
      } else {
        // 如果选择了会员，则获取该会员的交易记录
        let params = {
          page,
          limit: pageSize
        };
        
        // 如果有日期范围，添加到查询参数
        if (dates && dates.length === 2) {
          params.startDate = dates[0].format('YYYY-MM-DD');
          params.endDate = dates[1].format('YYYY-MM-DD');
        }
        
        const response = await getPointsTransactions(memberId, params);
        
        if (response.data && response.data.success) {
          // 确保每条记录都有会员昵称
          const member = membersToUse.find(m => m.id === memberId);
          const memberNickname = member ? member.nickname : '未知会员';
          
          const transactionsWithMember = response.data.data.transactions.map(tx => ({
            ...tx,
            member_nickname: memberNickname,
            member_id: memberId
          }));
          
          setTransactions(transactionsWithMember);
          setPagination({
            current: page,
            pageSize,
            total: response.data.data.pagination.total
          });
        } else {
          setTransactions([]);
          setPagination({
            current: page,
            pageSize,
            total: 0
          });
        }
      }
    } catch (error) {
      console.error('获取积分交易记录时出错:', error);
      message.error('获取积分交易记录失败');
      setTransactions([]);
      setPagination({
        current: page,
        pageSize,
        total: 0
      });
    } finally {
      setLoading(false);
      setInitialized(true);
    }
  }, [members, selectedMemberId, dateRange, membersLoaded]);

  // 初始化：先获取会员列表，然后获取交易记录
  useEffect(() => {
    const init = async () => {
      try {
        // 先获取会员列表
        await fetchMembers();
        // 会员列表加载完成后，获取交易记录
        // 这里不需要再次调用fetchTransactions，因为下面的useEffect会在membersLoaded变为true时触发
      } catch (error) {
        console.error('初始化数据时出错:', error);
        setLoading(false);
        setInitialized(true);
      }
    };
    
    init();
  }, []);

  // 当会员数据加载完成后，获取交易记录
  useEffect(() => {
    if (membersLoaded) {
      fetchTransactions(1, pagination.pageSize);
    }
  }, [membersLoaded]);

  // 当选择的会员ID或日期范围变化时，重新获取交易记录
  useEffect(() => {
    if (initialized && membersLoaded) {
      // 重置到第一页
      fetchTransactions(1, pagination.pageSize);
    }
  }, [selectedMemberId, dateRange]);

  // 处理表格分页变化
  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize);
  };

  // 处理日期范围筛选
  const handleDateRangeChange = (dates) => {
    setDateRange(dates);
    // 不需要在这里调用fetchTransactions，因为useEffect会处理
  };

  // 处理重置筛选
  const handleResetFilters = () => {
    setDateRange(null);
    setSelectedMemberId(null);
    // 不需要在这里调用fetchTransactions，因为useEffect会处理
  };

  // 处理会员选择
  const handleMemberChange = (value) => {
    setSelectedMemberId(value);
    // 不需要在这里调用fetchTransactions，因为useEffect会处理
  };

  // 处理刷新按钮
  const handleRefresh = () => {
    fetchTransactions(pagination.current, pagination.pageSize);
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
      title: '会员',
      dataIndex: 'member_nickname',
      key: 'member_nickname',
      render: (text, record) => {
        // 如果会员数据已加载，尝试从members中查找
        if (membersLoaded && record.member_id) {
          const member = members.find(m => m.id === record.member_id);
          if (member) {
            return member.nickname;
          }
        }
        return text || '未知会员';
      }
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
      render: (text) => formatDate(text),
      defaultSortOrder: 'descend'
    }
  ];

  return (
    <div className="points-page">
      <Card
        title={
          <Title level={4}>积分交易记录</Title>
        }
        extra={
          <Space>
            <Select
              placeholder="选择会员"
              allowClear
              style={{ width: 200 }}
              value={selectedMemberId}
              onChange={handleMemberChange}
              showSearch
              optionFilterProp="children"
              loading={!membersLoaded}
            >
              {members.map(member => (
                <Option key={member.id} value={member.id}>{member.nickname}</Option>
              ))}
            </Select>
            <RangePicker
              value={dateRange}
              onChange={handleDateRangeChange}
            />
            <Button 
              icon={<ReloadOutlined />} 
              onClick={handleRefresh}
            >
              刷新
            </Button>
            <Button 
              onClick={handleResetFilters}
            >
              重置筛选
            </Button>
          </Space>
        }
      >
        {initialized && transactions.length === 0 && !loading ? (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <p>暂无交易记录</p>
            <Button type="primary" onClick={handleRefresh}>
              刷新
            </Button>
          </div>
        ) : (
          <Table
            columns={columns}
            dataSource={transactions}
            rowKey="id"
            pagination={pagination}
            loading={loading || !membersLoaded}
            onChange={handleTableChange}
            locale={{ emptyText: '暂无交易记录' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Points; 