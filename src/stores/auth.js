import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import api from '../utils/api'

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const userRole = ref(null)
  const token = ref(localStorage.getItem('token'))

  const isAuthenticated = computed(() => !!user.value)

  const login = async (credentials, role = 'user', rememberMe = false) => {
    try {
      let response
      if (role === 'user') {
        response = await api.post('/api/auth/users/login', credentials)
      } else if (role === 'repairman') {
        response = await api.post('/api/repairman/login', credentials)
      } else if (role === 'admin') {
        response = await api.post('/api/admin/login', credentials)
      }

      // 处理新的API响应格式
      if (response.data.success === true) {
        user.value = response.data.data
        userRole.value = role

        // 根据 rememberMe 选择是否持久化存储
        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(response.data.data))
          localStorage.setItem('userRole', role)
          localStorage.setItem('rememberMe', 'true')
        } else {
          // 只在会话期间存储，不持久化
          sessionStorage.setItem('user', JSON.stringify(response.data.data))
          sessionStorage.setItem('userRole', role)
          // 清除可能存在的持久化数据
          localStorage.removeItem('user')
          localStorage.removeItem('userRole')
          localStorage.removeItem('rememberMe')
        }

        return { success: true, data: response.data.data }
      } else if (response.data.code === 200) {
        // 兼容旧的API响应格式
        user.value = response.data.data
        userRole.value = role

        if (rememberMe) {
          localStorage.setItem('user', JSON.stringify(response.data.data))
          localStorage.setItem('userRole', role)
          localStorage.setItem('rememberMe', 'true')
        } else {
          sessionStorage.setItem('user', JSON.stringify(response.data.data))
          sessionStorage.setItem('userRole', role)
          localStorage.removeItem('user')
          localStorage.removeItem('userRole')
          localStorage.removeItem('rememberMe')
        }

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

      // 处理新的API响应格式
      if (response.data.success === true) {
        return { success: true, data: response.data.data }
      } else if (response.data.code === 200) {
        // 兼容旧的API响应格式
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

    // 清除所有存储
    localStorage.removeItem('user')
    localStorage.removeItem('userRole')
    localStorage.removeItem('token')
    localStorage.removeItem('rememberMe')
    sessionStorage.removeItem('user')
    sessionStorage.removeItem('userRole')
    sessionStorage.removeItem('token')
  }

  const checkAuth = () => {
    // 首先检查持久化存储（localStorage）
    const storedUser = localStorage.getItem('user')
    const storedRole = localStorage.getItem('userRole')
    const rememberMe = localStorage.getItem('rememberMe')

    if (storedUser && storedRole && rememberMe === 'true') {
      user.value = JSON.parse(storedUser)
      userRole.value = storedRole
      return
    }

    // 如果没有持久化数据，检查会话存储（sessionStorage）
    const sessionUser = sessionStorage.getItem('user')
    const sessionRole = sessionStorage.getItem('userRole')

    if (sessionUser && sessionRole) {
      user.value = JSON.parse(sessionUser)
      userRole.value = sessionRole
    }
  }

  const updateUser = (userData) => {
    user.value = { ...user.value, ...userData }

    // 根据当前存储方式更新用户数据
    const rememberMe = localStorage.getItem('rememberMe')
    if (rememberMe === 'true') {
      localStorage.setItem('user', JSON.stringify(user.value))
    } else if (sessionStorage.getItem('user')) {
      sessionStorage.setItem('user', JSON.stringify(user.value))
    }
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