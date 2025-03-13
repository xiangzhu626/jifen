const express = require('express');
const cors = require('cors');
const path = require('path');
const { initDb } = require('./utils/db');

// 导入路由
const authRoutes = require('./routes/auth');
const memberRoutes = require('./routes/members');
const pointsRoutes = require('./routes/points');

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 5000;

// 中间件
app.use(cors());
app.use(express.json());

// API路由
app.use('/api/auth', authRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/points', pointsRoutes);

// 静态文件服务
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../client/build')));
  
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../client/build', 'index.html'));
  });
} else {
  // 开发环境下的API测试路由
  app.get('/api', (req, res) => {
    res.json({ message: '会员积分系统API服务正在运行' });
  });
}

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err);
  res.status(500).json({ 
    success: false, 
    message: '服务器内部错误' 
  });
});

// 初始化数据库并启动服务器
const startServer = async () => {
  try {
    // 初始化数据库
    await initDb();
    
    // 启动服务器
    app.listen(PORT, () => {
      console.log(`服务器运行在端口 ${PORT}`);
    });
  } catch (error) {
    console.error('启动服务器失败:', error);
    process.exit(1);
  }
};

startServer();

module.exports = app; 