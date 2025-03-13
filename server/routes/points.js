const express = require('express');
const router = express.Router();
const { 
  getMemberPoints, 
  addPoints, 
  deductPoints, 
  getPointsTransactions,
  getPointsRanking,
  searchMemberPointsByPlanetId
} = require('../controllers/pointsController');
const { authenticate } = require('../middleware/auth');

// 公开路由 - 无需认证
// 获取积分排行榜
router.get('/ranking', getPointsRanking);

// 通过星球ID查询会员积分 - 新增公开API
router.get('/search', searchMemberPointsByPlanetId);

// 获取积分交易记录 - 公开路由
router.get('/transactions/:memberId', getPointsTransactions);

// 以下路由需要认证
router.use(authenticate);

// 获取会员积分
router.get('/:memberId', getMemberPoints);

// 增加积分
router.post('/add', addPoints);

// 扣减积分
router.post('/deduct', deductPoints);

module.exports = router; 