# Netlify Serverless Functions 部署指南

## 📋 项目结构

```
lostfound/
├── netlify/
│   └── functions/
│       ├── api.js          # 主 API 处理程序
│       └── static.js       # 静态文件/图片代理
├── netlify.toml            # Netlify 配置
├── package.json            # 项目依赖
├── app.js                  # 前端应用
├── index.html              # HTML 页面
├── style.css               # 样式表
└── README.md              # 项目说明
```

## 🚀 快速开始

### 1. 本地开发

```bash
# 安装依赖
npm install

# 启动本地开发服务器
npm run dev

# 访问 http://localhost:8888
```

### 2. 部署到 Netlify

#### 方案 A：使用 CLI 部署

```bash
# 安装 Netlify CLI（如果未安装）
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 部署项目
netlify deploy --prod
```

#### 方案 B：连接 GitHub 仓库

1. 将项目推送到 GitHub
2. 登录 [Netlify Dashboard](https://app.netlify.com)
3. 点击 "New site from Git"
4. 选择 GitHub，授权并选择仓库
5. 配置自动部署

## ⚙️ 关键配置说明

### netlify.toml 配置

```toml
[build]
  command = "npm install"
  functions = "netlify/functions"
  publish = "."
```

- `functions`: 无服务器函数所在目录
- `publish`: 发布的静态文件目录（前端文件）

### 环境变量

在 Netlify Dashboard 中添加环境变量（可选）：
- `DATABASE_PATH`: 数据库路径（默认 `/tmp/database.sqlite`）
- `UPLOADS_PATH`: 上传目录（默认 `/tmp/uploads`）

## 🔧 API 端点

所有 API 请求自动路由到 `/.netlify/functions/api`：

| 方法 | 端点 | 说明 |
|------|------|------|
| GET | `/api/items` | 获取所有物品 |
| POST | `/api/items` | 发布新物品 |
| PUT | `/api/items/:id` | 更新物品 |
| DELETE | `/api/items/:id` | 删除物品 |
| POST | `/api/upload` | 上传图片 |
| GET | `/api/health` | 健康检查 |

## 📝 前端代码更新

前端代码（`app.js`）已兼容无服务器架构，无需修改 API 调用：

```javascript
// 这些请求会自动路由到无服务器函数
fetch('/api/items')           // ✅ 自动映射到 api.js
fetch('/api/upload', {        // ✅ 自动映射到 api.js
  method: 'POST',
  body: formData
})
```

## 🗄️ 数据库

- **类型**: SQLite3
- **位置**: `/tmp/database.sqlite`（Netlify 环境）
- **表**:
  - `users`: 用户表
  - `items`: 物品表

⚠️ **注意**: Netlify 的 `/tmp` 目录是临时的。建议使用外部数据库（如 Supabase、MongoDB）以保持数据持久化。

## 📤 图片上传

上传的图片存储在 `/tmp/uploads` 目录。由于 Netlify 无服务器环境的限制，建议：

1. **使用云存储**（推荐）：
   - AWS S3
   - Cloudinary
   - Firebase Storage

2. **或配置 Netlify Large Media**（需专业计划）

## 🔐 CORS 配置

如果前端和后端域名不同，需要在 API 函数中添加 CORS 头：

```javascript
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});
```

## 🐛 调试

### 查看函数日志

```bash
# 本地开发时查看日志
netlify dev

# 生产环境查看日志
netlify logs functions
```

### 测试 API

```bash
# 测试健康检查
curl https://your-site.netlify.app/api/health

# 获取物品列表
curl https://your-site.netlify.app/api/items
```

## ✅ 部署检查清单

- [ ] 安装了 `serverless-http`
- [ ] 创建了 `netlify/functions/api.js`
- [ ] 配置了 `netlify.toml`
- [ ] `package.json` 包含所有依赖
- [ ] 前端 API 调用路径正确（`/api/*`）
- [ ] Netlify 部署成功
- [ ] API 端点可正常访问

## 📚 相关资源

- [Netlify Functions 文档](https://docs.netlify.com/functions/overview)
- [Express.js 文档](https://expressjs.com/)
- [serverless-http GitHub](https://github.com/dougmoscrop/serverless-http)

## 💡 建议和优化

1. **数据库迁移**: 从 SQLite 迁移到云数据库（Supabase、MongoDB）
2. **图片存储**: 使用 Cloudinary 或 AWS S3
3. **Authentication**: 集成 Netlify Identity 或 Auth0
4. **Monitoring**: 配置 Netlify Analytics
5. **CI/CD**: 自动化部署流程
