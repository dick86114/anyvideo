import { useState, useEffect } from 'react';
import { 
  Card, 
  Space, 
  message, 
  Typography,
  Tag
} from 'antd';
import { 
  UserOutlined
} from '@ant-design/icons';
import apiService from '../services/api';

const { Title, Text } = Typography;

const PersonalProfile = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadUserProfile();
  }, []);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getCurrentUser();
      setUser(response.data);
    } catch (error) {
      message.error('获取用户信息失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return <Card loading={loading} />;
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto' }}>
      <Card
        title={
          <Space>
            <UserOutlined />
            <Title level={4} style={{ margin: 0 }}>个人资料</Title>
          </Space>
        }
        loading={loading}
      >
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Text strong>用户名: </Text>
            <Text style={{ fontSize: '16px' }}>{user.username}</Text>
          </div>
          
          <div>
            <Text strong>用户ID: </Text>
            <Text code>{user.id}</Text>
          </div>
          
          <div>
            <Text strong>角色: </Text>
            <Tag color={user.role === 'admin' ? 'red' : 'blue'} size="large">
              {user.role === 'admin' ? '管理员' : '操作员'}
            </Tag>
          </div>
          
          <div>
            <Text strong>状态: </Text>
            <Tag color={user.is_active ? 'green' : 'red'} size="large">
              {user.is_active ? '启用' : '禁用'}
            </Tag>
          </div>
          
          <div>
            <Text strong>创建时间: </Text>
            <Text>{new Date(user.created_at).toLocaleString('zh-CN')}</Text>
          </div>
          
          <div>
            <Text strong>最后更新: </Text>
            <Text>{new Date(user.updated_at).toLocaleString('zh-CN')}</Text>
          </div>
        </Space>
      </Card>
    </div>
  );
};

export default PersonalProfile;