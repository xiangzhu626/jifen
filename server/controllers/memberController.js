const { getAll, getOne, runQuery } = require('../utils/db');

// 获取所有会员
const getAllMembers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;
    
    let query = `
      SELECT m.*, COALESCE(pa.points, 0) as points 
      FROM members m
      LEFT JOIN points_accounts pa ON m.id = pa.member_id
    `;
    
    let countQuery = `SELECT COUNT(*) as total FROM members`;
    let params = [];
    
    if (search) {
      query += ` WHERE m.nickname LIKE ? OR m.planetId LIKE ?`;
      countQuery += ` WHERE nickname LIKE ? OR planetId LIKE ?`;
      params = [`%${search}%`, `%${search}%`];
    }
    
    query += ` ORDER BY m.id DESC LIMIT ? OFFSET ?`;
    params.push(parseInt(limit), offset);
    
    const members = await getAll(query, params);
    const countResult = await getOne(countQuery, search ? [`%${search}%`, `%${search}%`] : []);
    
    // 确保每个会员对象都有积分属性
    const membersWithPoints = members.map(member => ({
      ...member,
      points: member.points || 0
    }));
    
    res.json({
      success: true,
      data: {
        members: membersWithPoints,
        pagination: {
          total: countResult.total,
          page: parseInt(page),
          limit: parseInt(limit)
        }
      }
    });
  } catch (error) {
    console.error('获取会员列表时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取会员列表失败'
    });
  }
};

// 获取单个会员
const getMemberById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const query = `
      SELECT m.*, COALESCE(pa.points, 0) as points 
      FROM members m
      LEFT JOIN points_accounts pa ON m.id = pa.member_id
      WHERE m.id = ?
    `;
    
    const member = await getOne(query, [id]);
    
    if (!member) {
      return res.status(404).json({
        success: false,
        message: '会员不存在'
      });
    }
    
    // 确保会员对象有积分属性
    member.points = member.points || 0;
    
    res.json({
      success: true,
      data: {
        member
      }
    });
  } catch (error) {
    console.error('获取会员详情时出错:', error);
    res.status(500).json({
      success: false,
      message: '获取会员详情失败'
    });
  }
};

// 创建会员
const createMember = async (req, res) => {
  try {
    const { nickname, planetId, initialPoints, description } = req.body;
    
    console.log('创建会员请求数据:', req.body);
    
    // 验证必填字段
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '会员昵称不能为空'
      });
    }
    
    // 确保initialPoints是数字类型
    const points = initialPoints !== undefined && initialPoints !== null 
      ? parseInt(initialPoints) 
      : 0;
    
    console.log('初始积分:', points);
    
    // 检查是否已存在相同星球ID的会员
    if (planetId) {
      const existingMember = await getOne(
        'SELECT * FROM members WHERE planetId = ?',
        [planetId]
      );
      
      if (existingMember) {
        return res.status(400).json({
          success: false,
          message: '已存在相同星球ID的会员'
        });
      }
    }
    
    // 开始事务
    await runQuery('BEGIN TRANSACTION');
    
    try {
      console.log('创建会员记录...');
      
      // 创建会员记录
      const insertResult = await runQuery(
        'INSERT INTO members (nickname, planetId, created_at) VALUES (?, ?, datetime("now", "localtime"))',
        [nickname, planetId]
      );
      
      // 获取新创建会员的ID
      const memberId = insertResult.lastID;
      
      console.log('新创建会员ID:', memberId);
      
      if (!memberId) {
        throw new Error('创建会员失败，无法获取会员ID');
      }
      
      // 创建积分账户
      console.log('创建积分账户，会员ID:', memberId, '初始积分:', points);
      
      await runQuery(
        'INSERT INTO points_accounts (member_id, points, created_at) VALUES (?, ?, datetime("now", "localtime"))',
        [memberId, points]
      );
      
      // 如果有初始积分，创建积分交易记录
      if (points > 0) {
        console.log('创建初始积分交易记录，积分:', points);
        await runQuery(
          'INSERT INTO points_transactions (member_id, type, points, description, created_at) VALUES (?, ?, ?, ?, datetime("now", "localtime"))',
          [memberId, 'add', points, description || '初始积分']
        );
      }
      
      // 提交事务
      await runQuery('COMMIT');
      
      // 获取创建的会员信息
      const member = await getOne(
        `SELECT m.*, COALESCE(pa.points, 0) as points 
         FROM members m 
         LEFT JOIN points_accounts pa ON m.id = pa.member_id 
         WHERE m.id = ?`,
        [memberId]
      );
      
      console.log('创建的会员信息:', member);
      
      // 确保返回的会员对象包含积分
      if (member && !member.hasOwnProperty('points')) {
        member.points = points;
      }
      
      res.status(201).json({
        success: true,
        message: '会员创建成功',
        data: member
      });
    } catch (error) {
      // 回滚事务
      await runQuery('ROLLBACK');
      throw error;
    }
  } catch (error) {
    console.error('创建会员时出错:', error);
    res.status(500).json({
      success: false,
      message: '创建会员失败: ' + error.message
    });
  }
};

// 更新会员
const updateMember = async (req, res) => {
  try {
    const { id } = req.params;
    const { nickname, planetId } = req.body;
    
    // 验证必填字段
    if (!nickname) {
      return res.status(400).json({
        success: false,
        message: '会员昵称不能为空'
      });
    }
    
    // 检查会员是否存在
    const existingMember = await getOne('SELECT * FROM members WHERE id = ?', [id]);
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: '会员不存在'
      });
    }
    
    // 检查星球ID是否已被其他会员使用
    if (planetId) {
      const duplicateMember = await getOne('SELECT * FROM members WHERE planetId = ? AND id != ?', [planetId, id]);
      if (duplicateMember) {
        return res.status(400).json({
          success: false,
          message: '该星球ID已被其他会员使用'
        });
      }
    }
    
    // 更新会员信息
    await runQuery(
      'UPDATE members SET nickname = ?, planetId = ? WHERE id = ?',
      [nickname, planetId, id]
    );
    
    // 获取更新后的会员信息
    const member = await getOne(`
      SELECT m.*, COALESCE(pa.points, 0) as points 
      FROM members m
      LEFT JOIN points_accounts pa ON m.id = pa.member_id
      WHERE m.id = ?
    `, [id]);
    
    res.json({
      success: true,
      data: {
        member
      },
      message: '会员信息更新成功'
    });
  } catch (error) {
    console.error('更新会员信息时出错:', error);
    res.status(500).json({
      success: false,
      message: '更新会员信息失败'
    });
  }
};

// 删除会员
const deleteMember = async (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查会员是否存在
    const existingMember = await getOne('SELECT * FROM members WHERE id = ?', [id]);
    if (!existingMember) {
      return res.status(404).json({
        success: false,
        message: '会员不存在'
      });
    }
    
    // 删除会员相关的积分交易记录
    await runQuery('DELETE FROM points_transactions WHERE member_id = ?', [id]);
    
    // 删除会员的积分账户
    await runQuery('DELETE FROM points_accounts WHERE member_id = ?', [id]);
    
    // 删除会员
    await runQuery('DELETE FROM members WHERE id = ?', [id]);
    
    res.json({
      success: true,
      message: '会员删除成功'
    });
  } catch (error) {
    console.error('删除会员时出错:', error);
    res.status(500).json({
      success: false,
      message: '删除会员失败'
    });
  }
};

module.exports = {
  getAllMembers,
  getMemberById,
  createMember,
  updateMember,
  deleteMember
}; 