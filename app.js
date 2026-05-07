/* ===========================
   寻迹 · 失物招领平台 - app.js (后端集成版)
   =========================== */

// ===== 国际化支持 =====
function getCategoryName(category) {
  const categoryKeys = {
    electronics: 'category.electronics',
    id: 'category.id',
    wallet: 'category.wallet',
    keys: 'category.keys',
    bag: 'category.bag',
    other: 'category.other'
  };
  return i18n.t(categoryKeys[category] || 'category.other');
}

const CATEGORY_EMOJI = {
  electronics: '📱', id: '🪪', wallet: '👛',
  keys: '🔑', bag: '🎒', other: '📦'
};

// ===== 用户认证状态 =====
let currentUser = null;
let authToken = localStorage.getItem('auth_token');

// 简单的本地用户数据存储
const LOCAL_USERS_KEY = 'lostfound_users';

function getLocalUsers() {
  const data = localStorage.getItem(LOCAL_USERS_KEY);
  return data ? JSON.parse(data) : {};
}

function saveLocalUsers(users) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users));
}

function generateToken() {
  return 'token_' + Math.random().toString(36).substr(2) + Date.now();
}

// 声明加载用户信息
async function initializeAuth() {
  if (authToken) {
    // 验证 token 是否有效
    try {
      // 优先尝试后端 API
      const res = await fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        currentUser = data.user;
        updateAuthUI();
        return;
      }
    } catch (e) {
      // 后端不可用，继续检查本地
      console.log('后端不可用，使用本地认证');
    }

    // 检查本地存储的 token
    const users = getLocalUsers();
    for (const username in users) {
      if (users[username].token === authToken) {
        currentUser = {
          username: username,
          email: users[username].email
        };
        updateAuthUI();
        return;
      }
    }

    // Token 无效，清除
    localStorage.removeItem('auth_token');
    authToken = null;
  }
}

function updateAuthUI() {
  const authButtonsGroup = document.getElementById('authButtonsGroup');
  const userMenuGroup = document.getElementById('userMenuGroup');
  const userMenuUsername = document.getElementById('userMenuUsername');

  if (currentUser) {
    authButtonsGroup.style.display = 'none';
    userMenuGroup.style.display = 'block';
    userMenuUsername.textContent = currentUser.username;
  } else {
    authButtonsGroup.style.display = 'flex';
    userMenuGroup.style.display = 'none';
  }
}

// ===== 状态 =====
let items = [];
let filters = { status: 'all', category: 'all', keyword: '', sort: 'newest' };
let pendingImages = []; // { dataUrl, file }

// ===== 数据加载 (请求后端) =====
async function loadData() {
  try {
    const res = await fetch('/api/items');
    if (!res.ok) throw new Error('网络请求失败');
    items = await res.json();
    render();
  } catch (e) {
    console.error(e);
    showToast(i18n.t('toast.loadError'), 'error');
    // 如果失败也渲染空状态
    render();
  }
}

// ===== 过滤 & 排序 =====
function getFiltered() {
  let result = items.filter(item => {
    const matchStatus = filters.status === 'all' || item.status === filters.status ||
      (filters.status === 'lost' && item.type === 'lost' && item.status !== 'solved') ||
      (filters.status === 'found' && item.type === 'found' && item.status !== 'solved');
    const matchCat = filters.category === 'all' || item.category === filters.category;
    const kw = filters.keyword.toLowerCase();
    const matchKw = !kw ||
      item.title.toLowerCase().includes(kw) ||
      item.location.toLowerCase().includes(kw) ||
      (item.desc || '').toLowerCase().includes(kw);

    let statusOk = false;
    if (filters.status === 'all') statusOk = true;
    else if (filters.status === 'solved') statusOk = item.status === 'solved';
    else if (filters.status === 'lost') statusOk = item.type === 'lost' && item.status !== 'solved';
    else if (filters.status === 'found') statusOk = item.type === 'found' && item.status !== 'solved';

    return statusOk && matchCat && matchKw;
  });

  result.sort((a, b) =>
    filters.sort === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt
  );
  return result;
}

