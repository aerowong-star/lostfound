# 🔍 失物招领系统

一个完整的失物招领平台，支持物品发布、搜索和联系功能。

## 📁 文件说明

- **server.js** - Node.js 后端服务器（Express.js + SQLite）
- **backend.py** - Python 后端服务器（HTTP 服务器实现）
- **app.js** - 前端逻辑代码（用户认证、物品管理等）
- **index.html** - 前端用户界面
- **style.css** - 前端样式表
- **database.sqlite** - SQLite 数据库（运行时生成）
- **uploads/** - 物品图片上传目录（运行时生成）

## 🚀 快速开始

### 使用 Node.js 后端

```bash
npm install
node server.js
```

访问：`http://localhost:3000`

### 使用 Python 后端

```bash
python backend.py
```

访问：`http://localhost:5000`

## 📋 功能

- 用户认证（注册/登录）
- 物品发布（支持图片上传）
- 物品分类（电子产品、证件、钱包、钥匙、包类等）
- 物品搜索和筛选
- 交流与联系
- 物品详情展示
