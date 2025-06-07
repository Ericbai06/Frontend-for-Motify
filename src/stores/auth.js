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
        return { success: false, message: response.data.message }
      }
    } catch (error) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.message || '登录失败，请稍后重试' 
      }
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