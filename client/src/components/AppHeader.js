import React, { useContext, useState } from 'react';
import { Layout, Menu, Dropdown, Space, Avatar, Typography, Modal, Form, Input, message, Button } from 'antd';
import { UserOutlined, LogoutOutlined, LockOutlined } from '@ant-design/icons';
import AuthContext from '../context/AuthContext';
import api from '../services/api';

const { Header } = Layout;
const { Text } = Typography;

const AppHeader = () => {
  const { admin, logout } = useContext(AuthContext);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  const handleChangePassword = async (values) => {
    try {
      setLoading(true);
      const response = await api.post('/auth/change-password', {
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });

      if (response.data.success) {
        message.success('密码修改成功');
        form.resetFields();
        setPasswordModalVisible(false);
      } else {
        message.error(response.data.message || '密码修改失败');
      }
    } catch (error) {
      message.error(error.response?.data?.message || '密码修改失败');
    } finally {
      setLoading(false);
    }
  };

  // 用户菜单
  const userMenu = (
    <Menu
      items={[
        {
          key: 'changePassword',
          icon: <LockOutlined />,
          label: '修改密码',
          onClick: () => setPasswordModalVisible(true)
        },
        {
          key: 'logout',
          icon: <LogoutOutlined />,
          label: '退出登录',
          onClick: () => {
            if (typeof logout === 'function') {
              logout();
              // 添加跳转到登录页
              window.location.href = '/login';
            } else {
              console.error('logout is not a function');
              // 如果logout不是函数，手动清除token并重定向
              localStorage.removeItem('token');
              window.location.href = '/login';
            }
          }
        }
      ]}
    />
  );

  return (
    <>
      <Header style={{ 
        background: '#fff', 
        padding: '0 16px',
        display: 'flex',
        justifyContent: 'flex-end',
        alignItems: 'center',
        boxShadow: '0 1px 4px rgba(0,21,41,.08)'
      }}>
        <Dropdown overlay={userMenu} placement="bottomRight">
          <Space style={{ cursor: 'pointer' }}>
            <Avatar icon={<UserOutlined />} />
            <Text>{admin?.username || '管理员'}</Text>
          </Space>
        </Dropdown>
      </Header>

      <Modal
        title="修改密码"
        open={passwordModalVisible}
        onCancel={() => {
          setPasswordModalVisible(false);
          form.resetFields();
        }}
        footer={null}
      >
        <Form
          form={form}
          onFinish={handleChangePassword}
          layout="vertical"
        >
          <Form.Item
            name="currentPassword"
            label="当前密码"
            rules={[{ required: true, message: '请输入当前密码' }]}
          >
            <Input.Password placeholder="请输入当前密码" />
          </Form.Item>

          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码长度至少6位' }
            ]}
          >
            <Input.Password placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认新密码"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: '请确认新密码' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('两次输入的密码不一致'));
                },
              }),
            ]}
          >
            <Input.Password placeholder="请确认新密码" />
          </Form.Item>

          <Form.Item>
            <Space style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => {
                setPasswordModalVisible(false);
                form.resetFields();
              }}>
                取消
              </Button>
              <Button type="primary" htmlType="submit" loading={loading}>
                确认修改
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default AppHeader; 