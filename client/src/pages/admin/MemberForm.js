import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Card, message, Typography, Spin } from 'antd';
import { UserOutlined, PhoneOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../services/api';

const { Title } = Typography;

const MemberForm = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(false);
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  
  // 如果是编辑模式，获取会员信息
  useEffect(() => {
    if (isEditing) {
      const fetchMember = async () => {
        try {
          setInitialLoading(true);
          const response = await api.get(`/api/members/${id}`);
          
          if (response.data.success) {
            const member = response.data.data.member;
            form.setFieldsValue({
              nickname: member.nickname,
              phone: member.phone,
              email: member.email
            });
          } else {
            message.error(response.data.message);
            navigate('/admin/members');
          }
        } catch (error) {
          console.error('获取会员信息时出错:', error);
          message.error('获取会员信息失败，请稍后重试');
          navigate('/admin/members');
        } finally {
          setInitialLoading(false);
        }
      };
      
      fetchMember();
    }
  }, [isEditing, id, form, navigate]);
  
  // 处理表单提交
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      let response;
      if (isEditing) {
        // 更新会员
        response = await api.put(`/api/members/${id}`, values);
      } else {
        // 创建会员
        response = await api.post('/api/members', values);
      }
      
      if (response.data.success) {
        message.success(isEditing ? '会员信息更新成功' : '会员创建成功');
        navigate('/admin/members');
      } else {
        message.error(response.data.message);
      }
    } catch (error) {
      console.error(isEditing ? '更新会员信息时出错:' : '创建会员时出错:', error);
      message.error(
        error.response?.data?.message || 
        (isEditing ? '更新会员信息失败，请稍后重试' : '创建会员失败，请稍后重试')
      );
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div>
      <Title level={2}>{isEditing ? '编辑会员' : '添加会员'}</Title>
      
      <Card>
        <Spin spinning={initialLoading}>
          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            initialValues={{
              nickname: '',
              phone: '',
              email: ''
            }}
          >
            <Form.Item
              name="nickname"
              label="昵称"
              rules={[
                { required: true, message: '请输入会员昵称' },
                { max: 50, message: '昵称不能超过50个字符' }
              ]}
            >
              <Input prefix={<UserOutlined />} placeholder="请输入会员昵称" />
            </Form.Item>
            
            <Form.Item
              name="phone"
              label="手机号"
              rules={[
                { pattern: /^1[3-9]\d{9}$/, message: '请输入有效的手机号码', validateTrigger: 'onBlur' }
              ]}
            >
              <Input prefix={<PhoneOutlined />} placeholder="请输入手机号（选填）" />
            </Form.Item>
            
            <Form.Item
              name="email"
              label="邮箱"
              rules={[
                { type: 'email', message: '请输入有效的邮箱地址', validateTrigger: 'onBlur' }
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="请输入邮箱（选填）" />
            </Form.Item>
            
            <Form.Item>
              <Button type="primary" htmlType="submit" loading={loading}>
                {isEditing ? '更新' : '创建'}
              </Button>
              <Button 
                style={{ marginLeft: 8 }} 
                onClick={() => navigate('/admin/members')}
              >
                取消
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </Card>
    </div>
  );
};

export default MemberForm; 