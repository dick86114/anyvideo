import { useState } from 'react';
import { Button, Card, Typography, Space, Alert } from 'antd';
import apiService from '../services/api';

const { Text, Paragraph } = Typography;

const ApiDebugger = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const testUsersAPI = async () => {
    setLoading(true);
    setResult(null);
    setError(null);
    
    try {
      console.log('Testing users API...');
      const response = await apiService.users.getAll();
      console.log('API Response:', response);
      setResult(response);
    } catch (err) {
      console.error('API Error:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const checkLocalStorage = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    console.log('LocalStorage Debug:');
    console.log('Token:', token ? `${token.substring(0, 20)}...` : 'Not found');
    console.log('User:', user);
    
    setResult({
      localStorage: {
        hasToken: !!token,
        tokenPreview: token ? `${token.substring(0, 20)}...` : null,
        user: user ? JSON.parse(user) : null
      }
    });
  };

  return (
    <Card title="API 调试器" style={{ margin: '20px' }}>
      <Space direction="vertical" style={{ width: '100%' }}>
        <Space>
          <Button 
            type="primary" 
            loading={loading} 
            onClick={testUsersAPI}
          >
            测试用户API
          </Button>
          <Button onClick={checkLocalStorage}>
            检查LocalStorage
          </Button>
        </Space>
        
        {error && (
          <Alert 
            type="error" 
            message="API错误" 
            description={error}
            showIcon 
          />
        )}
        
        {result && (
          <Card size="small" title="结果">
            <Paragraph>
              <Text code>
                {JSON.stringify(result, null, 2)}
              </Text>
            </Paragraph>
          </Card>
        )}
      </Space>
    </Card>
  );
};

export default ApiDebugger;