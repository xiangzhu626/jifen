const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getOne, runQuery } = require('../utils/db');
const { JWT_SECRET } = require('../middleware/auth');

// 生成JWT令牌
const generateToken = (user) => {
  return jwt.sign(
    { id: user.id, username: user.username },
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
    
    // 查询用户
    const user = await getOne('SELECT * FROM admins WHERE username = ?', [username]);
    
    // 用户不存在
    if (!user) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 验证密码
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: '用户名或密码错误'
      });
    }
    
    // 生成令牌
    const token = generateToken(user);
    
    // 返回用户信息和令牌
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          username: user.username
        }
      }
    });
  } catch (error) {
    console.error('登录错误:', error);
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
      user: {
        id: req.user.id,
        username: req.user.username
      }
    }
  });
};

// 修改管理员密码
const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const adminId = req.user.id;  // 从认证中间件获取管理员ID

    // 验证请求数据
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码和新密码都不能为空'
      });
    }

    // 获取管理员信息
    const admin = await getOne('SELECT * FROM admins WHERE id = ?', [adminId]);
    if (!admin) {
      return res.status(404).json({
        success: false,
        message: '管理员不存在'
      });
    }

    // 验证当前密码
    const isValidPassword = await bcrypt.compare(currentPassword, admin.password);
    if (!isValidPassword) {
      return res.status(400).json({
        success: false,
        message: '当前密码错误'
      });
    }

    // 加密新密码
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // 更新密码
    await runQuery(
      'UPDATE admins SET password = ? WHERE id = ?',
      [hashedPassword, adminId]
    );

    res.json({
      success: true,
      message: '密码修改成功'
    });
  } catch (error) {
    console.error('修改密码时出错:', error);
    res.status(500).json({
      success: false,
      message: '修改密码失败: ' + error.message
    });
  }
};

module.exports = {
  login,
  checkAuth,
  changePassword
}; 