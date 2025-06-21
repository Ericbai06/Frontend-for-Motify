<template>
  <div class="maintenance-items-container">
    <div class="page-header">
      <h1>维修工单管理</h1>
      <p>查看和管理系统中的所有维修工单</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索工单名称或车牌号"
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedStatus" placeholder="选择状态" clearable>
              <el-option label="全部状态" value="" />
              <el-option label="待接受" value="PENDING" />
              <el-option label="进行中" value="IN_PROGRESS" />
              <el-option label="已完成" value="COMPLETED" />
              <el-option label="已取消" value="CANCELLED" />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch" :loading="loading">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
          <el-col :span="8" class="text-right">
            <el-button type="success" @click="exportMaintenanceItems">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 工单列表 -->
    <div class="maintenance-items-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>维修工单列表</span>
            <span class="total-count">总计: {{ totalCount }} 个工单</span>
          </div>
        </template>

        <el-table
          :data="filteredMaintenanceItems"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >          <el-table-column prop="itemId" label="工单ID" width="80" />
          <el-table-column prop="name" label="维修项目" min-width="150">
            <template #default="scope">
              <div class="maintenance-name">
                <el-icon 
                  v-if="scope.row.reminder" 
                  color="#F56C6C" 
                  size="14" 
                  class="rush-icon-small"
                >
                  <Bell />
                </el-icon>
                <span>{{ scope.row.name }}</span>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="car.licensePlate" label="车牌号" width="120">
            <template #default="scope">
              <el-tag type="primary">{{ scope.row.car?.licensePlate || '未知' }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="车辆信息" width="180">
            <template #default="scope">
              <span v-if="scope.row.car">
                {{ scope.row.car.brand }} {{ scope.row.car.model }}
              </span>
              <span v-else class="text-muted">未知车辆</span>
            </template>
          </el-table-column>          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
            <!-- 催单提示列 -->
          <el-table-column label="催单提示" width="120" align="center">
            <template #default="scope">
              <div v-if="scope.row.reminder" class="rush-indicator">
                <el-tooltip 
                  effect="dark" 
                  :content="scope.row.reminder" 
                  placement="top"
                >
                  <el-badge :value="'急'" class="rush-badge">
                    <el-icon color="#F56C6C" size="16">
                      <Bell />
                    </el-icon>
                  </el-badge>
                </el-tooltip>
              </div>
              <span v-else class="text-muted">-</span>
            </template>
          </el-table-column>
          
          <el-table-column prop="progress" label="进度" width="100">
            <template #default="scope">
              <el-progress 
                :percentage="scope.row.progress || 0" 
                :status="scope.row.status === 'COMPLETED' ? 'success' : ''"
                :stroke-width="6"
              />
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="费用" width="100">
            <template #default="scope">
              ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="score" label="评分" width="80">
            <template #default="scope">
              <el-rate 
                v-if="scope.row.score" 
                :model-value="scope.row.score" 
                disabled 
                size="small"
              />
              <span v-else class="text-muted">未评分</span>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="150">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>          <el-table-column label="操作" width="180" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewMaintenanceDetail(scope.row)"
              >
                查看详情
              </el-button>
              
              <el-popconfirm
                title="确定要删除这个工单吗？此操作不可逆！"
                confirm-button-text="确定删除"
                cancel-button-text="取消"
                confirm-button-type="danger"
                icon-color="#ff4949"
                @confirm="deleteMaintenance(scope.row)"
              >
                <template #reference>
                  <el-button
                    type="danger"
                    size="small"
                    :loading="deletingItemId === scope.row.itemId"
                    style="margin-left: 8px;"
                  >
                    <el-icon><Delete /></el-icon>
                    删除
                  </el-button>
                </template>
              </el-popconfirm>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 工单详情对话框 -->
    <el-dialog
      v-model="maintenanceDetailVisible"
      title="维修工单详细信息"
      width="800px"
    >
      <div v-if="selectedMaintenance" class="maintenance-detail">
        <el-tabs v-model="activeTab">
          <!-- 基本信息 -->
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="工单ID">
                {{ selectedMaintenance.itemId }}
              </el-descriptions-item>
              <el-descriptions-item label="维修项目">
                {{ selectedMaintenance.name }}
              </el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(selectedMaintenance.status)">
                  {{ getStatusText(selectedMaintenance.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="进度">
                {{ selectedMaintenance.progress || 0 }}%
              </el-descriptions-item>
              <el-descriptions-item label="材料费">
                ¥{{ selectedMaintenance.materialCost?.toFixed(2) || '0.00' }}
              </el-descriptions-item>
              <el-descriptions-item label="工时费">
                ¥{{ selectedMaintenance.laborCost?.toFixed(2) || '0.00' }}
              </el-descriptions-item>
              <el-descriptions-item label="总费用">
                ¥{{ selectedMaintenance.cost?.toFixed(2) || '0.00' }}
              </el-descriptions-item>
              <el-descriptions-item label="评分">
                <el-rate 
                  v-if="selectedMaintenance.score" 
                  :model-value="selectedMaintenance.score" 
                  disabled 
                />
                <span v-else>未评分</span>
              </el-descriptions-item>
              <el-descriptions-item label="描述" :span="2">
                {{ selectedMaintenance.description || '无描述' }}
              </el-descriptions-item>
              <el-descriptions-item label="维修结果" :span="2">
                {{ selectedMaintenance.result || '暂无结果' }}
              </el-descriptions-item>
              <el-descriptions-item label="提醒" :span="2">
                {{ selectedMaintenance.reminder || '无提醒' }}
              </el-descriptions-item>
            </el-descriptions>
          </el-tab-pane>

          <!-- 车辆信息 -->
          <el-tab-pane label="车辆信息" name="car">
            <el-descriptions :column="1" border v-if="selectedMaintenance.car">
              <el-descriptions-item label="车辆ID">
                {{ selectedMaintenance.car.carId }}
              </el-descriptions-item>
              <el-descriptions-item label="车牌号">
                <el-tag type="primary">{{ selectedMaintenance.car.licensePlate }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="品牌">
                {{ selectedMaintenance.car.brand }}
              </el-descriptions-item>
              <el-descriptions-item label="型号">
                {{ selectedMaintenance.car.model }}
              </el-descriptions-item>
            </el-descriptions>
            <div v-else class="text-muted">暂无车辆信息</div>
          </el-tab-pane>

          <!-- 维修人员 -->
          <el-tab-pane label="维修人员" name="repairmen">
            <div v-if="selectedMaintenance.repairmen && selectedMaintenance.repairmen.length > 0">
              <el-table :data="selectedMaintenance.repairmen" style="width: 100%">
                <el-table-column prop="repairmanId" label="ID" width="60" />
                <el-table-column prop="name" label="姓名" width="100" />
                <el-table-column prop="type" label="工种" width="120">
                  <template #default="scope">
                    <el-tag>{{ getRepairmanTypeText(scope.row.type) }}</el-tag>
                  </template>
                </el-table-column>
                <el-table-column prop="hourlyRate" label="时薪" width="100">
                  <template #default="scope">
                    ¥{{ scope.row.hourlyRate?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
                <el-table-column label="接受状态" width="100">
                  <template #default="scope">
                    <el-tag 
                      :type="isRepairmanAccepted(scope.row) ? 'success' : 'warning'"
                    >
                      {{ isRepairmanAccepted(scope.row) ? '已接受' : '待接受' }}
                    </el-tag>
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="text-muted">暂无分配的维修人员</div>
          </el-tab-pane>

          <!-- 维修记录 -->
          <el-tab-pane label="维修记录" name="records">
            <div v-if="selectedMaintenance.maintenanceRecords && selectedMaintenance.maintenanceRecords.length > 0">
              <el-table :data="selectedMaintenance.maintenanceRecords" style="width: 100%">
                <el-table-column prop="recordId" label="记录ID" width="80" />
                <el-table-column prop="name" label="记录名称" />
                <el-table-column prop="description" label="描述" />
                <el-table-column prop="cost" label="费用" width="100">
                  <template #default="scope">
                    ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
                  </template>
                </el-table-column>
                <el-table-column prop="workHours" label="工时" width="80">
                  <template #default="scope">
                    {{ scope.row.workHours || 0 }}分钟
                  </template>
                </el-table-column>
                <el-table-column prop="startTime" label="开始时间" width="150">
                  <template #default="scope">
                    {{ formatDateTime(scope.row.startTime) }}
                  </template>
                </el-table-column>
              </el-table>
            </div>
            <div v-else class="text-muted">暂无维修记录</div>
          </el-tab-pane>
        </el-tabs>
      </div>
      <template #footer>
        <el-button @click="maintenanceDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { Search, Download, Bell, Delete } from '@element-plus/icons-vue'
import api, { deleteMaintenanceItem } from '../../utils/api'
import { formatDateTime } from '../../utils/format'

const router = useRouter()
const loading = ref(false)
const deletingItemId = ref(null)
const maintenanceItems = ref([])
const searchKeyword = ref('')
const selectedStatus = ref('')
const maintenanceDetailVisible = ref(false)
const selectedMaintenance = ref(null)
const activeTab = ref('basic')

const totalCount = computed(() => maintenanceItems.value.length)

const filteredMaintenanceItems = computed(() => {
  let filtered = maintenanceItems.value
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(item => 
      item.name?.toLowerCase().includes(keyword) ||
      item.car?.licensePlate?.toLowerCase().includes(keyword)
    )
  }
  
  // 按状态过滤
  if (selectedStatus.value) {
    filtered = filtered.filter(item => item.status === selectedStatus.value)
  }
  
  return filtered
})

const getStatusType = (status) => {
  const statusMap = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'danger'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待接受',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

const getRepairmanTypeText = (type) => {
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

const isRepairmanAccepted = (repairman) => {
  if (!selectedMaintenance.value?.acceptedRepairmen) return false
  return selectedMaintenance.value.acceptedRepairmen.some(
    accepted => accepted.repairmanId === repairman.repairmanId
  )
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const loadMaintenanceItems = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/maintenance-items')
    
    if (response.data.success) {
      maintenanceItems.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 个工单`)
    } else {
      ElMessage.error(response.data.message || '加载维修工单列表失败')
    }
  } catch (error) {
    console.error('加载维修工单列表失败:', error)
    ElMessage.error('加载维修工单列表失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  ElMessage.success(`找到 ${filteredMaintenanceItems.value.length} 个匹配的工单`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedStatus.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewMaintenanceDetail = (maintenance) => {
  // 跳转到工单详情页面
  router.push(`/admin/maintenance/${maintenance.itemId}`)
}

const deleteMaintenance = async (maintenance) => {
  try {
    deletingItemId.value = maintenance.itemId
    
    const response = await deleteMaintenanceItem(maintenance.itemId)
    
    if (response.data.success) {
      // 从列表中移除已删除的工单
      const index = maintenanceItems.value.findIndex(item => item.itemId === maintenance.itemId)
      if (index !== -1) {
        maintenanceItems.value.splice(index, 1)
      }
      
      ElMessage.success(response.data.message || '工单删除成功')
    } else {
      ElMessage.error(response.data.message || '删除工单失败')
    }
  } catch (error) {
    console.error('删除工单失败:', error)
    ElMessage.error('删除工单失败，请稍后重试')
  } finally {
    deletingItemId.value = null
  }
}

const exportMaintenanceItems = () => {
  const csvContent = generateCSV(filteredMaintenanceItems.value)
  downloadCSV(csvContent, 'maintenance-items.csv')
  ElMessage.success('维修工单数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['工单ID', '维修项目', '车牌号', '车辆信息', '状态', '进度', '费用', '评分', '创建时间']
  const csvArray = [headers]
  
  data.forEach(item => {
    csvArray.push([
      item.itemId,
      item.name,
      item.car?.licensePlate || '',
      item.car ? `${item.car.brand} ${item.car.model}` : '',
      getStatusText(item.status),
      `${item.progress || 0}%`,
      item.cost?.toFixed(2) || '0.00',
      item.score || '',
      formatDate(item.createTime)
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
  loadMaintenanceItems()
})
</script>

<style scoped>
.maintenance-items-container {
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

.maintenance-items-table {
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

.maintenance-detail {
  padding: 16px 0;
}

.maintenance-name {
  display: flex;
  align-items: center;
  gap: 6px;
}

.rush-icon-small {
  animation: bell-shake 2s infinite ease-in-out;
}

.rush-indicator {
  display: flex;
  justify-content: center;
  align-items: center;
}

.rush-badge :deep(.el-badge__content) {
  background-color: #F56C6C;
  border-color: #F56C6C;
  font-size: 9px;
  padding: 0 3px;
  height: 14px;
  line-height: 14px;
  min-width: 14px;
  border-radius: 7px;
}

.rush-indicator .el-icon {
  animation: bell-shake 2s infinite ease-in-out;
}

@keyframes bell-shake {
  0%, 50%, 100% {
    transform: rotate(0deg);
  }
  10%, 30% {
    transform: rotate(-10deg);
  }
  20%, 40% {
    transform: rotate(10deg);
  }
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-progress-bar__outer) {
  border-radius: 3px;
}
</style>
