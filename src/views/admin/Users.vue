<template>
  <div class="users-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>用户管理</h2>
        <el-button type="primary" @click="showAddUserDialog = true">
          <el-icon><Plus /></el-icon>
          添加用户
        </el-button>
      </div>

      <el-table :data="users" style="width: 100%" v-loading="loading">
        <el-table-column prop="userId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="email" label="邮箱" />
        <el-table-column label="车辆数" width="100">
          <template #default="{ row }">
            {{ row.cars?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="维修记录" width="100">
          <template #default="{ row }">
            {{ row.maintenanceRecords?.length || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button text type="primary" @click="editUser(row)">编辑</el-button>
            <el-button text type="danger" @click="confirmDeleteUser(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑用户对话框 -->
    <el-dialog
      v-model="showUserDialog"
      :title="isEditing ? '编辑用户' : '添加用户'"
      width="500px"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="userForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="userForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="userForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="userForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item v-if="!isEditing" label="密码" prop="password">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showUserDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitUserForm">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'

const users = ref([])
const loading = ref(false)
const showUserDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const userFormRef = ref()

const userForm = reactive({
  userId: null,
  username: '',
  name: '',
  phone: '',
  email: '',
  password: ''
})

const userRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/users')
    if (response.data.code === 200) {
      users.value = response.data.data || []
    } else {
      ElMessage.error(response.data.message || '获取用户列表失败')
    }
  } catch (error) {
    console.error('Failed to load users:', error)
    ElMessage.error('获取用户列表失败')
  } finally {
    loading.value = false
  }
}

const editUser = (user) => {
  isEditing.value = true
  userForm.userId = user.userId
  userForm.username = user.username
  userForm.name = user.name || ''
  userForm.phone = user.phone || ''
  userForm.email = user.email || ''
  userForm.password = '' // 清空密码
  showUserDialog.value = true
}

const addUser = () => {
  isEditing.value = false
  userForm.userId = null
  userForm.username = ''
  userForm.name = ''
  userForm.phone = ''
  userForm.email = ''
  userForm.password = ''
  showUserDialog.value = true
}

const submitUserForm = async () => {
  if (!userFormRef.value) return
  
  await userFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      submitting.value = true
      let response
      
      if (isEditing.value) {
        response = await api.put(`/api/admin/users/${userForm.userId}`, userForm)
      } else {
        response = await api.post('/api/admin/users/register', userForm)
      }
      
      if (response.data.code === 200) {
        ElMessage.success(isEditing.value ? '用户更新成功' : '用户添加成功')
        showUserDialog.value = false
        loadUsers()
      } else {
        ElMessage.error(response.data.message || (isEditing.value ? '用户更新失败' : '用户添加失败'))
      }
    } catch (error) {
      console.error('Failed to submit user form:', error)
      ElMessage.error(isEditing.value ? '用户更新失败' : '用户添加失败')
    } finally {
      submitting.value = false
    }
  })
}

const confirmDeleteUser = (user) => {
  ElMessageBox.confirm(
    `确定要删除用户 ${user.username} 吗？此操作不可逆`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    deleteUser(user.userId)
  }).catch(() => {
    // 用户取消删除
  })
}

const deleteUser = async (userId) => {
  try {
    const response = await api.delete(`/api/admin/users/${userId}`)
    if (response.data.code === 200) {
      ElMessage.success('用户删除成功')
      loadUsers()
    } else {
      ElMessage.error(response.data.message || '用户删除失败')
    }
  } catch (error) {
    console.error('Failed to delete user:', error)
    ElMessage.error('用户删除失败')
  }
}

onMounted(() => {
  loadUsers()
})

defineExpose({
  showAddUserDialog: addUser
})
</script>

<style scoped>
.users-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style> 