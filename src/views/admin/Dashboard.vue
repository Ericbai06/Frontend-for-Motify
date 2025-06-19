<template>
  <div class="dashboard-container">
    <div class="dashboard-header">
      <h1>管理员仪表板</h1>
      <p>车辆维修管理系统总览</p>
    </div>

    <!-- 概览卡片 -->
    <div class="overview-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-icon users-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="card-info">
                <h3>{{ statistics.totalUsers }}</h3>
                <p>注册用户</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-icon repairmen-icon">
                <el-icon><Tools /></el-icon>
              </div>
              <div class="card-info">
                <h3>{{ statistics.totalRepairmen }}</h3>
                <p>维修人员</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-icon cars-icon">
                <el-icon><Van /></el-icon>
              </div>
              <div class="card-info">
                <h3>{{ statistics.totalCars }}</h3>
                <p>注册车辆</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="overview-card">
            <div class="card-content">
              <div class="card-icon orders-icon">
                <el-icon><Document /></el-icon>
              </div>
              <div class="card-info">
                <h3>{{ statistics.totalMaintenanceItems }}</h3>
                <p>维修工单</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>    <!-- 快速操作 -->
    <div class="quick-actions">
      <h2>快速操作</h2>
      <!-- 第一行：基础管理 -->
      <el-row :gutter="20">
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/users')">
            <div class="action-content">
              <el-icon class="action-icon"><User /></el-icon>
              <h3>用户管理</h3>
              <p>查看和管理所有注册用户</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/repairmen')">
            <div class="action-content">
              <el-icon class="action-icon"><Tools /></el-icon>
              <h3>维修人员管理</h3>
              <p>查看和管理维修人员信息</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/cars')">
            <div class="action-content">
              <el-icon class="action-icon"><Van /></el-icon>
              <h3>车辆管理</h3>
              <p>查看系统中所有车辆信息</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 第二行：工单管理 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/maintenance-items')">
            <div class="action-content">
              <el-icon class="action-icon"><Document /></el-icon>
              <h3>工单管理</h3>
              <p>查看和管理维修工单</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/batch-submit')">
            <div class="action-content">
              <el-icon class="action-icon"><Plus /></el-icon>
              <h3>批量提交工单</h3>
              <p>一次性提交多个维修工单请求</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/maintenance-records')">
            <div class="action-content">
              <el-icon class="action-icon"><Memo /></el-icon>
              <h3>维修记录</h3>
              <p>查看所有维修记录和历史</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
      
      <!-- 第三行：资源与分析 -->
      <el-row :gutter="20" style="margin-top: 20px;">
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/materials')">
            <div class="action-content">
              <el-icon class="action-icon"><Box /></el-icon>
              <h3>材料库存</h3>
              <p>查看和管理材料库存</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/wages')">
            <div class="action-content">
              <el-icon class="action-icon"><Money /></el-icon>
              <h3>工资管理</h3>
              <p>查看维修人员工资发放记录</p>
            </div>
          </el-card>
        </el-col>
        <el-col :span="8">
          <el-card class="action-card" @click="navigateTo('/admin/statistics')">
            <div class="action-content">
              <el-icon class="action-icon"><DataAnalysis /></el-icon>
              <h3>数据统计</h3>
              <p>查看系统运营数据分析</p>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div><!-- 最近维修工单 -->
    <div class="recent-orders">
      <div class="section-header">
        <h2>最近维修工单</h2>
        <el-button type="primary" text @click="navigateTo('/admin/maintenance-items')">
          查看全部
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-table :data="recentMaintenanceItems" style="width: 100%">
        <el-table-column prop="itemId" label="工单ID" width="80" />
        <el-table-column prop="name" label="维修项目" />
        <el-table-column prop="car.licensePlate" label="车牌号" width="120" />
        <el-table-column prop="status" label="状态" width="120">
          <template #default="scope">
            <el-tag :type="getStatusType(scope.row.status)">
              {{ getStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="cost" label="费用" width="120">
          <template #default="scope">
            ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
          </template>
        </el-table-column>
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDateTime(scope.row.createTime) }}
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 最近维修记录 -->
    <div class="recent-records">
      <div class="section-header">
        <h2>最近维修记录</h2>
        <el-button type="primary" text @click="navigateTo('/admin/maintenance-records')">
          查看全部
          <el-icon class="ml-1"><ArrowRight /></el-icon>
        </el-button>
      </div>
      <el-table :data="recentMaintenanceRecords" style="width: 100%" v-loading="loadingRecords">
        <el-table-column prop="recordId" label="记录ID" width="80" />
        <el-table-column prop="name" label="维修项目" min-width="120" />
        <el-table-column prop="repairman.name" label="维修人员" width="100" />        <el-table-column prop="workHours" label="工时" width="80">
          <template #default="scope">
            {{ formatWorkMinutes(scope.row.workHours) }}
          </template>
        </el-table-column>
        <el-table-column prop="status" label="状态" width="100">
          <template #default="scope">
            <el-tag :type="getRecordStatusType(scope.row.status)">
              {{ getRecordStatusText(scope.row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="car.licensePlate" label="车牌号" width="120" />
        <el-table-column prop="startTime" label="开始时间" width="150">
          <template #default="scope">
            {{ formatDateTime(scope.row.startTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="scope">
            <el-button 
              type="primary" 
              text 
              size="small"
              @click="viewRecordDetail(scope.row)"
            >
              查看详情
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 维修记录详情对话框 -->
    <el-dialog
      v-model="showRecordDetail"
      title="维修记录详情"
      width="600px"
    >
      <div v-if="selectedRecord" class="record-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">
            {{ selectedRecord.recordId }}
          </el-descriptions-item>
          <el-descriptions-item label="维修项目">
            {{ selectedRecord.name }}
          </el-descriptions-item>
          <el-descriptions-item label="维修人员">
            {{ selectedRecord.repairman?.name }}
          </el-descriptions-item>
          <el-descriptions-item label="工种">
            {{ getRepairmanType(selectedRecord.repairman?.type) }}
          </el-descriptions-item>
          <el-descriptions-item label="车辆信息">
            {{ selectedRecord.car?.brand }} {{ selectedRecord.car?.model }}
          </el-descriptions-item>
          <el-descriptions-item label="车牌号">
            {{ selectedRecord.car?.licensePlate }}
          </el-descriptions-item>          <el-descriptions-item label="工时">
            {{ formatWorkMinutes(selectedRecord.workHours) }}
          </el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag :type="getRecordStatusType(selectedRecord.status)">
              {{ getRecordStatusText(selectedRecord.status) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="开始时间" :span="2">
            {{ formatDateTime(selectedRecord.startTime) }}
          </el-descriptions-item>
          <el-descriptions-item label="维修描述" :span="2">
            {{ selectedRecord.description || '无' }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { User, Tools, Van, Document, Money, DataAnalysis, Memo, Box, ArrowRight, Plus } from '@element-plus/icons-vue'
import api from '../../utils/api'
import { formatDateTime, formatWorkMinutes } from '../../utils/format'

const router = useRouter()

const statistics = reactive({
  totalUsers: 0,
  totalRepairmen: 0,
  totalCars: 0,
  totalMaintenanceItems: 0
})

const recentMaintenanceItems = ref([])
const recentMaintenanceRecords = ref([])
const loadingRecords = ref(false)
const showRecordDetail = ref(false)
const selectedRecord = ref(null)

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

const getRecordStatusType = (status) => {
  const statusMap = {
    'IN_PROGRESS': 'warning',
    'COMPLETED': 'success',
    'PAUSED': 'info'
  }
  return statusMap[status] || 'info'
}

const getRecordStatusText = (status) => {
  const statusMap = {
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'PAUSED': '暂停'
  }
  return statusMap[status] || status
}

const getRepairmanType = (type) => {
  const typeMap = {
    'MECHANIC': '机械师',
    'ELECTRICIAN': '电工',
    'SHEET_METAL': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒'
  }
  return typeMap[type] || type
}

const navigateTo = (path) => {
  router.push(path)
}

const viewRecordDetail = (record) => {
  selectedRecord.value = record
  showRecordDetail.value = true
}

const loadMaintenanceRecords = async () => {
  try {
    loadingRecords.value = true
    const response = await api.get('/api/admin/maintenance-records')
    if (response.data.success) {
      // 取最近的5条记录
      recentMaintenanceRecords.value = response.data.data.slice(0, 5)
    }
  } catch (error) {
    console.error('加载维修记录失败:', error)
    ElMessage.error('加载维修记录失败')
  } finally {
    loadingRecords.value = false
  }
}

const loadDashboardData = async () => {
  try {
    // 获取用户总数
    const usersResponse = await api.get('/api/admin/users')
    if (usersResponse.data.success) {
      statistics.totalUsers = usersResponse.data.count || usersResponse.data.data.length
    }

    // 获取维修人员总数
    const repairmenResponse = await api.get('/api/admin/repairmen')
    if (repairmenResponse.data.success) {
      statistics.totalRepairmen = repairmenResponse.data.count || repairmenResponse.data.data.length
    }

    // 获取车辆总数
    const carsResponse = await api.get('/api/admin/cars')
    if (carsResponse.data.success) {
      statistics.totalCars = carsResponse.data.count || carsResponse.data.data.length
    }

    // 获取维修工单总数和最近工单
    const maintenanceResponse = await api.get('/api/admin/maintenance-items')
    if (maintenanceResponse.data.success) {
      statistics.totalMaintenanceItems = maintenanceResponse.data.count || maintenanceResponse.data.data.length
      // 取最近的5条记录
      recentMaintenanceItems.value = maintenanceResponse.data.data.slice(0, 5)
    }

    // 加载维修记录
    await loadMaintenanceRecords()
  } catch (error) {
    console.error('加载仪表板数据失败:', error)
    ElMessage.error('加载数据失败')
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.dashboard-header {
  margin-bottom: 32px;
}

.dashboard-header h1 {
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.dashboard-header p {
  color: #7f8c8d;
  font-size: 16px;
}

.overview-cards {
  margin-bottom: 32px;
}

.overview-card {
  transition: transform 0.2s;
}

.overview-card:hover {
  transform: translateY(-2px);
}

.card-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.card-icon {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 24px;
  color: white;
}

.users-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.repairmen-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.cars-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.orders-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.card-info h3 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.card-info p {
  color: #7f8c8d;
  font-size: 14px;
}

.quick-actions {
  margin-bottom: 32px;
}

.quick-actions h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.action-card {
  cursor: pointer;
  transition: all 0.3s;
  height: 160px;
}

.action-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

.action-content {
  text-align: center;
  padding: 20px;
}

.action-icon {
  font-size: 32px;
  color: #409eff;
  margin-bottom: 12px;
}

.action-content h3 {
  font-size: 16px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 8px;
}

.action-content p {
  color: #7f8c8d;
  font-size: 12px;
  line-height: 1.4;
}

.recent-orders h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.recent-records {
  margin-top: 32px;
}

.recent-records h2 {
  font-size: 20px;
  font-weight: 600;
  color: #2c3e50;
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.section-header h2 {
  margin-bottom: 0;
}

.record-detail {
  padding: 16px 0;
}

.ml-1 {
  margin-left: 4px;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  background-color: white;
  border-radius: 8px;
}
</style>
