<template>
  <div class="maintenance-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>维修记录管理</h2>
        <div>
          <el-button type="success" @click="$router.push('/admin/create-multi-order')">
            <el-icon><Plus /></el-icon>
            创建多工种工单
          </el-button>
          <el-button type="primary" @click="showAddMaintenanceDialog = true">
            <el-icon><Plus /></el-icon>
            创建普通工单
          </el-button>
        </div>
      </div>

      <el-form :inline="true" class="filter-form mb-4">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="选择状态" clearable>
            <el-option
              v-for="(value, key) in ORDER_STATUS_MAP"
              :key="key"
              :label="value"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="用户">
          <el-input v-model="filters.username" placeholder="用户名" clearable />
        </el-form-item>
        <el-form-item label="车牌号">
          <el-input v-model="filters.licensePlate" placeholder="车牌号" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="maintenanceRecords" style="width: 100%" v-loading="loading">
        <el-table-column prop="recordId" label="ID" width="80" />
        <el-table-column prop="name" label="工单名称" />
        <el-table-column prop="car.licensePlate" label="车牌号" />
        <el-table-column prop="user.username" label="用户" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)">
              {{ ORDER_STATUS_MAP[row.status] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180" />
        <el-table-column label="操作" width="220">
          <template #default="{ row }">
            <el-button text type="primary" @click="viewMaintenanceDetail(row)">详情</el-button>
            <el-button text type="primary" @click="editMaintenance(row)">编辑</el-button>
            <el-button 
              text 
              type="danger" 
              :disabled="row.status !== 'PENDING'"
              @click="confirmCancelMaintenance(row)"
            >
              取消
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-container mt-4">
        <el-pagination
          background
          layout="prev, pager, next, total"
          :total="total"
          :page-size="pageSize"
          :current-page="currentPage"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 维修详情对话框 -->
    <el-dialog
      v-model="showDetailDialog"
      title="维修工单详情"
      width="700px"
    >
      <div v-if="selectedMaintenance" class="maintenance-detail">
        <div class="detail-header mb-4">
          <h3>{{ selectedMaintenance.name }}</h3>
          <el-tag :type="getStatusType(selectedMaintenance.status)">
            {{ ORDER_STATUS_MAP[selectedMaintenance.status] }}
          </el-tag>
        </div>
        
        <el-descriptions :column="2" border>
          <el-descriptions-item label="工单ID">{{ selectedMaintenance.recordId }}</el-descriptions-item>
          <el-descriptions-item label="创建时间">{{ selectedMaintenance.createTime }}</el-descriptions-item>
          <el-descriptions-item label="车辆信息">
            {{ selectedMaintenance.car?.brand }} {{ selectedMaintenance.car?.model }} 
            ({{ selectedMaintenance.car?.licensePlate }})
          </el-descriptions-item>
          <el-descriptions-item label="用户">{{ selectedMaintenance.user?.username }}</el-descriptions-item>
          <el-descriptions-item label="进度" :span="2">
            <el-progress :percentage="selectedMaintenance.progress" />
          </el-descriptions-item>
          <el-descriptions-item label="描述" :span="2">
            {{ selectedMaintenance.description || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="催单信息" :span="2">
            {{ selectedMaintenance.reminder || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="维修结果" :span="2">
            {{ selectedMaintenance.result || '无' }}
          </el-descriptions-item>
          <el-descriptions-item label="评分" :span="2" v-if="selectedMaintenance.score">
            <el-rate
              v-model="selectedMaintenance.score"
              disabled
              show-score
              text-color="#ff9900"
            />
          </el-descriptions-item>
          <el-descriptions-item label="总费用" :span="2">
            ¥{{ selectedMaintenance.cost || 0 }}
          </el-descriptions-item>
        </el-descriptions>

        <div v-if="selectedMaintenance.repairmen && selectedMaintenance.repairmen.length > 0" class="mt-4">
          <h4>维修人员</h4>
          <el-table :data="selectedMaintenance.repairmen" size="small">
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="type" label="工种">
              <template #default="{ row }">
                {{ REPAIRMAN_TYPE_MAP[row.type] }}
              </template>
            </el-table-column>
            <el-table-column prop="isAccepted" label="状态">
              <template #default="{ row }">
                <el-tag :type="row.isAccepted ? 'success' : 'warning'">
                  {{ row.isAccepted ? '已接受' : '待确认' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'
import { ORDER_STATUS_MAP, REPAIRMAN_TYPE_MAP, STATUS_COLORS } from '../../utils/constants'

const maintenanceRecords = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(10)
const currentPage = ref(1)
const showDetailDialog = ref(false)
const selectedMaintenance = ref(null)

const filters = reactive({
  status: '',
  username: '',
  licensePlate: ''
})

const loadMaintenanceRecords = async () => {
  try {
    loading.value = true
    const params = {
      page: currentPage.value - 1,
      size: pageSize.value,
      ...filters
    }
    
    const response = await api.get('/api/admin/maintenance-records', { params })
    if (response.data.code === 200) {
      maintenanceRecords.value = response.data.data.content || []
      total.value = response.data.data.totalElements || 0
    } else {
      ElMessage.error(response.data.message || '获取维修记录失败')
    }
  } catch (error) {
    console.error('Failed to load maintenance records:', error)
    ElMessage.error('获取维修记录失败')
  } finally {
    loading.value = false
  }
}

const getStatusType = (status) => {
  const statusMap = {
    PENDING: 'warning',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger'
  }
  return statusMap[status] || 'info'
}

const handlePageChange = (page) => {
  currentPage.value = page
  loadMaintenanceRecords()
}

const applyFilters = () => {
  currentPage.value = 1
  loadMaintenanceRecords()
}

const resetFilters = () => {
  filters.status = ''
  filters.username = ''
  filters.licensePlate = ''
  applyFilters()
}

const viewMaintenanceDetail = async (maintenance) => {
  try {
    loading.value = true
    const response = await api.get(`/api/admin/maintenance-records/${maintenance.recordId}`)
    if (response.data.code === 200) {
      selectedMaintenance.value = response.data.data
      showDetailDialog.value = true
    } else {
      ElMessage.error(response.data.message || '获取维修详情失败')
    }
  } catch (error) {
    console.error('Failed to load maintenance detail:', error)
    ElMessage.error('获取维修详情失败')
  } finally {
    loading.value = false
  }
}

const editMaintenance = (maintenance) => {
  // 跳转到编辑页面或者打开编辑对话框
  ElMessage.info('编辑功能待实现')
}

const confirmCancelMaintenance = (maintenance) => {
  ElMessageBox.confirm(
    `确定要取消工单 "${maintenance.name}" 吗？此操作不可逆`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    cancelMaintenance(maintenance.recordId)
  }).catch(() => {
    // 用户取消操作
  })
}

const cancelMaintenance = async (recordId) => {
  try {
    const response = await api.put(`/api/admin/maintenance-records/${recordId}/cancel`)
    if (response.data.code === 200) {
      ElMessage.success('工单已取消')
      loadMaintenanceRecords()
    } else {
      ElMessage.error(response.data.message || '取消工单失败')
    }
  } catch (error) {
    console.error('Failed to cancel maintenance:', error)
    ElMessage.error('取消工单失败')
  }
}

onMounted(() => {
  loadMaintenanceRecords()
})

defineExpose({
  showAddMaintenanceDialog: () => {
    ElMessage.info('创建工单功能待实现')
  }
})
</script>

<style scoped>
.maintenance-page {
  max-width: 1200px;
  margin: 0 auto;
}

.filter-form {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 4px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.pagination-container {
  display: flex;
  justify-content: center;
}
</style> 