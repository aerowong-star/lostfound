const express = require('express');
const multer = require('multer');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// 中间件
app.use(express.json());
app.use(express.static(__dirname)); // 提供前端静态文件
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 确保上传目录存在
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// 初始化 SQLite 数据库
const db = new sqlite3.Database('./database.sqlite');
db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS items (
    id TEXT PRIMARY KEY,
    type TEXT,
    title TEXT,
    category TEXT,
    date TEXT,
    location TEXT,
    desc TEXT,
    contact TEXT,
    images TEXT,
    status TEXT,
    createdAt INTEGER
  )`);
});

// 配置图片上传 (Multer)
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + Math.round(Math.random() * 1E9) + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// API：上传图片
app.post('/api/upload', upload.array('images', 3), (req, res) => {
  if (!req.files) return res.status(400).json({ error: 'No files uploaded' });
  const urls = req.files.map(file => `/uploads/${file.filename}`);
  res.json({ urls });
});

// API：获取所有物品
app.get('/api/items', (req, res) => {
  db.all('SELECT * FROM items ORDER BY createdAt DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    const items = rows.map(row => ({
      ...row,
      images: JSON.parse(row.images || '[]')
    }));
    res.json(items);
  });
});

// API：发布新物品
app.post('/api/items', (req, res) => {
  const item = req.body;
  db.run(
    `INSERT INTO items (id, type, title, category, date, location, desc, contact, images, status, createdAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [item.id, item.type, item.title, item.category, item.date, item.location, item.desc, item.contact, JSON.stringify(item.images), item.status, item.createdAt],
    function(err) {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ success: true, id: item.id });
    }
  );
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`后端服务已启动！请在浏览器访问: http://localhost:${PORT}`);
});
