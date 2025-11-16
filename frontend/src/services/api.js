import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api'

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    const message = error.response?.data?.detail || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

// 流程定义 API
export const processApi = {
  // 获取所有流程定义
  getAll: () => api.get('/bpmn_processes'),
  
  // 获取单个流程定义
  getById: (id) => api.get(`/bpmn_processes/${id}`),
  
  // 创建流程定义
  create: (data) => api.post('/bpmn_processes', data),
  
  // 更新流程定义
  update: (id, data) => api.put(`/bpmn_processes/${id}`, data),
  
  // 删除流程定义
  delete: (id) => api.delete(`/bpmn_processes/${id}`)
}

// 流程实例 API
export const instanceApi = {
  // 获取所有流程实例
  getAll: () => api.get('/bpmn_process_instances'),
  
  // 获取单个流程实例
  getById: (id) => api.get(`/bpmn_process_instances/${id}`)
}

// 工作流执行 API
export const workflowApi = {
  // 创建流程实例
  createInstance: (processId) => api.post(`/test/create_process_instance/${processId}`),
  
  // 执行流程实例
  runInstance: (instanceId, data = {}) => api.post(`/test/run_process_instance/${instanceId}`, data)
}

export default api