// ===== 渲染 =====
function renderStats() {
  const lost   = items.filter(i => i.type === 'lost'  && i.status !== 'solved').length;
  const found  = items.filter(i => i.type === 'found' && i.status !== 'solved').length;
  const solved = items.filter(i => i.status === 'solved').length;
  animateCount('statLost',   lost);
  animateCount('statFound',  found);
  animateCount('statSolved', solved);
}

function animateCount(id, target) {
  const el = document.getElementById(id);
  const current = parseInt(el.textContent) || 0;
  const diff = target - current;
  if (diff === 0) return;
  let frame = 0;
  const total = 30;
  const timer = setInterval(() => {
    frame++;
    el.textContent = Math.round(current + diff * (frame / total));
    if (frame >= total) clearInterval(timer);
  }, 16);
}

function renderCards() {
  const grid  = document.getElementById('cardGrid');
  const empty = document.getElementById('emptyState');
  const count = document.getElementById('resultCount');

  const filtered = getFiltered();
  count.textContent = i18n.t('list.results', { count: filtered.length });

  if (filtered.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';

  grid.innerHTML = filtered.map((item, i) => {
    const badgeClass  = item.status === 'solved' ? 'badge-solved' : item.type === 'lost' ? 'badge-lost' : 'badge-found';
    const badgeText   = item.status === 'solved' ? i18n.t('filter.solved') : item.type === 'lost' ? i18n.t('filter.lost') : i18n.t('filter.found');
    const imgHtml     = item.images && item.images.length > 0
      ? `<img class="card-img" src="${item.images[0]}" alt="${item.title}" loading="lazy" />`
      : `<div class="card-img-placeholder">${CATEGORY_EMOJI[item.category] || '📦'}</div>`;
    const catName     = getCategoryName(item.category);
    const timeAgo     = formatTimeAgo(item.createdAt);

    return `
      <article class="item-card" data-id="${item.id}" style="animation-delay:${i * 0.04}s" tabindex="0" role="button">
        ${imgHtml}
        <div class="card-body">
          <div class="card-top">
            <h3 class="card-title">${escHtml(item.title)}</h3>
            <span class="badge ${badgeClass}">${badgeText}</span>
          </div>
          <div class="card-meta">
            <div class="card-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              ${escHtml(item.location)}
            </div>
            <div class="card-meta-item">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              ${escHtml(item.date)}
            </div>
          </div>
          ${item.desc ? `<p class="card-desc">${escHtml(item.desc)}</p>` : ''}
        </div>
        <div class="card-footer">
          <span class="card-category">${catName}</span>
          <span class="card-time">${timeAgo}</span>
        </div>
      </article>`;
  }).join('');

  grid.querySelectorAll('.item-card').forEach(card => {
    card.addEventListener('click', () => openDetail(card.dataset.id));
    card.addEventListener('keydown', e => { if (e.key === 'Enter') openDetail(card.dataset.id); });
  });
}

function render() {
  renderStats();
  renderCards();
}

// ===== 详情弹窗 =====
function openDetail(id) {
  const item = items.find(i => i.id === id);
  if (!item) return;

  const badgeClass = item.status === 'solved' ? 'badge-solved' : item.type === 'lost' ? 'badge-lost' : 'badge-found';
  const badgeText  = item.status === 'solved' ? i18n.t('filter.solved') : item.type === 'lost' ? i18n.t('filter.lost') : i18n.t('filter.found');
  const catName    = getCategoryName(item.category);

  const imgsHtml = item.images && item.images.length > 0
    ? `<div class="detail-images">${item.images.map(src =>
        `<img src="${src}" alt="${escHtml(item.title)}" />`).join('')}</div>`
    : `<div style="text-align:center;font-size:4rem;margin-bottom:20px">${CATEGORY_EMOJI[item.category] || '📦'}</div>`;

  document.getElementById('detailContent').innerHTML = `
    ${imgsHtml}
    <div class="detail-header">
      <h2 class="detail-title">${escHtml(item.title)}</h2>
      <span class="badge ${badgeClass}">${badgeText}</span>
    </div>
    <div class="detail-info">
      <div class="detail-info-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
        <span class="detail-info-label">${i18n.t('detail.location')}</span>
        <span class="detail-info-value">${escHtml(item.location)}</span>
      </div>
      <div class="detail-info-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
        <span class="detail-info-label">${i18n.t('detail.date')}</span>
        <span class="detail-info-value">${escHtml(item.date)}</span>
      </div>
      <div class="detail-info-item">
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></svg>
        <span class="detail-info-label">${i18n.t('detail.category')}</span>
        <span class="detail-info-value">${catName}</span>
      </div>
    </div>
    ${item.desc ? `<div class="detail-desc">${escHtml(item.desc)}</div>` : ''}
    <div class="detail-contact">
      <div class="detail-contact-info">
        <span class="detail-contact-label">${i18n.t('detail.contact')}</span>
        <span class="detail-contact-value">${escHtml(item.contact)}</span>
      </div>
      <button class="btn-contact" onclick="copyContact('${escHtml(item.contact)}')">${i18n.t('detail.copy')}</button>
    </div>`;

  openModal('detailOverlay');
}

function copyContact(text) {
  navigator.clipboard.writeText(text).then(() => showToast(i18n.t('toast.contactCopied'), 'success')).catch(() => showToast(i18n.t('toast.copyError'), 'error'));
}

// ===== 发布表单提交 (提交至后端) =====
function openPublish() {
  if (!currentUser) {
    showToast(i18n.t('toast.loginRequired'), 'error');
    openModal('loginOverlay');
    return;
  }
  openModal('publishOverlay');
  document.getElementById('fieldDate').value = new Date().toISOString().split('T')[0];
}

document.getElementById('publishForm').addEventListener('submit', async e => {
  e.preventDefault();
  
  if (!currentUser) {
    showToast('请先登录', 'error');
    return;
  }

  const form = e.target;
  const submitBtn = form.querySelector('button[type="submit"]');

  const title    = document.getElementById('fieldTitle').value.trim();
  const category = document.getElementById('fieldCategory').value;
  const date     = document.getElementById('fieldDate').value;
  const location = document.getElementById('fieldLocation').value.trim();
  const contact  = document.getElementById('fieldContact').value.trim();
  const desc     = document.getElementById('fieldDesc').value.trim();
  const type     = form.querySelector('input[name="type"]:checked').value;

  let hasError = false;
  [{ id: 'fieldTitle', val: title }, { id: 'fieldCategory', val: category },
   { id: 'fieldDate', val: date },   { id: 'fieldLocation', val: location },
   { id: 'fieldContact', val: contact }].forEach(({ id, val }) => {
    const el = document.getElementById(id);
    if (!val) { el.classList.add('error'); hasError = true; }
    else el.classList.remove('error');
  });
  if (hasError) { showToast(i18n.t('toast.fillRequired'), 'error'); return; }

  submitBtn.disabled = true;
  submitBtn.textContent = '发布中...';

  try {
    // 构建数据并提交（图片直接使用 Base64 数据随表单一同提交）
    const newItem = {
      id:        'item_' + Date.now(),
      type, title, category, date, location, desc, contact,
      images:    pendingImages.map(p => p.dataUrl),
      createdAt: Date.now(),
      status:    type
    };

    const res = await fetch('/api/items', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify(newItem)
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.message || '上传数据失败');
    }

    await loadData(); // 重新拉取数据
    closeModal('publishOverlay');
    resetPublishForm();
    showToast(i18n.t('toast.publishSuccess'), 'success');

  } catch (err) {
    console.error(err);
    showToast(i18n.t('toast.publishError'), 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = '发布';
  }
});

function resetPublishForm() {
  document.getElementById('publishForm').reset();
  pendingImages = [];
  document.getElementById('previewRow').innerHTML = '';
  document.querySelectorAll('.form-input.error').forEach(el => el.classList.remove('error'));
}

// ===== 图片上传处理 =====
const uploadArea  = document.getElementById('uploadArea');
const fieldImages = document.getElementById('fieldImages');
const previewRow  = document.getElementById('previewRow');

document.getElementById('btnPickImages').addEventListener('click', () => fieldImages.click());

fieldImages.addEventListener('change', () => handleFiles(fieldImages.files));

uploadArea.addEventListener('dragover', e => { e.preventDefault(); uploadArea.classList.add('drag-over'); });
uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('drag-over'));
uploadArea.addEventListener('drop', e => {
  e.preventDefault();
  uploadArea.classList.remove('drag-over');
  handleFiles(e.dataTransfer.files);
});

