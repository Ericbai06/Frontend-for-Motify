<template>
  <div class="cars-container">
    <div class="page-header">
      <h1>车辆管理</h1>
      <p>查看系统中所有注册车辆信息</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索车牌号或品牌型号"
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedBrand" placeholder="选择品牌" clearable>
              <el-option label="全部品牌" value="" />
              <el-option 
                v-for="brand in uniqueBrands" 
                :key="brand" 
                :label="brand" 
                :value="brand" 
              />
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
            <el-button type="success" @click="exportCars">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 车辆列表 -->
    <div class="cars-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>车辆列表</span>
            <span class="total-count">总计: {{ totalCount }} 辆车</span>
          </div>
        </template>

        <el-table
          :data="filteredCars"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >
          <el-table-column prop="carId" label="车辆ID" width="80" />
          <el-table-column prop="licensePlate" label="车牌号" width="150">
            <template #default="scope">
              <el-tag type="primary">{{ scope.row.licensePlate }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="brand" label="品牌" width="120">
            <template #default="scope">
              <el-tag>{{ scope.row.brand }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="model" label="型号" width="150" />
          <el-table-column label="品牌型号" min-width="200">
            <template #default="scope">
              <span>{{ scope.row.brand }} {{ scope.row.model }}</span>
            </template>
          </el-table-column>
          <el-table-column label="操作" width="200" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewCarDetail(scope.row)"
              >
                查看详情
              </el-button>
              <el-button
                type="info"
                size="small"
                @click="viewMaintenanceHistory(scope.row)"
              >
                维修记录
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 车辆详情对话框 -->
    <el-dialog
      v-model="carDetailVisible"
      title="车辆详细信息"
      width="500px"
    >
      <div v-if="selectedCar" class="car-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="车辆ID">
            {{ selectedCar.carId }}
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            <el-tag type="primary">{{ selectedCar.licensePlate }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="品牌">
            <el-tag>{{ selectedCar.brand }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="型号">
            {{ selectedCar.model }}
          </el-descriptions-item>
          <el-descriptions-item label="完整型号">
            {{ selectedCar.brand }} {{ selectedCar.model }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="carDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>

    <!-- 维修记录对话框 -->
    <el-dialog
      v-model="maintenanceHistoryVisible"
      title="维修记录"
      width="800px"
    >
      <div v-if="selectedCar">
        <div class="history-header">
          <h3>{{ selectedCar.brand }} {{ selectedCar.model }} ({{ selectedCar.licensePlate }})</h3>
        </div>
        
        <el-table
          :data="maintenanceHistory"
          v-loading="historyLoading"
          style="width: 100%"
          max-height="400"
        >
          <el-table-column prop="itemId" label="工单ID" width="80" />
          <el-table-column prop="name" label="维修项目" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusText(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="cost" label="费用" width="100">
            <template #default="scope">
              ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="150">
            <template #default="scope">
              {{ formatDate(scope.row.createTime) }}
            </template>
          </el-table-column>
        </el-table>
      </div>
      <template #footer>
        <el-button @click="maintenanceHistoryVisible = false">关闭</el-button>
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
const historyLoading = ref(false)
const cars = ref([])
const maintenanceHistory = ref([])
const searchKeyword = ref('')
const selectedBrand = ref('')
const carDetailVisible = ref(false)
const maintenanceHistoryVisible = ref(false)
const selectedCar = ref(null)

const totalCount = computed(() => cars.value.length)

const uniqueBrands = computed(() => {
  const brands = cars.value.map(car => car.brand)
  return [...new Set(brands)].sort()
})

const filteredCars = computed(() => {
  let filtered = cars.value
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(car => 
      car.licensePlate?.toLowerCase().includes(keyword) ||
      car.brand?.toLowerCase().includes(keyword) ||
      car.model?.toLowerCase().includes(keyword)
    )
  }
  
  // 按品牌过滤
  if (selectedBrand.value) {
    filtered = filtered.filter(car => car.brand === selectedBrand.value)
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

const formatDate = (dateString) => {
  if (!dateString) return ''
  return new Date(dateString).toLocaleDateString('zh-CN')
}

const loadCars = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/cars')
    
    if (response.data.success) {
      cars.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 辆车`)
    } else {
      ElMessage.error(response.data.message || '加载车辆列表失败')
    }
  } catch (error) {
    console.error('加载车辆列表失败:', error)
    ElMessage.error('加载车辆列表失败')
  } finally {
    loading.value = false
  }
}

const loadMaintenanceHistory = async (carId) => {
  try {
    historyLoading.value = true
    const response = await api.get('/api/admin/maintenance-items')
    
    if (response.data.success) {
      // 过滤出该车辆的维修记录
      maintenanceHistory.value = response.data.data.filter(item => 
        item.car && item.car.carId === carId
      )
    }
  } catch (error) {
    console.error('加载维修记录失败:', error)
    ElMessage.error('加载维修记录失败')
  } finally {
    historyLoading.value = false
  }
}

const handleSearch = () => {
  ElMessage.success(`找到 ${filteredCars.value.length} 辆匹配的车辆`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedBrand.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewCarDetail = (car) => {
  selectedCar.value = car
  carDetailVisible.value = true
}

const viewMaintenanceHistory = async (car) => {
  selectedCar.value = car
  maintenanceHistoryVisible.value = true
  await loadMaintenanceHistory(car.carId)
}

const exportCars = () => {
  const csvContent = generateCSV(filteredCars.value)
  downloadCSV(csvContent, 'cars.csv')
  ElMessage.success('车辆数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['车辆ID', '车牌号', '品牌', '型号', '完整型号']
  const csvArray = [headers]
  
  data.forEach(car => {
    csvArray.push([
      car.carId,
      car.licensePlate,
      car.brand,
      car.model,
      `${car.brand} ${car.model}`
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
  loadCars()
})
</script>

<style scoped>
.cars-container {
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

.cars-table {
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

.car-detail {
  padding: 16px 0;
}

.history-header {
  margin-bottom: 16px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.history-header h3 {
  color: #2c3e50;
  margin: 0;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
