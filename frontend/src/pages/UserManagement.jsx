import { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Button, 
  Space, 
  Modal, 
  Form, 
  Input, 
  Select, 
  Switch, 
  message, 
  Popconfirm, 
  Tag,
  Typography,
  Alert
} from 'antd';
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  KeyOutlined,
  UserOutlined,
  LockOutlined
} from '@ant-design/icons';
import apiService from '../services/api';
import ApiDebugger from '../components/ApiDebugger';

const { Title } = Typography;
const { Option } = Select;

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [form] = Form.useForm();
  const [passwordForm] = Form.useForm();

  // Get current user info
  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
    }
  }, []);

  // Load users on component mount
  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await apiService.users.getAll();
      setUsers(response.data);
    } catch (error) {
      message.error('获取用户列表失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = () => {
    setEditingUser(null);
    form.resetFields();
    setModalVisible(true);
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    form.setFieldsValue({
      username: user.username,
      role: user.role,
      is_active: user.is_active
    });
    setModalVisible(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      await apiService.users.delete(userId);
      message.success('用户删除成功');
      loadUsers();
    } catch (error) {
      message.error('删除用户失败: ' + error.message);
    }
  };

  const handleChangePassword = (user) => {
    setEditingUser(user);
    passwordForm.resetFields();
    setPasswordModalVisible(true);
  };

  const handleModalOk = async () => {
    try {
      const values = await form.validateFields();
      
      if (editingUser) {
        // Update existing user
        await apiService.users.update(editingUser.id, values);
        message.success('用户更新成功');
      } else {
        // Create new user
        await apiService.users.create(values);
        message.success('用户创建成功');
      }
      
      setModalVisible(false);
      loadUsers();
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error(editingUser ? '更新用户失败: ' + error.message : '创建用户失败: ' + error.message);
    }
  };

  const handlePasswordModalOk = async () => {
    try {
      const values = await passwordForm.validateFields();
      
      await apiService.users.updatePassword(editingUser.id, {
        newPassword: values.newPassword
      });
      
      message.success('密码更新成功');
      setPasswordModalVisible(false);
    } catch (error) {
      if (error.errorFields) {
        // Form validation error
        return;
      }
      message.error('更新密码失败: ' + error.message);
    }
  };

  const handleModalCancel = () => {
    setModalVisible(false);
    setEditingUser(null);
  };

  const handlePasswordModalCancel = () => {
    setPasswordModalVisible(false);
    setEditingUser(null);
  };

  const columns = [
    {
      title: '用户名',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          <UserOutlined />
          <span>{text}</span>
          {currentUser && currentUser.id === record.id && (
            <Tag color="blue" size="small">当前用户</Tag>
          )}
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => (
        <Tag color={role === 'admin' ? 'red' : 'blue'}>
          {role === 'admin' ? '管理员' : '操作员'}
        </Tag>
      )
    },
    {
      title: '状态',
      dataIndex: 'is_active',
      key: 'is_active',
      render: (isActive) => (
        <Tag color={isActive ? 'green' : 'red'}>
          {isActive ? '启用' : '禁用'}
        </Tag>
      )
    },
    {
      title: '创建时间',
      dataIndex: 'created_at',
      key: 'created_at',
      render: (time) => new Date(time).toLocaleString('zh-CN')
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => {
        const isCurrentUser = currentUser && currentUser.id === record.id;
        const isLastAdmin = record.role === 'admin' && users.filter(u => u.role === 'admin').length === 1;
        const isOnlyUser = users.length === 1;
        
        return (
          <Space size="small">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEditUser(record)}
              size="small"
            >
              编辑
            </Button>
            <Button
              type="link"
              icon={<KeyOutlined />}
              onClick={() => handleChangePassword(record)}
              size="small"
            >
              改密
            </Button>
            <Popconfirm
              title={
                isCurrentUser ? "确定要删除自己的账户吗？" :
                isLastAdmin ? "这是最后一个管理员账户，无法删除" :
                isOnlyUser ? "这是最后一个用户账户，无法删除" :
                "确定要删除这个用户吗？"
              }
              onConfirm={() => handleDeleteUser(record.id)}
              okText="确定"
              cancelText="取消"
              disabled={isCurrentUser || isLastAdmin || isOnlyUser}
            >
              <Button
                type="link"
                danger
                icon={<DeleteOutlined />}
                size="small"
                disabled={isCurrentUser || isLastAdmin || isOnlyUser}
              >
                删除
              </Button>
            </Popconfirm>
          </Space>
        );
      }
    }
  ];

  return (
    <div>
      <ApiDebugger />
      <Card
        title={
          <Space>
            <UserOutlined />
            <Title level={4} style={{ margin: 0 }}>用户管理</Title>
          </Space>
        }
        extra={
          <Button
            type="primary"
            icon={<PlusOutlined />}
            onClick={handleCreateUser}
          >
            新增用户
          </Button>
        }
      >
        <Alert
          message="用户管理说明"
          description="管理员可以创建、编辑和删除用户。注意：不能删除最后一个管理员账户和最后一个用户账户，也不能删除自己的账户。"
          type="info"
          showIcon
          style={{ marginBottom: 16 }}
        />
        
        <Table
          columns={columns}
          dataSource={users}
          rowKey="id"
          loading={loading}
          pagination={{
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `显示 ${range[0]}-${range[1]} 条，共 ${total} 条`
          }}
        />
      </Card>

      {/* Create/Edit User Modal */}
      <Modal
        title={editingUser ? '编辑用户' : '新增用户'}
        open={modalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        width={500}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            role: 'operator',
            is_active: true
          }}
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
            <Input prefix={<UserOutlined />} placeholder="请输入用户名" />
          </Form.Item>

          {!editingUser && (
            <Form.Item
              name="password"
              label="密码"
              rules={[
                { required: true, message: '请输入密码' },
                { min: 6, message: '密码至少6个字符' }
              ]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="请输入密码" />
            </Form.Item>
          )}

          <Form.Item
            name="role"
            label="角色"
            rules={[{ required: true, message: '请选择角色' }]}
          >
            <Select placeholder="请选择角色">
              <Option value="admin">管理员</Option>
              <Option value="operator">操作员</Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="is_active"
            label="状态"
            valuePropName="checked"
          >
            <Switch checkedChildren="启用" unCheckedChildren="禁用" />
          </Form.Item>
        </Form>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        title={`修改密码 - ${editingUser?.username}`}
        open={passwordModalVisible}
        onOk={handlePasswordModalOk}
        onCancel={handlePasswordModalCancel}
        width={400}
      >
        <Form
          form={passwordForm}
          layout="vertical"
        >
          <Form.Item
            name="newPassword"
            label="新密码"
            rules={[
              { required: true, message: '请输入新密码' },
              { min: 6, message: '密码至少6个字符' }
            ]}
          >
            <Input.Password prefix={<LockOutlined />} placeholder="请输入新密码" />
          </Form.Item>

          <Form.Item
            name="confirmPassword"
            label="确认密码"
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
            <Input.Password prefix={<LockOutlined />} placeholder="请再次输入新密码" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default UserManagement;