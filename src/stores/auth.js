import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userRole = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials, role = 'user') => {
    try {
      let response
      if (role === 'user') {
        response = await api.post('/api/auth/users/login', credentials)
      } else if (role === 'repairman') {
        response = await api.post('/api/repairman/login', credentials)
      } else if (role === 'admin') {
        response = await api.post('/api/admin/login', credentials)
      }

      if (response.data.code === 200) {
        user.value = response.data.data
        userRole.value = role
        
        // 存储到本地存储
        localStorage.setItem('user', JSON.stringify(response.data.data))
        localStorage.setItem('userRole', role)
        
        return { success: true, data: response.data.data }
      } else {
        return { success: false, message: response.data.message || '登录失败，用户名或密码错误' }
      }
    } catch (error) {
      console.error('Login error:', error)
      // 改进错误处理
      let errorMessage = '登录失败，请稍后重试'
      
      if (error.response) {
        // 服务器返回了错误响应
        if (error.response.data && error.response.data.message) {
          errorMessage = error.response.data.message
        } else if (error.response.status === 401) {
          errorMessage = '用户名或密码错误'
        } else if (error.response.status === 404) {
          errorMessage = '用户不存在'
        } else if (error.response.status === 500) {
          errorMessage = '服务器错误，请稍后重试'
      }
      } else if (error.request) {
        // 请求已发出，但没有收到响应
        errorMessage = '无法连接到服务器，请检查网络连接'
      }
      
      return { success: false, message: errorMessage }
    }
  }

  const register = async (userData, role = 'user') => {
    try {
      let response
      if (role === 'user') {
        response = await api.post('/api/auth/users/register', userData)
      } else if (role === 'repairman') {
        response = await api.post('/api/repairman/register', userData)
      } else if (role === 'admin') {
        response = await api.post('/api/admin/register', userData)
      }

      if (response.data.code === 200) {
        return { success: true, data: response.data.data }
      } else {
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      console.error('Register error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '注册失败，请稍后重试' 
      }
    }
  }

  const logout = () => {
    user.value = null
    userRole.value = null
    token.value = null
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    localStorage.removeItem('token')
  }

  const checkAuth = () => {
    const storedUser = localStorage.getItem('user')
    const storedRole = localStorage.getItem('userRole')
    
    if (storedUser && storedRole) {
      user.value = JSON.parse(storedUser)
      userRole.value = storedRole
    }
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }
    localStorage.setItem('user', JSON.stringify(user.value))
  }

  return {
    user,
    userRole,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
    updateUser
  }
})