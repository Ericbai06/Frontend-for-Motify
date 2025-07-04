import axios from 'axios'
import { ElMessage } from 'element-plus'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器
api.interceptors.response.use(
  (response) => {
    return response
  },
  (error) => {
    if (error.response) {
      const { status, data } = error.response
      
      switch (status) {
        case 401:
          ElMessage.error('登录已过期，请重新登录')
          localStorage.clear()
          window.location.href = '/login'
          break
        case 403:
          ElMessage.error('没有权限访问该资源')
          break
        case 404:
          ElMessage.error('请求的资源不存在')
          break
        case 500:
          ElMessage.error('服务器内部错误')
          break
        default:
          ElMessage.error(data?.message || '请求失败')
      }
    } else if (error.request) {
      ElMessage.error('网络连接失败，请检查网络')
    } else {
      ElMessage.error('请求配置错误')
    }
    
    return Promise.reject(error)
  }
)

// 批量提交维修工单API
export const batchSubmitRepairOrders = (orders) => {
  return api.post('/api/repair/batch-submit', orders)
}

// 单个工单提交API
export const userSubmitRepairOrder = (userId, order) => {
  return api.post(`/api/auth/users/${userId}/maintenance-records`, order)
}

// 获取所有用户
export const getAllUsers = () => {
  return api.get('/api/admin/users')
}

// 获取特定用户的车辆
export const getUserCars = (userId) => {
  return api.get(`/api/auth/users/${userId}/cars`)
}

// 用户提交催单请求
export const submitRushOrder = (userId, itemId, reminderMessage) => {
  return api.post(`/api/auth/users/${userId}/maintenance-records/${itemId}/rush-order`, {
    reminderMessage
  })
}

// 用户提交服务评分
export const submitRating = (userId, itemId, score) => {
  return api.post(`/api/auth/users/${userId}/maintenance-records/${itemId}/rating`, {
    score
  })
}

// 按车辆统计未完成任务
export const getUncompletedTasksByCar = () => {
  return api.get('/api/admin/statistics/uncompleted-tasks-by-car')
}

// 批量提交维修工单API (用户端)
export const userBatchSubmitRepairOrders = (orders) => {
  return api.post('/api/repair/batch-submit', orders)
}

// 删除维修工单 (管理员)
export const deleteMaintenanceItem = (itemId) => {
  return api.delete(`/api/admin/maintenance-items/${itemId}`)
}

export default api