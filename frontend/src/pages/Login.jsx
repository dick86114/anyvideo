import { Form, Input, Button, Card, Typography, Space, Checkbox } from 'antd';
import { LockOutlined, UserOutlined, DeleteOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import apiService from '../services/api';

const { Title } = Typography;

const Login = ({ onLogin }) => {
  const [form] = Form.useForm();
  const navigate = useNavigate();

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
    const credentials = getSavedCredentials();
    if (credentials) {
      form.setFieldsValue({
        username: credentials.username,
        password: credentials.password,
        remember: true
      });
    }
  }, [form]);

  const handleLogin = async (values) => {
    try {
      // Mock login - 使用模拟数据替代实际API调用，避免依赖后端服务
      console.log('Login values:', values);
      
      // 模拟登录成功响应
      const mockResponse = {
        token: 'mock-token-' + Date.now(),
        user: {
          id: '1',
          username: values.username,
          role: 'admin'
        }
      };
      
      // Store user info and token in localStorage
      localStorage.setItem('token', mockResponse.token);
      localStorage.setItem('user', JSON.stringify(mockResponse.user));
      
      // 保存登录凭证（如果用户勾选了"记住密码"）
      if (values.remember) {
        saveCredentials(values);
      } else {
        clearSavedCredentials();
      }
      
      // Call onLogin prop to update parent component state
      onLogin(mockResponse.user);
      
      // Navigate to dashboard after successful login
      navigate('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      alert('登录失败: ' + error.message);
    }
  };

  return (
    <Card 
      style={{ width: 400, boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)' }}
      title={
        <Space direction="vertical" align="center" size="small" style={{ width: '100%' }}>
          <Title level={2} style={{ margin: 0, color: '#1890ff' }}>
            内容管理系统
          </Title>
        </Space>
      }
    >
      <Form
        form={form}
        name="login"
        initialValues={{ remember: false }}
        onFinish={handleLogin}
        style={{ maxWidth: 360, margin: '0 auto' }}
      >
        <Form.Item
          name="username"
          rules={[{ required: true, message: '请输入用户名!' }]}
        >
          <Input 
            prefix={<UserOutlined className="site-form-item-icon" />} 
            placeholder="用户名"
          />
        </Form.Item>
        <Form.Item
          name="password"
          rules={[{ required: true, message: '请输入密码!' }]}
        >
          <Input
            prefix={<LockOutlined className="site-form-item-icon" />}
            type="password"
            placeholder="密码"
          />
        </Form.Item>
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
        <Form.Item>
          <Button 
            type="primary" 
            htmlType="submit" 
            style={{ width: '100%', height: 40, fontSize: 16 }}
          >
            登录
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Login;