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

  // 获取所有会员
  const fetchMembers = async () => {
    try {
      const response = await getAllMembers({ limit: 1000 });
      if (response.data && response.data.success) {
        setMembers(response.data.data.members);
        return response.data.data.members;
      }
      return [];
    } catch (error) {
      console.error('获取会员列表时出错:', error);
      message.error('获取会员列表失败');
      return [];
    }
  };

  // 获取积分交易记录
  const fetchTransactions = useCallback(async (page = 1, pageSize = 10, memberId = selectedMemberId, dates = dateRange) => {
    try {
      setLoading(true);
      console.log('Fetching transactions with:', { memberId, dates, page, pageSize });
      
      if (!memberId) {
        // 如果没有选择会员，获取所有会员的最新交易记录
        const allMembers = members.length > 0 ? members : await fetchMembers();
        if (allMembers.length === 0) {
          setLoading(false);
          setInitialized(true);
          setTransactions([]);
          setPagination({
            current: page,
            pageSize,
            total: 0
          });
          return;
        }
        
        // 为了性能考虑，我们只获取前10个会员的数据
        const limitedMembers = allMembers.slice(0, 10);
        let allTransactions = [];
        
        const fetchPromises = limitedMembers.map(async (member) => {
          try {
            const memberResponse = await getPointsTransactions(member.id, {
              page: 1,
              limit: 20 // 每个会员获取最新的20条记录
            });
            
            if (memberResponse.data && memberResponse.data.success) {
              return memberResponse.data.data.transactions.map(tx => ({
                ...tx,
                member_nickname: member.nickname,
                member_id: member.id
              }));
            }
            return [];
          } catch (error) {
            console.error(`获取会员 ${member.id} 的交易记录时出错:`, error);
            return [];
          }
        });
        
        // 并行获取所有会员的交易记录
        const results = await Promise.all(fetchPromises);
        results.forEach(memberTransactions => {
          allTransactions.push(...memberTransactions);
        });
        
        // 对所有交易记录按时间排序（最新的在前）
        allTransactions.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        // 应用日期范围筛选
        if (dates && dates.length === 2) {
          const startDate = dates[0].startOf('day').valueOf();
          const endDate = dates[1].endOf('day').valueOf();
          
          allTransactions = allTransactions.filter(tx => {
            const txDate = new Date(tx.created_at).valueOf();
            return txDate >= startDate && txDate <= endDate;
          });
        }
        
        // 分页处理
        const startIndex = (page - 1) * pageSize;
        const endIndex = Math.min(startIndex + pageSize, allTransactions.length);
        const paginatedTransactions = allTransactions.slice(startIndex, endIndex);
        
        console.log('设置交易记录:', paginatedTransactions.length);
        setTransactions(paginatedTransactions);
        setPagination({
          current: page,
          pageSize,
          total: allTransactions.length
        });
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
        
        console.log('Fetching member transactions with params:', params);
        const response = await getPointsTransactions(memberId, params);
        
        if (response.data && response.data.success) {
          // 确保每条记录都有会员昵称
          const member = members.find(m => m.id === memberId);
          const memberNickname = member ? member.nickname : '未知会员';
          
          const transactionsWithMember = response.data.data.transactions.map(tx => ({
            ...tx,
            member_nickname: memberNickname,
            member_id: memberId
          }));
          
          console.log('Member transactions received:', transactionsWithMember.length);
          setTransactions(transactionsWithMember);
          setPagination({
            current: page,
            pageSize,
            total: response.data.data.pagination.total
          });
        } else {
          console.log('No transactions found for member');
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
  }, [members, selectedMemberId, dateRange]);

  useEffect(() => {
    // 初始化时获取会员列表和交易记录
    const init = async () => {
      try {
        await fetchMembers();
        await fetchTransactions(1, 10, null, null);
      } catch (error) {
        console.error('初始化数据时出错:', error);
        setLoading(false);
        setInitialized(true);
      }
    };
    
    init();
  }, []);

  // 当选择的会员ID或日期范围变化时，重新获取交易记录
  useEffect(() => {
    if (initialized) {
      fetchTransactions(1, pagination.pageSize, selectedMemberId, dateRange);
    }
  }, [selectedMemberId, dateRange]);

  // 处理表格分页变化
  const handleTableChange = (newPagination) => {
    fetchTransactions(newPagination.current, newPagination.pageSize, selectedMemberId, dateRange);
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
    fetchTransactions(1, pagination.pageSize, selectedMemberId, dateRange);
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
      render: (text, record) => text || '未知会员'
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
            loading={loading}
            onChange={handleTableChange}
            locale={{ emptyText: '暂无交易记录' }}
          />
        )}
      </Card>
    </div>
  );
};

export default Points; 