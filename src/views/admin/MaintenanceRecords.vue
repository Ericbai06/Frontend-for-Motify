<template>
  <div class="maintenance-records-container">
    <div class="page-header">
      <h1>维修记录管理</h1>
      <p>查看系统中所有的历史维修记录</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="8">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索记录名称或描述"
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
            <el-button type="success" @click="exportRecords">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 维修记录列表 -->
    <div class="records-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>维修记录列表</span>
            <span class="total-count">总计: {{ totalCount }} 条记录</span>
          </div>
        </template>

        <el-table
          :data="filteredRecords"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >
          <el-table-column prop="recordId" label="记录ID" width="80" />
          <el-table-column prop="name" label="记录名称" min-width="150" />
          <el-table-column prop="description" label="描述" min-width="200">
            <template #default="scope">
              <span :title="scope.row.description">
                {{ truncateText(scope.row.description, 50) }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="费用" width="100">
            <template #default="scope">
              ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="repairManId" label="维修人员ID" width="120" />          <el-table-column prop="workHours" label="工时" width="100">
            <template #default="scope">
              {{ formatWorkMinutes(scope.row.workHours) }}
            </template>
          </el-table-column>
          <el-table-column prop="startTime" label="开始时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.startTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewRecordDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 记录详情对话框 -->
    <el-dialog
      v-model="recordDetailVisible"
      title="维修记录详细信息"
      width="600px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">
            {{ selectedRecord.recordId }}
          </el-descriptions-item>
          <el-descriptions-item label="维修人员ID">
            {{ selectedRecord.repairManId }}
          </el-descriptions-item>
          <el-descriptions-item label="记录名称" :span="2">
            {{ selectedRecord.name }}
          </el-descriptions-item>
          <el-descriptions-item label="详细描述" :span="2">
            <div class="description-text">
              {{ selectedRecord.description || '无描述' }}
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="费用">
            ¥{{ selectedRecord.cost?.toFixed(2) || '0.00' }}
          </el-descriptions-item>          <el-descriptions-item label="工时">
            {{ formatWorkMinutes(selectedRecord.workHours) }}
          </el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">
            {{ formatDateTime(selectedRecord.startTime) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="recordDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download } from '@element-plus/icons-vue'
import api from '../../utils/api'
import { formatDateTime, formatWorkMinutes } from '../../utils/format'

const loading = ref(false)
const records = ref([])
const searchKeyword = ref('')
const recordDetailVisible = ref(false)
const selectedRecord = ref(null)

const totalCount = computed(() => records.value.length)

const filteredRecords = computed(() => {
  if (!searchKeyword.value) {
    return records.value
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return records.value.filter(record => 
    record.name?.toLowerCase().includes(keyword) ||
    record.description?.toLowerCase().includes(keyword)
  )
})

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

// 移除本地的formatWorkHours函数，使用统一的formatWorkMinutes

const loadRecords = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/maintenance-records')
    
    if (response.data.success) {
      records.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 条维修记录`)
    } else {
      ElMessage.error(response.data.message || '加载维修记录列表失败')
    }
  } catch (error) {
    console.error('加载维修记录列表失败:', error)
    ElMessage.error('加载维修记录列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  ElMessage.success(`找到 ${filteredRecords.value.length} 条匹配的记录`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewRecordDetail = (record) => {
  selectedRecord.value = record
  recordDetailVisible.value = true
}

const exportRecords = () => {
  const csvContent = generateCSV(filteredRecords.value)
  downloadCSV(csvContent, 'maintenance-records.csv')
  ElMessage.success('维修记录数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['记录ID', '记录名称', '描述', '费用', '维修人员ID', '工时', '开始时间']
  const csvArray = [headers]
  
  data.forEach(record => {
    csvArray.push([
      record.recordId,
      record.name,
      record.description || '',
      record.cost?.toFixed(2) || '0.00',
      record.repairManId,
      formatWorkMinutes(record.workHours),
      formatDateTime(record.startTime)
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
  loadRecords()
})
</script>

<style scoped>
.maintenance-records-container {
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

.records-table {
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

.record-detail {
  padding: 16px 0;
}

.description-text {
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.6;
  word-break: break-word;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
