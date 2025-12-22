# 媒体解析 SDK 安装指南

## 系统要求

- Python 3.8 或更高版本
- 操作系统：Windows、macOS、Linux

## 安装方法

### 方法 1：从源码安装（推荐）

```bash
# 克隆或下载项目
git clone <repository-url>
cd media-parser-sdk

# 安装依赖
pip install -r requirements.txt

# 安装SDK（开发模式）
pip install -e .
```

### 方法 2：直接使用

如果不想安装，可以直接在项目目录中使用：

```bash
cd media-parser-sdk
python3 -c "
import sys
sys.path.insert(0, '.')
from media_parser_sdk import MediaParser
parser = MediaParser()
print('SDK可用')
"
```

## 验证安装

运行测试脚本验证安装：

```bash
# 基础功能测试
python3 test_sdk.py

# 完整功能测试
python3 test_complete.py

# 小红书功能测试
python3 test_xiaohongshu.py
```

## 依赖说明

核心依赖：

- `httpx>=0.25.0` - HTTP 客户端
- `rich>=13.0.0` - 终端美化
- `retry>=0.9.2` - 重试机制
- `pydantic>=2.0.0` - 数据验证
- `typing-extensions>=4.0.0` - 类型支持

## 常见问题

### Q: 导入失败

A: 确保 Python 版本>=3.8，并检查依赖是否正确安装

### Q: 网络请求失败

A: 检查网络连接，某些平台可能有访问限制

### Q: 解析失败

A: 确保链接格式正确，某些私密内容可能无法访问

## 下一步

安装完成后，请查看：

- [README.md](README.md) - 详细使用文档
- [examples/](examples/) - 使用示例
- [test\_\*.py](.) - 测试脚本
