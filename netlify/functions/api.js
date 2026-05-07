/**
 * Netlify 无服务器函数 - API 处理程序
 * 使用 serverless-http 将 Express 应用转换为无服务器函数
 */

const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const serverless = require('serverless-http');

// 创建 Express 应用
const app = express();

// 中间件
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 确保必要目录存在
const uploadsDir = path.join('/tmp', 'uploads'); // Netlify 中使用 /tmp
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 数据库路径（Netlify 中使用 /tmp）
const dbPath = path.join('/tmp', 'database.sqlite');

// 初始化数据库连接
const db = new sqlite3.Database(dbPath);

// 创建必要的表
db.serialize(() => {
  // 用户表
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    token TEXT UNIQUE,
    createdAt INTEGER
  )`, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('创建 users 表错误:', err);
    }
  });

  // 物品表
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    userId TEXT,
    type TEXT,
    title TEXT,
    category TEXT,
    date TEXT,
    location TEXT,
    desc TEXT,
    contact TEXT,
    images TEXT,
    status TEXT,
    createdAt INTEGER,
    FOREIGN KEY(userId) REFERENCES users(id)
  )`, (err) => {
    if (err && !err.message.includes('already exists')) {
      console.error('创建 items 表错误:', err);
    }
  });
});

// 配置图片上传 (Multer)
const storage = multer.diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB 限制
});

// ===== API 路由 =====

/**
 * POST /api/upload
 * 上传图片
 */
app.post('/api/upload', upload.array('images', 3), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({ error: '没有选择文件' });
  }
  
  const urls = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ urls, success: true });
});

/**
 * GET /api/items
 * 获取所有物品
 */
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    
    const items = (rows || []).map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]')
    }));
    
    res.json(items);
  });
});

/**
 * POST /api/items
 * 发布新物品
 */
app.post('/api/items', (req, res) => {
  const item = req.body;
  
  if (!item.id || !item.title || !item.type) {
    return res.status(400).json({ error: '缺少必要字段' });
  }

  db.run(
    `INSERT INTO items (id, userId, type, title, category, date, location, desc, contact, images, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      item.id,
      item.userId || null,
      item.type,
      item.title,
      item.category || 'other',
      item.date || new Date().toISOString().split('T')[0],
      item.location || '',
      item.desc || '',
      item.contact || '',
      JSON.stringify(item.images || []),
      item.status || 'open',
      item.createdAt || Date.now()
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: item.id });
    }
  );
});

/**
 * PUT /api/items/:id
 * 更新物品
 */
app.put('/api/items/:id', (req, res) => {
  const { id } = req.params;
  const item = req.body;

  db.run(
    `UPDATE items 
     SET type = ?, title = ?, category = ?, date = ?, location = ?, desc = ?, contact = ?, images = ?, status = ?
     WHERE id = ?`,
    [
      item.type,
      item.title,
      item.category || 'other',
      item.date,
      item.location,
      item.desc,
      item.contact,
      JSON.stringify(item.images || []),
      item.status,
      id
    ],
    function(err) {
      if (err) {
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true });
    }
  );
});

/**
 * DELETE /api/items/:id
 * 删除物品
 */
app.delete('/api/items/:id', (req, res) => {
  const { id } = req.params;

  db.run('DELETE FROM items WHERE id = ?', [id], function(err) {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ success: true });
  });
});

/**
 * GET /api/health
 * 健康检查
 */
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理
app.use((err, req, res, next) => {
  console.error('错误:', err);
  res.status(500).json({ error: err.message || '服务器错误' });
});

// 将 Express 应用包装为无服务器函数
module.exports.handler = serverless(app);
