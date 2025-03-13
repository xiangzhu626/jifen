const express = require('express');
const router = express.Router();
const { login, checkAuth } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');

// 登录路由
router.post('/login', login);

// 检查认证状态 - 需要认证
router.get('/check', authenticate, checkAuth);

module.exports = router; 