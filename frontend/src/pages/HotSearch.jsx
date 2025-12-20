import { useState, useEffect } from 'react';
import { Card, Typography, Space, Select, DatePicker, List, Button, message, Spin, Modal, Collapse } from 'antd';
import { FileSearchOutlined, ReloadOutlined, InfoCircleOutlined } from '@ant-design/icons';
import apiService from '../services/api';

const { Title } = Typography;

const HotSearch = () => {
  const [hotsearchData, setHotsearchData] = useState([]);
  const [platforms, setPlatforms] = useState([]);
  const [selectedPlatform, setSelectedPlatform] = useState('douyin');
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  
  // State for related content
  const [relatedContentModalVisible, setRelatedContentModalVisible] = useState(false);
  const [relatedContent, setRelatedContent] = useState([]);
  const [relatedContentLoading, setRelatedContentLoading] = useState(false);
  const [currentKeyword, setCurrentKeyword] = useState('');
  const [currentPlatform, setCurrentPlatform] = useState('');
  
  // Collapse for related content display
  


  // Fetch available platforms
  const fetchPlatforms = async () => {
    try {
      const result = await apiService.hotsearch.getPlatforms();
      setPlatforms(Array.isArray(result) ? result : result.data || []);
      if (result.data && result.data.length > 0 && !selectedPlatform) {
        setSelectedPlatform(result.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch platforms:', error);
      message.error('获取平台列表失败');
      setPlatforms(['douyin', 'xiaohongshu', 'weibo', 'kuaishou', 'bilibili']);
    }
  };







  // Fetch hotsearch data
  const fetchHotsearchData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedDate) {
        params.date = selectedDate.format('YYYY-MM-DD');
      }
      const result = await apiService.hotsearch.getByDate(selectedPlatform, params);
      const hotsearchData = Array.isArray(result) ? result : result.data || [];
      
      // Sort data by rank if it exists, otherwise by heat
      const sortedData = [...hotsearchData].sort((a, b) => {
        if (a.rank && b.rank) {
          return a.rank - b.rank;
        }
        return (b.heat || 0) - (a.heat || 0);
      });
      
      setHotsearchData(sortedData);
    } catch (error) {
      console.error('Failed to fetch hotsearch data:', error);
      message.error('获取热搜数据失败');
      setHotsearchData([]);
    } finally {
      setLoading(false);
    }
  };

  // Refresh hotsearch data
  const refreshHotsearch = async () => {
    try {
      setFetching(true);
      await apiService.hotsearch.fetch(selectedPlatform);
      await fetchHotsearchData();
      message.success('热搜数据刷新成功');
    } catch (error) {
      console.error('Failed to refresh hotsearch:', error);
      message.error(error.message || '刷新热搜数据失败');
    } finally {
      setFetching(false);
    }
  };

  // Handle platform change
  const handlePlatformChange = (value) => {
    setSelectedPlatform(value);
  };

  // Handle date change
  const handleDateChange = (date) => {
    setSelectedDate(date);
  };

  // Handle keyword parse
  const handleParseKeyword = (keyword) => {
    message.info(`开始解析关键词: ${keyword}`);
    // Navigate to parsing page with keyword pre-filled
    // In real implementation, this would navigate to the parsing page
    console.log('Parse keyword:', keyword);
  };

  // Handle get related content
  const handleGetRelatedContent = async (keyword, platform) => {
    try {
      setRelatedContentLoading(true);
      setCurrentKeyword(keyword);
      setCurrentPlatform(platform);
      
      const result = await apiService.hotsearch.getRelatedContent({
        keyword: keyword,
        platform: platform
      });
      setRelatedContent(result.data || []);
      setRelatedContentModalVisible(true);
    } catch (error) {
      console.error('Failed to get related content:', error);
      message.error(error.message || '获取关联内容失败');
      setRelatedContent([]);
    } finally {
      setRelatedContentLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchPlatforms();
  }, []);

  // Fetch hotsearch data when platform or date changes
  useEffect(() => {
    fetchHotsearchData();
  }, [selectedPlatform, selectedDate]);

  // Auto refresh data every 5 minutes
  useEffect(() => {
    const refreshInterval = setInterval(() => {
      fetchHotsearchData();
    }, 5 * 60 * 1000); // 5 minutes

    return () => clearInterval(refreshInterval);
  }, [selectedPlatform, selectedDate]);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="筛选条件">
        <Space wrap>
          <Select 
            placeholder="选择平台" 
            style={{ width: 150 }}
            value={selectedPlatform}
            onChange={handlePlatformChange}
          >
            {platforms.map(platform => (
              <Select.Option key={platform} value={platform}>
                {platform === 'douyin' && '抖音'}
                {platform === 'xiaohongshu' && '小红书'}
                {platform === 'weibo' && '微博'}
                {platform === 'kuaishou' && '快手'}
                {platform === 'bilibili' && 'B站'}
              </Select.Option>
            ))}
          </Select>
          <DatePicker 
            placeholder="选择日期" 
            style={{ width: 180 }}
            value={selectedDate}
            onChange={handleDateChange}
          />
          <Button 
            type="primary" 
            icon={<ReloadOutlined />}
            onClick={refreshHotsearch}
            loading={fetching}
          >
            刷新数据
          </Button>
        </Space>
      </Card>
      
      <Card title="热搜榜单">
        <Spin spinning={loading}>
          <List
            dataSource={hotsearchData}
            renderItem={(item) => (
              <List.Item
              actions={[
                <span key="heat" style={{ color: '#1890ff' }}>
                  {item.heat.toLocaleString()} 热度
                </span>,
                <span key="trend" style={{ 
                  color: item.trend === '上升' ? '#52c41a' : item.trend === '下降' ? '#ff4d4f' : '#faad14' 
                }}>
                  {item.trend === '上升' ? '↑ 上升' : item.trend === '下降' ? '↓ 下降' : '→ 持平'}
                </span>,
                <Button 
                  key="related" 
                  type="link" 
                  icon={<InfoCircleOutlined />}
                  onClick={() => handleGetRelatedContent(item.keyword, selectedPlatform)}
                >
                  关联内容
                </Button>,
                <Button 
                  key="parse" 
                  type="link" 
                  icon={<FileSearchOutlined />}
                  onClick={() => handleParseKeyword(item.keyword)}
                >
                  一键解析
                </Button>
              ]}
              style={{
                padding: '12px 0',
                borderBottom: '1px solid #f0f0f0'
              }}
            >
                <List.Item.Meta
                  avatar={
                    <span style={{ 
                      display: 'inline-block', 
                      width: 24, 
                      height: 24, 
                      lineHeight: '24px', 
                      textAlign: 'center',
                      background: item.rank <= 3 ? '#ff4d4f' : '#8c8c8c',
                      color: '#fff',
                      borderRadius: '4px',
                      marginRight: 16
                    }}>
                      {item.rank}
                    </span>
                  }
                  title={<a href={item.url} target="_blank" rel="noopener noreferrer">{item.keyword}</a>}
                />
              </List.Item>
            )}
          />
        </Spin>
      </Card>
      


      {/* Related Content Modal */}
      <Modal
        title={`${currentKeyword} - ${currentPlatform}关联内容摘要`}
        open={relatedContentModalVisible}
        onCancel={() => setRelatedContentModalVisible(false)}
        footer={null}
        width={800}
      >
        <Spin spinning={relatedContentLoading}>
          {relatedContent.length > 0 ? (
            <Space direction="vertical" size="large" style={{ width: '100%' }}>
              <Collapse defaultActiveKey={[]} style={{ border: 'none' }}>
                {relatedContent.map((item) => (
                  <Collapse.Panel
                    key={item.id}
                    header={
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span>
                          <strong>{item.title}</strong>
                        </span>
                        <span style={{ color: '#1890ff' }}>
                          {item.heat.toLocaleString()} 热度
                        </span>
                      </div>
                    }
                    style={{ marginBottom: '16px', border: '1px solid #f0f0f0', borderRadius: '4px' }}
                  >
                    <div style={{ marginBottom: '16px' }}>
                      <h4 style={{ marginBottom: '8px' }}>内容摘要</h4>
                      <p>{item.summary}</p>
                    </div>
                    <div style={{ marginBottom: '8px' }}>
                      <h4 style={{ marginBottom: '8px' }}>基本信息</h4>
                      <div>平台：{item.platform}</div>
                      <div>发布时间：{new Date(item.published_at).toLocaleString()}</div>
                      <div style={{ marginTop: '8px' }}>
                        <a href={item.source_url} target="_blank" rel="noopener noreferrer">
                          查看原文
                        </a>
                      </div>
                    </div>
                  </Collapse.Panel>
                ))}
              </Collapse>
            </Space>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              暂无关联内容
            </div>
          )}
        </Spin>
      </Modal>
    </Space>
  );
};

export default HotSearch;