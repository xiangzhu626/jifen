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
    // 添加调试日志
    console.log('API请求:', config.method.toUpperCase(), config.url);
    
    // 对于公开路由，不需要添加token
    const publicRoutes = [
      '/points/ranking',
      '/points/search',
      '/points/transactions/',
      '/auth/login'
    ];
    
    // 检查当前请求是否是公开路由
    const isPublicRoute = publicRoutes.some(route => 
      config.url.includes(route) && (config.method === 'get' || config.url.includes('/auth/login'))
    );
    
    console.log('是否是公开路由:', isPublicRoute);
    
    // 如果不是公开路由，则添加token
    if (!isPublicRoute) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
        console.log('已添加认证令牌');
      } else {
        console.log('警告: 非公开路由但没有找到token');
      }
    }
    
    return config;
  },
  error => {
    console.error('请求拦截器错误:', error);
    return Promise.reject(error);
  }
);

// 响应拦截器 - 处理错误
api.interceptors.response.use(
  response => {
    console.log('API响应:', response.status, response.config.url);
    return response;
  },
  error => {
    if (error.response) {
      console.error('API错误:', error.response.status, error.config.url);
      
      // 如果是401错误，可能是token过期，清除token并跳转到登录页
      if (error.response.status === 401) {
        console.error('收到401错误，请求URL:', error.config.url);
        console.error('请求方法:', error.config.method);
        console.error('请求头:', JSON.stringify(error.config.headers));
        
        // 检查是否是因为token缺失或无效
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('本地存储中没有token');
        }
        
        // 清除token
        localStorage.removeItem('token');
        
        // 只有在非登录页面才跳转
        if (window.location.pathname !== '/login' && 
            !window.location.pathname.includes('/public/')) {
          console.error('重定向到登录页面');
          // 使用延迟跳转，确保其他代码有机会执行
          setTimeout(() => {
            window.location.href = '/login';
          }, 100);
        }
      }
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
  // 确保添加token到请求头
  const token = localStorage.getItem('token');
  const headers = {};
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  console.log('获取会员详情, ID:', id, '认证头:', headers);
  return await api.get(`/members/${id}`, { headers });
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

// 修改为使用api实例，确保请求拦截器能正确处理
export const getPointsTransactions = (memberId, params = {}) => {
  return api.get(`/points/transactions/${memberId}`, { params });
};

export const getPointsRanking = async (limit = 10) => {
  return await api.get('/points/ranking', { params: { limit } });
};

export default api;