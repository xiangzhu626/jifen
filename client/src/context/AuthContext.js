import React, { createContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { login as apiLogin, checkAuth } from '../services/api';

// 创建认证上下文
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [isAuthenticated, setIsAuthenticated] = useState(!!token);
  const [loading, setLoading] = useState(true);

  // 设置认证状态
  const setAuth = (adminData, tokenData) => {
    setAdmin(adminData);
    setToken(tokenData);
    setIsAuthenticated(true);
  };

  // 清除认证状态
  const logout = () => {
    localStorage.removeItem('token');
    setAdmin(null);
    setToken(null);
    setIsAuthenticated(false);
  };

  // 初始化时检查认证状态
  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const response = await checkAuth();
          if (response.success) {
            setAdmin(response.data.admin);
            setIsAuthenticated(true);
          } else {
            logout();
          }
        } catch (error) {
          console.error('验证认证状态时出错:', error);
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  // 登录
  const login = async (credentials) => {
    try {
      console.log('尝试登录:', credentials);
      const response = await apiLogin(credentials);
      console.log('登录响应:', response);
      
      // 检查响应格式
      if (!response.data || !response.data.success) {
        throw new Error(response.data?.message || '登录失败，服务器返回了无效的响应');
      }
      
      const { token: newToken, admin: newAdmin } = response.data.data;
      
      if (!newToken) {
        throw new Error('登录失败，服务器没有返回令牌');
      }
      
      // 保存令牌和管理员信息
      localStorage.setItem('token', newToken);
      localStorage.setItem('admin', JSON.stringify(newAdmin));
      
      // 更新状态
      setAdmin(newAdmin);
      setToken(newToken);
      setIsAuthenticated(true);
      
      message.success('登录成功');
      return true;
    } catch (error) {
      console.error('登录时出错:', error);
      
      // 提取错误消息
      let errorMessage = '登录失败，请检查用户名和密码';
      if (error.response) {
        errorMessage = error.response.data?.message || `服务器错误: ${error.response.status}`;
      } else if (error.request) {
        errorMessage = '无法连接到服务器，请检查网络连接';
      } else {
        errorMessage = error.message;
      }
      
      message.error(errorMessage);
      throw error;
    }
  };

  // 提供上下文值
  const contextValue = {
    admin,
    token,
    isAuthenticated,
    loading,
    setAuth,
    logout,
    login
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext; 