<template>
  <div class="register-container">
    <div class="register-card">
      <div class="register-header">
        <h1>注册账号</h1>
        <p>加入 Motify 车辆维修管理系统</p>
      </div>

      <el-tabs v-model="activeTab" class="register-tabs">
        <el-tab-pane label="用户注册" name="user">
          <el-form
            ref="userFormRef"
            :model="userForm"
            :rules="userRules"
            class="register-form"
            label-width="80px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="userForm.username"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="userForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="userForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="userForm.name"
                placeholder="请输入真实姓名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="userForm.phone"
                placeholder="请输入手机号"
                size="large"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="userForm.email"
                placeholder="请输入邮箱地址"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="register-button"
                :loading="loading"
                @click="handleRegister('user')"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="维修人员注册" name="repairman">
          <el-form
            ref="repairmanFormRef"
            :model="repairmanForm"
            :rules="repairmanRules"
            class="register-form"
            label-width="80px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="repairmanForm.username"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="repairmanForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="repairmanForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="repairmanForm.name"
                placeholder="请输入真实姓名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="性别" prop="gender">
              <el-radio-group v-model="repairmanForm.gender" size="large">
                <el-radio label="男">男</el-radio>
                <el-radio label="女">女</el-radio>
              </el-radio-group>
            </el-form-item>
            <el-form-item label="工种" prop="type">
              <el-select
                v-model="repairmanForm.type"
                placeholder="请选择工种"
                size="large"
                style="width: 100%"
              >
                <el-option label="机修工" value="MECHANIC" />
                <el-option label="电工" value="ELECTRICIAN" />
                <el-option label="钣金工" value="BODYWORKER" />
                <el-option label="喷漆工" value="PAINTER" />
                <el-option label="学徒工" value="APPRENTICE" />
                <el-option label="质检员" value="INSPECTOR" />
                <el-option label="故障诊断师" value="DIAGNOSER" />
              </el-select>
            </el-form-item>
            <el-form-item label="手机号" prop="phone">
              <el-input
                v-model="repairmanForm.phone"
                placeholder="请输入手机号"
                size="large"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="repairmanForm.email"
                placeholder="请输入邮箱地址"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="register-button"
                :loading="loading"
                @click="handleRegister('repairman')"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>

        <el-tab-pane label="管理员注册" name="admin">
          <el-form
            ref="adminFormRef"
            :model="adminForm"
            :rules="adminRules"
            class="register-form"
            label-width="80px"
          >
            <el-form-item label="用户名" prop="username">
              <el-input
                v-model="adminForm.username"
                placeholder="请输入用户名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="密码" prop="password">
              <el-input
                v-model="adminForm.password"
                type="password"
                placeholder="请输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="确认密码" prop="confirmPassword">
              <el-input
                v-model="adminForm.confirmPassword"
                type="password"
                placeholder="请再次输入密码"
                size="large"
                show-password
              />
            </el-form-item>
            <el-form-item label="姓名" prop="name">
              <el-input
                v-model="adminForm.name"
                placeholder="请输入真实姓名"
                size="large"
              />
            </el-form-item>
            <el-form-item label="邮箱" prop="email">
              <el-input
                v-model="adminForm.email"
                placeholder="请输入邮箱地址"
                size="large"
              />
            </el-form-item>
            <el-form-item>
              <el-button
                type="primary"
                size="large"
                class="register-button"
                :loading="loading"
                @click="handleRegister('admin')"
              >
                注册
              </el-button>
            </el-form-item>
          </el-form>
        </el-tab-pane>
      </el-tabs>

      <div class="register-footer">
        <p>已有账号？ 
          <router-link to="/login" class="login-link">立即登录</router-link>
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
  password: '',
  confirmPassword: '',
  name: '',
  phone: '',
  email: ''
})

const repairmanForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  gender: '男',
  type: '',
  phone: '',
  email: ''
})

const adminForm = reactive({
  username: '',
  password: '',
  confirmPassword: '',
  name: '',
  email: ''
})

const validatePassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入密码'))
  } else if (value.length < 8) {
    callback(new Error('密码长度不能少于8位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (form) => (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入密码'))
  } else if (value !== form.password) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const validatePhone = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入手机号'))
  } else if (!/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入邮箱地址'))
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword(userForm), trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
}

const repairmanRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword(repairmanForm), trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  gender: [
    { required: true, message: '请选择性别', trigger: 'change' }
  ],
  type: [
    { required: true, message: '请选择工种', trigger: 'change' }
  ],
  phone: [
    { validator: validatePhone, trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
}

const adminRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
  ],
  password: [
    { validator: validatePassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword(adminForm), trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' },
    { max: 50, message: '姓名不超过50个字符', trigger: 'blur' }
  ],
  email: [
    { validator: validateEmail, trigger: 'blur' }
  ]
}

const handleRegister = async (role) => {
  let formRef, formData
  
  if (role === 'user') {
    formRef = userFormRef.value
    formData = { ...userForm }
  } else if (role === 'repairman') {
    formRef = repairmanFormRef.value
    formData = { ...repairmanForm }
  } else if (role === 'admin') {
    formRef = adminFormRef.value
    formData = { ...adminForm }
  }

  if (!formRef) return

  try {
    await formRef.validate()
    loading.value = true

    // 移除确认密码字段
    delete formData.confirmPassword

    const result = await authStore.register(formData, role)
    
    if (result.success) {
      ElMessage.success('注册成功，请登录')
      router.push('/login')
    } else {
      ElMessage.error(result.message || '注册失败')
    }
  } catch (error) {
    console.error('Register validation failed:', error)
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.register-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.register-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  padding: 40px;
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.register-header {
  text-align: center;
  margin-bottom: 32px;
}

.register-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.register-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.register-tabs {
  margin-bottom: 24px;
}

.register-form {
  margin-top: 24px;
}

.register-button {
  width: 100%;
  height: 48px;
  font-size: 16px;
  font-weight: 600;
}

.register-footer {
  text-align: center;
  margin-top: 24px;
  padding-top: 24px;
  border-top: 1px solid #eee;
}

.login-link {
  color: #409eff;
  text-decoration: none;
  font-weight: 500;
}

.login-link:hover {
  text-decoration: underline;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
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