const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne } = require('../utils/db');

// JWT密钥
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key';

// 生成JWT token
const generateToken = (admin) => {
  return jwt.sign(
    { id: admin.id, username: admin.username },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

// 登录
const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // 验证请求体
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: '用户名和密码不能为空'
      });
    }
    
    // 查询管理员
    const admin = await getOne('SELECT * FROM admins WHERE username = ?', [username]);
    
    // 如果管理员不存在
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, admin.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 生成token
    const token = generateToken(admin);
    
    // 返回结果
    res.json({
      success: true,
      data: {
        token,
        admin: {
          id: admin.id,
          username: admin.username
        }
      }
    });
  } catch (error) {
    console.error('登录时出错:', error);
    res.status(500).json({
      success: false,
      message: '服务器错误'
    });
  }
};

// 检查认证状态
const checkAuth = (req, res) => {
  res.json({
    success: true,
    data: {
      admin: req.user
    }
  });
};

module.exports = {
  login,
  checkAuth
}; 