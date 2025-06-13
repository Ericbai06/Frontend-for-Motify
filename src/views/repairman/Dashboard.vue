<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><List /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalWorkOrders }}</h3>
          <p>总工单数</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.pendingWorkOrders }}</h3>
          <p>待处理</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><Clock /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.inProgressWorkOrders }}</h3>
          <p>进行中</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.completedWorkOrders }}</h3>
          <p>已完成</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><Money /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.totalIncome) }}</h3>
          <p>总收入</p>
        </div>
      </div>
    </div>

    <!-- 个人信息 -->
    <div class="card-container">
      <h2>个人信息</h2>
      <div class="personal-info">
        <div class="info-item">
          <span class="label">姓名：</span>
          <span>{{ authStore.user?.name }}</span>
        </div>
        <div class="info-item">
          <span class="label">工种：</span>
          <el-tag type="info">{{ formatRepairmanType(repairmanInfo?.type) }}</el-tag>
        </div>
        <div class="info-item">
          <span class="label">时薪：</span>
          <span class="hourly-rate">{{ formatCurrency(repairmanInfo?.hourlyRate || 0) }}/小时</span>
        </div>
        <div class="info-item">
          <span class="label">手机：</span>
          <span>{{ repairmanInfo?.phone }}</span>
        </div>
        <div class="info-item">
          <span class="label">邮箱：</span>
          <span>{{ repairmanInfo?.email }}</span>
        </div>
      </div>
    </div>

    <!-- 当前工作 -->
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>进行中的工作</h2>
        <el-button text @click="$router.push('/repairman/current-work')">
          查看全部 <el-icon><ArrowRight /></el-icon>
        </el-button>
      </div>
      
      <div v-if="currentWork.length === 0" class="empty-state">
        <el-empty description="暂无进行中的工作" />
      </div>
      
      <div v-else class="work-list">
        <div v-for="work in currentWork" :key="work.itemId" class="work-card">
          <div class="work-header">
            <h4>{{ work.name }}</h4>
            <el-tag :type="STATUS_COLORS[work.status]" size="small">
              {{ formatStatus(work.status) }}
            </el-tag>
          </div>
          <p class="work-description">{{ work.description }}</p>
          <div class="work-progress">
            <span class="progress-label">进度：</span>
            <el-progress :percentage="work.progress" :stroke-width="6" />
          </div>
          <div class="work-meta">
            <span class="text-muted">{{ formatDateTime(work.createTime) }}</span>
            <el-button text type="primary" @click="updateProgress(work)">
              更新进度
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 更新进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="更新工作进度"
      width="500px"
    >
      <el-form
        ref="progressFormRef"
        :model="progressForm"
        :rules="progressRules"
        label-width="100px"
      >
        <el-form-item label="当前进度" prop="progress">
          <el-slider
            v-model="progressForm.progress"
            :min="0"
            :max="100"
            show-input
            :format-tooltip="(val) => `${val}%`"
          />
        </el-form-item>
        <el-form-item label="进度说明" prop="description">
          <el-input
            v-model="progressForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入进度说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showProgressDialog = false">取消</el-button>
        <el-button type="primary" :loading="updatingProgress" @click="submitProgress">
          更新
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
import { formatDateTime, formatCurrency, formatStatus, formatRepairmanType } from '../../utils/format'
import { STATUS_COLORS } from '../../utils/constants'

const authStore = useAuthStore()

const stats = reactive({
  totalWorkOrders: 0,
  pendingWorkOrders: 0,
  inProgressWorkOrders: 0,
  completedWorkOrders: 0,
  totalIncome: 0
})

const repairmanInfo = ref(null)
const currentWork = ref([])
const showProgressDialog = ref(false)
const updatingProgress = ref(false)
const selectedWork = ref(null)

const progressFormRef = ref()
const progressForm = reactive({
  progress: 0,
  description: ''
})

const progressRules = {
  progress: [
    { required: true, message: '请设置进度', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入进度说明', trigger: 'blur' }
  ]
}

const loadDashboardData = async () => {
  try {
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    // 加载维修人员信息
    const infoResponse = await api.post('/api/repairman/info', { repairmanId })
    if (infoResponse.data.code === 200) {
      repairmanInfo.value = infoResponse.data.data
    }

    // 加载当前工作（所有未完成的工单）
    const currentResponse = await api.post('/api/repairman/current-records', { repairmanId })
    if (currentResponse.data.code === 200) {
      const allCurrentWork = currentResponse.data.data
      
      // 分别统计待处理和进行中的工单
      stats.pendingWorkOrders = allCurrentWork.filter(work => work.status === 'PENDING').length
      stats.inProgressWorkOrders = allCurrentWork.filter(work => work.status === 'IN_PROGRESS').length
      
      // 只显示进行中的工作（前3个）
      const inProgressWork = allCurrentWork.filter(work => work.status === 'IN_PROGRESS')
      currentWork.value = inProgressWork.slice(0, 3)
    }

    // 加载已完成工作
    const completedResponse = await api.post('/api/repairman/completed-records', { repairmanId })
    if (completedResponse.data.code === 200) {
      stats.completedWorkOrders = completedResponse.data.data.length
    }

    // 加载收入统计
    const incomeResponse = await api.get(`/api/repairman/${repairmanId}/income`)
    if (incomeResponse.data.code === 200) {
      const incomeData = incomeResponse.data.data
      stats.totalIncome = incomeData.totalIncome || 0
    }

    // 计算总工单数：待处理 + 进行中 + 已完成
    stats.totalWorkOrders = stats.pendingWorkOrders + stats.inProgressWorkOrders + stats.completedWorkOrders
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

const updateProgress = (work) => {
  selectedWork.value = work
  progressForm.progress = work.progress
  progressForm.description = ''
  showProgressDialog.value = true
}

const submitProgress = async () => {
  if (!progressFormRef.value) return

  try {
    await progressFormRef.value.validate()
    updatingProgress.value = true

    const repairmanId = authStore.user?.repairmanId
    const itemId = selectedWork.value.itemId
    
    const response = await api.put(
      `/api/repairman/${repairmanId}/maintenance-items/${itemId}/progress`,
      progressForm
    )

    if (response.data.code === 200) {
      ElMessage.success('进度更新成功')
      showProgressDialog.value = false
      loadDashboardData()
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
  } finally {
    updatingProgress.value = false
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
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
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

.personal-info {
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
  min-width: 60px;
}

.hourly-rate {
  color: #27ae60;
  font-weight: 600;
}

.work-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  border-left: 4px solid #27ae60;
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.work-header h4 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.work-description {
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.5;
}

.work-progress {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.progress-label {
  font-weight: 500;
  color: #909399;
  min-width: 50px;
}

.work-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
}
</style>