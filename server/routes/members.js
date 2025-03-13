const express = require('express');
const router = express.Router();
const { 
  getAllMembers, 
  getMemberById, 
  createMember, 
  updateMember, 
  deleteMember 
} = require('../controllers/memberController');
const { authenticate } = require('../middleware/auth');

// 所有会员路由都需要认证
router.use(authenticate);

// 获取所有会员
router.get('/', getAllMembers);

// 获取单个会员
router.get('/:id', getMemberById);

// 创建会员
router.post('/', createMember);

// 更新会员
router.put('/:id', updateMember);

// 删除会员
router.delete('/:id', deleteMember);

module.exports = router; 