import { useState, useEffect } from 'react';
import { Card, Typography, Space, Table, Button, Input, Select, DatePicker, message, Modal, Image } from 'antd';
import { SearchOutlined, DownloadOutlined, DeleteOutlined, EyeOutlined, FileExcelOutlined } from '@ant-design/icons';
import apiService from '../services/api';

const { Title } = Typography;
const { RangePicker } = DatePicker;

const ContentManagement = () => {
  // State management
  const [contentList, setContentList] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [filters, setFilters] = useState({
    keyword: '',
    platform: '',
    media_type: '',
    source_type: '',
    date_range: null
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 10
  });
  // Preview modal state
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewContent, setPreviewContent] = useState(null);

  // Columns definition
  const columns = [
    {
      title: '封面',
      dataIndex: 'cover_url',
      key: 'cover_url',
      render: (cover_url) => (
        <img 
          src={`/api/v1/content/proxy-image?url=${encodeURIComponent(cover_url)}`} 
          alt="封面" 
          style={{ width: 80, height: 60, objectFit: 'cover', borderRadius: 4 }}
          onError={(e) => {
            e.target.src = 'https://via.placeholder.com/80x60?text=加载失败';
          }}
        />
      )
    },
    {
      title: '标题',
      dataIndex: 'title',
      key: 'title',
      ellipsis: true
    },
    {
      title: '作者',
      dataIndex: 'author',
      key: 'author'
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform'
    },
    {
      title: '类型',
      dataIndex: 'media_type',
      key: 'media_type',
      render: (type, record) => {
        const typeText = type === 'video' ? '视频' : '图片';
        const imageCount = record.all_images && record.all_images.length > 0 ? record.all_images.length : 1;
        return type === 'image' && imageCount > 1 ? `${typeText} (${imageCount}张)` : typeText;
      }
    },
    {
      title: '来源',
      dataIndex: 'source_type',
      key: 'source_type',
      render: (type) => type === 1 ? '单链接解析' : '监控任务'
    },
    {
      title: '采集时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => {
        const date = new Date(time);
        return date.toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      }
    },
    {
      title: '操作',
      key: 'action',
      width: 180,
      fixed: 'right',
      render: (_, record) => (
        <Space size="small" wrap>
          <Button type="link" icon={<EyeOutlined />} onClick={() => handlePreview(record)}>预览</Button>
          <Button type="link" icon={<DownloadOutlined />} onClick={() => handleDownload(record)}>下载</Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record.id)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // Row selection configuration
  const rowSelection = {
    selectedRowKeys,
    onChange: setSelectedRowKeys
  };

  // Get content list from backend
  const getContentList = async () => {
    try {
      setLoading(true);
      
      // Build query params - only include non-empty values to ensure proper filtering
      const params = {
        page: pagination.current,
        page_size: pagination.pageSize
      };
      
      // Only add filter parameters if they have values (not empty strings or null)
      if (filters.keyword && filters.keyword.trim()) {
        params.keyword = filters.keyword.trim();
      }
      if (filters.platform) {
        params.platform = filters.platform;
      }
      if (filters.media_type) {
        params.media_type = filters.media_type;
      }
      if (filters.source_type) {
        params.source_type = filters.source_type;
      }
      
      // Add date range if selected
      if (filters.date_range && filters.date_range.length === 2) {
        params.start_date = filters.date_range[0].format('YYYY-MM-DD');
        params.end_date = filters.date_range[1].format('YYYY-MM-DD');
      }
      
      // Call backend API
      const result = await apiService.content.getList(params);
      
      // Update state with real data or fallback structure
      const contentData = result.data || result;
      setContentList(contentData.list || []);
      setTotal(contentData.total || 0);
    } catch (error) {
      console.error('Get content list error:', error);
      // Show empty list when API fails instead of mock data
      setContentList([]);
      setTotal(0);
      message.error('获取内容列表失败，请检查后端服务是否正常运行');
    } finally {
      setLoading(false);
    }
  };

  // Delete content by ID
  const handleDelete = async (id) => {
    try {
      await apiService.content.delete(id);
      message.success('删除成功');
      // Refresh content list
      getContentList();
    } catch (error) {
      console.error('Delete content error:', error);
      message.error(error.message || '删除失败');
    }
  };

  // Batch delete contents
  const handleBatchDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要删除的内容');
      return;
    }
    
    try {
      await apiService.content.batchDelete({ ids: selectedRowKeys });
      message.success('批量删除成功');
      // Refresh content list and clear selection
      getContentList();
      setSelectedRowKeys([]);
    } catch (error) {
      console.error('Batch delete error:', error);
      message.error(error.message || '批量删除失败');
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Handle search - automatically trigger when filters change
  const handleSearch = () => {
    setPagination(prev => ({
      ...prev,
      current: 1 // Reset to first page when searching
    }));
    getContentList();
  };

  // Handle reset filters
  const handleReset = () => {
    setFilters({
      keyword: '',
      platform: '',
      media_type: '',
      source_type: '',
      date_range: null
    });
    setPagination({
      current: 1,
      pageSize: 10
    });
    // Automatically reload content after reset
    setTimeout(() => {
      getContentList();
    }, 0);
  };

  // Check if any filters are active
  const hasActiveFilters = () => {
    return !!(
      (filters.keyword && filters.keyword.trim()) ||
      filters.platform ||
      filters.media_type ||
      filters.source_type ||
      filters.date_range
    );
  };

  // Get filter status text for user feedback
  const getFilterStatusText = () => {
    if (!hasActiveFilters()) {
      return '显示所有内容';
    }
    
    const activeFilters = [];
    if (filters.keyword && filters.keyword.trim()) activeFilters.push('关键词');
    if (filters.platform) activeFilters.push('平台');
    if (filters.media_type) activeFilters.push('类型');
    if (filters.source_type) activeFilters.push('来源');
    if (filters.date_range) activeFilters.push('日期范围');
    
    return `已应用筛选条件: ${activeFilters.join(', ')}`;
  };

  // Handle pagination change
  const handlePaginationChange = (page, pageSize) => {
    setPagination({
      current: page,
      pageSize
    });
  };

  // Handle content preview
  const handlePreview = (record) => {
    setPreviewContent(record);
    setPreviewVisible(true);
  };

  // Handle content download
  const handleDownload = async (record) => {
    try {
      const response = await apiService.content.download(record.id);
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('下载请求已发送');
    } catch (error) {
      console.error('Download content error:', error);
      message.error(error.message || '下载失败');
    }
  };

  // Handle batch export
  const handleBatchExport = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('请选择要导出的内容');
      return;
    }
    
    try {
      const response = await apiService.content.export({ ids: selectedRowKeys });
      // Create download link and trigger download
      const link = document.createElement('a');
      link.href = response.data.download_url;
      link.download = response.data.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('导出请求已发送');
    } catch (error) {
      console.error('Batch export error:', error);
      message.error(error.message || '导出失败');
    }
  };

  // Load content list on component mount and when pagination changes
  useEffect(() => {
    getContentList();
  }, [pagination]);

  // Load content list on initial mount (show all content by default)
  useEffect(() => {
    getContentList();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card title="筛选条件">
        <Space wrap>
          <Input 
            placeholder="搜索标题/作者" 
            prefix={<SearchOutlined />} 
            style={{ width: 300 }}
            value={filters.keyword}
            onChange={(e) => handleFilterChange('keyword', e.target.value)}
            onPressEnter={handleSearch}
            allowClear
          />
          <Select 
            placeholder="选择平台" 
            style={{ width: 150 }}
            value={filters.platform || undefined}
            onChange={(value) => handleFilterChange('platform', value)}
            allowClear
          >
            <Select.Option value="douyin">抖音</Select.Option>
            <Select.Option value="xiaohongshu">小红书</Select.Option>
            <Select.Option value="kuaishou">快手</Select.Option>
            <Select.Option value="bilibili">B站</Select.Option>
            <Select.Option value="weibo">微博</Select.Option>
          </Select>
          <Select 
            placeholder="选择类型" 
            style={{ width: 120 }}
            value={filters.media_type || undefined}
            onChange={(value) => handleFilterChange('media_type', value)}
            allowClear
          >
            <Select.Option value="video">视频</Select.Option>
            <Select.Option value="image">图片</Select.Option>
          </Select>
          <Select 
            placeholder="选择来源" 
            style={{ width: 150 }}
            value={filters.source_type || undefined}
            onChange={(value) => handleFilterChange('source_type', value)}
            allowClear
          >
            <Select.Option value="1">单链接解析</Select.Option>
            <Select.Option value="2">监控任务</Select.Option>
          </Select>
          <RangePicker 
            placeholder={['开始日期', '结束日期']}
            style={{ width: 300 }}
            value={filters.date_range}
            onChange={(date) => handleFilterChange('date_range', date)}
          />
          <Button type="primary" onClick={handleSearch}>筛选</Button>
          <Button onClick={handleReset}>重置</Button>
        </Space>
        
        {/* Filter status indicator */}
        <div style={{ 
          marginTop: '12px', 
          padding: '8px 12px', 
          backgroundColor: hasActiveFilters() ? '#e6f7ff' : '#f6ffed',
          border: `1px solid ${hasActiveFilters() ? '#91d5ff' : '#b7eb8f'}`,
          borderRadius: '6px',
          fontSize: '14px',
          color: hasActiveFilters() ? '#1890ff' : '#52c41a'
        }}>
          <span style={{ fontWeight: '500' }}>
            {getFilterStatusText()}
          </span>
          {total > 0 && (
            <span style={{ marginLeft: '8px', color: '#666' }}>
              (共 {total} 条记录)
            </span>
          )}
        </div>
      </Card>
      
      <Card>
        <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          <Space wrap style={{ justifyContent: 'flex-end' }}>
            <Button 
              type="primary" 
              danger
              onClick={handleBatchDelete}
              disabled={selectedRowKeys.length === 0}
            >
              批量删除 ({selectedRowKeys.length})
            </Button>
            <Button 
              type="primary" 
              icon={<FileExcelOutlined />}
              onClick={handleBatchExport}
              disabled={selectedRowKeys.length === 0}
            >
              批量导出 ({selectedRowKeys.length})
            </Button>
          </Space>
          
          <Table 
            dataSource={contentList} 
            columns={columns} 
            rowKey="id"
            pagination={{
              current: pagination.current,
              pageSize: pagination.pageSize,
              total,
              onChange: handlePaginationChange,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => 
                `显示第 ${range[0]}-${range[1]} 条记录，共 ${total} 条`,
            }}
            rowSelection={rowSelection}
            loading={loading}
            locale={{
              emptyText: hasActiveFilters() 
                ? '没有找到符合筛选条件的内容' 
                : '暂无内容数据，请先添加一些内容'
            }}
          />
        </Space>
      </Card>

      {/* Content Preview Modal */}
      <Modal
        title={previewContent?.title || '内容预览'}
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        footer={null}
        width={900}
      >
        {previewContent && (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
          {previewContent.media_type === 'video' ? (
            <video 
              src={previewContent.file_path ? `/media/${previewContent.file_path}` : `/api/v1/content/proxy-download?url=${encodeURIComponent(previewContent.media_url || previewContent.cover_url)}`} 
              controls 
              style={{ width: '100%', maxHeight: '400px' }}
            />
          ) : (
            <>
              {/* 显示所有图片 */}
              {previewContent.all_images && previewContent.all_images.length > 0 ? (
                <div>
                  <h4>图片列表 ({previewContent.all_images.length}张)</h4>
                  <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', 
                    gap: '10px',
                    maxHeight: '500px',
                    overflowY: 'auto',
                    padding: '10px',
                    backgroundColor: '#f5f5f5',
                    borderRadius: '8px'
                  }}>
                    {previewContent.all_images.map((imgUrl, index) => (
                      <div key={index} style={{ textAlign: 'center' }}>
                        <Image
                          src={`/api/v1/content/proxy-image?url=${encodeURIComponent(imgUrl)}`}
                          alt={`图片 ${index + 1}`}
                          style={{ 
                            width: '100%', 
                            height: '150px', 
                            objectFit: 'cover', 
                            borderRadius: '4px',
                            cursor: 'pointer'
                          }}
                          fallback="https://via.placeholder.com/150x150?text=加载失败"
                        />
                        <div style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
                          图片 {index + 1}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <Image
                  src={`/api/v1/content/proxy-image?url=${encodeURIComponent(previewContent.cover_url)}`}
                  alt={previewContent.title}
                  style={{ maxWidth: '100%', maxHeight: '400px' }}
                  fallback="https://via.placeholder.com/400x300?text=图片加载失败"
                />
              )}
            </>
          )}
            <div style={{ marginBottom: '16px' }}>
              <h4>基本信息</h4>
              <div>作者: {previewContent.author || '未知'}</div>
              <div>平台: {previewContent.platform || '未知'}</div>
              <div>类型: {previewContent.media_type === 'video' ? '视频' : '图片'}</div>
              <div>来源: {previewContent.source_type === 1 ? '单链接解析' : '监控任务'}</div>
              <div>采集时间: {new Date(previewContent.created_at).toLocaleString()}</div>
            </div>
            {previewContent.description && (
              <div>
                <h4>描述</h4>
                <p>{previewContent.description}</p>
              </div>
            )}
            {previewContent.source_url && (
              <div>
                <h4>原始链接</h4>
                <a href={previewContent.source_url} target="_blank" rel="noopener noreferrer">
                  {previewContent.source_url}
                </a>
              </div>
            )}
          </Space>
        )}
      </Modal>
    </Space>
  );
};

export default ContentManagement;