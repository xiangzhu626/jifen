import axios from 'axios';

// 创建axios实例
const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// 请求拦截器 - 添加token
api.interceptors.request.use(
  config => {
    // 对于公开路由，不需要添加token
    const publicRoutes = [
      '/points/ranking',
      '/points/search',
      '/auth/login'
    ];
    
    // 检查当前请求是否是公开路由
    const isPublicRoute = publicRoutes.some(route => 
      config.url.includes(route) && (config.method === 'get' || config.url.includes('/auth/login'))
    );
    
    // 如果不是公开路由，则添加token
    if (!isPublicRoute) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => {
    return response;
  },
  error => {
    if (error.response) {
      // 如果是401错误，可能是token过期，清除token并跳转到登录页
      if (error.response.status === 401) {
        localStorage.removeItem('token');
        // 只有在非登录页面才跳转
        if (window.location.pathname !== '/login' && 
            !window.location.pathname.includes('/public/')) {
          window.location.href = '/login';
        }
      }
      
      // 显示错误信息
      console.error('API错误:', error.response);
    } else {
      console.error('API请求失败:', error.message);
    }
    
    return Promise.reject(error);
  }
);

// 登录
export const login = async (username, password) => {
  try {
    console.log('登录请求参数:', { username, password });
    const response = await api.post('/auth/login', { username, password });
    console.log('登录响应:', response.data);
    return response.data;
  } catch (error) {
    console.error('登录请求错误:', error);
    if (error.response && error.response.data) {
      console.error('服务器返回的错误:', error.response.data);
    }
    throw error;
  }
};

// 检查认证状态
export const checkAuth = async () => {
  try {
    const response = await api.get('/auth/check');
    return response.data;
  } catch (error) {
    throw error;
  }
};

// 会员相关API函数
export const getAllMembers = async (params) => {
  return await api.get('/members', { params });
};

export const getMemberById = async (id) => {
  return await api.get(`/members/${id}`);
};

export const createMember = async (data) => {
  return await api.post('/members', data);
};

export const updateMember = async (id, data) => {
  return await api.put(`/members/${id}`, data);
};

export const deleteMember = async (id) => {
  return await api.delete(`/members/${id}`);
};

// 积分相关API函数
export const getMemberPoints = async (memberId) => {
  return await api.get(`/points/${memberId}`);
};

export const addPoints = async (data) => {
  return await api.post('/points/add', data);
};

export const deductPoints = async (data) => {
  return await api.post('/points/deduct', data);
};

export const getPointsTransactions = async (memberId, params = {}) => {
  // 确保memberId是一个有效的值
  if (!memberId || typeof memberId === 'object') {
    console.error('Invalid memberId:', memberId);
    return Promise.reject(new Error('Invalid memberId'));
  }
  
  return await api.get(`/points/transactions/${memberId}`, { params });
};

export const getPointsRanking = async (limit = 10) => {
  return await api.get('/points/ranking', { params: { limit } });
};

export default api;