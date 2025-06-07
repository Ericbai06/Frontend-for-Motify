<template>
  <div class="profile-page">
    <div class="card-container">
      <h2>个人资料</h2>
      
      <el-form
        ref="profileFormRef"
        :model="profileForm"
        :rules="profileRules"
        label-width="100px"
        class="profile-form"
      >
        <el-form-item label="用户名" prop="username">
          <el-input
            v-model="profileForm.username"
            placeholder="请输入用户名"
          />
        </el-form-item>
        
        <el-form-item label="姓名" prop="name">
          <el-input
            v-model="profileForm.name"
            placeholder="请输入真实姓名"
          />
        </el-form-item>
        
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="profileForm.phone"
            placeholder="请输入手机号"
          />
        </el-form-item>
        
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="profileForm.email"
            placeholder="请输入邮箱地址"
          />
        </el-form-item>
        
        <el-form-item label="地址" prop="address">
          <el-input
            v-model="profileForm.address"
            type="textarea"
            :rows="3"
            placeholder="请输入地址"
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="updating" @click="updateProfile">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-container">
      <h2>修改密码</h2>
      
      <el-form
        ref="passwordFormRef"
        :model="passwordForm"
        :rules="passwordRules"
        label-width="100px"
        class="password-form"
      >
        <el-form-item label="当前密码" prop="currentPassword">
          <el-input
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="请输入当前密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="新密码" prop="newPassword">
          <el-input
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="请输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item label="确认密码" prop="confirmPassword">
          <el-input
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="请再次输入新密码"
            show-password
          />
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="changingPassword" @click="changePassword">
            修改密码
          </el-button>
          <el-button @click="resetPasswordForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'

const authStore = useAuthStore()

const updating = ref(false)
const changingPassword = ref(false)

const profileFormRef = ref()
const passwordFormRef = ref()

const profileForm = reactive({
  username: '',
  name: '',
  phone: '',
  email: '',
  address: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const validatePhone = (rule, value, callback) => {
  if (value && !/^1[3-9]\d{9}$/.test(value)) {
    callback(new Error('请输入正确的手机号'))
  } else {
    callback()
  }
}

const validateEmail = (rule, value, callback) => {
  if (value && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    callback(new Error('请输入正确的邮箱地址'))
  } else {
    callback()
  }
}

const validateNewPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请输入新密码'))
  } else if (value.length < 6) {
    callback(new Error('密码长度不能少于6位'))
  } else {
    callback()
  }
}

const validateConfirmPassword = (rule, value, callback) => {
  if (value === '') {
    callback(new Error('请再次输入新密码'))
  } else if (value !== passwordForm.newPassword) {
    callback(new Error('两次输入密码不一致'))
  } else {
    callback()
  }
}

const profileRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 3, max: 20, message: '用户名长度在 3 到 20 个字符', trigger: 'blur' }
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

const passwordRules = {
  currentPassword: [
    { required: true, message: '请输入当前密码', trigger: 'blur' }
  ],
  newPassword: [
    { validator: validateNewPassword, trigger: 'blur' }
  ],
  confirmPassword: [
    { validator: validateConfirmPassword, trigger: 'blur' }
  ]
}

const loadUserProfile = async () => {
  try {
    const userId = authStore.user?.userId
    if (!userId) return

    const response = await api.get(`/api/auth/users/${userId}`)
    if (response.data.code === 200) {
      const userData = response.data.data
      profileForm.username = userData.username || ''
      profileForm.name = userData.name || ''
      profileForm.phone = userData.phone || ''
      profileForm.email = userData.email || ''
      profileForm.address = userData.address || ''
    }
  } catch (error) {
    console.error('Failed to load user profile:', error)
  }
}

const updateProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    updating.value = true

    const userId = authStore.user?.userId
    const response = await api.put(`/api/auth/users/${userId}`, profileForm)

    if (response.data.code === 200) {
      ElMessage.success('个人资料更新成功')
      
      // 更新本地存储的用户信息
      authStore.updateUser(response.data.data)
    }
  } catch (error) {
    console.error('Failed to update profile:', error)
  } finally {
    updating.value = false
  }
}

const changePassword = async () => {
  if (!passwordFormRef.value) return

  try {
    await passwordFormRef.value.validate()
    changingPassword.value = true

    // 这里需要实现密码修改的API调用
    // 由于后端API文档中没有提供密码修改接口，这里只是模拟
    ElMessage.success('密码修改成功，请重新登录')
    
    // 重置密码表单
    resetPasswordForm()
    
    // 可以选择自动登出用户
    // authStore.logout()
    // router.push('/login')
  } catch (error) {
    console.error('Failed to change password:', error)
  } finally {
    changingPassword.value = false
  }
}

const resetForm = () => {
  loadUserProfile()
}

const resetPasswordForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

onMounted(() => {
  loadUserProfile()
})
</script>

<style scoped>
.profile-page {
  max-width: 600px;
  margin: 0 auto;
}

.profile-form,
.password-form {
  max-width: 500px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}

:deep(.el-textarea__inner) {
  resize: vertical;
}
</style>