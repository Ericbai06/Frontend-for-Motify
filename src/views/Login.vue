<template>
  <div class="login-container">
    <div class="login-card">
      <div class="login-header">
        <h1>Motify</h1>
        <p>车辆维修管理系统</p>
      </div>

      <el-tabs v-model="activeTab" class="login-tabs">
        <el-tab-pane label="用户登录" name="user">
          <el-form
            ref="userFormRef"
            :model="userForm"
            :rules="loginRules"
            class="login-form"
            @submit.prevent="handleLogin('user')"
          >
            <el-form-item prop="username">
              <el-input
                v-model="userForm.username"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin('user')"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin('user')"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="维修人员" name="repairman">
          <el-form
            ref="repairmanFormRef"
            :model="repairmanForm"
            :rules="loginRules"
            class="login-form"
            @submit.prevent="handleLogin('repairman')"
          >
            <el-form-item prop="username">
              <el-input
                v-model="repairmanForm.username"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="repairmanForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin('repairman')"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin('repairman')"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="管理员" name="admin">
          <el-form
            ref="adminFormRef"
            :model="adminForm"
            :rules="loginRules"
            class="login-form"
            @submit.prevent="handleLogin('admin')"
          >
            <el-form-item prop="username">
              <el-input
                v-model="adminForm.username"
                placeholder="请输入用户名"
                size="large"
                prefix-icon="User"
              />
            </el-form-item>
            <el-form-item prop="password">
              <el-input
                v-model="adminForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                prefix-icon="Lock"
                show-password
                @keyup.enter="handleLogin('admin')"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="login-button"
                :loading="loading"
                @click="handleLogin('admin')"
              >
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="login-footer">
        <p>还没有账号？ 
          <router-link to="/register" class="register-link">立即注册</router-link>
        </p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const activeTab = ref('user')
const loading = ref(false)

const userFormRef = ref()
const repairmanFormRef = ref()
const adminFormRef = ref()

const userForm = reactive({
  username: '',
  password: ''
})

const repairmanForm = reactive({
  username: '',
  password: ''
})

const adminForm = reactive({
  username: '',
  password: ''
})

const loginRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const handleLogin = async (role) => {
  let formRef, formData
  
  if (role === 'user') {
    formRef = userFormRef.value
    formData = userForm
  } else if (role === 'repairman') {
    formRef = repairmanFormRef.value
    formData = repairmanForm
  } else if (role === 'admin') {
    formRef = adminFormRef.value
    formData = adminForm
  }

  if (!formRef) return

  try {
    await formRef.validate()
    loading.value = true

    const result = await authStore.login(formData, role)
    
    if (result.success) {
      ElMessage.success('登录成功')
      
      // 根据角色跳转到对应的仪表板
      if (role === 'user') {
        router.push('/user/dashboard')
      } else if (role === 'repairman') {
        router.push('/repairman/dashboard')
      } else if (role === 'admin') {
        router.push('/admin/dashboard')
      }
    } else {
      ElMessage.error(result.message || '登录失败')
    }
  } catch (error) {
    console.error('Login validation failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.login-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.login-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 400px;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-header h1 {
  font-size: 32px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.login-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.login-tabs {
  margin-bottom: 24px;
}

.login-form {
  margin-top: 24px;
}

.login-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.login-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.register-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.register-link:hover {
  text-decoration: underline;
}

:deep(.el-tabs__item) {
  font-weight: 500;
}

:deep(.el-tabs__active-bar) {
  background-color: #409eff;
}

:deep(.el-tabs__item.is-active) {
  color: #409eff;
}
</style>