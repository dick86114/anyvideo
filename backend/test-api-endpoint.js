const express = require('express');
const cors = require('cors');

// 创建一个简单的测试服务器来验证API端点
const app = express();

app.use(cors());
app.use(express.json());

// 测试端点
app.get('/api/v1/content', (req, res) => {
  console.log('收到内容列表请求:', req.query);
  
  // 返回空数据
  res.json({
    message: "获取成功",
    data: {
      list: [],
      total: 0,
      page: parseInt(req.query.page) || 1,
      page_size: parseInt(req.query.page_size) || 10
    }
  });
});

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Test server is running' });
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`测试服务器运行在 http://localhost:${PORT}`);
  console.log('测试API端点: http://localhost:3001/api/v1/content');
});