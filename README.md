# 会员积分管理系统

一个简洁高效的会员积分管理系统，用于管理会员信息和积分交易记录。

## 功能特点

### 会员管理
- 会员信息的添加、编辑、删除和查询
- 会员列表展示与分页
- 会员详情查看
- 支持按昵称和星球ID搜索会员

### 积分管理
- 积分交易记录查询与展示
- 支持按会员筛选交易记录
- 支持按日期范围筛选交易记录
- 积分增加和扣减功能
- 交易记录详细信息展示

### 系统特性
- 响应式设计，适配不同设备
- 简洁直观的用户界面
- 完善的错误处理和用户反馈
- 安全的用户认证机制

## 技术栈

### 前端
- React.js
- Ant Design UI组件库
- Axios用于API请求
- React Router用于路由管理

### 后端
- Node.js
- Express.js框架
- SQLite数据库
- JWT用于身份验证

## 快速开始

### 系统要求
- Node.js 14.x 或更高版本
- npm 6.x 或更高版本

### Windows平台安装运行

1. **克隆项目**
   ```bash
   git clone <项目仓库URL>
   cd 会员积分系统
   ```

2. **安装后端依赖并启动**
   ```bash
   cd server
   npm install
   npm start
   ```
   后端服务将在 http://localhost:3001 运行

3. **安装前端依赖并启动**
   ```bash
   cd ../client
   npm install
   npm start
   ```
   前端应用将在 http://localhost:3000 运行

4. **初始化数据库（首次运行）**
   ```bash
   cd ../server
   npm run reset-db
   ```
   这将创建必要的数据库表并插入测试数据

5. **访问应用**
   在浏览器中打开 http://localhost:3000
   - 默认管理员账号: admin
   - 默认密码: admin123

### Linux平台安装运行

1. **克隆项目**
   ```bash
   git clone <项目仓库URL>
   cd 会员积分系统
   ```

2. **安装后端依赖并启动**
   ```bash
   cd server
   npm install
   npm start
   ```
   或使用PM2进行进程管理（推荐用于生产环境）:
   ```bash
   npm install -g pm2
   pm2 start index.js --name "member-points-server"
   ```

3. **安装前端依赖并启动**
   ```bash
   cd ../client
   npm install
   npm start
   ```
   或构建生产版本:
   ```bash
   npm run build
   ```
   然后使用Nginx或其他Web服务器部署build目录

4. **初始化数据库（首次运行）**
   ```bash
   cd ../server
   npm run reset-db
   ```

5. **设置防火墙（如需要）**
   ```bash
   sudo ufw allow 3000/tcp  # 前端端口
   sudo ufw allow 3001/tcp  # 后端API端口
   ```

6. **访问应用**
   在浏览器中打开 http://服务器IP:3000
   - 默认管理员账号: admin
   - 默认密码: admin123

## 项目结构

### 前端 (client)

```
client/
├── public/                 # 静态资源
├── src/                    # 源代码
│   ├── components/         # 通用组件
│   │   ├── AppHeader.js    # 应用头部组件
│   │   ├── AppSidebar.js   # 侧边栏组件
│   │   ├── MemberForm.js   # 会员表单组件
│   │   └── ...
│   ├── contexts/           # React上下文
│   │   └── AuthContext.js  # 认证上下文
│   ├── pages/              # 页面组件
│   │   ├── Login.js        # 登录页面
│   │   ├── Members.js      # 会员管理页面
│   │   ├── MemberDetail.js # 会员详情页面
│   │   ├── Points.js       # 积分管理页面
│   │   ├── Ranking.js      # 积分排行页面
│   │   └── ...
│   ├── services/           # 服务
│   │   └── api.js          # API请求服务
│   ├── utils/              # 工具函数
│   │   └── helpers.js      # 辅助函数
│   ├── App.js              # 应用主组件
│   ├── index.js            # 入口文件
│   └── ...
├── package.json            # 项目依赖
└── ...
```

### 后端 (server)

```
server/
├── controllers/            # 控制器
│   ├── authController.js   # 认证控制器
│   ├── memberController.js # 会员管理控制器
│   ├── pointsController.js # 积分管理控制器
│   └── ...
├── middleware/             # 中间件
│   ├── auth.js             # 认证中间件
│   └── ...
├── routes/                 # 路由
│   ├── auth.js             # 认证路由
│   ├── members.js          # 会员管理路由
│   ├── points.js           # 积分管理路由
│   └── ...
├── utils/                  # 工具函数
│   ├── db.js               # 数据库操作
│   ├── initDb.js           # 数据库初始化
│   ├── resetDb.js          # 数据库重置
│   └── ...
├── index.js                # 服务器入口文件
└── package.json            # 项目依赖
```

## 常见问题

### 数据库重置
如果需要重置数据库，可以运行:
```bash
cd server
npm run reset-db
```

### 端口冲突
如果端口3000或3001已被占用，可以修改以下文件:
- 前端端口: 在`client/package.json`中修改start脚本，添加`PORT=3006`
- 后端端口: 在`server/index.js`中修改PORT常量

### 跨域问题
如果遇到跨域问题，请确保后端CORS设置正确，检查`server/index.js`中的CORS配置。

## 开发指南

### 添加新功能
1. 在`server/controllers`中添加新的控制器函数
2. 在`server/routes`中注册新的路由
3. 在`client/src/services/api.js`中添加对应的API调用函数
4. 在`client/src/pages`中创建新的页面组件
5. 在`client/src/App.js`中添加新的路由

### 修改数据库结构
1. 修改`server/utils/db.js`中的表结构定义
2. 运行`npm run reset-db`重置数据库（注意：这将删除所有现有数据）

## 许可证

[MIT](LICENSE)

## 联系方式

如有问题或建议，请联系项目维护者。 