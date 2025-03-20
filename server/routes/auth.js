const express = require('express');
const router = express.Router();
const { login, checkAuth, changePassword } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 登录路由
router.post('/login', login);

// 检查认证状态 - 需要认证
router.get('/check', authenticate, checkAuth);

// 添加修改密码路由
router.post('/change-password', authenticate, changePassword);

module.exports = router; 