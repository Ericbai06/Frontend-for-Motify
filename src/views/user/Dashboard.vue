<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><Van /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalCars }}</h3>
          <p>我的车辆</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><Tools /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalMaintenance }}</h3>
          <p>维修记录</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.inProgressMaintenance }}</h3>
          <p>进行中</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><Money /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.totalCost) }}</h3>
          <p>总花费</p>
        </div>
      </div>
    </div>

    <!-- 快速操作 -->
    <div class="card-container">
      <h2>快速操作</h2>
      <div class="quick-actions">
        <el-button type="primary" size="large" @click="$router.push('/user/cars')">
          <el-icon><Plus /></el-icon>
          添加车辆
        </el-button>
        <el-button type="success" size="large" @click="showSubmitRepairDialog = true">
          <el-icon><Tools /></el-icon>
          提交维修请求
        </el-button>
        <el-button type="info" size="large" @click="$router.push('/user/maintenance')">
          <el-icon><List /></el-icon>
          查看维修记录
        </el-button>
      </div>
    </div>

    <!-- 最近维修记录 -->
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>最近维修记录</h2>
        <el-button text @click="$router.push('/user/maintenance')">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <el-table :data="recentMaintenance" style="width: 100%">
        <el-table-column prop="name" label="维修项目" />
        <el-table-column prop="car" label="车辆" width="200">
          <template #default="{ row }">
            {{ row.car?.brand }} {{ row.car?.model }} ({{ row.car?.licensePlate }})
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="120">
          <template #default="{ row }">
            <el-tag :type="STATUS_COLORS[row.status]">
              {{ formatStatus(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="progress" label="进度" width="120">
          <template #default="{ row }">
            <el-progress :percentage="row.progress" :stroke-width="8" />
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="{ row }">
            {{ formatDateTime(row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button 
              text 
              type="primary" 
              @click="$router.push(`/user/maintenance/${row.itemId}`)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 提交维修请求对话框 -->
    <el-dialog
      v-model="showSubmitRepairDialog"
      title="提交维修请求"
      width="500px"
    >
      <el-form
        ref="repairFormRef"
        :model="repairForm"
        :rules="repairRules"
        label-width="100px"
      >
        <el-form-item label="选择车辆" prop="carId">
          <el-select
            v-model="repairForm.carId"
            placeholder="请选择车辆"
            style="width: 100%"
          >
            <el-option
              v-for="car in cars"
              :key="car.carId"
              :label="`${car.brand} ${car.model} (${car.licensePlate})`"
              :value="car.carId"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="维修项目" prop="name">
          <el-input
            v-model="repairForm.name"
            placeholder="请输入维修项目名称"
          />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="repairForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述车辆问题"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSubmitRepairDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRepairRequest">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency, formatStatus } from '../../utils/format'
import { STATUS_COLORS } from '../../utils/constants'

const authStore = useAuthStore()

const stats = reactive({
  totalCars: 0,
  totalMaintenance: 0,
  inProgressMaintenance: 0,
  totalCost: 0
})

const recentMaintenance = ref([])
const cars = ref([])
const showSubmitRepairDialog = ref(false)
const submitting = ref(false)

const repairFormRef = ref()
const repairForm = reactive({
  carId: '',
  name: '',
  description: ''
})

const repairRules = {
  carId: [
    { required: true, message: '请选择车辆', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入维修项目名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
}

const loadDashboardData = async () => {
  try {
    const userId = authStore.user?.userId
    if (!userId) return

    // 加载车辆数据
    const carsResponse = await api.get(`/api/auth/users/${userId}/cars`)
    if (carsResponse.data.code === 200) {
      cars.value = carsResponse.data.data
      stats.totalCars = cars.value.length
    }

    // 加载维修记录数据
    const maintenanceResponse = await api.get(`/api/auth/users/${userId}/maintenance-records`)
    if (maintenanceResponse.data.code === 200) {
      const maintenanceData = maintenanceResponse.data.data
      stats.totalMaintenance = maintenanceData.length
      stats.inProgressMaintenance = maintenanceData.filter(item => 
        item.status === 'IN_PROGRESS'
      ).length
      stats.totalCost = maintenanceData.reduce((sum, item) => sum + (item.cost || 0), 0)
      
      // 获取最近的5条记录
      recentMaintenance.value = maintenanceData
        .sort((a, b) => new Date(b.createTime) - new Date(a.createTime))
        .slice(0, 5)
    }
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const submitRepairRequest = async () => {
  if (!repairFormRef.value) return

  try {
    await repairFormRef.value.validate()
    submitting.value = true

    const userId = authStore.user?.userId
    const response = await api.post(`/api/auth/users/${userId}/maintenance-records`, repairForm)

    if (response.data.code === 200) {
      ElMessage.success('维修请求提交成功')
      showSubmitRepairDialog.value = false
      
      // 重置表单
      repairFormRef.value.resetFields()
      
      // 重新加载数据
      loadDashboardData()
    }
  } catch (error) {
    console.error('Failed to submit repair request:', error)
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-content p {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.quick-actions {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.quick-actions .el-button {
  flex: 1;
  min-width: 160px;
}

:deep(.el-progress-bar__outer) {
  background-color: #f0f2f5;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}
</style>