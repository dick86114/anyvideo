import React from 'react';
import { Select } from 'antd';
import { SunOutlined, MoonOutlined, EyeOutlined } from '@ant-design/icons';
import { themeOptions } from '../config/themes';

const { Option } = Select;

/**
 * 主题切换控制器组件
 * @param {Object} props - 组件属性
 * @param {string} props.currentTheme - 当前主题值
 * @param {Function} props.onThemeChange - 主题变化回调函数
 * @returns {React.ReactNode} 主题切换控制器组件
 */
const ThemeSwitcher = ({ currentTheme, onThemeChange }) => {
  // 根据主题值获取对应的图标
  const getThemeIcon = (theme) => {
    switch (theme) {
      case 'light':
        return <SunOutlined />;
      case 'dark':
        return <MoonOutlined />;
      case 'highContrast':
        return <EyeOutlined />;
      default:
        return <SunOutlined />;
    }
  };

  return (
    <Select
      value={currentTheme}
      onChange={onThemeChange}
      style={{ width: 150 }}
      size="middle"
      options={themeOptions}
      optionRender={(option) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {getThemeIcon(option.value)}
          {option.label}
        </div>
      )}
      suffixIcon={getThemeIcon(currentTheme)}
      placeholder="选择主题"
    />
  );
};

export default ThemeSwitcher;
