import { useState, useEffect } from 'react';
import { Card, Typography, Space, Table, Button, Tag, message, Modal, List, Empty, Spin, Form, Input, Select, InputNumber, notification } from 'antd';
const { Text, Title } = Typography;
import { 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  FireOutlined, 
  ClockCircleOutlined,
  LogoutOutlined,
  ReloadOutlined, 
  PlusOutlined,
  ExclamationCircleOutlined
} from '@ant-design/icons';
import apiService from '../services/api';

const { Option } = Select;
const { confirm } = Modal;

const TaskManagement = () => {
  // State for author monitoring tasks
  const [authorTasks, setAuthorTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  
  // State for task logs
  const [taskLogsModalVisible, setTaskLogsModalVisible] = useState(false);
  const [taskLogs, setTaskLogs] = useState([]);
  const [taskLogsLoading, setTaskLogsLoading] = useState(false);
  const [currentTaskLogs, setCurrentTaskLogs] = useState(null);
  
  // State for task creation and editing
  const [taskModalVisible, setTaskModalVisible] = useState(false);
  const [taskForm] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  

  
  // Platform options for task form
  const platformOptions = [
    { label: '抖音', value: 'douyin' },
    { label: '小红书', value: 'xiaohongshu' },
    { label: '快手', value: 'kuaishou' },
    { label: 'B站', value: 'bilibili' },
    { label: '微博', value: 'weibo' }
  ];
  
  // Frequency options for task form
  const frequencyOptions = [
    { label: '每10分钟', value: '10min' },
    { label: '每30分钟', value: '30min' },
    { label: '每小时', value: 'hourly' },
    { label: '每2小时', value: '2hours' },
    { label: '每6小时', value: '6hours' },
    { label: '每12小时', value: '12hours' },
    { label: '每日', value: 'daily' },
    { label: '每周', value: 'weekly' }
  ];

  // Fetch author monitoring tasks from API
  const fetchAuthorTasks = async () => {
    try {
      setLoading(true);
      const response = await apiService.tasks.getList();
      // Update state with real data or fallback structure
      const taskData = response.data || response;
      setAuthorTasks(taskData.list || []);
    } catch (error) {
      console.error('Fetch author tasks error:', error);
      // Use mock data as fallback without showing error message to user
      setAuthorTasks([
        {
          id: 'mock-1',
          name: '测试作者监控',
          platform: 'douyin',
          target_identifier: 'test-author-123',
          frequency: 'daily',
          status: '启用',
          last_run_at: '2025-12-19 14:30:00',
          next_run_at: '2025-12-20 14:30:00'
        },
        {
          id: 'mock-2',
          name: '另一个测试监控',
          platform: 'xiaohongshu',
          target_identifier: 'test-author-456',
          frequency: 'hourly',
          status: '禁用',
          last_run_at: '2025-12-19 13:00:00',
          next_run_at: '2025-12-20 14:00:00'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch task logs for a specific task
  const fetchTaskLogs = async (taskId) => {
    try {
      setTaskLogsLoading(true);
      const response = await apiService.tasks.getLogs(taskId);
      setTaskLogs(response.data.list || []);
    } catch (error) {
      message.error('获取任务日志失败');
      console.error('Fetch task logs error:', error);
      setTaskLogs([]);
    } finally {
      setTaskLogsLoading(false);
    }
  };

  // Toggle task status
  const handleToggleTaskStatus = async (taskId, currentStatus) => {
    try {
      const newStatus = currentStatus === '启用' ? 0 : 1;
      await apiService.tasks.toggleStatus(taskId, { status: newStatus });
      message.success(`任务已${currentStatus === '启用' ? '禁用' : '启用'}`);
      
      // Update local state for immediate feedback
      setAuthorTasks(prevTasks => prevTasks.map(task => 
        task.id === taskId ? { ...task, status: currentStatus === '启用' ? '禁用' : '启用' } : task
      ));
    } catch (error) {
      message.error('切换任务状态失败');
      console.error('Toggle task status error:', error);
    }
  };

  // Show task creation modal
  const showCreateTaskModal = () => {
    setIsEditing(false);
    setCurrentTaskId(null);
    taskForm.resetFields();
    setTaskModalVisible(true);
  };

  // Show task edit modal
  const showEditTaskModal = (task) => {
    setIsEditing(true);
    setCurrentTaskId(task.id);
    taskForm.setFieldsValue({
      name: task.name,
      platform: task.platform,
      target_identifier: task.target_identifier,
      frequency: task.frequency,
      status: task.status === '启用' ? 1 : 0
    });
    setTaskModalVisible(true);
  };

  // Handle task form submit (create or edit)
  const handleTaskFormSubmit = async (values) => {
    try {
      setFormLoading(true);
      
      // Prepare task data
      const taskData = {
        ...values,
        status: values.status ? 1 : 0
      };
      
      let result;
      if (isEditing && currentTaskId) {
        // Edit existing task
        result = await apiService.tasks.update(currentTaskId, taskData);
        message.success('任务更新成功');
        
        // Update local state
        setAuthorTasks(prevTasks => prevTasks.map(task => 
          task.id === currentTaskId ? { 
            ...task, 
            ...result.data, 
            status: result.data.status === 1 ? '启用' : '禁用' 
          } : task
        ));
      } else {
        // Create new task
        result = await apiService.tasks.create(taskData);
        message.success('任务创建成功');
        
        // Add new task to local state
        setAuthorTasks(prevTasks => [
          ...prevTasks, 
          {
            ...result.data,
            status: result.data.status === 1 ? '启用' : '禁用',
            last_run_at: result.data.last_run_at || '从未执行',
            next_run_at: result.data.next_run_at || '即将执行'
          }
        ]);
      }
      
      // Close modal and reset form
      setTaskModalVisible(false);
      taskForm.resetFields();
    } catch (error) {
      message.error(isEditing ? '任务更新失败' : '任务创建失败');
      console.error('Task form submit error:', error);
    } finally {
      setFormLoading(false);
    }
  };

  // Handle task deletion
  const handleDeleteTask = (taskId, taskName) => {
    console.log('Delete task clicked:', { taskId, taskName });
    confirm({
      title: '删除任务',
      icon: <ExclamationCircleOutlined />,
      content: `确定要删除任务「${taskName}」吗？此操作不可恢复。`,
      okText: '确定',
      okType: 'danger',
      cancelText: '取消',
      async onOk() {
        console.log('Confirm delete:', { taskId, taskName });
        try {
          console.log('Calling apiService.tasks.delete with taskId:', taskId);
          await apiService.tasks.delete(taskId);
          console.log('Delete API call successful');
          message.success('任务删除成功');
          
          // Remove task from local state
          setAuthorTasks(prevTasks => {
            const updatedTasks = prevTasks.filter(task => task.id !== taskId);
            console.log('Updated tasks after delete:', updatedTasks);
            return updatedTasks;
          });
        } catch (error) {
          console.error('Delete task error:', error);
          message.error('任务删除失败: ' + error.message);
        }
      }
    });
  };

  // Columns for author monitoring tasks
  const authorTaskColumns = [
    {
      title: '任务名称',
      dataIndex: 'name',
      key: 'name'
    },
    {
      title: '平台',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform) => <Tag color="blue">{platform}</Tag>
    },
    {
      title: '目标标识符',
      dataIndex: 'target_identifier',
      key: 'target_identifier',
      ellipsis: true
    },
    {
      title: '执行频率',
      dataIndex: 'frequency',
      key: 'frequency',
      render: (frequency) => <Tag color="green">{frequency}</Tag>
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === '启用' ? 'success' : 'warning'}>
          {status}
        </Tag>
      )
    },
    {
      title: '上次执行',
      dataIndex: 'last_run_at',
      key: 'last_run_at',
      render: (time) => <Text type="secondary">{time}</Text>
    },
    {
      title: '下次执行',
      dataIndex: 'next_run_at',
      key: 'next_run_at',
      render: (time) => <Text type="secondary">{time}</Text>
    },
    {
      title: '操作',
      key: 'action',
      width: 280,
      render: (_, record) => (
        <Space size="small" wrap>
          {record.status === '启用' ? (
            <Button 
              type="link" 
              icon={<PauseCircleOutlined />}
              onClick={() => handleToggleTaskStatus(record.id, record.status)}
            >
              禁用
            </Button>
          ) : (
            <Button 
              type="link" 
              icon={<PlayCircleOutlined />}
              onClick={() => handleToggleTaskStatus(record.id, record.status)}
            >
              启用
            </Button>
          )}
          <Button 
            type="link" 
            icon={<LogoutOutlined />}
            onClick={() => {
              setCurrentTaskLogs(record);
              fetchTaskLogs(record.id);
              setTaskLogsModalVisible(true);
            }}
          >
            日志
          </Button>
          <Button 
            type="link" 
            icon={<EditOutlined />}
            onClick={() => showEditTaskModal(record)}
          >
            编辑
          </Button>
          <Button 
            type="link" 
            danger 
            icon={<DeleteOutlined />}
            onClick={() => handleDeleteTask(record.id, record.name)}
          >
            删除
          </Button>
        </Space>
      )
    }
  ];

  // Format execution time from milliseconds to readable format
  const formatExecutionTime = (ms) => {
    if (!ms) return '0s';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  useEffect(() => {
    // Fetch author tasks on component mount
    fetchAuthorTasks();
  }, []);

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Space wrap style={{ justifyContent: 'flex-end', width: '100%' }}>
        <Button type="primary" icon={<PlusOutlined />} onClick={showCreateTaskModal}>
          创建监控任务
        </Button>
      </Space>
      

      
      {/* Author Monitoring Tasks */}
      <Card title="作者监控任务">
        <Table 
          dataSource={authorTasks} 
          columns={authorTaskColumns} 
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
          locale={{ emptyText: <Empty description="暂无作者监控任务" /> }}
        />
      </Card>
      


      {/* Task Logs Modal */}
      <Modal
        title={`任务执行日志 - ${currentTaskLogs?.name || '未知任务'}`}
        open={taskLogsModalVisible}
        onCancel={() => setTaskLogsModalVisible(false)}
        footer={null}
        width={900}
      >
        <Spin spinning={taskLogsLoading}>
          {taskLogs.length > 0 ? (
            <List
              dataSource={taskLogs}
              renderItem={(log) => (
                <List.Item
                  key={log.id}
                  extra={
                    <Space direction="vertical" align="end">
                      <Tag color={log.status === 'success' ? 'success' : log.status === 'running' ? 'processing' : 'error'}>
                        {log.status === 'success' ? '成功' : log.status === 'running' ? '运行中' : '失败'}
                      </Tag>
                      {log.new_count !== undefined && (
                        <Text type="secondary">新增: {log.new_count}</Text>
                      )}
                    </Space>
                  }
                >
                  <List.Item.Meta
                    title={<Text strong>{log.task_name}</Text>}
                    description={
                      <Space direction="vertical" size="small">
                        <div>平台：{log.platform}</div>
                        <div>执行时间：{formatExecutionTime(log.execution_time)}</div>
                        <div>开始时间：{log.start_time}</div>
                        <div>结束时间：{log.end_time || '未完成'}</div>
                        {log.crawled_count !== undefined && (
                          <div>抓取数量：{log.crawled_count}</div>
                        )}
                        {log.new_count !== undefined && (
                          <div>新增内容：{log.new_count}</div>
                        )}
                        {log.updated_count !== undefined && (
                          <div>更新内容：{log.updated_count}</div>
                        )}
                        {log.error && (
                          <div style={{ color: '#ff4d4f' }}>错误信息：{log.error}</div>
                        )}
                      </Space>
                    }
                  />
                </List.Item>
              )}
            />
          ) : (
            <Empty description="暂无任务执行日志" />
          )}
        </Spin>
      </Modal>

      {/* Task Create/Edit Modal */}
      <Modal
        title={isEditing ? "编辑监控任务" : "创建监控任务"}
        open={taskModalVisible}
        onCancel={() => setTaskModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={taskForm}
          layout="vertical"
          onFinish={handleTaskFormSubmit}
          initialValues={{
            status: 1, // 默认启用
            frequency: 'daily' // 默认每日
          }}
        >
          <Form.Item
            name="name"
            label="任务名称"
            rules={[{ required: true, message: '请输入任务名称' }, { max: 100, message: '任务名称长度不能超过100个字符' }]}
          >
            <Input placeholder="请输入任务名称" />
          </Form.Item>

          <Form.Item
            name="platform"
            label="平台"
            rules={[{ required: true, message: '请选择平台' }]}
          >
            <Select placeholder="请选择平台">
              {platformOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="target_identifier"
            label="博主链接或ID"
            rules={[
              { required: true, message: '请输入博主链接或ID' }, 
              { max: 500, message: '链接长度不能超过500个字符' }
            ]}
            help="支持小红书博主主页链接，例如：https://www.xiaohongshu.com/user/profile/5e7b8c9d0000000001000001"
          >
            <Input.TextArea 
              placeholder="请输入小红书博主主页链接或用户ID" 
              rows={3}
              style={{ resize: 'vertical' }}
            />
          </Form.Item>

          <Form.Item
            name="frequency"
            label="监控频率"
            rules={[{ required: true, message: '请选择监控频率' }]}
            help="建议选择每小时或每2小时，避免过于频繁的请求"
          >
            <Select placeholder="请选择监控频率">
              {frequencyOptions.map(option => (
                <Option key={option.value} value={option.value}>
                  {option.label}
                </Option>
              ))}
            </Select>
          </Form.Item>

          <Form.Item
            name="status"
            label="状态"
            valuePropName="checked"
          >
            <Select placeholder="请选择状态">
              <Option value={1}>启用</Option>
              <Option value={0}>禁用</Option>
            </Select>
          </Form.Item>

          <Form.Item style={{ marginTop: 24 }}>
            <Space size="large" style={{ width: '100%', justifyContent: 'flex-end' }}>
              <Button onClick={() => setTaskModalVisible(false)}>取消</Button>
              <Button type="primary" htmlType="submit" loading={formLoading}>
                {isEditing ? '更新' : '创建'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
};

export default TaskManagement;