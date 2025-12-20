import { useState } from 'react';
import { Form, Input, Button, Card, Typography, Space, message, Progress } from 'antd';
import { FileSearchOutlined, DownloadOutlined } from '@ant-design/icons';
import apiService from '../services/api';

const { Title } = Typography;

const ContentParsing = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [parsedResult, setParsedResult] = useState(null);
  const [processingStatus, setProcessingStatus] = useState(null); // null, 'processing', 'completed', 'failed'
  const [progress, setProgress] = useState(0); // Progress percentage
  const [downloadProgress, setDownloadProgress] = useState(null); // Download progress
  const [downloadStatus, setDownloadStatus] = useState(null); // Download status: null, 'downloading', 'completed', 'failed'

  // Helper function to get proxy image URL
  const getProxyImageUrl = (imageUrl) => {
    if (!imageUrl) return 'https://via.placeholder.com/300x200?text=图片加载失败';
    
    try {
      // Use relative path for proxy requests to avoid baseURL issues
      return `/api/v1/content/proxy-image?url=${encodeURIComponent(imageUrl)}`;
    } catch (error) {
      console.error('Error generating proxy image URL:', error);
      return 'https://via.placeholder.com/300x200?text=图片加载失败';
    }
  };

  // Helper function to handle image load errors
  const handleImageError = (e) => {
    e.target.src = 'https://via.placeholder.com/300x200?text=图片加载失败';
  };

  // Helper function to download a single file using backend proxy
  const downloadFile = async (url, filename) => {
    try {
      // Show download progress
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      
      // Create a proxy download URL using backend API with relative path
      const proxyUrl = `/api/v1/content/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(filename)}`;
      
      // Set a timeout for the download request (15 seconds)
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('下载超时')), 15000);
      });
      
      // Create a download link and trigger it
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = filename;
      link.target = '_blank';
      document.body.appendChild(link);
      
      // Simulate progress update while waiting for download to start
      const progressInterval = setInterval(() => {
        setDownloadProgress(prev => {
          if (prev < 90) return prev + 5;
          clearInterval(progressInterval);
          return prev;
        });
      }, 1000);
      
      // Trigger download
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Wait a bit for download to start, then complete progress
      await new Promise(resolve => setTimeout(resolve, 2000));
      clearInterval(progressInterval);
      
      // Complete download
      setDownloadProgress(100);
      setDownloadStatus('completed');
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 2000);
      
      message.success('文件下载成功');
      
      return true;
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('failed');
      message.error(`下载失败: ${error.message}`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 2000);
      
      return false;
    }
  };

  // Handle save to library
  const handleSaveToLibrary = () => {
    message.info('保存到内容库功能待实现');
    // TODO: Implement save to library logic
  };

  // Handle download of all images
  const handleDownloadAllImages = async () => {
    if (!parsedResult || !parsedResult.all_images || parsedResult.all_images.length === 0) {
      message.warning('没有可下载的图片');
      return;
    }
    
    try {
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      
      const totalImages = parsedResult.all_images.length;
      let downloadedCount = 0;
      
      // Download all images sequentially
      for (const [index, imgUrl] of parsedResult.all_images.entries()) {
        const filename = `${parsedResult.title || '小红书内容'}_${index + 1}.jpg`;
        const success = await downloadFile(imgUrl, filename);
        
        if (success) {
          downloadedCount++;
        }
        
        // Update overall progress
        const overallProgress = Math.round(((index + 1) / totalImages) * 100);
        setDownloadProgress(overallProgress);
      }
      
      setDownloadStatus('completed');
      message.success(`成功下载 ${downloadedCount}/${totalImages} 张图片`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 2000);
    } catch (error) {
      console.error('Batch download error:', error);
      setDownloadStatus('failed');
      message.error(`批量下载失败: ${error.message}`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 2000);
    }
  };

  // Handle download
  const handleDownload = async () => {
    if (!parsedResult) {
      message.warning('没有可下载的内容');
      return;
    }
    
    try {
      let filename;
      let url;
      
      if (parsedResult.media_type === 'video') {
        // Download video
        filename = `${parsedResult.title || '小红书视频'}.mp4`;
        url = parsedResult.media_url;
      } else {
        // Download main image
        filename = `${parsedResult.title || '小红书图片'}.jpg`;
        url = parsedResult.media_url;
      }
      
      await downloadFile(url, filename);
    } catch (error) {
      console.error('Download error:', error);
      message.error(`下载失败: ${error.message}`);
    }
  };

  const handleParse = async (values) => {
    try {
      setLoading(true);
      setProcessingStatus('processing');
      setProgress(10);
      setParsedResult(null);
      console.log('Parse link:', values.link);
      
      // Call backend API to parse the link
      const result = await apiService.content.parse({ link: values.link });
      
      setProgress(50);
      
      // Set parsed result with data validation and defaults
      const parsedData = {
        title: result.title || result.data?.title || '未知标题',
        author: result.author || result.data?.author || '未知作者',
        platform: result.platform || result.data?.platform || '未知平台',
        cover_url: result.cover_url || result.data?.cover_url || 'https://via.placeholder.com/300x200',
        media_type: result.media_type || result.data?.media_type || 'image',
        media_url: result.media_url || result.data?.media_url || 'https://via.placeholder.com/800x600',
        all_images: result.all_images || result.data?.all_images || [],
        file_size: '未知' // Will be calculated from actual file
      };
      
      setProgress(100);
      setParsedResult(parsedData);
      message.success('解析成功！');
      
      setProcessingStatus('completed');
      form.resetFields();
    } catch (error) {
      console.error('Parse error:', error);
      message.error(`解析失败：${error.message || '请检查链接是否有效！'}`);
      setProcessingStatus('failed');
      setProgress(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="输入链接">
        <Form
          form={form}
          name="parsing"
          onFinish={handleParse}
          layout="horizontal"
        >
          <Form.Item
            name="link"
            rules={[
              { required: true, message: '请输入作品链接!' },
              { type: 'url', message: '请输入有效的URL!' }
            ]}
            style={{ flex: 1, marginRight: 16 }}
          >
            <Input 
              placeholder="请输入抖音、小红书等平台作品链接"
              style={{ fontSize: 16, padding: '8px 16px' }}
            />
          </Form.Item>
          <Form.Item>
            <Button 
              type="primary" 
              htmlType="submit" 
              icon={<FileSearchOutlined />}
              loading={loading}
              style={{ fontSize: 16, padding: '0 24px', height: 40 }}
            >
              解析
            </Button>
          </Form.Item>
        </Form>
      </Card>
      
      {/* Processing Status Card */}
      {processingStatus && (
        <Card title={processingStatus === 'processing' ? '解析中' : processingStatus === 'completed' ? '解析成功' : '解析失败'}>
          {processingStatus === 'processing' && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div>
                <h4>正在解析链接，请稍候...</h4>
              </div>
              <div style={{ width: '100%' }}>
                <div style={{ width: '100%', height: 20, backgroundColor: '#f0f0f0', borderRadius: 10, overflow: 'hidden' }}>
                  <div 
                    style={{ 
                      width: `${progress}%`, 
                      height: '100%', 
                      backgroundColor: '#1890ff', 
                      borderRadius: 10, 
                      transition: 'width 0.3s ease' 
                    }}
                  ></div>
                </div>
                <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#666' }}>
                  {progress}%
                </div>
              </div>
              <div>
                <p>当前进度：{progress < 30 ? '正在识别平台和链接...' : progress < 60 ? '正在解析作品信息...' : '正在下载媒体文件...'}</p>
              </div>
            </Space>
          )}
          
          {parsedResult && (processingStatus === 'completed' || processingStatus === 'processing') && (
            <Space direction="vertical" size="middle" style={{ width: '100%' }}>
              <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                <div>
                  <img 
                    src={getProxyImageUrl(parsedResult.cover_url)} 
                    alt="封面" 
                    style={{ width: 300, height: 200, objectFit: 'cover', borderRadius: 8 }}
                    onError={handleImageError}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 300 }}>
                  <h4>标题：{parsedResult.title}</h4>
                  <p>作者：{parsedResult.author}</p>
                  <p>平台：{parsedResult.platform}</p>
                  <p>类型：{parsedResult.media_type === 'video' ? '视频' : '图片'}</p>
                  <p>文件大小：{parsedResult.file_size}</p>
                  {parsedResult.all_images && parsedResult.all_images.length > 0 && (
                    <p>图片数量：{parsedResult.all_images.length} 张</p>
                  )}
                  <Space size="middle" style={{ marginTop: 16 }}>
                    <Button type="primary" onClick={handleSaveToLibrary}>保存到内容库</Button>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownload}
                    >
                      下载当前文件
                    </Button>
                    {parsedResult.all_images && parsedResult.all_images.length > 1 && (
                      <Button 
                        icon={<DownloadOutlined />} 
                        onClick={handleDownloadAllImages}
                      >
                        下载全部图片 ({parsedResult.all_images.length})
                      </Button>
                    )}
                  </Space>
                </div>
              </div>
              
              {/* Download Progress */}
              {downloadProgress !== null && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <h4>下载进度</h4>
                  <Progress 
                    percent={downloadProgress} 
                    status={downloadStatus === 'failed' ? 'exception' : downloadStatus === 'completed' ? 'success' : 'active'} 
                    strokeColor={{
                      '0%': '#108ee9',
                      '100%': '#87d068',
                    }}
                  />
                  <div style={{ textAlign: 'center', marginTop: 8, fontSize: 14, color: '#666' }}>
                    {downloadStatus === 'downloading' ? '正在下载...' : 
                     downloadStatus === 'completed' ? '下载完成！' : 
                     downloadStatus === 'failed' ? '下载失败！' : ''}
                  </div>
                </div>
              )}
              
              {/* Preview all images if available */}
              {parsedResult.all_images && parsedResult.all_images.length > 0 && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <h4>图片预览</h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', overflowX: 'auto', padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                    {parsedResult.all_images.slice(0, 5).map((imgUrl, index) => (
                      <div key={index} style={{ flex: '0 0 auto' }}>
                        <img 
                          src={getProxyImageUrl(imgUrl)} 
                          alt={`图片 ${index + 1}`} 
                          style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} 
                          onClick={() => window.open(imgUrl, '_blank')}
                          onError={handleImageError}
                        />
                        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 12, color: '#666' }}>
                          图片 {index + 1}
                        </div>
                      </div>
                    ))}
                    {parsedResult.all_images.length > 5 && (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 150, height: 150, backgroundColor: '#e8e8e8', borderRadius: 4 }}>
                        <span style={{ fontSize: 14, color: '#666' }}>... 还有 {parsedResult.all_images.length - 5} 张图片</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </Space>
          )}
        </Card>
      )}
    </Space>
  );
};

export default ContentParsing;