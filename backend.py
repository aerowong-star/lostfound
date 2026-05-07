import http.server
import socketserver
import json
import sqlite3
import os
import hashlib
import secrets
import re
import time
from urllib.parse import urlparse, parse_qs

PORT = 5000
DB_FILE = 'database.sqlite'

def get_db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    return conn

# ===== 密码哈希处理 =====
def hash_password(password):
    """使用 SHA256 哈希密码"""
    return hashlib.sha256(password.encode()).hexdigest()

def verify_password(password, hash_val):
    """验证密码"""
    return hash_password(password) == hash_val

def generate_token():
    """生成随机 token"""
    return secrets.token_hex(32)

# 初始化 SQLite 数据库（长效储存，替代原本的 localStorage）
with get_db() as conn:
    # 用户表
    conn.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            token TEXT UNIQUE,
            createdAt INTEGER
        )
    ''')
    
    # 物品表（添加 userId 字段关联用户）
    conn.execute('''
        CREATE TABLE IF NOT EXISTS items (
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
        )
    ''')
    conn.commit()

class RequestHandler(http.server.SimpleHTTPRequestHandler):
    def _send_json(self, data, status_code=200):
        """发送 JSON 响应"""
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))
    
    def _get_token_from_header(self):
        """从 Authorization header 获取 token"""
        auth = self.headers.get('Authorization', '')
        if auth.startswith('Bearer '):
            return auth[7:]
        return None
    
    def _verify_token(self, token):
        """验证 token 并返回用户信息"""
        if not token:
            return None
        with get_db() as conn:
            user = conn.execute('SELECT * FROM users WHERE token = ?', (token,)).fetchone()
            return dict(user) if user else None
    
    def do_GET(self):
        if self.path == '/api/items':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json; charset=utf-8')
            self.end_headers()
            
            with get_db() as conn:
                rows = conn.execute('SELECT * FROM items ORDER BY createdAt DESC').fetchall()
                items = []
                for row in rows:
                    item = dict(row)
                    item['images'] = json.loads(item['images']) if item['images'] else []
                    items.append(item)
                
            self.wfile.write(json.dumps(items).encode('utf-8'))
        
        elif self.path == '/api/auth/me':
            token = self._get_token_from_header()
            user = self._verify_token(token)
            if user:
                self._send_json({
                    'success': True,
                    'user': {
                        'id': user['id'],
                        'username': user['username'],
                        'email': user['email']
                    }
                })
            else:
                self._send_json({'success': False, 'message': '未授权'}, 401)
        
        else:
            # 默认返回 index.html 及其它静态文件 (app.js, style.css)
            if self.path == '/':
                self.path = '/index.html'
            super().do_GET()

    def do_POST(self):
        content_length = int(self.headers.get('Content-Length', 0))
        post_data = self.rfile.read(content_length).decode('utf-8') if content_length else '{}'
        
        if self.path == '/api/auth/register':
            try:
                data = json.loads(post_data)
                username = data.get('username', '').strip()
                email = data.get('email', '').strip()
                password = data.get('password', '')
                
                # 基础验证
                if not username or not email or not password:
                    self._send_json({'success': False, 'message': '用户名、邮箱和密码不能为空'}, 400)
                    return
                
                if len(username) < 3 or len(username) > 20:
                    self._send_json({'success': False, 'message': '用户名长度需要 3-20 个字符'}, 400)
                    return
                
                if len(password) < 6:
                    self._send_json({'success': False, 'message': '密码长度至少 6 个字符'}, 400)
                    return
                
                if not re.match(r'^[\w\.-]+@[\w\.-]+\.\w+$', email):
                    self._send_json({'success': False, 'message': '邮箱格式无效'}, 400)
                    return
                
                # 创建用户
                user_id = 'user_' + secrets.token_hex(8)
                token = generate_token()
                password_hash = hash_password(password)
                
                with get_db() as conn:
                    try:
                        conn.execute('''
                            INSERT INTO users (id, username, email, password_hash, token, createdAt)
                            VALUES (?, ?, ?, ?, ?, ?)
                        ''', (user_id, username, email, password_hash, token, int(time.time() * 1000)))
                        conn.commit()
                    except sqlite3.IntegrityError as e:
                        if 'username' in str(e):
                            self._send_json({'success': False, 'message': '用户名已被使用'}, 400)
                        elif 'email' in str(e):
                            self._send_json({'success': False, 'message': '邮箱已被注册'}, 400)
                        else:
                            raise
                        return
                
                self._send_json({
                    'success': True,
                    'message': '注册成功',
                    'token': token,
                    'user': {'id': user_id, 'username': username, 'email': email}
                }, 201)
                
            except Exception as e:
                self._send_json({'success': False, 'message': f'注册错误: {str(e)}'}, 500)
        
        elif self.path == '/api/auth/login':
            try:
                data = json.loads(post_data)
                username = data.get('username', '').strip()
                password = data.get('password', '')
                
                if not username or not password:
                    self._send_json({'success': False, 'message': '用户名和密码不能为空'}, 400)
                    return
                
                with get_db() as conn:
                    # 通过用户名或邮箱登录
                    user = conn.execute(
                        'SELECT * FROM users WHERE username = ? OR email = ?',
                        (username, username)
                    ).fetchone()
                    
                    if not user or not verify_password(password, user['password_hash']):
                        self._send_json({'success': False, 'message': '用户名或密码错误'}, 401)
                        return
                    
                    # 生成新 token
                    new_token = generate_token()
                    conn.execute('UPDATE users SET token = ? WHERE id = ?', (new_token, user['id']))
                    conn.commit()
                    
                    self._send_json({
                        'success': True,
                        'message': '登录成功',
                        'token': new_token,
                        'user': {
                            'id': user['id'],
                            'username': user['username'],
                            'email': user['email']
                        }
                    }, 200)
                
            except Exception as e:
                self._send_json({'success': False, 'message': f'登录错误: {str(e)}'}, 500)
        
        elif self.path == '/api/items':
            try:
                # 验证用户身份
                token = self._get_token_from_header()
                user = self._verify_token(token)
                
                if not user:
                    self._send_json({'success': False, 'message': '请登录后再发布物品'}, 401)
                    return
                
                item = json.loads(post_data)
                
                with get_db() as conn:
                    conn.execute('''
                        INSERT INTO items (id, userId, type, title, category, date, location, desc, contact, images, status, createdAt)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ''', (
                        item['id'], user['id'], item.get('type'), item.get('title'), 
                        item.get('category'),
                        item.get('date'), item.get('location'), item.get('desc', ''),
                        item.get('contact'), json.dumps(item.get('images', [])),
                        item.get('status'), item.get('createdAt')
                    ))
                    conn.commit()
                
                self._send_json({'success': True, 'id': item['id']}, 201)
            
            except Exception as e:
                self._send_json({'success': False, 'message': f'发布错误: {str(e)}'}, 500)
        
        else:
            self._send_json({'success': False, 'message': '路径不存在'}, 404)

# 启动服务器
with socketserver.TCPServer(("", PORT), RequestHandler) as httpd:
    print(f"后端环境已准备就绪！")
    print(f"=========================================")
    print(f"请在浏览器中访问: http://localhost:{PORT}")
    print(f"按 Ctrl+C 关闭服务")
    print(f"=========================================")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