function handleFiles(files) {
  const remaining = 3 - pendingImages.length;
  if (remaining <= 0) { showToast('最多上传 3 张图片', 'error'); return; }
  const toAdd = Array.from(files).slice(0, remaining).filter(f => f.type.startsWith('image/'));
  toAdd.forEach(file => {
    const reader = new FileReader();
    reader.onload = ev => {
      pendingImages.push({ dataUrl: ev.target.result, file });
      addPreview(ev.target.result, pendingImages.length - 1);
    };
    reader.readAsDataURL(file);
  });
}

function addPreview(dataUrl, idx) {
  const div = document.createElement('div');
  div.className = 'preview-item';
  div.dataset.idx = idx;
  div.innerHTML = `<img src="${dataUrl}" alt="预览" /><button type="button" class="preview-remove" title="删除">✕</button>`;
  div.querySelector('.preview-remove').addEventListener('click', () => {
    pendingImages.splice(idx, 1);
    refreshPreviews();
  });
  previewRow.appendChild(div);
}

function refreshPreviews() {
  previewRow.innerHTML = '';
  pendingImages.forEach((p, i) => addPreview(p.dataUrl, i));
}

// ===== 模态框及基础事件 =====
function openModal(overlayId) {
  document.getElementById(overlayId).classList.add('open');
  document.body.style.overflow = 'hidden';
}
function closeModal(overlayId) {
  document.getElementById(overlayId).classList.remove('open');
  document.body.style.overflow = '';
}

