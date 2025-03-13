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

// 获取所有交易记录（支持分页和筛选）
const getAllPointsTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT pt.*, m.nickname as member_nickname
      FROM points_transactions pt
      LEFT JOIN members m ON pt.member_id = m.id
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total
      FROM points_transactions
    `;
    
    const queryParams = [];
    let whereClause = '';
    
    // 添加日期筛选
    if (req.query.startDate && req.query.endDate) {
      whereClause = ' WHERE pt.created_at BETWEEN ? AND ?';
      const startDate = req.query.startDate + ' 00:00:00';
      const endDate = req.query.endDate + ' 23:59:59';
      queryParams.push(startDate, endDate);
    }
    
    query += whereClause;
    countQuery += whereClause;
    
    // 添加排序和分页
    query += ' ORDER BY pt.created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // 执行查询
    const transactions = await runQuery(query, queryParams);
    const countResult = await runQuery(countQuery, queryParams.slice(0, queryParams.length - 2));
    
    // 安全地获取总数
    let total = 0;
    if (countResult && countResult.length > 0 && countResult[0].total !== undefined) {
      total = countResult[0].total;
    } else {
      // 如果无法获取总数，则使用当前获取的交易记录数量作为备选
      console.log('无法获取总记录数，使用当前记录数作为备选');
      total = transactions.length;
    }
    
    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('获取所有积分交易记录时出错:', error);
    return res.status(500).json({
      success: false,
      message: '获取积分交易记录失败',
      error: error.message
    });
  }
};

// 获取会员积分交易记录
const getPointsTransactions = async (req, res) => {
  try {
    const { memberId } = req.params;
    
    // 如果memberId是'all'，则获取所有交易记录
    if (memberId === 'all') {
      return getAllPointsTransactions(req, res);
    }
    
    // 验证会员ID
    if (!memberId) {
      return res.status(400).json({
        success: false,
        message: '会员ID不能为空'
      });
    }
    
    // 检查会员是否存在
    try {
      const member = await getOne('SELECT * FROM members WHERE id = ?', [memberId]);
      if (!member) {
        return res.status(404).json({
          success: false,
          message: '会员不存在'
        });
      }
    } catch (error) {
      console.error('检查会员是否存在时出错:', error);
      // 继续执行，不要因为检查会员失败而中断整个请求
    }
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT * FROM points_transactions
      WHERE member_id = ?
    `;
    
    let countQuery = `
      SELECT COUNT(*) as total FROM points_transactions
      WHERE member_id = ?
    `;
    
    const queryParams = [memberId];
    
    // 添加日期筛选
    if (req.query.startDate && req.query.endDate) {
      query += ' AND created_at BETWEEN ? AND ?';
      countQuery += ' AND created_at BETWEEN ? AND ?';
      const startDate = req.query.startDate + ' 00:00:00';
      const endDate = req.query.endDate + ' 23:59:59';
      queryParams.push(startDate, endDate);
    }
    
    // 添加排序和分页
    query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
    queryParams.push(limit, offset);
    
    // 执行查询
    const transactions = await runQuery(query, queryParams);
    const countResult = await runQuery(countQuery, queryParams.slice(0, queryParams.length - 2));
    
    // 安全地获取总数
    let total = 0;
    if (countResult && countResult.length > 0 && countResult[0].total !== undefined) {
      total = countResult[0].total;
    } else {
      // 如果无法获取总数，则使用当前获取的交易记录数量作为备选
      console.log('无法获取总记录数，使用当前记录数作为备选');
      total = transactions.length;
    }
    
    return res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('获取积分交易记录时出错:', error);
    return res.status(500).json({
      success: false,
      message: '获取积分交易记录失败',
      error: error.message
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
  searchMemberPointsByPlanetId,
  getAllPointsTransactions
}; 