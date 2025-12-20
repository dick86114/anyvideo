import { theme } from 'antd';

const { darkAlgorithm, defaultAlgorithm, highContrastAlgorithm } = theme;

// 主题配置
export const themes = {
  light: {
    algorithm: defaultAlgorithm,
    token: {
      colorPrimary: '#1890ff',
      colorBgContainer: '#ffffff',
      colorBgLayout: '#f0f2f5',
      colorText: '#000000d9',
      colorTextSecondary: '#00000073',
    },
  },
  dark: {
    algorithm: darkAlgorithm,
    token: {
      colorPrimary: '#40a9ff',
      colorBgContainer: '#1f1f1f',
      colorBgLayout: '#141414',
      colorText: '#ffffff',
      colorTextSecondary: '#ffffff99',
    },
  },
  highContrast: {
    algorithm: highContrastAlgorithm,
    token: {
      colorPrimary: '#0066cc',
      colorBgContainer: '#ffffff',
      colorBgLayout: '#f5f5f5',
      colorText: '#000000',
      colorTextSecondary: '#333333',
    },
  },
};

// 主题选项，用于下拉选择器
export const themeOptions = [
  { value: 'light', label: '浅色主题' },
  { value: 'dark', label: '深色主题' },
  { value: 'highContrast', label: '高对比度主题' },
];
