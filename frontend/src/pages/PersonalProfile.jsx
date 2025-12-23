import { useState, useEffect } from 'react';
import { 
  Card, 
  Form, 
  Input, 
  Button, 
  Space, 
  message, 
  Divider,
  Typography,
  Tag,
  Alert
} from 'antd';
import { 
  UserOutlined, 
  LockOutlined, 
  SaveOutlined,
  KeyOutlined
} from '@ant-design/icons';
import apiService from '../services/api';

const { Title, Text } = Typography;

const PersonalProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [profileForm] = Form.useForm();
  const [passwordForm] = Form.useForm();

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getCurrentUser();
      setUser(response.data);
      profileForm.setFieldsValue({
        username: response.data.username
      });
    } catch (error) {
      message.error('获取用户信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);
      const values = await profileForm.validateFields();
      
      const response = await apiService.users.updateCurrentUser(values);
      
      // Update local storage
      const updatedUser = response.data;
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      message.success('个人信息更新成功');
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('更新个人信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setPasswordLoading(true);
      const values = await passwordForm.validateFields();
      
      await apiService.users.changeCurrentUserPassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword
      });
      
      message.success('密码修改成功');
      passwordForm.resetFields();
    } catch (error) {
      if (error.errorFields) {
        return;
      }
      message.error('修改密码失败: ' + error.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  if (!user) {
    return <Card loading={true} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        {/* User Info Card */}
        <Card
          title={
            <Space>
              <UserOutlined />
              <Title level={4} style={{ margin: 0 }}>个人信息</Title>
            </Space>
          }
        >
          <div style={{ marginBottom: 24 }}>
            <Space direction="vertical" size="middle">
              <div>
                <Text strong>用户ID: </Text>
                <Text code>{user._id}</Text>
              </div>
              <div>
                <Text strong>角色: </Text>
                <Tag color={user.role === 'admin' ? 'red' : 'blue'}>
                  {user.role === 'admin' ? '管理员' : '操作员'}
                </Tag>
              </div>
              <div>
                <Text strong>状态: </Text>
                <Tag color={user.is_active ? 'green' : 'red'}>
                  {user.is_active ? '启用' : '禁用'}
                </Tag>
              </div>
              <div>
                <Text strong>创建时间: </Text>
                <Text>{new Date(user.created_at).toLocaleString('zh-CN')}</Text>
              </div>
            </Space>
          </div>

          <Divider />

          <Form
            form={profileForm}
            layout="vertical"
            onFinish={handleUpdateProfile}
          >
            <Form.Item
              name="username"
              label="用户名"
              rules={[
                { required: true, message: '请输入用户名' },
                { min: 3, message: '用户名至少3个字符' },
                { max: 20, message: '用户名不能超过20个字符' },
                { pattern: /^[a-zA-Z0-9_]+$/, message: '用户名只能包含字母、数字和下划线' }
              ]}
            >
              <Input 
                prefix={<UserOutlined />} 
                placeholder="请输入用户名"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<SaveOutlined />}
                loading={loading}
                size="large"
              >
                保存个人信息
              </Button>
            </Form.Item>
          </Form>
        </Card>

        {/* Change Password Card */}
        <Card
          title={
            <Space>
              <KeyOutlined />
              <Title level={4} style={{ margin: 0 }}>修改密码</Title>
            </Space>
          }
        >
          <Alert
            message="密码安全提示"
            description="为了账户安全，建议定期更换密码。新密码应至少包含6个字符。"
            type="info"
            showIcon
            style={{ marginBottom: 24 }}
          />

          <Form
            form={passwordForm}
            layout="vertical"
            onFinish={handleChangePassword}
          >
            <Form.Item
              name="currentPassword"
              label="当前密码"
              rules={[
                { required: true, message: '请输入当前密码' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请输入当前密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="newPassword"
              label="新密码"
              rules={[
                { required: true, message: '请输入新密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请输入新密码"
                size="large"
              />
            </Form.Item>

            <Form.Item
              name="confirmPassword"
              label="确认新密码"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: '请确认新密码' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('两次输入的密码不一致'));
                  }
                })
              ]}
            >
              <Input.Password 
                prefix={<LockOutlined />} 
                placeholder="请再次输入新密码"
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                icon={<KeyOutlined />}
                loading={passwordLoading}
                size="large"
              >
                修改密码
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default PersonalProfile;