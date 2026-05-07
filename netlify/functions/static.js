/**
 * Netlify 无服务器函数 - 图片获取/代理
 * 处理静态文件和上传的图片
 */

const fs = require('fs');
const path = require('path');

/**
 * GET /.netlify/functions/static
 * 代理获取上传的图片
 */
exports.handler = async (event, context) => {
  try {
    // 从查询参数获取文件路径
    const filename = event.queryStringParameters?.file;
    
    if (!filename) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: '缺少 file 参数' })
      };
    }

    // 防止路径遍历攻击
    const safePath = path.basename(filename);
    const filePath = path.join('/tmp/uploads', safePath);

    // 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: '文件不存在' })
      };
    }

    // 读取文件
    const fileContent = fs.readFileSync(filePath);
    
    // 获取文件类型
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp'
    };
    
    const contentType = mimeTypes[ext] || 'application/octet-stream';

    return {
      statusCode: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000'
      },
      body: fileContent.toString('base64'),
      isBase64Encoded: true
    };
  } catch (error) {
    console.error('错误:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: '服务器错误', message: error.message })
    };
  }
};
