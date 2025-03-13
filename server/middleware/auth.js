const jwt = require('jsonwebtoken');
const { getOne } = require('../utils/db');

// JWT密钥，应该从环境变量中获取
// 使用一个固定的密钥，避免服务器重启后密钥变化
const JWT_SECRET = process.env.JWT_SECRET || 'your-fixed-secret-key-for-jwt-tokens-do-not-change';

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    // 从请求头中获取token
    const authHeader = req.headers.authorization;
    
    // 添加调试日志
    console.log('认证中间件 - 请求路径:', req.path);
    console.log('认证中间件 - 认证头:', authHeader);
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.log('认证中间件 - 未提供有效的认证头');
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }
    
    // 提取token
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      console.log('认证中间件 - 令牌为空');
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }
    
    // 验证token
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log('认证中间件 - 令牌解码成功:', decoded);
      
      // 检查用户是否存在
      const user = await getOne('SELECT * FROM admins WHERE id = ?', [decoded.id]);
      
      if (!user) {
        console.log('认证中间件 - 用户不存在');
        return res.status(401).json({ 
          success: false, 
          message: '无效的认证令牌' 
        });
      }
      
      // 将用户信息和token添加到请求对象
      req.user = user;
      req.token = token;
      
      // 继续处理请求
      next();
    } catch (jwtError) {
      console.error('JWT验证错误:', jwtError);
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false, 
          message: '无效的认证令牌，请重新登录' 
        });
      }
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false, 
          message: '认证令牌已过期，请重新登录' 
        });
      }
      
      throw jwtError; // 重新抛出其他类型的JWT错误
    }
  } catch (error) {
    console.error('认证中间件错误:', error);
    
    res.status(401).json({ 
      success: false, 
      message: '认证失败，请重新登录' 
    });
  }
};

module.exports = { authenticate, JWT_SECRET }; 