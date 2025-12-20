import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Layout, Menu, ConfigProvider, Select } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import {
  HomeOutlined,
  VideoCameraOutlined,
  FileSearchOutlined,
  ScheduleOutlined,
  BarChartOutlined,
  SettingOutlined,
  LoginOutlined
} from '@ant-design/icons';
import './App.css';
import { useState } from 'react';
import { themes } from './config/themes';
import ThemeSwitcher from './components/ThemeSwitcher';

// Import placeholder pages
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import ContentParsing from './pages/ContentParsing';
import ContentManagement from './pages/ContentManagement';
import TaskManagement from './pages/TaskManagement';
import HotSearch from './pages/HotSearch';
import SystemConfig from './pages/SystemConfig';

const { Header, Content, Sider } = Layout;

// Move menuItems outside App component to make it accessible
const menuItems = [
  { key: '/dashboard', icon: <HomeOutlined />, label: '仪表盘' },
  { key: '/parsing', icon: <FileSearchOutlined />, label: '单作品解析' },
  { key: '/content', icon: <VideoCameraOutlined />, label: '内容管理' },
  { key: '/tasks', icon: <ScheduleOutlined />, label: '任务调度' },
  { key: '/hotsearch', icon: <BarChartOutlined />, label: '平台热搜' },
  { key: '/config', icon: <SettingOutlined />, label: '系统配置' },
];

// Protected route component
const ProtectedRoute = ({ children, isAuthenticated }) => {
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

// Main App component
function App() {
  const [collapsed, setCollapsed] = useState(false);
  // Initialize currentUser from localStorage if exists
  const [currentUser, setCurrentUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Initialize theme from localStorage if exists, default to light
  const [currentTheme, setCurrentTheme] = useState(() => {
    const savedTheme = localStorage.getItem('appTheme');
    return savedTheme || 'light';
  });

  // Handle theme change
  const handleThemeChange = (newTheme) => {
    setCurrentTheme(newTheme);
    localStorage.setItem('appTheme', newTheme);
  };

  // Mock login state (will be replaced with actual auth)
  const isAuthenticated = !!currentUser;

  // Handle logout
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Clear saved credentials for security
    localStorage.removeItem('savedCredentials');
    // Update state
    setCurrentUser(null);
  };

  // RouterWrapper component that has access to router context
  const RouterWrapper = () => {
    // Navigation hooks - now inside Router context
    const navigate = useNavigate();
    const location = useLocation();

    // Handle menu click for navigation
    const handleMenuClick = (e) => {
      navigate(e.key);
    };

    return (
      <Layout style={{ minHeight: '100vh' }}>
        {isAuthenticated ? (
          <>
            <Sider collapsible collapsed={collapsed} onCollapse={setCollapsed}>
              <div className="logo" style={{ height: '32px', margin: '16px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                内容管理系统
              </div>
              <Menu 
                theme="dark" 
                mode="inline" 
                selectedKeys={[location.pathname]}
                items={menuItems}
                onClick={handleMenuClick}
              />
            </Sider>
            <Layout>
              <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
                <h1 style={{ margin: 0, fontSize: '18px', color: currentTheme === 'dark' ? '#40a9ff' : '#1890ff' }}>内容解析、管理与热点发现系统</h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <ThemeSwitcher currentTheme={currentTheme} onThemeChange={handleThemeChange} />
                  {currentUser && (
                    <span>欢迎, {currentUser.username}</span>
                  )}
                  <button
                    onClick={handleLogout}
                    style={{ padding: '6px 12px', background: '#1890ff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    退出登录
                  </button>
                </div>
              </Header>
              <Content style={{ margin: '24px 16px', padding: 24, minHeight: 280 }}>
                <Routes>
                  {/* Redirect to dashboard if authenticated user tries to access login */}
                  <Route path="/login" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/" element={<Navigate to="/dashboard" replace />} />
                  <Route path="/dashboard" element={<ProtectedRoute isAuthenticated={isAuthenticated}><Dashboard /></ProtectedRoute>} />
                  <Route path="/parsing" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ContentParsing /></ProtectedRoute>} />
                  <Route path="/content" element={<ProtectedRoute isAuthenticated={isAuthenticated}><ContentManagement /></ProtectedRoute>} />
                  <Route path="/tasks" element={<ProtectedRoute isAuthenticated={isAuthenticated}><TaskManagement /></ProtectedRoute>} />
                  <Route path="/hotsearch" element={<ProtectedRoute isAuthenticated={isAuthenticated}><HotSearch /></ProtectedRoute>} />
                  <Route path="/config" element={<ProtectedRoute isAuthenticated={isAuthenticated}><SystemConfig /></ProtectedRoute>} />
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </Content>
            </Layout>
          </>
        ) : (
          <Content style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
            <Routes>
              <Route path="/login" element={<Login onLogin={setCurrentUser} />} />
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </Content>
        )}
      </Layout>
    );
  };

  return (
    <ConfigProvider locale={zhCN} theme={themes[currentTheme]}>
      <Router>
        <RouterWrapper />
      </Router>
    </ConfigProvider>
  );
}

export default App;
