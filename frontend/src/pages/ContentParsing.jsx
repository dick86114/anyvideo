import { useState } from 'react';
import JSZip from 'jszip';
import { Form, Input, Button, Card, Typography, Space, message, Progress, Modal, Image } from 'antd';
import { FileSearchOutlined, DownloadOutlined, FileTextOutlined, EyeOutlined } from '@ant-design/icons';
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
  
  // Image preview modal states
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewImage, setPreviewImage] = useState('');
  const [previewTitle, setPreviewTitle] = useState('');

  // Handle image preview
  const handlePreview = (imageUrl, index) => {
    setPreviewImage(getProxyImageUrl(imageUrl));
    setPreviewTitle(`图片 ${index + 1}`);
    setPreviewVisible(true);
  };

  // Close image preview
  const handlePreviewCancel = () => {
    setPreviewVisible(false);
    setPreviewImage('');
    setPreviewTitle('');
  };

  // Helper function to get proxy image URL
  const getProxyImageUrl = (imageUrl) => {
    if (!imageUrl) {
      console.log('getProxyImageUrl: No image URL provided, returning placeholder');
      return 'https://via.placeholder.com/300x200?text=图片加载失败';
    }
    
    try {
      // Use relative path for proxy requests to avoid baseURL issues
      const proxyUrl = `/api/v1/content/proxy-image?url=${encodeURIComponent(imageUrl)}`;
      console.log('getProxyImageUrl:', { originalUrl: imageUrl, proxyUrl });
      return proxyUrl;
    } catch (error) {
      console.error('Error generating proxy image URL:', error, { imageUrl });
      return 'https://via.placeholder.com/300x200?text=图片加载失败';
    }
  };
  
  // Helper function to get proxy video URL
  const getProxyVideoUrl = (videoUrl) => {
    if (!videoUrl) {
      console.log('getProxyVideoUrl: No video URL provided');
      return '';
    }
    
    try {
      // Check if video URL is already a local path
      if (videoUrl.startsWith('/media/')) {
        console.log('getProxyVideoUrl: Using local video path:', videoUrl);
        return videoUrl;
      }
      
      // Use relative path for proxy requests to avoid baseURL issues
      const proxyUrl = `/api/v1/content/proxy-download?url=${encodeURIComponent(videoUrl)}`;
      console.log('getProxyVideoUrl:', { originalUrl: videoUrl, proxyUrl });
      return proxyUrl;
    } catch (error) {
      console.error('Error generating proxy video URL:', error, { videoUrl });
      return '';
    }
  };

  // Helper function to handle image load errors
  const handleImageError = (e) => {
    console.error('Image load error:', {
      src: e.target.src,
      alt: e.target.alt,
      naturalWidth: e.target.naturalWidth,
      naturalHeight: e.target.naturalHeight
    });
    
    // Get current retry count from dataset, default to 0 if not exists
    let retryCount = parseInt(e.target.dataset.retryCount || '0', 10);
    const maxRetries = 2; // Maximum retry attempts
    
    if (retryCount < maxRetries) {
      // Increment retry count and store back in dataset
      retryCount++;
      e.target.dataset.retryCount = retryCount;
      
      console.log(`Image retry ${retryCount}/${maxRetries}:`, e.target.src);
      
      // Implement exponential backoff - wait 500ms * retryCount before retrying
      setTimeout(() => {
        // Append a cache busting parameter to force a fresh request
        const url = new URL(e.target.src);
        url.searchParams.set('_retry', retryCount);
        url.searchParams.set('_timestamp', Date.now());
        e.target.src = url.toString();
      }, 500 * retryCount);
    } else {
      console.log(`Max retries reached for image:`, e.target.src);
      // If max retries reached, show placeholder
      e.target.src = 'https://via.placeholder.com/300x200?text=图片加载失败';
    }
  };

  // Helper function to download a single file using backend proxy
  const downloadFile = async (url, filename) => {
    try {
      // Validate URL
      if (!url || typeof url !== 'string') {
        throw new Error('无效的下载URL');
      }
      
      // Sanitize filename to ensure it's not a hidden file
      let sanitizedFilename = filename || 'download_file';
      sanitizedFilename = sanitizedFilename.trim();
      
      // If the filename starts with a dot, add a prefix to make it visible
      if (sanitizedFilename.startsWith('.')) {
        sanitizedFilename = `file_${sanitizedFilename.substring(1)}`;
      }
      
      // Replace invalid characters in filename
      sanitizedFilename = sanitizedFilename.replace(/[<>:"/\\|?*]/g, '_');
      
      // Ensure the filename is not empty after sanitization
      if (!sanitizedFilename || sanitizedFilename === '_') {
        sanitizedFilename = 'download_file';
      }
      
      // Show download progress
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      
      // Create a proxy download URL using backend API with relative path
      const proxyUrl = `/api/v1/content/proxy-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(sanitizedFilename)}`;
      
      console.log('Downloading file:', { originalUrl: url, proxyUrl, filename: sanitizedFilename });
      
      // Create a download link and trigger it
      const link = document.createElement('a');
      link.href = proxyUrl;
      link.download = sanitizedFilename;
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
      console.error('Download error:', error, { url, filename });
      setDownloadStatus('failed');
      message.error(`下载失败: ${error.message}`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 2000);
      
      return false;
    }
  };

  // Handle download of all images
  // Helper function to fetch blob from URL with proxy
  const fetchFileBlob = async (url) => {
    try {
      const proxyUrl = `/api/v1/content/proxy-download?url=${encodeURIComponent(url)}`;
      const response = await fetch(proxyUrl);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.blob();
    } catch (error) {
      console.error('Fetch blob error:', error);
      throw error;
    }
  };

  // Handle download all content
  const handleDownload = async () => {
    if (!parsedResult) {
      message.warning('没有可下载的内容');
      return;
    }
    
    try {
      setDownloadProgress(0);
      setDownloadStatus('downloading');
      message.info('开始下载全部内容...');
      
      // Create JSZip instance
      const zip = new JSZip();
      
      // Sanitize folder name
      let folderName = (parsedResult.title || 'xiaohongshu_content')
        .trim()
        .replace(/[<>:"/\\|?*]/g, '_')
        .replace(/^\./, 'content_'); // Handle hidden files
      
      if (!folderName || folderName === '_') {
        folderName = 'xiaohongshu_content';
      }
      
      // Collect all files to download
      const filesToDownload = [];
      
      // Add all images
      if (parsedResult.all_images && parsedResult.all_images.length > 0) {
        parsedResult.all_images.forEach((imgUrl, index) => {
          filesToDownload.push({
            name: `${folderName}/image_${String(index + 1).padStart(2, '0')}.jpg`,
            url: imgUrl,
            type: 'image'
          });
        });
      }
      
      // Add main media if it's different from images (for video content)
      if (parsedResult.media_type === 'video' && parsedResult.media_url) {
        filesToDownload.push({
          name: `${folderName}/main_video.mp4`,
          url: parsedResult.media_url,
          type: 'video'
        });
      }
      
      // Create info file
      const infoContent = {
        title: parsedResult.title,
        author: parsedResult.author,
        platform: parsedResult.platform,
        content_id: parsedResult.content_id,
        media_type: parsedResult.media_type,
        source_url: parsedResult.source_url,
        download_date: new Date().toISOString(),
        total_files: filesToDownload.length
      };
      
      zip.file(`${folderName}/info.json`, JSON.stringify(infoContent, null, 2));
      
      // Download all files
      let successCount = 0;
      for (let i = 0; i < filesToDownload.length; i++) {
        const file = filesToDownload[i];
        try {
          const progress = Math.round(((i + 1) / filesToDownload.length) * 90);
          setDownloadProgress(progress);
          
          const blob = await fetchFileBlob(file.url);
          zip.file(file.name, blob);
          successCount++;
          
        } catch (error) {
          console.error(`Failed to download ${file.name}:`, error);
          message.warning(`文件 ${file.name} 下载失败，将跳过`);
        }
      }
      
      // Generate and download zip
      setDownloadProgress(95);
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      
      setDownloadProgress(100);
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${folderName}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 1000);
      
      setDownloadStatus('completed');
      message.success(`下载完成！成功下载 ${successCount}/${filesToDownload.length} 个文件`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 3000);
      
    } catch (error) {
      console.error('Download error:', error);
      setDownloadStatus('failed');
      message.error(`下载失败: ${error.message || '未知错误'}`);
      
      setTimeout(() => {
        setDownloadProgress(null);
        setDownloadStatus(null);
      }, 3000);
    }
  };

  const handleParse = async (values) => {
    try {
      setLoading(true);
      setProcessingStatus('processing');
      setProgress(10);
      setParsedResult(null);
      let link = values.link;
      console.log('Original parse link:', link);
      
      // Extract URL from text if it contains more than just a URL
      const urlRegex = /https?:\/\/[^\s)\]]+/g;
      const extractedUrls = link.match(urlRegex);
      if (extractedUrls && extractedUrls.length > 0) {
        link = extractedUrls[0];
        console.log('Extracted URL:', link);
      }
      
      // Check if it's a Xiaohongshu URL
      const isXiaohongshuUrl = link.includes('xiaohongshu.com') || link.includes('xhslink.com');
      
      // Call backend API to parse the link
      const result = await apiService.content.parse({ link });
      
      setProgress(50);
      
      // Set parsed result with data validation and defaults
      const parsedData = {
        title: result.title || result.data?.title || '未知标题',
        author: result.author || result.data?.author || '未知作者',
        platform: result.platform || result.data?.platform || (isXiaohongshuUrl ? 'xiaohongshu' : '未知平台'),
        cover_url: result.cover_url || result.data?.cover_url || 'https://via.placeholder.com/300x200',
        media_type: result.media_type || result.data?.media_type || 'image',
        media_url: result.media_url || result.data?.media_url || 'https://via.placeholder.com/800x600',
        all_images: result.all_images || result.data?.all_images || [],
        file_size: '未知' // Will be calculated from actual file
      };
      
      setProgress(100);
      setParsedResult(parsedData);
      message.success('解析成功！');
      
      // Automatically save to database and local file system after successful parsing
      try {
        console.log('开始自动保存到内容库...');
        
        // Call backend API to save content (this will save to both database and local files)
        await apiService.content.save({
          link: link, // Original link for parsing and downloading
          source_type: 1, // 1-单链接解析
          task_id: null
        });
        
        message.success('内容已自动保存到数据库和本地文件系统');
        console.log('自动保存成功');
      } catch (saveError) {
        console.error('Auto save error:', saveError);
        message.warning(`自动保存失败：${saveError.message}，但解析成功`);
      }
      
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
              allowClear
              suffix={
                <Button 
                  type="text" 
                  icon={<FileTextOutlined />} 
                  onClick={async () => {
                    try {
                      const text = await navigator.clipboard.readText();
                      if (text) {
                        form.setFieldsValue({ link: text });
                        message.success('已从剪贴板粘贴内容');
                      } else {
                        message.warning('剪贴板内容为空');
                      }
                    } catch (error) {
                      console.error('剪贴板读取失败:', error);
                      message.error('无法访问剪贴板，请手动粘贴');
                    }
                  }}
                  style={{ color: '#1890ff', margin: 0, padding: '0 8px' }}
                  title="粘贴剪贴板内容"
                  size="small"
                />
              }
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
                  {parsedResult.all_images && parsedResult.all_images.length > 0 && (
                    <p>图片数量：{parsedResult.all_images.length} 张</p>
                  )}
                  <Space size="middle" style={{ marginTop: 16 }}>
                    <Button 
                      type="primary" 
                      icon={<DownloadOutlined />} 
                      onClick={handleDownload}
                      loading={downloadStatus === 'downloading'}
                    >
                      下载全部 ({parsedResult.all_images ? parsedResult.all_images.length : 1}个文件)
                    </Button>
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
              
              {/* Preview all images if available and media type is image */}
              {parsedResult.media_type === 'image' && parsedResult.all_images && parsedResult.all_images.length > 0 && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <h4>图片预览</h4>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', overflowX: 'auto', padding: 10, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
                    {parsedResult.all_images.slice(0, 5).map((imgUrl, index) => (
                      <div key={index} style={{ flex: '0 0 auto' }}>
                        <img 
                          src={getProxyImageUrl(imgUrl)} 
                          alt={`图片 ${index + 1}`} 
                          style={{ width: 150, height: 150, objectFit: 'cover', borderRadius: 4, cursor: 'pointer' }} 
                          onClick={() => handlePreview(imgUrl, index)}
                          onError={handleImageError}
                        />
                        <div style={{ textAlign: 'center', marginTop: 5, fontSize: 12, color: '#666' }}>
                          图片 {index + 1}
                        </div>
                      </div>
                    ))}
                    {parsedResult.all_images.length > 5 && (
                      <div 
                        style={{ 
                          display: 'flex', 
                          alignItems: 'center', 
                          justifyContent: 'center', 
                          width: 150, 
                          height: 150, 
                          backgroundColor: '#e8e8e8', 
                          borderRadius: 4,
                          cursor: 'pointer',
                          flexDirection: 'column'
                        }}
                        onClick={() => {
                          // Show all images in a grid modal
                          Modal.info({
                            title: `所有图片 (${parsedResult.all_images.length}张)`,
                            width: '90%',
                            content: (
                              <div style={{ 
                                display: 'grid', 
                                gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                                gap: 10, 
                                marginTop: 20 
                              }}>
                                {parsedResult.all_images.map((imgUrl, index) => (
                                  <div key={index} style={{ textAlign: 'center' }}>
                                    <img 
                                      src={getProxyImageUrl(imgUrl)} 
                                      alt={`图片 ${index + 1}`} 
                                      style={{ 
                                        width: '100%', 
                                        height: 150, 
                                        objectFit: 'cover', 
                                        borderRadius: 4, 
                                        cursor: 'pointer' 
                                      }} 
                                      onClick={() => handlePreview(imgUrl, index)}
                                      onError={handleImageError}
                                    />
                                    <div style={{ fontSize: 12, color: '#666', marginTop: 5 }}>
                                      图片 {index + 1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ),
                            okText: '关闭'
                          });
                        }}
                      >
                        <EyeOutlined style={{ fontSize: 24, color: '#666', marginBottom: 8 }} />
                        <span style={{ fontSize: 14, color: '#666' }}>查看全部</span>
                        <span style={{ fontSize: 12, color: '#999' }}>({parsedResult.all_images.length}张)</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Video preview if media type is video */}
              {parsedResult.media_type === 'video' && (
                <div style={{ marginTop: 20, width: '100%' }}>
                  <h4>视频预览</h4>
                  <div style={{ display: 'flex', justifyContent: 'center', backgroundColor: '#f5f5f5', borderRadius: 8, padding: 20 }}>
                    <video 
                      src={getProxyVideoUrl(parsedResult.media_url || (parsedResult.file_path ? `/media/${parsedResult.file_path}` : ''))} 
                      controls 
                      style={{ maxWidth: '100%', maxHeight: '400px', borderRadius: 4 }} 
                      onError={(e) => {
                        console.error('Video load error:', e);
                        message.error('视频加载失败，请检查网络或稍后重试');
                      }}
                    />
                  </div>
                  {!parsedResult.media_url && (
                    <div style={{ textAlign: 'center', marginTop: 10, color: '#ff4d4f' }}>
                      视频URL为空，无法加载视频
                    </div>
                  )}
                </div>
              )}
            </Space>
          )}
        </Card>
      )}
      
      {/* Image Preview Modal */}
      <Modal
        open={previewVisible}
        title={
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span>{previewTitle}</span>
            <Button 
              type="link" 
              icon={<DownloadOutlined />}
              onClick={() => {
                // Extract original URL from proxy URL
                const urlMatch = previewImage.match(/url=([^&]+)/);
                if (urlMatch) {
                  const originalUrl = decodeURIComponent(urlMatch[1]);
                  window.open(originalUrl, '_blank');
                }
              }}
            >
              查看原图
            </Button>
          </div>
        }
        footer={null}
        onCancel={handlePreviewCancel}
        width="80%"
        style={{ top: 20 }}
        bodyStyle={{ padding: 0, textAlign: 'center', backgroundColor: '#f5f5f5' }}
      >
        <Image
          src={previewImage}
          alt={previewTitle}
          style={{ maxWidth: '100%', maxHeight: '80vh' }}
          preview={false}
        />
      </Modal>
    </Space>
  );
};

export default ContentParsing;