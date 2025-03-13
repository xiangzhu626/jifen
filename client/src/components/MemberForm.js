import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message, InputNumber, Radio, Space } from 'antd';
import { UserOutlined, IdcardOutlined, PlusOutlined, MinusOutlined } from '@ant-design/icons';
import api from '../services/api';

const MemberForm = ({ member, onSuccess, mode = 'create' }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [pointsOperation, setPointsOperation] = useState('none');
  const [pointsAmount, setPointsAmount] = useState(0);
  const [pointsDescription, setPointsDescription] = useState('');

  useEffect(() => {
    if (member && mode === 'edit') {
      form.setFieldsValue({
        nickname: member.nickname,
        planetId: member.planetId
      });
    }
  }, [member, form, mode]);

  const handleSubmit = async (values) => {
    setLoading(true);
    try {
      let response;
      let pointsResponse;
      
      if (mode === 'create') {
        // 创建会员
        response = await api.post('/members', {
          nickname: values.nickname,
          planetId: values.planetId
        });
        
        // 如果设置了初始积分，则添加积分
        if (values.initialPoints && values.initialPoints > 0) {
          pointsResponse = await api.post('/points/add', {
            memberId: response.data.data.member.id,
            points: values.initialPoints,
            description: values.initialPointsDescription || '初始积分设置'
          });
        }
      } else {
        // 更新会员信息
        response = await api.put(`/members/${member.id}`, {
          nickname: values.nickname,
          planetId: values.planetId
        });
        
        // 处理积分操作
        if (pointsOperation === 'add' && pointsAmount > 0) {
          pointsResponse = await api.post('/points/add', {
            memberId: member.id,
            points: pointsAmount,
            description: pointsDescription || '手动增加积分'
          });
        } else if (pointsOperation === 'deduct' && pointsAmount > 0) {
          pointsResponse = await api.post('/points/deduct', {
            memberId: member.id,
            points: pointsAmount,
            description: pointsDescription || '手动抵扣积分'
          });
        }
      }

      message.success(mode === 'create' ? '会员创建成功！' : '会员信息更新成功！');
      
      if (pointsResponse) {
        message.success(pointsOperation === 'add' ? '积分增加成功！' : '积分抵扣成功！');
      }
      
      // 重置表单
      form.resetFields();
      setPointsOperation('none');
      setPointsAmount(0);
      setPointsDescription('');
      
      // 回调
      if (onSuccess) {
        onSuccess(response.data.data.member);
      }
    } catch (error) {
      console.error('提交表单时出错:', error);
      message.error(error.response?.data?.message || '操作失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form
      form={form}
      layout="vertical"
      onFinish={handleSubmit}
      initialValues={{ initialPoints: 0, initialPointsDescription: '' }}
    >
      <Form.Item
        name="nickname"
        label="会员昵称"
        rules={[{ required: true, message: '请输入会员昵称' }]}
      >
        <Input prefix={<UserOutlined />} placeholder="请输入会员昵称" />
      </Form.Item>

      <Form.Item
        name="planetId"
        label="星球ID"
      >
        <Input prefix={<IdcardOutlined />} placeholder="请输入星球ID" />
      </Form.Item>

      {mode === 'create' && (
        <>
          <Form.Item
            name="initialPoints"
            label="初始积分"
            tooltip="可以为新会员设置初始积分"
          >
            <InputNumber min={0} step={10} style={{ width: '100%' }} />
          </Form.Item>
          
          <Form.Item
            name="initialPointsDescription"
            label="操作说明"
            tooltip="记录初始积分的来源"
          >
            <Input placeholder="例如：注册奖励、开业活动、老会员转入等" />
          </Form.Item>
        </>
      )}

      {mode === 'edit' && member && (
        <div className="points-operation-section" style={{ marginBottom: 24, border: '1px solid #f0f0f0', padding: 16, borderRadius: 4 }}>
          <h3>积分操作</h3>
          <p>当前积分: <strong>{member.points || 0}</strong></p>
          
          <Form.Item label="操作类型">
            <Radio.Group 
              value={pointsOperation} 
              onChange={(e) => setPointsOperation(e.target.value)}
            >
              <Radio.Button value="none">不操作</Radio.Button>
              <Radio.Button value="add">增加积分</Radio.Button>
              <Radio.Button value="deduct">抵扣积分</Radio.Button>
            </Radio.Group>
          </Form.Item>
          
          {pointsOperation !== 'none' && (
            <Space direction="vertical" style={{ width: '100%' }}>
              <Form.Item label="积分数量">
                <InputNumber
                  min={1}
                  step={10}
                  style={{ width: '100%' }}
                  value={pointsAmount}
                  onChange={setPointsAmount}
                  prefix={pointsOperation === 'add' ? <PlusOutlined /> : <MinusOutlined />}
                />
              </Form.Item>
              
              <Form.Item label="操作说明">
                <Input
                  placeholder="请输入积分操作说明"
                  value={pointsDescription}
                  onChange={(e) => setPointsDescription(e.target.value)}
                />
              </Form.Item>
            </Space>
          )}
        </div>
      )}

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading} block>
          {mode === 'create' ? '创建会员' : '保存修改'}
        </Button>
      </Form.Item>
    </Form>
  );
};

export default MemberForm;