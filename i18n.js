/**
 * 国际化 (i18n) - 多语言支持
 * 支持：简体中文 (zh-CN), 繁體中文 (zh-TW), 英文 (en-US)
 */

const i18n = {
  currentLang: localStorage.getItem('i18n_lang') || 'zh-CN',
  
  messages: {
    'zh-CN': {
      // 导航栏
      'nav.publishBtn': '发布物品',
      'nav.login': '登录',
      'nav.register': '注册',
      'nav.myItems': '我的发布',
      'nav.logout': '退出登录',
      'nav.user': '用户',
      
      // Hero 区域
      'hero.title': '失物招领，让爱回家',
      'hero.subtitle': '丢失物品？捡到东西？在这里发布，让失物与主人重逢。',
      'stats.lost': '待认领失物',
      'stats.found': '招领物品',
      'stats.solved': '成功找回',
      
      // 搜索和筛选
      'search.placeholder': '搜索物品名称、地点或描述…',
      'filter.status': '状态',
      'filter.category': '类别',
      'filter.all': '全部',
      'filter.lost': '失物',
      'filter.found': '招领',
      'filter.solved': '已解决',
      'filter.sort': '最新发布',
      'filter.sortOldest': '最早发布',
      
      // 分类
      'category.electronics': '电子产品',
      'category.id': '证件/卡片',
      'category.wallet': '钱包',
      'category.keys': '钥匙',
      'category.bag': '包类',
      'category.other': '其他',
      
      // 列表
      'list.results': '共 {count} 条',
      'list.empty': '没有找到相关物品',
      
      // 登录表单
      'login.title': '登录',
      'login.username': '用户名或邮箱',
      'login.password': '密码',
      'login.submit': '登录',
      'login.noAccount': '还没有账户？',
      'login.register': '注册新账户',
      'login.required': '必填',
      
      // 注册表单
      'register.title': '注册',
      'register.username': '用户名',
      'register.email': '邮箱',
      'register.password': '密码',
      'register.confirmPassword': '确认密码',
      'register.submit': '注册',
      'register.hasAccount': '已有账户？',
      'register.login': '直接登录',
      'register.usernameHint': '用户名长度需要 3-20 个字符',
      'register.passwordHint': '密码长度至少 6 个字符',
      
      // 发布表单
      'publish.title': '发布物品信息',
      'publish.type': '我要发布',
      'publish.lost': '🔍 我丢失了',
      'publish.found': '📦 我捡到了',
      'publish.name': '物品名称',
      'publish.nameHint': '例如：黑色 AirPods Pro',
      'publish.category': '物品类别',
      'publish.categorySelect': '请选择',
      'publish.date': '发生日期',
      'publish.location': '发生位置',
      'publish.contact': '联系方式',
      'publish.desc': '详细描述',
      'publish.images': '上传图片',
      'publish.submit': '发布',
      'publish.cancel': '取消',
      
      // 详情
      'detail.location': '地点',
      'detail.date': '时间',
      'detail.category': '类别',
      'detail.contact': '联系方式',
      'detail.copy': '复制',
      
      // 提示消息
      'toast.loginRequired': '请先登录后再发布物品',
      'toast.fillRequired': '请填写所有必填项',
      'toast.publishSuccess': '发布成功！',
      'toast.publishError': '发布失败，请重试',
      'toast.contactCopied': '联系方式已复制',
      'toast.copyError': '复制失败，请手动复制',
      'toast.loadError': '获取数据失败，请确保后端已启动',
      'toast.loginSuccess': '登录成功！',
      'toast.registerSuccess': '注册成功，请登录！',
      'toast.passwordMismatch': '两次输入的密码不一致',
      'toast.usernameError': '用户名长度需要 3-20 个字符',
      'toast.passwordError': '密码长度至少 6 个字符',
    },
    
    'zh-TW': {
      // 導航欄
      'nav.publishBtn': '發佈物品',
      'nav.login': '登入',
      'nav.register': '註冊',
      'nav.myItems': '我的發佈',
      'nav.logout': '退出登入',
      'nav.user': '使用者',
      
      // Hero 區域
      'hero.title': '失物招領，讓愛回家',
      'hero.subtitle': '丟失物品？撿到東西？在這裡發佈，讓失物與主人重逢。',
      'stats.lost': '待認領失物',
      'stats.found': '招領物品',
      'stats.solved': '成功找回',
      
      // 搜尋和篩選
      'search.placeholder': '搜尋物品名稱、地點或描述…',
      'filter.status': '狀態',
      'filter.category': '類別',
      'filter.all': '全部',
      'filter.lost': '失物',
      'filter.found': '招領',
      'filter.solved': '已解決',
      'filter.sort': '最新發佈',
      'filter.sortOldest': '最早發佈',
      
      // 分類
      'category.electronics': '電子產品',
      'category.id': '證件/卡片',
      'category.wallet': '錢包',
      'category.keys': '鑰匙',
      'category.bag': '包類',
      'category.other': '其他',
      
      // 列表
      'list.results': '共 {count} 條',
      'list.empty': '沒有找到相關物品',
      
      // 登入表單
      'login.title': '登入',
      'login.username': '使用者名稱或信箱',
      'login.password': '密碼',
      'login.submit': '登入',
      'login.noAccount': '還沒有帳戶？',
      'login.register': '註冊新帳戶',
      'login.required': '必填',
      
      // 註冊表單
      'register.title': '註冊',
      'register.username': '使用者名稱',
      'register.email': '信箱',
      'register.password': '密碼',
      'register.confirmPassword': '確認密碼',
      'register.submit': '註冊',
      'register.hasAccount': '已有帳戶？',
      'register.login': '直接登入',
      'register.usernameHint': '使用者名稱長度需要 3-20 個字元',
      'register.passwordHint': '密碼長度至少 6 個字元',
      
      // 發佈表單
      'publish.title': '發佈物品資訊',
      'publish.type': '我要發佈',
      'publish.lost': '🔍 我丟失了',
      'publish.found': '📦 我撿到了',
      'publish.name': '物品名稱',
      'publish.nameHint': '例如：黑色 AirPods Pro',
      'publish.category': '物品類別',
      'publish.categorySelect': '請選擇',
      'publish.date': '發生日期',
      'publish.location': '發生位置',
      'publish.contact': '聯繫方式',
      'publish.desc': '詳細描述',
      'publish.images': '上傳圖片',
      'publish.submit': '發佈',
      'publish.cancel': '取消',
      
      // 詳情
      'detail.location': '地點',
      'detail.date': '時間',
      'detail.category': '類別',
      'detail.contact': '聯繫方式',
      'detail.copy': '複製',
      
      // 提示訊息
      'toast.loginRequired': '請先登入後再發佈物品',
      'toast.fillRequired': '請填寫所有必填項',
      'toast.publishSuccess': '發佈成功！',
      'toast.publishError': '發佈失敗，請重試',
      'toast.contactCopied': '聯繫方式已複製',
      'toast.copyError': '複製失敗，請手動複製',
      'toast.loadError': '取得資料失敗，請確保後端已啟動',
      'toast.loginSuccess': '登入成功！',
      'toast.registerSuccess': '註冊成功，請登入！',
      'toast.passwordMismatch': '兩次輸入的密碼不一致',
      'toast.usernameError': '使用者名稱長度需要 3-20 個字元',
      'toast.passwordError': '密碼長度至少 6 個字元',
    },
    
    'en-US': {
      // Navigation
      'nav.publishBtn': 'Publish Item',
      'nav.login': 'Login',
      'nav.register': 'Register',
      'nav.myItems': 'My Posts',
      'nav.logout': 'Logout',
      'nav.user': 'User',
      
      // Hero Section
      'hero.title': 'Lost & Found, Reuniting Hearts',
      'hero.subtitle': 'Lost something? Found an item? Post here and help reunite lost items with their owners.',
      'stats.lost': 'Missing Items',
      'stats.found': 'Found Items',
      'stats.solved': 'Resolved Cases',
      
      // Search and Filter
      'search.placeholder': 'Search item name, location or description…',
      'filter.status': 'Status',
      'filter.category': 'Category',
      'filter.all': 'All',
      'filter.lost': 'Lost',
      'filter.found': 'Found',
      'filter.solved': 'Resolved',
      'filter.sort': 'Newest First',
      'filter.sortOldest': 'Oldest First',
      
      // Categories
      'category.electronics': 'Electronics',
      'category.id': 'ID/Card',
      'category.wallet': 'Wallet',
      'category.keys': 'Keys',
      'category.bag': 'Bag',
      'category.other': 'Other',
      
      // List
      'list.results': 'Total {count} items',
      'list.empty': 'No items found',
      
      // Login Form
      'login.title': 'Login',
      'login.username': 'Username or Email',
      'login.password': 'Password',
      'login.submit': 'Login',
      'login.noAccount': "Don't have an account?",
      'login.register': 'Create new account',
      'login.required': 'Required',
      
      // Register Form
      'register.title': 'Register',
      'register.username': 'Username',
      'register.email': 'Email',
      'register.password': 'Password',
      'register.confirmPassword': 'Confirm Password',
      'register.submit': 'Register',
      'register.hasAccount': 'Already have an account?',
      'register.login': 'Login directly',
      'register.usernameHint': 'Username must be 3-20 characters',
      'register.passwordHint': 'Password must be at least 6 characters',
      
      // Publish Form
      'publish.title': 'Publish Item Information',
      'publish.type': 'I want to',
      'publish.lost': '🔍 Report Lost Item',
      'publish.found': '📦 Report Found Item',
      'publish.name': 'Item Name',
      'publish.nameHint': 'e.g. Black AirPods Pro',
      'publish.category': 'Item Category',
      'publish.categorySelect': 'Select category',
      'publish.date': 'Date of Incident',
      'publish.location': 'Location',
      'publish.contact': 'Contact Information',
      'publish.desc': 'Description',
      'publish.images': 'Upload Images',
      'publish.submit': 'Publish',
      'publish.cancel': 'Cancel',
      
      // Details
      'detail.location': 'Location',
      'detail.date': 'Date',
      'detail.category': 'Category',
      'detail.contact': 'Contact Information',
      'detail.copy': 'Copy',
      
      // Toast Messages
      'toast.loginRequired': 'Please login first before posting',
      'toast.fillRequired': 'Please fill in all required fields',
      'toast.publishSuccess': 'Posted successfully!',
      'toast.publishError': 'Failed to post, please try again',
      'toast.contactCopied': 'Contact information copied',
      'toast.copyError': 'Copy failed, please copy manually',
      'toast.loadError': 'Failed to load data, please ensure backend is running',
      'toast.loginSuccess': 'Login successful!',
      'toast.registerSuccess': 'Registration successful, please login!',
      'toast.passwordMismatch': 'Passwords do not match',
      'toast.usernameError': 'Username must be 3-20 characters',
      'toast.passwordError': 'Password must be at least 6 characters',
    }
  },
  
  // 获取翻译文本
  t(key, params = {}) {
    let text = this.messages[this.currentLang][key] || this.messages['zh-CN'][key] || key;
    
    // 处理参数替换 {placeholder}
    Object.keys(params).forEach(param => {
      text = text.replace(`{${param}}`, params[param]);
    });
    
    return text;
  },
  
  // 设置语言
  setLang(lang) {
    if (this.messages[lang]) {
      this.currentLang = lang;
      localStorage.setItem('i18n_lang', lang);
      document.documentElement.lang = lang;
      this.updatePageText();
      return true;
    }
    return false;
  },
  
  // 获取当前语言
  getLang() {
    return this.currentLang;
  },
  
  // 获取所有支持的语言
  getSupportedLangs() {
    return [
      { code: 'zh-CN', name: '简体中文', nativeName: '简体中文' },
      { code: 'zh-TW', name: '繁體中文', nativeName: '繁體中文' },
      { code: 'en-US', name: 'English', nativeName: 'English' }
    ];
  },
  
  // 更新页面上所有带有 data-i18n 属性的文本
  updatePageText() {
    // 更新 data-i18n 属性的元素
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      el.textContent = this.t(key);
    });
    
    // 更新 placeholder 属性
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      el.placeholder = this.t(key);
    });
    
    // 更新 title 属性
    document.querySelectorAll('[data-i18n-title]').forEach(el => {
      const key = el.getAttribute('data-i18n-title');
      el.title = this.t(key);
    });
    
    // 触发自定义事件，通知其他脚本进行动态翻译
    window.dispatchEvent(new CustomEvent('i18nUpdated', { detail: { lang: this.currentLang } }));
  }
};

// 初始化时更新页面
document.addEventListener('DOMContentLoaded', () => {
  i18n.updatePageText();
});