document.getElementById('btnOpenPublish').addEventListener('click', openPublish);
document.getElementById('fabPublish').addEventListener('click', openPublish);
document.getElementById('btnClosePublish').addEventListener('click', () => { closeModal('publishOverlay'); resetPublishForm(); });
document.getElementById('btnCancelPublish').addEventListener('click', () => { closeModal('publishOverlay'); resetPublishForm(); });
document.getElementById('btnCloseDetail').addEventListener('click', () => closeModal('detailOverlay'));

['publishOverlay', 'detailOverlay'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target.id === id) closeModal(id);
  });
});

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    closeModal('publishOverlay');
    closeModal('detailOverlay');
  }
});

let searchTimer;
document.getElementById('searchInput').addEventListener('input', e => {
  clearTimeout(searchTimer);
  searchTimer = setTimeout(() => {
    filters.keyword = e.target.value.trim();
    renderCards();
  }, 250);
});

document.getElementById('sortSelect').addEventListener('change', e => {
  filters.sort = e.target.value;
  renderCards();
});

function setupTabGroup(groupId, filterKey) {
  document.getElementById(groupId).querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.getElementById(groupId).querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      filters[filterKey] = tab.dataset.value;
      renderCards();
    });
  });
}
setupTabGroup('tabStatus', 'status');
setupTabGroup('tabCategory', 'category');

