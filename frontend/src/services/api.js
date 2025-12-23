import axios from 'axios';

// Create axios instance with relative path to support both HTTP and HTTPS
// The baseURL is constructed dynamically based on the current window location
const getBaseURL = () => {
  // In production, use relative path to auto-adapt to HTTP/HTTPS
  // In development, use hardcoded URL for easier development
  if (import.meta.env.MODE === 'production') {
    return '/api/v1';
  } else {
    // Use HTTP for development by default, can be changed via environment variable
    const protocol = import.meta.env.VITE_API_PROTOCOL || 'http';
    const host = import.meta.env.VITE_API_HOST || 'localhost';
    const port = import.meta.env.VITE_API_PORT || '3000';
    return `${protocol}://${host}:${port}/api/v1`;
  }
};

const api = axios.create({
  baseURL: getBaseURL(),
  timeout: 60000 // 60 seconds timeout
});

// Request interceptor - add auth token
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    // Handle 401 Unauthorized - redirect to login
    if (error.response && error.response.status === 401) {
      // Check if current token is mock token
      const token = localStorage.getItem('token');
      if (token && token.startsWith('mock-token-')) {
        // For mock tokens, provide a clearer error message
        const message = '认证令牌无效，请重新登录';
        return Promise.reject(new Error(message));
      }
      
      // For real token errors, clear authentication info and redirect to login
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('savedCredentials');
      window.location.href = '/login';
    }
    
    // Handle network errors specially
    if (!error.response) {
      const message = '网络连接失败，请检查后端服务是否正常运行';
      return Promise.reject(new Error(message));
    }
    
    // Handle other errors
    let message = error.response?.data?.message || error.message || '请求失败';
    
    // Provide more specific error messages for common status codes
    if (error.response.status === 403) {
      message = '您没有权限执行此操作';
    } else if (error.response.status === 404) {
      message = '请求的资源不存在';
    } else if (error.response.status === 503) {
      message = error.response.data?.message || '数据库连接不可用，请稍后重试';
    } else if (error.response.status >= 500) {
      message = '服务器内部错误，请稍后重试';
    }
    
    return Promise.reject(new Error(message));
  }
);

// Request interceptor - add auth token only (no caching)
api.interceptors.request.use(
  (config) => {
    // Get token from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// API endpoints
const apiService = {
  // Authentication
  auth: {
    login: (data) => api.post('/auth/login', data),
    logout: () => api.post('/auth/logout'),
    checkSystemStatus: () => api.get('/auth/system-status'),
    initialSetup: (data) => api.post('/auth/initial-setup', data)
  },
  
  // User management
  users: {
    // Current user
    getCurrentUser: () => api.get('/users/me'),
    updateCurrentUser: (data) => api.put('/users/me', data),
    changeCurrentUserPassword: (data) => api.put('/users/me/password', data),
    
    // Admin user management
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    create: (data) => api.post('/users', data),
    update: (id, data) => api.put(`/users/${id}`, data),
    updatePassword: (id, data) => api.put(`/users/${id}/password`, data),
    delete: (id) => api.delete(`/users/${id}`)
  },
  
  // Content parsing and management
  content: {
    parse: (data) => api.post('/content/parse', data),
    getList: (params) => api.get('/content', { params }),
    getById: (id) => api.get(`/content/${id}`),
    delete: (id) => api.delete(`/content/${id}`),
    batchDelete: (data) => api.post('/content/batch-delete', data),
    export: (data) => api.post('/content/export', data),
    download: (id) => api.post('/content/download', { id }, { responseType: 'blob' }),
    downloadByUrl: (data) => api.post('/content/download-by-url', data),
    save: (data) => api.post('/content/save', data)
  },
  
  // Task management
  tasks: {
    create: (data) => api.post('/tasks', data),
    getList: (params) => api.get('/tasks', { params }),
    getById: (id) => api.get(`/tasks/${id}`),
    update: (id, data) => api.put(`/tasks/${id}`, data),
    delete: (id) => api.delete(`/tasks/${id}`),
    toggleStatus: (id, data) => api.patch(`/tasks/${id}/status`, data),
    runImmediately: (id) => api.post(`/tasks/${id}/run`),
    runHotsearch: () => api.post('/tasks/hotsearch/run'),
    getHotsearchLogs: (params) => api.get('/tasks/hotsearch/logs', { params }),
    getLogs: (taskId, params) => api.get(`/tasks/${taskId}/logs`, { params }),
    getAllLogs: (params) => api.get('/tasks/logs/all', { params })
  },
  
  // Hotsearch management
  hotsearch: {
    fetch: (platform) => api.post(`/hotsearch/${platform}`),
    fetchAll: () => api.post('/hotsearch'),
    getByDate: (platform, params) => api.get(`/hotsearch/${platform}`, { params }),
    getTrends: (platform, params) => api.get(`/hotsearch/${platform}/trends`, { params }),
    getPlatforms: () => api.get('/hotsearch/platforms'),
    parseContent: (data) => api.post('/hotsearch/parse', data),
    getRelatedContent: (params) => api.get('/hotsearch/related', { params })
  },
  
  // Dashboard data
  dashboard: {
    getAllData: () => api.get('/dashboard'),
    getStats: () => api.get('/dashboard/stats'),
    getPlatformDistribution: () => api.get('/dashboard/platform-distribution'),
    getContentTypeComparison: () => api.get('/dashboard/content-type-comparison'),
    getRecentTrend: () => api.get('/dashboard/recent-trend')
  },
  
  // System configuration management
  config: {
    // User management
    getUsers: () => api.get('/config/users'),
    createUser: (data) => api.post('/config/users', data),
    updateUser: (id, data) => api.put(`/config/users/${id}`, data),
    updateUserPassword: (id, data) => api.patch(`/config/users/${id}/password`, data),
    deleteUser: (id) => api.delete(`/config/users/${id}`),
    toggleUserStatus: (id, data) => api.patch(`/config/users/${id}/status`, data),
    
    // Cookie management
    getCookies: () => api.get('/config/cookies'),
    createCookie: (data) => api.post('/config/cookies', data),
    updateCookie: (id, data) => api.put(`/config/cookies/${id}`, data),
    deleteCookie: (id) => api.delete(`/config/cookies/${id}`),
    testCookie: (id) => api.post(`/config/cookies/${id}/test`),
    
    // Platform Cookie management
    getPlatformCookies: () => api.get('/config/platform-cookies'),
    createPlatformCookie: (data) => api.post('/config/platform-cookies', data),
    updatePlatformCookie: (id, data) => api.put(`/config/platform-cookies/${id}`, data),
    deletePlatformCookie: (id) => api.delete(`/config/platform-cookies/${id}`),
    testPlatformCookie: (id) => api.post(`/config/platform-cookies/${id}/test`),
    
    // System settings
    getSystemSettings: () => api.get('/config/system'),
    updateSystemSettings: (data) => api.put('/config/system', data)
  }
};

export default apiService;