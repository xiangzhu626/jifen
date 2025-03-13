const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// 数据库文件路径
const dbDir = path.join(__dirname, '../../database');
const dbPath = path.join(dbDir, 'points_system.db');

console.log('开始重置数据库...');

// 检查数据库文件是否存在
if (fs.existsSync(dbPath)) {
  console.log(`删除现有数据库文件: ${dbPath}`);
  
  try {
    // 删除数据库文件
    fs.unlinkSync(dbPath);
    console.log('数据库文件已删除');
  } catch (error) {
    console.error('删除数据库文件时出错:', error);
    process.exit(1);
  }
} else {
  console.log('数据库文件不存在，将创建新数据库');
}

// 确保数据库目录存在
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
  console.log(`创建数据库目录: ${dbDir}`);
}

// 运行初始化脚本
console.log('运行数据库初始化脚本...');

try {
  // 使用同步执行，确保脚本完成后才继续
  execSync('node ' + path.join(__dirname, 'initDb.js'), { 
    stdio: 'inherit',
    timeout: 30000 // 30秒超时
  });
  console.log('数据库重置成功');
} catch (error) {
  console.error('数据库初始化失败:', error.message);
  process.exit(1);
} 