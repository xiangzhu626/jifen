const jwt = require('jsonwebtoken');
const { getOne } = require('../utils/db');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 认证中间件
const authenticate = async (req, res, next) => {
  try {
    // 获取token
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: '未提供认证令牌' 
      });
    }
    
    // 验证token
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // 查询用户
    const admin = await getOne('SELECT id, username FROM admins WHERE id = ?', [decoded.id]);
    
    if (!admin) {
      return res.status(401).json({ 
        success: false, 
        message: '无效的认证令牌' 
      });
    }
    
    // 将用户信息附加到请求对象
    req.user = admin;
    req.token = token;
    
    next();
  } catch (error) {
    console.error('认证中间件错误:', error);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false, 
        message: '认证令牌已过期' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        success: false, 
        message: '无效的认证令牌' 
      });
    }
    
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  authenticate
}; 