<template>
  <div class="maintenance-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>维修记录</h2>
        <div class="header-actions">
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            clearable
            style="width: 150px; margin-right: 12px;"
            @change="loadMaintenanceRecords"
          >
            <el-option label="全部" value="" />
            <el-option label="待处理" value="PENDING" />
            <el-option label="已接收" value="ACCEPTED" />
            <el-option label="维修中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
            <el-option label="已取消" value="CANCELLED" />
          </el-select>
          <el-button type="primary" @click="showSubmitDialog = true">
            <el-icon><Plus /></el-icon>
            提交维修请求
          </el-button>
        </div>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="maintenanceRecords.length === 0" class="empty-state">
        <el-empty description="暂无维修记录">
          <el-button type="primary" @click="showSubmitDialog = true">
            提交第一个维修请求
          </el-button>
        </el-empty>
      </div>

      <div v-else class="maintenance-list">
        <div v-for="record in maintenanceRecords" :key="record.itemId" class="maintenance-card">
          <div class="maintenance-header">
            <div class="maintenance-title">
              <h3>{{ record.name }}</h3>
              <el-tag :type="STATUS_COLORS[record.status]" size="small">
                {{ formatStatus(record.status) }}
              </el-tag>
            </div>
            <div class="maintenance-meta">
              <span class="text-muted">{{ formatDateTime(record.createTime) }}</span>
            </div>
          </div>

          <div class="maintenance-content">
            <p class="description">{{ record.description }}</p>
            
            <div class="maintenance-details">
              <div class="detail-item">
                <span class="label">车辆：</span>
                <span>{{ record.car?.brand }} {{ record.car?.model }} ({{ record.car?.licensePlate }})</span>
              </div>
              
              <div class="detail-item">
                <span class="label">进度：</span>
                <el-progress :percentage="record.progress" :stroke-width="6" style="width: 200px;" />
              </div>
              
              <div v-if="record.cost > 0" class="detail-item">
                <span class="label">费用：</span>
                <span class="cost">{{ formatCurrency(record.cost) }}</span>
              </div>
              
              <div v-if="record.score" class="detail-item">
                <span class="label">评分：</span>
                <el-rate v-model="record.score" disabled size="small" />
              </div>
            </div>
          </div>

          <div class="maintenance-actions">
            <el-button text type="primary" @click="viewDetail(record)">
              查看详情
            </el-button>
            
            <el-button 
              v-if="record.status === 'IN_PROGRESS'" 
              text 
              type="warning" 
              @click="submitRushOrder(record)"
            >
              催单
            </el-button>
            
            <el-button 
              v-if="record.status === 'COMPLETED' && !record.score" 
              text 
              type="success" 
              @click="submitRating(record)"
            >
              评分
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 提交维修请求对话框 -->
    <el-dialog
      v-model="showSubmitDialog"
      title="提交维修请求"
      width="500px"
    >
      <el-form
        ref="submitFormRef"
        :model="submitForm"
        :rules="submitRules"
        label-width="100px"
      >
        <el-form-item label="选择车辆" prop="carId">
          <el-select
            v-model="submitForm.carId"
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
            v-model="submitForm.name"
            placeholder="请输入维修项目名称"
          />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="submitForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述车辆问题"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showSubmitDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRequest">
          提交
        </el-button>
      </template>
    </el-dialog>

    <!-- 催单对话框 -->
    <el-dialog
      v-model="showRushDialog"
      title="提交催单"
      width="400px"
    >
      <el-form
        ref="rushFormRef"
        :model="rushForm"
        :rules="rushRules"
        label-width="100px"
      >
        <el-form-item label="催单信息" prop="reminderMessage">
          <el-input
            v-model="rushForm.reminderMessage"
            type="textarea"
            :rows="3"
            placeholder="请输入催单信息"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRushDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingRush" @click="submitRush">
          提交催单
        </el-button>
      </template>
    </el-dialog>

    <!-- 评分对话框 -->
    <el-dialog
      v-model="showRatingDialog"
      title="服务评分"
      width="400px"
    >
      <div class="rating-content">
        <p>请为本次维修服务评分：</p>
        <div class="rating-section">
          <el-rate v-model="ratingForm.score" size="large" />
          <p class="rating-text">{{ getRatingText(ratingForm.score) }}</p>
        </div>
      </div>
      
      <template #footer>
        <el-button @click="showRatingDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingRating" @click="submitRatingRequest">
          提交评分
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency, formatStatus } from '../../utils/format'
import { STATUS_COLORS, RATING_LABELS } from '../../utils/constants'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const maintenanceRecords = ref([])
const cars = ref([])
const loading = ref(false)
const statusFilter = ref('')
const showSubmitDialog = ref(false)
const showRushDialog = ref(false)
const showRatingDialog = ref(false)
const submitting = ref(false)
const submittingRush = ref(false)
const submittingRating = ref(false)
const selectedRecord = ref(null)

