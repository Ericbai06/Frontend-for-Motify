<template>
  <div class="repairmen-container">
    <div class="page-header">
      <h1>维修人员管理</h1>
      <p>查看和管理系统中的所有维修人员</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索用户名或姓名"
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="6">
            <el-select v-model="selectedType" placeholder="选择工种" clearable>
              <el-option label="全部工种" value="" />
              <el-option label="机修工" value="MECHANIC" />
              <el-option label="电工" value="ELECTRICIAN" />
              <el-option label="钣金工" value="BODYWORKER" />
              <el-option label="喷漆工" value="PAINTER" />
              <el-option label="学徒工" value="APPRENTICE" />
              <el-option label="质检员" value="INSPECTOR" />
              <el-option label="故障诊断师" value="DIAGNOSER" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch" :loading="loading">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
          <el-col :span="6" class="text-right">
            <el-button type="success" @click="exportRepairmen">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 维修人员列表 -->
    <div class="repairmen-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>维修人员列表</span>
            <span class="total-count">总计: {{ totalCount }} 名维修人员</span>
          </div>
        </template>

        <el-table
          :data="filteredRepairmen"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >
          <el-table-column prop="repairmanId" label="ID" width="60" />
          <el-table-column prop="username" label="用户名" width="120">
            <template #default="scope">
              <el-tag>{{ scope.row.username }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="name" label="姓名" width="100" />
          <el-table-column prop="gender" label="性别" width="60" />
          <el-table-column prop="type" label="工种" width="120">
            <template #default="scope">
              <el-tag :type="getTypeColor(scope.row.type)">
                {{ getTypeText(scope.row.type) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="hourlyRate" label="时薪" width="100">
            <template #default="scope">
              ¥{{ scope.row.hourlyRate?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
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
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewRepairmanDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 维修人员详情对话框 -->
    <el-dialog
      v-model="repairmanDetailVisible"
      title="维修人员详细信息"
      width="600px"
    >
      <div v-if="selectedRepairman" class="repairman-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="ID">
            {{ selectedRepairman.repairmanId }}
          </el-descriptions-item>
          <el-descriptions-item label="用户名">
            <el-tag>{{ selectedRepairman.username }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="姓名">
            {{ selectedRepairman.name }}
          </el-descriptions-item>
          <el-descriptions-item label="性别">
            {{ selectedRepairman.gender }}
          </el-descriptions-item>
          <el-descriptions-item label="工种">
            <el-tag :type="getTypeColor(selectedRepairman.type)">
              {{ getTypeText(selectedRepairman.type) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时薪">
            ¥{{ selectedRepairman.hourlyRate?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
          <el-descriptions-item label="手机号">
            {{ selectedRepairman.phone || '未填写' }}
          </el-descriptions-item>
          <el-descriptions-item label="邮箱地址">
            {{ selectedRepairman.email || '未填写' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="repairmanDetailVisible = false">关闭</el-button>
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
const repairmen = ref([])
const searchKeyword = ref('')
const selectedType = ref('')
const repairmanDetailVisible = ref(false)
const selectedRepairman = ref(null)

const totalCount = computed(() => repairmen.value.length)

const filteredRepairmen = computed(() => {
  let filtered = repairmen.value
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(repairman => 
      repairman.username?.toLowerCase().includes(keyword) ||
      repairman.name?.toLowerCase().includes(keyword)
    )
  }
  
  // 按工种过滤
  if (selectedType.value) {
    filtered = filtered.filter(repairman => repairman.type === selectedType.value)
  }
  
  return filtered
})

const getTypeText = (type) => {
  const typeMap = {
    'MECHANIC': '机修工',
    'ELECTRICIAN': '电工',
    'BODYWORKER': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒工',
    'INSPECTOR': '质检员',
    'DIAGNOSER': '故障诊断师'
  }
  return typeMap[type] || type
}

const getTypeColor = (type) => {
  const colorMap = {
    'MECHANIC': 'primary',
    'ELECTRICIAN': 'warning',
    'BODYWORKER': 'success',
    'PAINTER': 'danger',
    'APPRENTICE': 'info',
    'INSPECTOR': '',
    'DIAGNOSER': 'primary'
  }
  return colorMap[type] || ''
}

const loadRepairmen = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/repairmen')
    
    if (response.data.success) {
      repairmen.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 名维修人员`)
    } else {
      ElMessage.error(response.data.message || '加载维修人员列表失败')
    }
  } catch (error) {
    console.error('加载维修人员列表失败:', error)
    ElMessage.error('加载维修人员列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  ElMessage.success(`找到 ${filteredRepairmen.value.length} 名匹配的维修人员`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedType.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewRepairmanDetail = (repairman) => {
  selectedRepairman.value = repairman
  repairmanDetailVisible.value = true
}

const exportRepairmen = () => {
  const csvContent = generateCSV(filteredRepairmen.value)
  downloadCSV(csvContent, 'repairmen.csv')
  ElMessage.success('维修人员数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['ID', '用户名', '姓名', '性别', '工种', '时薪', '手机号', '邮箱']
  const csvArray = [headers]
  
  data.forEach(repairman => {
    csvArray.push([
      repairman.repairmanId,
      repairman.username,
      repairman.name,
      repairman.gender,
      getTypeText(repairman.type),
      repairman.hourlyRate?.toFixed(2) || '0.00',
      repairman.phone || '',
      repairman.email || ''
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
  loadRepairmen()
})
</script>

<style scoped>
.repairmen-container {
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

.repairmen-table {
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

.repairman-detail {
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
