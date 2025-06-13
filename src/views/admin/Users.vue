<template>
  <div class="users-container">
    <div class="page-header">
      <h1>用户管理</h1>
      <p>查看和管理系统中的所有注册用户</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名、姓名或邮箱"
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch" :loading="loading">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
          <el-col :span="10" class="text-right">
            <el-button type="success" @click="exportUsers">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 用户列表 -->
    <div class="users-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>用户列表</span>
            <span class="total-count">总计: {{ totalCount }} 个用户</span>
          </div>
        </template>

        <el-table
          :data="filteredUsers"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >
          <el-table-column prop="userId" label="用户ID" width="80" />
          <el-table-column prop="username" label="用户名" width="150">
            <template #default="scope">
              <el-tag>{{ scope.row.username }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="120" />
          <el-table-column prop="phone" label="手机号" width="140">
            <template #default="scope">
              <span v-if="scope.row.phone">{{ scope.row.phone }}</span>
              <span v-else class="text-muted">未填写</span>
            </template>
          </el-table-column>
          <el-table-column prop="email" label="邮箱地址" min-width="200">
            <template #default="scope">
              <span v-if="scope.row.email">{{ scope.row.email }}</span>
              <span v-else class="text-muted">未填写</span>
            </template>
          </el-table-column>
          <el-table-column prop="address" label="地址" min-width="250">
            <template #default="scope">
              <span v-if="scope.row.address">{{ scope.row.address }}</span>
              <span v-else class="text-muted">未填写</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewUserDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 用户详情对话框 -->
    <el-dialog
      v-model="userDetailVisible"
      title="用户详细信息"
      width="600px"
    >
      <div v-if="selectedUser" class="user-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="用户ID">
            {{ selectedUser.userId }}
          </el-descriptions-item>
          <el-descriptions-item label="用户名">
            <el-tag>{{ selectedUser.username }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ selectedUser.name }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ selectedUser.phone || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱地址" :span="2">
            {{ selectedUser.email || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="地址" :span="2">
            {{ selectedUser.address || '未填写' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="userDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const users = ref([])
const searchKeyword = ref('')
const userDetailVisible = ref(false)
const selectedUser = ref(null)

const totalCount = computed(() => users.value.length)

const filteredUsers = computed(() => {
  if (!searchKeyword.value) {
    return users.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return users.value.filter(user => 
    user.username?.toLowerCase().includes(keyword) ||
    user.name?.toLowerCase().includes(keyword) ||
    user.email?.toLowerCase().includes(keyword)
  )
})

const loadUsers = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/users')
    
    if (response.data.success) {
      users.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 个用户`)
    } else {
      ElMessage.error(response.data.message || '加载用户列表失败')
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
    ElMessage.error('加载用户列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  // 搜索功能通过 computed 属性实现
  ElMessage.success(`找到 ${filteredUsers.value.length} 个匹配的用户`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewUserDetail = (user) => {
  selectedUser.value = user
  userDetailVisible.value = true
}

const exportUsers = () => {
  // 导出功能
  const csvContent = generateCSV(filteredUsers.value)
  downloadCSV(csvContent, 'users.csv')
  ElMessage.success('用户数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['用户ID', '用户名', '姓名', '手机号', '邮箱', '地址']
  const csvArray = [headers]
  
  data.forEach(user => {
    csvArray.push([
      user.userId,
      user.username,
      user.name,
      user.phone || '',
      user.email || '',
      user.address || ''
    ])
  })
  
  return csvArray.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
}

const downloadCSV = (content, filename) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.users-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.search-section {
  margin-bottom: 24px;
}

.users-table {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.text-right {
  text-align: right;
}

.text-muted {
  color: #909399;
  font-style: italic;
}

.user-detail {
  padding: 16px 0;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
