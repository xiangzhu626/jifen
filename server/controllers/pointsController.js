const { getAll, getOne, runQuery } = require('../utils/db');

// 获取会员积分
const getMemberPoints = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    if (!memberId) {
      return res.status(400).json({ 
        success: false, 
        message: '会员ID不能为空' 
      });
    }
    
    const pointsAccount = await getOne(
      'SELECT pa.*, m.nickname FROM points_accounts pa JOIN members m ON pa.member_id = m.id WHERE pa.member_id = ?', 
      [memberId]
    );
    
    if (!pointsAccount) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该会员的积分账户' 
      });
    }
    
    res.json({
      success: true,
      data: pointsAccount
    });
  } catch (error) {
    console.error('获取会员积分时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 增加积分
const addPoints = async (req, res) => {
  try {
    const { memberId, points, description } = req.body;
    
    if (!memberId || !points || points <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: '会员ID和积分值不能为空，且积分必须大于0' 
      });
    }
    
    // 检查会员是否存在
    const member = await getOne('SELECT * FROM members WHERE id = ?', [memberId]);
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '会员不存在' 
      });
    }
    
    // 开始事务
    await runQuery('BEGIN');
    
    try {
      // 更新积分账户
      await runQuery(
        'UPDATE points_accounts SET points = points + ? WHERE member_id = ?',
        [points, memberId]
      );
      
      // 记录积分交易
      await runQuery(
        'INSERT INTO points_transactions (member_id, points, type, description, created_at) VALUES (?, ?, ?, ?, datetime("now", "localtime"))',
        [memberId, points, 'add', description || '增加积分']
      );
      
      // 提交事务
      await runQuery('COMMIT');
      
      // 获取更新后的积分账户
      const updatedAccount = await getOne(
        'SELECT * FROM points_accounts WHERE member_id = ?', 
        [memberId]
      );
      
      res.json({
        success: true,
        message: '积分增加成功',
        data: updatedAccount
      });
    } catch (error) {
      // 回滚事务
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('增加积分时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 扣减积分
const deductPoints = async (req, res) => {
  try {
    const { memberId, points, description } = req.body;
    
    if (!memberId || !points || points <= 0) {
      return res.status(400).json({ 
        success: false, 
        message: '会员ID和积分值不能为空，且积分必须大于0' 
      });
    }
    
    // 检查会员是否存在
    const member = await getOne('SELECT * FROM members WHERE id = ?', [memberId]);
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '会员不存在' 
      });
    }
    
    // 检查积分是否足够
    const pointsAccount = await getOne(
      'SELECT * FROM points_accounts WHERE member_id = ?', 
      [memberId]
    );
    
    if (!pointsAccount || pointsAccount.points < points) {
      return res.status(400).json({ 
        success: false, 
        message: '积分不足' 
      });
    }
    
    // 开始事务
    await runQuery('BEGIN');
    
    try {
      // 更新积分账户
      await runQuery(
        'UPDATE points_accounts SET points = points - ? WHERE member_id = ?',
        [points, memberId]
      );
      
      // 记录积分交易
      await runQuery(
        'INSERT INTO points_transactions (member_id, points, type, description, created_at) VALUES (?, ?, ?, ?, datetime("now", "localtime"))',
        [memberId, points, 'deduct', description || '扣减积分']
      );
      
      // 提交事务
      await runQuery('COMMIT');
      
      // 获取更新后的积分账户
      const updatedAccount = await getOne(
        'SELECT * FROM points_accounts WHERE member_id = ?', 
        [memberId]
      );
      
      res.json({
        success: true,
        message: '积分扣减成功',
        data: updatedAccount
      });
    } catch (error) {
      // 回滚事务
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('扣减积分时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取积分交易记录
const getPointsTransactions = async (req, res) => {
  try {
    const { memberId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    
    if (!memberId) {
      return res.status(400).json({ 
        success: false, 
        message: '会员ID不能为空' 
      });
    }
    
    // 检查会员是否存在
    const member = await getOne('SELECT * FROM members WHERE id = ?', [memberId]);
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '会员不存在' 
      });
    }
    
    // 计算分页
    const offset = (page - 1) * limit;
    
    // 获取交易记录总数
    const countResult = await getOne(
      'SELECT COUNT(*) as total FROM points_transactions WHERE member_id = ?',
      [memberId]
    );
    
    // 获取交易记录
    const transactions = await getAll(
      'SELECT * FROM points_transactions WHERE member_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
      [memberId, parseInt(limit), offset]
    );
    
    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取积分交易记录时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 获取积分排行榜
const getPointsRanking = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const ranking = await getAll(`
      SELECT 
        m.id, 
        m.nickname, 
        m.planetId,
        pa.points
      FROM 
        members m
      JOIN 
        points_accounts pa ON m.id = pa.member_id
      ORDER BY 
        pa.points DESC
      LIMIT ?
    `, [parseInt(limit)]);
    
    res.json({
      success: true,
      data: ranking
    });
  } catch (error) {
    console.error('获取积分排行榜时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

// 通过星球ID查询会员积分和排名
const searchMemberPointsByPlanetId = async (req, res) => {
  try {
    const { planetId } = req.query;
    
    if (!planetId) {
      return res.status(400).json({ 
        success: false, 
        message: '星球ID不能为空' 
      });
    }
    
    // 查询会员信息和积分
    const member = await getOne(`
      SELECT 
        m.id, 
        m.nickname, 
        m.planetId,
        pa.points
      FROM 
        members m
      JOIN 
        points_accounts pa ON m.id = pa.member_id
      WHERE 
        m.planetId = ?
    `, [planetId]);
    
    if (!member) {
      return res.status(404).json({ 
        success: false, 
        message: '未找到该星球ID对应的会员' 
      });
    }
    
    // 查询会员排名
    const rankQuery = await getOne(`
      SELECT 
        COUNT(*) + 1 as rank
      FROM 
        points_accounts pa
      JOIN 
        members m ON pa.member_id = m.id
      WHERE 
        pa.points > (
          SELECT points FROM points_accounts WHERE member_id = (
            SELECT id FROM members WHERE planetId = ?
          )
        )
    `, [planetId]);
    
    // 合并会员信息和排名
    const result = {
      ...member,
      rank: rankQuery.rank
    };
    
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('通过星球ID查询会员积分时出错:', error);
    res.status(500).json({ 
      success: false, 
      message: '服务器错误' 
    });
  }
};

module.exports = {
  getMemberPoints,
  addPoints,
  deductPoints,
  getPointsTransactions,
  getPointsRanking,
  searchMemberPointsByPlanetId
}; 