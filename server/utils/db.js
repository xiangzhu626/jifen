const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbPath = path.resolve(__dirname, '../../database.sqlite');

// 确保数据库目录存在
const dbDir = path.dirname(dbPath);
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// 创建数据库连接
const db = new sqlite3.Database(dbPath);

// 执行查询并返回所有结果
const getAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) {
        console.error('查询错误:', err);
        reject(err);
      } else {
        resolve(rows);
      }
    });
  });
};

// 执行查询并返回第一个结果
const getOne = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) {
        console.error('查询错误:', err);
        reject(err);
      } else {
        resolve(row);
      }
    });
  });
};

// 执行SQL查询
const runQuery = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    // 添加日志，帮助调试
    console.log('执行SQL查询:', sql);
    console.log('查询参数:', params);
    
    // 判断SQL类型
    const sqlType = sql.trim().toUpperCase().split(' ')[0];
    
    // 对于SELECT查询，使用db.all
    if (sqlType === 'SELECT') {
      db.all(sql, params, (err, rows) => {
        if (err) {
          console.error('SQL查询错误:', err);
          reject(err);
          return;
        }
        
        console.log('SQL查询结果行数:', rows.length);
        resolve(rows);
      });
    } 
    // 对于INSERT, UPDATE, DELETE等修改操作，使用db.run
    else {
      db.run(sql, params, function(err) {
        if (err) {
          console.error('SQL执行错误:', err);
          reject(err);
          return;
        }
        
        // 返回包含lastID和changes的对象
        const result = {
          lastID: this.lastID,
          changes: this.changes
        };
        
        console.log('SQL执行结果:', result);
        resolve(result);
      });
    }
  });
};

// 初始化数据库
const initDb = async () => {
  console.log('初始化数据库...');
  
  try {
    // 启用外键约束
    await runQuery('PRAGMA foreign_keys = ON');
    
    // 创建管理员表
    await runQuery(`
      CREATE TABLE IF NOT EXISTS admins (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TEXT NOT NULL
      )
    `);
    
    // 创建会员表
    await runQuery(`
      CREATE TABLE IF NOT EXISTS members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        nickname TEXT NOT NULL,
        planetId TEXT UNIQUE,
        created_at TEXT NOT NULL,
        updated_at TEXT
      )
    `);
    
    // 创建积分账户表
    await runQuery(`
      CREATE TABLE IF NOT EXISTS points_accounts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        points INTEGER NOT NULL DEFAULT 0,
        created_at TEXT NOT NULL,
        updated_at TEXT,
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
      )
    `);
    
    // 创建积分交易记录表
    await runQuery(`
      CREATE TABLE IF NOT EXISTS points_transactions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        member_id INTEGER NOT NULL,
        points INTEGER NOT NULL,
        type TEXT NOT NULL,
        description TEXT,
        created_at TEXT NOT NULL,
        FOREIGN KEY (member_id) REFERENCES members (id) ON DELETE CASCADE
      )
    `);
    
    console.log('数据库表创建完成');
    
    // 检查是否已有管理员账户
    const admins = await getAll('SELECT * FROM admins LIMIT 1');
    
    if (admins.length === 0) {
      console.log('未找到管理员账户，创建默认管理员...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      // 使用修改后的runQuery，确保能获取lastID
      const adminResult = await runQuery(
        'INSERT INTO admins (username, password, created_at) VALUES (?, ?, datetime("now", "localtime"))',
        ['admin', hashedPassword]
      );
      
      console.log('已创建管理员账户: admin / admin123', '管理员ID:', adminResult.lastID);
    }
    
    // 检查是否已有会员数据
    const members = await getAll('SELECT * FROM members LIMIT 1');
    
    // 如果没有会员数据，插入测试数据
    if (members.length === 0) {
      console.log('未找到会员数据，开始插入测试数据...');
      
      // 插入测试会员
      const testMembers = [
        { nickname: '张三', planetId: 'zhangsan123' },
        { nickname: '李四', planetId: 'lisi456' },
        { nickname: '王五', planetId: 'wangwu789' },
        { nickname: '赵六', planetId: 'zhaoliu000' },
        { nickname: '钱七', planetId: 'qianqi111' }
      ];
      
      for (const member of testMembers) {
        // 插入会员
        const memberResult = await runQuery(
          'INSERT INTO members (nickname, planetId, created_at) VALUES (?, ?, datetime("now", "localtime"))',
          [member.nickname, member.planetId]
        );
        
        const memberId = memberResult.lastID;
        console.log(`创建测试会员: ${member.nickname}, ID: ${memberId}`);
        
        // 创建积分账户
        const initialPoints = Math.floor(Math.random() * 1000);
        await runQuery(
          'INSERT INTO points_accounts (member_id, points, created_at) VALUES (?, ?, datetime("now", "localtime"))',
          [memberId, initialPoints]
        );
        
        // 添加一些积分交易记录
        const transactions = [
          { points: 100, type: 'add', description: '初始积分' },
          { points: 50, type: 'add', description: '活动奖励' },
          { points: 30, type: 'deduct', description: '兑换礼品' }
        ];
        
        for (const tx of transactions) {
          await runQuery(
            'INSERT INTO points_transactions (member_id, points, type, description, created_at) VALUES (?, ?, ?, ?, datetime("now", "localtime"))',
            [memberId, tx.points, tx.type, tx.description]
          );
        }
      }
      
      console.log('测试数据插入完成');
    } else {
      console.log('已存在会员数据，跳过测试数据插入');
    }
    
    console.log('数据库初始化完成');
  } catch (error) {
    console.error('数据库初始化失败:', error);
  }
};

module.exports = {
  db,
  initDb,
  getAll,
  getOne,
  runQuery
}; 