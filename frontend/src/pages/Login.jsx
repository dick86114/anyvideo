import { useState, useEffect } from 'react';
import { Form, Input, Button, Card, Typography, Space, Checkbox, Alert, Spin } from 'antd';
import { LockOutlined, UserOutlined, DeleteOutlined, SettingOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiService from '../services/api';

const { Title, Text } = Typography;

const Login = ({ onLogin }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [checkingSystem, setCheckingSystem] = useState(true);
  const [systemStatus, setSystemStatus] = useState(null);
  const [isInitialSetup, setIsInitialSetup] = useState(false);

  // Check system status on component mount
  useEffect(() => {
    checkSystemStatus();
  }, []);

  const checkSystemStatus = async () => {
    try {
      setCheckingSystem(true);
      const response = await apiService.auth.checkSystemStatus();
      setSystemStatus(response.data);
      setIsInitialSetup(response.data.needsInitialSetup);
    } catch (error) {
      console.error('System status check failed:', error);
      // If system check fails, assume normal login mode
      setSystemStatus({ hasUsers: true, needsInitialSetup: false });
      setIsInitialSetup(false);
    } finally {
      setCheckingSystem(false);
    }
  };

  // 获取已保存的登录凭证
  const getSavedCredentials = () => {
    try {
      const saved = localStorage.getItem('savedCredentials');
      if (saved) {
        const credentials = JSON.parse(saved);
        // 简单的解密（实际项目中应使用更安全的加密方式）
        credentials.password = atob(credentials.password);
        return credentials;
      }
    } catch (error) {
      console.error('Failed to get saved credentials:', error);
    }
    return null;
  };

  // 保存登录凭证
  const saveCredentials = (values) => {
    try {
      const credentials = {
        username: values.username,
        // 简单的加密（实际项目中应使用更安全的加密方式，如bcrypt或使用专门的加密库）
        password: btoa(values.password)
      };
      localStorage.setItem('savedCredentials', JSON.stringify(credentials));
    } catch (error) {
      console.error('Failed to save credentials:', error);
    }
  };

  // 清除已保存的登录凭证
  const clearSavedCredentials = () => {
    localStorage.removeItem('savedCredentials');
    form.setFieldsValue({ username: '', password: '', remember: false });
  };

  // 自动填充登录凭证
  useEffect(() => {
    if (!isInitialSetup) {
      const credentials = getSavedCredentials();
      if (credentials) {
        form.setFieldsValue({
          username: credentials.username,
          password: credentials.password,
          remember: true
        });
      }
    }
  }, [form, isInitialSetup]);

  const handleSubmit = async (values) => {
    try {
      setLoading(true);
      
      let response;
      if (isInitialSetup) {
        // Initial system setup
        response = await apiService.auth.initialSetup({
          username: values.username,
          password: values.password
        });
      } else {
        // Normal login
        response = await apiService.auth.login({
          username: values.username,
          password: values.password
        });
      }
      
      // Store user info and token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      // 保存登录凭证（如果用户勾选了"记住密码"）
      if (values.remember && !isInitialSetup) {
        saveCredentials(values);
      } else if (!isInitialSetup) {
        clearSavedCredentials();
      }
      
      // Call onLogin prop to update parent component state
      onLogin(response.data.user);
      
      // Navigate to dashboard after successful login/setup
      navigate('/dashboard');
    } catch (error) {
      console.error('Login/Setup error:', error);
      // Error is already handled by the API interceptor
    } finally {
      setLoading(false);
    }
  };

  if (checkingSystem) {
    return (
      <Card style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}>
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>
            <Text>正在检查系统状态...</Text>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card 
      style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
      title={
        <Space direction="vertical" align="center" size="small" style={{ width: '100%' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            内容管理系统
          </Title>
          {isInitialSetup && (
            <Space>
              <SettingOutlined style={{ color: '#52c41a' }} />
              <Text type="success">系统初始化</Text>
            </Space>
          )}
        </Space>
      }
    >
      {isInitialSetup && (
        <Alert
          message="欢迎使用内容管理系统"
          description="系统检测到这是首次使用，请创建管理员账户来完成初始化设置。"
          type="info"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      <Form
        form={form}
        name={isInitialSetup ? "initial-setup" : "login"}
        initialValues={{ remember: false }}
        onFinish={handleSubmit}
        style={{ maxWidth: 360, margin: '0 auto' }}
      >
        <Form.Item
          name="username"
          rules={[
            { required: true, message: '请输入用户名!' },
            { min: 3, message: '用户名至少3个字符!' },
            { max: 20, message: '用户名不能超过20个字符!' }
          ]}
        >
          <Input 
            prefix={<UserOutlined className="site-form-item-icon" />} 
            placeholder={isInitialSetup ? "管理员用户名" : "用户名"}
            size="large"
          />
        </Form.Item>
        
        <Form.Item
          name="password"
          rules={[
            { required: true, message: '请输入密码!' },
            { min: 6, message: '密码至少6个字符!' }
          ]}
        >
          <Input.Password
            prefix={<LockOutlined className="site-form-item-icon" />}
            placeholder={isInitialSetup ? "管理员密码" : "密码"}
            size="large"
          />
        </Form.Item>

        {!isInitialSetup && (
          <Form.Item
            name="remember"
            valuePropName="checked"
            wrapperCol={{ offset: 0, span: 24 }}
          >
            <Space style={{ width: '100%', justifyContent: 'space-between' }}>
              <Checkbox>记住密码</Checkbox>
              <Button 
                type="link" 
                size="small" 
                icon={<DeleteOutlined />} 
                onClick={clearSavedCredentials}
              >
                清除已保存密码
              </Button>
            </Space>
          </Form.Item>
        )}

        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            loading={loading}
            style={{ width: '100%', height: 40, fontSize: 16 }}
          >
            {isInitialSetup ? '创建管理员账户' : '登录'}
          </Button>
        </Form.Item>
      </Form>

      {systemStatus && !isInitialSetup && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary" style={{ fontSize: 12 }}>
            系统用户数: {systemStatus.userCount}
          </Text>
        </div>
      )}
    </Card>
  );
};

export default Login;