window.addEventListener('scroll', () => {
  document.getElementById('navbar').classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

let toastTimer;
function showToast(msg, type = '') {
  clearTimeout(toastTimer);
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.className = `toast ${type}`;
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  toastTimer = setTimeout(() => toast.classList.remove('show'), 2800);
}

// ===== 工具函数 =====
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function formatTimeAgo(ts) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  if (m < 1)   return '刚刚';
  if (m < 60)  return `${m} 分钟前`;
  const h = Math.floor(m / 60);
  if (h < 24)  return `${h} 小时前`;
  const d = Math.floor(h / 24);
  if (d < 30)  return `${d} 天前`;
  return new Date(ts).toLocaleDateString(i18n.currentLang === 'zh-CN' ? 'zh-CN' : i18n.currentLang === 'zh-TW' ? 'zh-TW' : 'en-US');
}

// ===== 初始化 =====
loadData();
initializeAuth();

// ===== 国际化事件监听 =====
// 语言切换按钮
document.getElementById('btnLanguage').addEventListener('click', () => {
  const dropdown = document.getElementById('langDropdown');
  dropdown.classList.toggle('active');
});

// 关闭语言下拉菜单（点击其他地方）
document.addEventListener('click', (e) => {
  const langSelector = document.querySelector('.language-selector');
  if (langSelector && !langSelector.contains(e.target)) {
    document.getElementById('langDropdown').classList.remove('active');
  }
});

// 语言选项点击
document.querySelectorAll('.lang-option').forEach(btn => {
  btn.addEventListener('click', (e) => {
    const lang = e.target.dataset.lang;
    i18n.setLang(lang);
    
    // 更新语言显示
    const langNames = {
      'zh-CN': '简体',
      'zh-TW': '繁體',
      'en-US': 'English'
    };
    document.getElementById('langDisplay').textContent = langNames[lang];
    
    // 关闭下拉菜单
    document.getElementById('langDropdown').classList.remove('active');
  });
});

// 监听 i18n 更新事件，重新渲染需要翻译的动态内容
window.addEventListener('i18nUpdated', () => {
  render(); // 重新渲染物品列表
});

// ===== 登录 & 注册事件处理 =====
document.getElementById('btnLogin').addEventListener('click', () => openModal('loginOverlay'));
document.getElementById('btnRegister').addEventListener('click', () => openModal('registerOverlay'));
document.getElementById('btnCloseLogin').addEventListener('click', () => closeModal('loginOverlay'));
document.getElementById('btnCloseRegister').addEventListener('click', () => closeModal('registerOverlay'));

// 登录表单提交
document.getElementById('loginForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim();
  const password = document.getElementById('loginPassword').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!username || !password) {
    showToast(i18n.t('toast.fillRequired'), 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '登录中...';

  try {
    // 优先尝试后端 API
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });

      const data = await res.json();

      if (res.ok) {
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('auth_token', authToken);

        updateAuthUI();
        closeModal('loginOverlay');
        document.getElementById('loginForm').reset();
        showToast(i18n.t('toast.loginSuccess'), 'success');
        return;
      } else {
        showToast(data.error || '登录失败', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = i18n.t('login.submit');
        return;
      }
    } catch (err) {
      // 后端不可用，尝试本地登录
      console.log('后端不可用，尝试本地登录');
    }

    // 本地登录备用方案
    const users = getLocalUsers();

    // 支持用户名或邮箱登录
    let user = users[username];
    if (!user) {
      for (const u in users) {
        if (users[u].email === username) {
          user = users[u];
          username = u;
          break;
        }
      }
    }

    if (!user || user.password !== password) {
      showToast('用户名或密码错误', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('login.submit');
      return;
    }

    authToken = user.token;
    currentUser = { username, email: user.email };
    localStorage.setItem('auth_token', authToken);

    updateAuthUI();
    closeModal('loginOverlay');
    document.getElementById('loginForm').reset();
    showToast(i18n.t('toast.loginSuccess'), 'success');

  } catch (err) {
    console.error(err);
    showToast('登录出错，请稍后重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = i18n.t('login.submit');
  }
});

// 注册表单提交
document.getElementById('registerForm').addEventListener('submit', async e => {
  e.preventDefault();
  const username = document.getElementById('registerUsername').value.trim();
  const email = document.getElementById('registerEmail').value.trim();
  const password = document.getElementById('registerPassword').value;
  const password2 = document.getElementById('registerPassword2').value;
  const submitBtn = e.target.querySelector('button[type="submit"]');

  if (!username || !email || !password || !password2) {
    showToast(i18n.t('toast.fillRequired'), 'error');
    return;
  }

  if (username.length < 3 || username.length > 20) {
    showToast(i18n.t('toast.usernameError'), 'error');
    return;
  }

  if (password.length < 6) {
    showToast(i18n.t('toast.passwordError'), 'error');
    return;
  }

  if (password !== password2) {
    showToast(i18n.t('toast.passwordMismatch'), 'error');
    return;
  }

  submitBtn.disabled = true;
  submitBtn.textContent = '注册中...';

  try {
    const users = getLocalUsers();

    // 检查用户名是否已存在
    if (users[username]) {
      showToast('用户名已被使用，请选择其他用户名', 'error');
      submitBtn.disabled = false;
      submitBtn.textContent = i18n.t('register.submit');
      return;
    }

    // 检查邮箱是否已被注册
    for (const u in users) {
      if (users[u].email === email) {
        showToast('邮箱已被注册，请使用其他邮箱', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = i18n.t('register.submit');
        return;
      }
    }

    // 先尝试调用后端 API
    let registered = false;
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password })
      });

      if (res.ok) {
        const data = await res.json();
        authToken = data.token;
        currentUser = data.user;
        localStorage.setItem('auth_token', authToken);
        registered = true;
      }
    } catch (err) {
      // 后端不可用，使用本地注册
      console.log('后端不可用，使用本地注册');
    }

    // 如果后端未成功，使用本地注册
    if (!registered) {
      const token = generateToken();
      users[username] = {
        email,
        password: password, // 实际应该加密存储，这里仅作演示
        token,
        createdAt: Date.now()
      };
      saveLocalUsers(users);
      
      authToken = token;
      currentUser = { username, email };
      localStorage.setItem('auth_token', authToken);
    }

    updateAuthUI();
    closeModal('registerOverlay');
    document.getElementById('registerForm').reset();
    showToast(i18n.t('toast.registerSuccess'), 'success');

  } catch (err) {
    console.error(err);
    showToast('注册出错，请稍后重试', 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = i18n.t('register.submit');
  }
});

