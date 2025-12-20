# Ant Design主题切换功能实现计划

## 1. 功能需求分析
- 实现多主题切换（浅色主题、深色主题、高对比度主题）
- 主题切换实时生效，不影响用户操作状态
- 遵循Ant Design主题定制规范
- 支持所有Ant Design组件和自定义组件
- 主题偏好保存到localStorage
- 页面刷新或重新访问时自动应用上次选择的主题

## 2. 技术方案设计
- 使用Ant Design 6.x提供的ConfigProvider主题配置
- 采用CSS变量实现主题切换
- 使用localStorage持久化存储用户主题偏好
- 实现主题切换控制器组件

## 3. 实现步骤

### 3.1 创建主题配置文件
- 创建`src/config/themes.js`文件
- 定义浅色、深色、高对比度三种主题配置
- 导出主题配置对象

### 3.2 实现主题切换控制器组件
- 创建`src/components/ThemeSwitcher.jsx`组件
- 使用Ant Design的Select或Button组件实现主题切换UI
- 支持三种主题选项
- 实时响应主题变化

### 3.3 修改App.jsx入口文件
- 引入主题配置和主题切换组件
- 添加主题状态管理
- 实现localStorage主题偏好读写逻辑
- 使用ConfigProvider包裹应用，动态设置theme属性
- 将主题切换控制器添加到Header中

### 3.4 确保主题全局生效
- 确保所有页面和组件都被ConfigProvider包裹
- 检查自定义组件样式，确保支持主题切换
- 测试所有Ant Design组件的主题应用效果

## 4. 代码实现细节

### 4.1 主题配置文件结构
```javascript
// src/config/themes.js
export const themes = {
  light: {
    token: {
      // 浅色主题配置
    }
  },
  dark: {
    algorithm: darkAlgorithm,
    token: {
      // 深色主题配置
    }
  },
  highContrast: {
    token: {
      // 高对比度主题配置
    }
  }
};
```

### 4.2 App.jsx主题管理逻辑
```javascript
// src/App.jsx
const [theme, setTheme] = useState(() => {
  // 从localStorage读取主题偏好，默认浅色主题
  return localStorage.getItem('appTheme') || 'light';
});

// 主题切换处理
const handleThemeChange = (newTheme) => {
  setTheme(newTheme);
  localStorage.setItem('appTheme', newTheme);
};
```

### 4.3 主题切换控制器组件
```javascript
// src/components/ThemeSwitcher.jsx
const ThemeSwitcher = ({ currentTheme, onChange }) => {
  // 主题选项
  const themeOptions = [
    { value: 'light', label: '浅色主题', icon: <SunOutlined /> },
    { value: 'dark', label: '深色主题', icon: <MoonOutlined /> },
    { value: 'highContrast', label: '高对比度主题', icon: <EyeOutlined /> }
  ];

  return (
    <Select
      value={currentTheme}
      onChange={onChange}
      options={themeOptions}
      style={{ width: 150 }}
      // 其他配置
    />
  );
};
```

## 5. 测试和验证
- 测试主题切换功能是否正常工作
- 验证所有Ant Design组件是否正确应用主题
- 测试主题偏好是否正确保存到localStorage
- 验证页面刷新后是否自动应用上次选择的主题
- 测试主题切换是否影响用户当前操作状态

## 6. 代码规范和可维护性
- 代码结构清晰，模块化设计
- 提供必要的注释说明
- 遵循React和Ant Design最佳实践
- 确保代码可扩展性，便于后续添加更多主题

## 7. 预期效果
- 用户可以通过主题切换控制器在三种主题之间切换
- 主题切换实时生效，无页面刷新
- 所有组件正确应用所选主题样式
- 用户主题偏好持久化保存
- 页面刷新或重新访问时自动应用上次选择的主题