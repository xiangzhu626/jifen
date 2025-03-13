import React, { useState, useContext } from 'react';
import { Form, Input, Button, Card, Typography, message, Layout } from 'antd';
import { UserOutlined, LockOutlined } from '@ant-design/icons';
import { useNavigate, Navigate } from 'react-router-dom';
import { login } from '../services/api';
import AuthContext from '../context/AuthContext';

const { Title } = Typography;
const { Content } = Layout;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, setAuth } = useContext(AuthContext);
  
  // 如果已经登录，重定向到首页
  if (isAuthenticated) {
    return <Navigate to="/" />;
  }
  
  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      // 确保用户名和密码都有值
      if (!values.username || !values.password) {
        message.error('用户名和密码不能为空');
        return;
      }
      
      const response = await login(values.username, values.password);
      
      if (response.success) {
        // 保存token到localStorage
        localStorage.setItem('token', response.data.token);
        
        // 更新认证状态
        if (typeof setAuth === 'function') {
          setAuth(response.data.admin, response.data.token);
        } else {
          console.error('setAuth is not a function:', setAuth);
          // 如果setAuth不是函数，手动刷新页面
          window.location.href = '/';
          return;
        }
        
        message.success('登录成功');
        navigate('/');
      } else {
        message.error(response.message || '登录失败');
      }
    } catch (error) {
      console.error('登录失败:', error);
      
      if (error.response && error.response.data) {
        message.error(error.response.data.message || '用户名或密码错误');
      } else {
        message.error('登录失败，请稍后再试');
      }
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Layout style={{ minHeight: '100vh', background: '#f0f2f5' }}>
      <Content style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center',
        padding: '50px 20px'
      }}>
        <Card 
          style={{ 
            width: '100%', 
            maxWidth: 400,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Title level={2} style={{ margin: 0 }}>会员积分系统</Title>
            <p style={{ color: '#999' }}>管理员登录</p>
          </div>
          
          <Form
            name="login"
            initialValues={{ remember: true }}
            onFinish={handleSubmit}
            size="large"
          >
            <Form.Item
              name="username"
              rules={[{ required: true, message: '请输入用户名' }]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="用户名" 
              />
            </Form.Item>
            
            <Form.Item
              name="password"
              rules={[{ required: true, message: '请输入密码' }]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="密码" 
              />
            </Form.Item>
            
            <Form.Item>
              <Button 
                type="primary" 
                htmlType="submit" 
                loading={loading}
                block
              >
                登录
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Content>
    </Layout>
  );
};

export default Login; 