// 登录/注册模态框切换
document.getElementById('btnSwitchToRegister').addEventListener('click', e => {
  e.preventDefault();
  closeModal('loginOverlay');
  openModal('registerOverlay');
});

document.getElementById('btnSwitchToLogin').addEventListener('click', e => {
  e.preventDefault();
  closeModal('registerOverlay');
  openModal('loginOverlay');
});

// 用户菜单
document.getElementById('btnUserMenu').addEventListener('click', () => {
  const dropdown = document.getElementById('userMenuDropdown');
  dropdown.classList.toggle('active');
});

// 关闭用户菜单（点击其他地方）
document.addEventListener('click', (e) => {
  const userMenu = document.querySelector('.user-menu');
  if (userMenu && !userMenu.contains(e.target)) {
    document.getElementById('userMenuDropdown').classList.remove('active');
  }
});

// 我的发布
document.getElementById('btnMyItems').addEventListener('click', () => {
  showToast('我的发布功能开发中...', 'info');
  document.getElementById('userMenuDropdown').classList.remove('active');
});

// 退出登录
document.getElementById('btnLogout').addEventListener('click', () => {
  if (confirm('确定要退出登录吗？')) {
    currentUser = null;
    authToken = null;
    localStorage.removeItem('auth_token');
    updateAuthUI();
    document.getElementById('userMenuDropdown').classList.remove('active');
    showToast('已退出登录', 'success');
  }
});

// 登录/注册模态框背景点击关闭
['loginOverlay', 'registerOverlay'].forEach(id => {
  document.getElementById(id).addEventListener('click', e => {
    if (e.target.id === id) closeModal(id);
  });
});