const submitFormRef = ref()
const rushFormRef = ref()

const submitForm = reactive({
  carId: '',
  name: '',
  description: ''
})

const rushForm = reactive({
  reminderMessage: ''
})

const ratingForm = reactive({
  score: 0
})

const submitRules = {
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

const rushRules = {
  reminderMessage: [
    { required: true, message: '请输入催单信息', trigger: 'blur' }
  ]
}

const loadMaintenanceRecords = async () => {
  try {
    loading.value = true
    const userId = authStore.user?.userId
    if (!userId) return

    const response = await api.get(`/api/auth/users/${userId}/maintenance-records`)
    if (response.data.code === 200) {
      let records = response.data.data
      
      // 根据状态筛选
      if (statusFilter.value) {
        records = records.filter(record => record.status === statusFilter.value)
      }
      
      // 根据路由查询参数筛选车辆
      if (route.query.carId) {
        records = records.filter(record => record.car?.carId == route.query.carId)
      }
      
      maintenanceRecords.value = records.sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      )
    }
  } catch (error) {
    console.error('Failed to load maintenance records:', error)
  } finally {
    loading.value = false
  }
}

const loadCars = async () => {
  try {
    const userId = authStore.user?.userId
    if (!userId) return

    const response = await api.get(`/api/auth/users/${userId}/cars`)
    if (response.data.code === 200) {
      cars.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load cars:', error)
  }
}

const viewDetail = (record) => {
  router.push(`/user/maintenance/${record.itemId}`)
}

const submitRequest = async () => {
  if (!submitFormRef.value) return

  try {
    await submitFormRef.value.validate()
    submitting.value = true

    const userId = authStore.user?.userId
    const response = await api.post(`/api/auth/users/${userId}/maintenance-records`, submitForm)

    if (response.data.code === 200) {
      ElMessage.success('维修请求提交成功')
      showSubmitDialog.value = false
      submitFormRef.value.resetFields()
      loadMaintenanceRecords()
    }
  } catch (error) {
    console.error('Failed to submit request:', error)
  } finally {
    submitting.value = false
  }
}

const submitRushOrder = (record) => {
  selectedRecord.value = record
  showRushDialog.value = true
}

const submitRush = async () => {
  if (!rushFormRef.value) return

  try {
    await rushFormRef.value.validate()
    submittingRush.value = true

    const userId = authStore.user?.userId
    const itemId = selectedRecord.value.itemId
    const response = await api.post(
      `/api/auth/users/${userId}/maintenance-records/${itemId}/rush-order`,
      rushForm
    )

    if (response.data.code === 200) {
      ElMessage.success('催单提交成功')
      showRushDialog.value = false
      rushFormRef.value.resetFields()
      loadMaintenanceRecords()
    }
  } catch (error) {
    console.error('Failed to submit rush order:', error)
  } finally {
    submittingRush.value = false
  }
}

const submitRating = (record) => {
  selectedRecord.value = record
  ratingForm.score = 0
  showRatingDialog.value = true
}

const submitRatingRequest = async () => {
  if (ratingForm.score === 0) {
    ElMessage.warning('请选择评分')
    return
  }

  try {
    submittingRating.value = true

    const userId = authStore.user?.userId
    const itemId = selectedRecord.value.itemId
    const response = await api.post(
      `/api/auth/users/${userId}/maintenance-records/${itemId}/rating`,
      { score: ratingForm.score }
    )

    if (response.data.code === 200) {
      ElMessage.success('评分提交成功')
      showRatingDialog.value = false
      loadMaintenanceRecords()
    }
  } catch (error) {
    console.error('Failed to submit rating:', error)
  } finally {
    submittingRating.value = false
  }
}

const getRatingText = (score) => {
  return RATING_LABELS[score] || '请评分'
}

onMounted(() => {
  loadMaintenanceRecords()
  loadCars()
})
</script>

<style scoped>
.maintenance-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
}

.maintenance-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.maintenance-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.maintenance-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.maintenance-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.maintenance-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.maintenance-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.maintenance-meta {
  color: #7f8c8d;
  font-size: 14px;
}

.maintenance-content {
  margin-bottom: 20px;
}

.description {
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.6;
}

.maintenance-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #909399;
  min-width: 60px;
}

.cost {
  font-weight: 600;
  color: #e6a23c;
  font-size: 16px;
}

.maintenance-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.rating-content {
  text-align: center;
  padding: 20px 0;
}

.rating-section {
  margin: 20px 0;
}

.rating-text {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
}
</style>