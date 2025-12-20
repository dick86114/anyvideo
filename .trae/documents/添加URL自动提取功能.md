## 问题分析
当前系统只能解析纯净的URL链接，无法处理包含URL的文本。当用户输入类似"文华东方你也太好拍了！ http://xhslink.com/o/LZtflJnH1H 复制后打开【小红书】查看笔记！"这样的文本时，系统会报错。

## 修复方案

### 修改前端handleParse函数
**文件**: `/Users/wangxuyang/Downloads/01_GitHub/demo/videoAll/frontend/src/pages/ContentParsing.jsx`
- 在`handleParse`函数中添加URL提取逻辑
- 使用正则表达式从输入文本中匹配并提取URL
- 确保只提取第一个匹配到的URL
- 使用提取出的URL调用后端API

### 正则表达式设计
使用通用URL正则表达式，能够匹配各种常见的URL格式，包括：
- http://和https://协议
- 各种域名格式
- URL参数和路径

### 预期效果
- 用户可以在输入框中输入包含URL的文本
- 系统会自动提取出纯净的URL进行解析
- 支持各种常见的URL格式
- 提高用户体验，减少手动处理URL的麻烦