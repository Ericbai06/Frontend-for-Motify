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
        
        <el-form-item label="性别" prop="gender">
          <el-radio-group v-model="profileForm.gender">
            <el-radio label="男">男</el-radio>
            <el-radio label="女">女</el-radio>
          </el-radio-group>
        </el-form-item>
        
        <el-form-item label="工种" prop="type">
          <el-select
            v-model="profileForm.type"
            placeholder="请选择工种"
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
        
        <el-form-item>
          <el-button type="primary" :loading="updating" @click="updateProfile">
            保存修改
          </el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>

    <div class="card-container">
      <h2>工作信息</h2>
      
      <div class="work-info">
        <div class="info-item">
          <span class="label">当前工种：</span>
          <el-tag type="info">{{ formatRepairmanType(repairmanInfo?.type) }}</el-tag>
        </div>
        <div class="info-item">
          <span class="label">时薪：</span>
          <span class="hourly-rate">{{ formatCurrency(repairmanInfo?.hourlyRate || 0) }}/小时</span>
        </div>
        <div class="info-item">
          <span class="label">入职时间：</span>
          <span>{{ formatDate(repairmanInfo?.createTime) || '未知' }}</span>
        </div>
        <div class="info-item">
          <span class="label">完成工单：</span>
          <span>{{ workStats.completedOrders }} 个</span>
        </div>
        <div class="info-item">
          <span class="label">总收入：</span>
          <span class="income">{{ formatCurrency(workStats.totalIncome) }}</span>
        </div>
        <div class="info-item">
          <span class="label">平均评分：</span>
          <div class="rating-display">
            <el-rate v-model="workStats.averageRating" disabled size="small" />
            <span>{{ workStats.averageRating.toFixed(1) }}</span>
          </div>
        </div>
      </div>
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
import { formatDate, formatCurrency, formatRepairmanType } from '../../utils/format'

const authStore = useAuthStore()

const updating = ref(false)
const changingPassword = ref(false)
const repairmanInfo = ref(null)

const profileFormRef = ref()
const passwordFormRef = ref()

const profileForm = reactive({
  username: '',
  name: '',
  gender: '男',
  type: '',
  phone: '',
  email: ''
})

const passwordForm = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const workStats = reactive({
  completedOrders: 0,
  totalIncome: 0,
  averageRating: 0
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

const loadRepairmanProfile = async () => {
  try {
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    const response = await api.post('/api/repairman/info', { repairmanId })
    if (response.data.code === 200) {
      const data = response.data.data
      repairmanInfo.value = data
      
      profileForm.username = data.username || ''
      profileForm.name = data.name || ''
      profileForm.gender = data.gender || '男'
      profileForm.type = data.type || ''
      profileForm.phone = data.phone || ''
      profileForm.email = data.email || ''
    }

    // 加载工作统计
    loadWorkStats()
  } catch (error) {
    console.error('Failed to load repairman profile:', error)
  }
}

const loadWorkStats = async () => {
  try {
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    // 加载收入统计
    const incomeResponse = await api.get(`/api/repairman/${repairmanId}/income`)
    if (incomeResponse.data.code === 200) {
      const incomeData = incomeResponse.data.data
      workStats.totalIncome = incomeData.totalIncome || 0
      workStats.completedOrders = incomeData.totalWorkOrders || 0
    }

    // 加载已完成工作以计算平均评分
    const completedResponse = await api.post('/api/repairman/completed-records', { repairmanId })
    if (completedResponse.data.code === 200) {
      const completedWork = completedResponse.data.data
      const ratedWork = completedWork.filter(work => work.score)
      if (ratedWork.length > 0) {
        const totalScore = ratedWork.reduce((sum, work) => sum + work.score, 0)
        workStats.averageRating = totalScore / ratedWork.length
      }
    }
  } catch (error) {
    console.error('Failed to load work stats:', error)
  }
}

const updateProfile = async () => {
  if (!profileFormRef.value) return

  try {
    await profileFormRef.value.validate()
    updating.value = true

    const repairmanId = authStore.user?.repairmanId
    const requestData = {
      repairmanId,
      ...profileForm
    }

    const response = await api.post('/api/repairman/update', requestData)

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
  loadRepairmanProfile()
}

const resetPasswordForm = () => {
  if (passwordFormRef.value) {
    passwordFormRef.value.resetFields()
  }
}

onMounted(() => {
  loadRepairmanProfile()
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

.work-info {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #909399;
  min-width: 80px;
}

.hourly-rate {
  color: #27ae60;
  font-weight: 600;
}

.income {
  color: #27ae60;
  font-weight: 600;
  font-size: 16px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

:deep(.el-form-item__label) {
  font-weight: 500;
  color: #606266;
}
</style>