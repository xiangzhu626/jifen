import React, { useState, useEffect } from 'react';
import { 
  Form, Input, Button, Card, message, Typography, Radio, 
  InputNumber, Select, Divider, Row, Col, Descriptions, Empty, Spin 
} from 'antd';
import { UserOutlined, GiftOutlined, SearchOutlined } from '@ant-design/icons';
import api from '../../services/api';

const { Title, Text } = Typography;
const { Option } = Select;

const PointsManage = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [members, setMembers] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [selectedMember, setSelectedMember] = useState(null);
  const [operationType, setOperationType] = useState('add');
  
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
        message.error('获取会员列表失败，请稍后重试');
      }
    };
    
    fetchMembers();
  }, []);
  
  // 处理会员选择变化
  const handleMemberChange = async (memberId) => {
    if (!memberId) {
      setSelectedMember(null);
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await api.get(`/api/points/member/${memberId}`);
      
      if (response.data.success) {
        setSelectedMember({
          id: response.data.data.member.id,
          nickname: response.data.data.member.nickname,
          points: response.data.data.points
        });
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error('获取会员积分信息时出错:', error);
      message.error('获取会员积分信息失败，请稍后重试');
    } finally {
      setSearchLoading(false);
    }
  };
  
  // 处理操作类型变化
  const handleOperationTypeChange = (e) => {
    setOperationType(e.target.value);
  };
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    if (!selectedMember) {
      message.error('请先选择会员');
      return;
    }
    
    try {
      setLoading(true);
      
      const data = {
        memberId: selectedMember.id,
        points: values.points,
        description: values.description
      };
      
      let response;
      if (operationType === 'add') {
        response = await api.post('/api/points/add', data);
      } else {
        response = await api.post('/api/points/deduct', data);
      }
      
      if (response.data.success) {
        message.success(operationType === 'add' ? '积分增加成功' : '积分抵扣成功');
        
        // 更新选中会员的积分信息
        setSelectedMember({
          ...selectedMember,
          points: response.data.data.currentPoints
        });
        
        // 重置表单
        form.resetFields(['points', 'description']);
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error('操作积分时出错:', error);
      message.error(
        error.response?.data?.message || 
        (operationType === 'add' ? '增加积分失败，请稍后重试' : '抵扣积分失败，请稍后重试')
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <Title level={2}>积分管理</Title>
      
      <Card style={{ marginBottom: 16 }}>
        <Form layout="vertical">
          <Form.Item label="选择会员">
            <Select
              showSearch
              placeholder="请输入会员昵称或ID搜索"
              optionFilterProp="children"
              onChange={handleMemberChange}
              loading={searchLoading}
              style={{ width: '100%' }}
              filterOption={(input, option) =>
                option.children.toLowerCase().indexOf(input.toLowerCase()) >= 0
              }
            >
              {members.map(member => (
                <Option key={member.id} value={member.id}>
                  {member.nickname} (ID: {member.id})
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Form>
        
        {selectedMember ? (
          <Spin spinning={searchLoading}>
            <Descriptions title="会员信息" bordered>
              <Descriptions.Item label="ID">{selectedMember.id}</Descriptions.Item>
              <Descriptions.Item label="昵称">{selectedMember.nickname}</Descriptions.Item>
              <Descriptions.Item label="当前积分">
                <Text strong style={{ color: '#1890ff', fontSize: 16 }}>
                  {selectedMember.points}
                </Text>
              </Descriptions.Item>
            </Descriptions>
          </Spin>
        ) : (
          <Empty description="请先选择会员" />
        )}
      </Card>
      
      {selectedMember && (
        <Card title="积分操作">
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              operationType: 'add',
              points: 0,
              description: ''
            }}
          >
            <Form.Item label="操作类型" name="operationType">
              <Radio.Group onChange={handleOperationTypeChange} defaultValue="add">
                <Radio.Button value="add">增加积分</Radio.Button>
                <Radio.Button value="deduct">抵扣积分</Radio.Button>
              </Radio.Group>
            </Form.Item>
            
            <Form.Item
              name="points"
              label="积分数量"
              rules={[
                { required: true, message: '请输入积分数量' },
                { type: 'number', min: 1, message: '积分数量必须大于0' },
                {
                  validator: (_, value) => {
                    if (operationType === 'deduct' && value > selectedMember.points) {
                      return Promise.reject('抵扣积分不能超过当前积分余额');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入积分数量"
                min={1}
                max={operationType === 'deduct' ? selectedMember.points : undefined}
              />
            </Form.Item>
            
            <Form.Item
              name="description"
              label="描述"
              rules={[
                { max: 100, message: '描述不能超过100个字符' }
              ]}
            >
              <Input.TextArea
                placeholder={`请输入${operationType === 'add' ? '增加' : '抵扣'}积分的原因或描述`}
                rows={3}
              />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {operationType === 'add' ? '增加积分' : '抵扣积分'}
              </Button>
            </Form.Item>
          </Form>
        </Card>
      )}
    </div>
  );
};

export default PointsManage; 