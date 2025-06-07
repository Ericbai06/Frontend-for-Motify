<template>
  <div class="maintenance-detail-page">
    <div class="card-container">
      <div class="detail-header">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>维修详情</h2>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="maintenanceDetail" class="detail-content">
        <!-- 基本信息 -->
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">维修项目：</span>
              <span class="value">{{ maintenanceDetail.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">状态：</span>
              <el-tag :type="STATUS_COLORS[maintenanceDetail.status]">
                {{ formatStatus(maintenanceDetail.status) }}
              </el-tag>
            </div>
            <div class="info-item">
              <span class="label">进度：</span>
              <div class="progress-container">
                <el-progress :percentage="maintenanceDetail.progress" :stroke-width="8" />
                <span class="progress-text">{{ maintenanceDetail.progress }}%</span>
              </div>
            </div>
            <div class="info-item">
              <span class="label">创建时间：</span>
              <span class="value">{{ formatDateTime(maintenanceDetail.createTime) }}</span>
            </div>
            <div v-if="maintenanceDetail.updateTime" class="info-item">
              <span class="label">更新时间：</span>
              <span class="value">{{ formatDateTime(maintenanceDetail.updateTime) }}</span>
            </div>
            <div v-if="maintenanceDetail.completeTime" class="info-item">
              <span class="label">完成时间：</span>
              <span class="value">{{ formatDateTime(maintenanceDetail.completeTime) }}</span>
            </div>
          </div>
        </div>

        <!-- 车辆信息 -->
        <div class="info-section">
          <h3>车辆信息</h3>
          <div class="car-info">
            <div class="car-icon">
              <el-icon size="32" color="#409eff"><Van /></el-icon>
            </div>
            <div class="car-details">
              <h4>{{ maintenanceDetail.car?.brand }} {{ maintenanceDetail.car?.model }}</h4>
              <p class="license-plate">{{ maintenanceDetail.car?.licensePlate }}</p>
            </div>
          </div>
        </div>

        <!-- 问题描述 -->
        <div class="info-section">
          <h3>问题描述</h3>
          <p class="description">{{ maintenanceDetail.description }}</p>
        </div>

        <!-- 维修结果 -->
        <div v-if="maintenanceDetail.result" class="info-section">
          <h3>维修结果</h3>
          <p class="result">{{ maintenanceDetail.result }}</p>
        </div>

        <!-- 催单信息 -->
        <div v-if="maintenanceDetail.reminder" class="info-section">
          <h3>催单信息</h3>
          <div class="reminder-box">
            <el-icon color="#e6a23c"><Warning /></el-icon>
            <span>{{ maintenanceDetail.reminder }}</span>
          </div>
        </div>

        <!-- 费用信息 -->
        <div v-if="maintenanceDetail.cost > 0" class="info-section">
          <h3>费用明细</h3>
          <div class="cost-breakdown">
            <div class="cost-item">
              <span class="label">材料费：</span>
              <span class="value">{{ formatCurrency(maintenanceDetail.materialCost || 0) }}</span>
            </div>
            <div class="cost-item">
              <span class="label">工时费：</span>
              <span class="value">{{ formatCurrency(maintenanceDetail.laborCost || 0) }}</span>
            </div>
            <div class="cost-item total">
              <span class="label">总费用：</span>
              <span class="value">{{ formatCurrency(maintenanceDetail.cost) }}</span>
            </div>
          </div>
        </div>

        <!-- 服务评分 -->
        <div v-if="maintenanceDetail.score" class="info-section">
          <h3>服务评分</h3>
          <div class="rating-display">
            <el-rate v-model="maintenanceDetail.score" disabled size="large" />
            <span class="rating-text">{{ getRatingText(maintenanceDetail.score) }}</span>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button 
            v-if="maintenanceDetail.status === 'IN_PROGRESS'" 
            type="warning" 
            @click="showRushDialog = true"
          >
            <el-icon><Bell /></el-icon>
            催单
          </el-button>
          
          <el-button 
            v-if="maintenanceDetail.status === 'COMPLETED' && !maintenanceDetail.score" 
            type="success" 
            @click="showRatingDialog = true"
          >
            <el-icon><Star /></el-icon>
            评分
          </el-button>
        </div>
      </div>

      <div v-else class="error-state">
        <el-result
          icon="error"
          title="加载失败"
          sub-title="无法获取维修详情信息"
        >
          <template #extra>
            <el-button type="primary" @click="loadMaintenanceDetail">重试</el-button>
          </template>
        </el-result>
      </div>
    </div>

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
        <el-button type="primary" :loading="submittingRating" @click="submitRating">
          提交评分
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency, formatStatus } from '../../utils/format'
import { STATUS_COLORS, RATING_LABELS } from '../../utils/constants'

const route = useRoute()
const authStore = useAuthStore()

const maintenanceDetail = ref(null)
const loading = ref(false)
const showRushDialog = ref(false)
const showRatingDialog = ref(false)
const submittingRush = ref(false)
const submittingRating = ref(false)

const rushFormRef = ref()

const rushForm = reactive({
  reminderMessage: ''
})

const ratingForm = reactive({
  score: 0
})

const rushRules = {
  reminderMessage: [
    { required: true, message: '请输入催单信息', trigger: 'blur' }
  ]
}

const loadMaintenanceDetail = async () => {
  try {
    loading.value = true
    const userId = authStore.user?.userId
    const itemId = route.params.id
    
    if (!userId || !itemId) return

    const response = await api.get(`/api/auth/users/${userId}/maintenance-records/${itemId}`)
    if (response.data.code === 200) {
      maintenanceDetail.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load maintenance detail:', error)
  } finally {
    loading.value = false
  }
}

const submitRush = async () => {
  if (!rushFormRef.value) return

  try {
    await rushFormRef.value.validate()
    submittingRush.value = true

    const userId = authStore.user?.userId
    const itemId = route.params.id
    const response = await api.post(
      `/api/auth/users/${userId}/maintenance-records/${itemId}/rush-order`,
      rushForm
    )

    if (response.data.code === 200) {
      ElMessage.success('催单提交成功')
      showRushDialog.value = false
      rushFormRef.value.resetFields()
      loadMaintenanceDetail()
    }
  } catch (error) {
    console.error('Failed to submit rush order:', error)
  } finally {
    submittingRush.value = false
  }
}

const submitRating = async () => {
  if (ratingForm.score === 0) {
    ElMessage.warning('请选择评分')
    return
  }

  try {
    submittingRating.value = true

    const userId = authStore.user?.userId
    const itemId = route.params.id
    const response = await api.post(
      `/api/auth/users/${userId}/maintenance-records/${itemId}/rating`,
      { score: ratingForm.score }
    )

    if (response.data.code === 200) {
      ElMessage.success('评分提交成功')
      showRatingDialog.value = false
      loadMaintenanceDetail()
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
  loadMaintenanceDetail()
})
</script>

<style scoped>
.maintenance-detail-page {
  max-width: 800px;
  margin: 0 auto;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-header h2 {
  margin: 0;
  color: #2c3e50;
}

.info-section {
  margin-bottom: 32px;
  padding-bottom: 24px;
  border-bottom: 1px solid #f0f2f5;
}

.info-section:last-child {
  border-bottom: none;
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-size: 18px;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.label {
  font-weight: 500;
  color: #909399;
  min-width: 80px;
}

.value {
  color: #606266;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.progress-text {
  font-weight: 500;
  color: #606266;
  min-width: 40px;
}

.car-info {
  display: flex;
  align-items: center;
  gap: 16px;
}

.car-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.car-details h4 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.license-plate {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.description, .result {
  color: #606266;
  line-height: 1.6;
  margin: 0;
}

.reminder-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef7e6;
  border: 1px solid #f4d03f;
  border-radius: 8px;
  color: #e6a23c;
}

.cost-breakdown {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
}

.cost-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
}

.cost-item.total {
  border-top: 1px solid #dee2e6;
  margin-top: 8px;
  padding-top: 16px;
  font-weight: 600;
  font-size: 16px;
}

.cost-item .value {
  color: #e6a23c;
  font-weight: 600;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 16px;
}

.rating-text {
  color: #606266;
  font-size: 16px;
}

.action-section {
  display: flex;
  gap: 12px;
  padding-top: 24px;
}

.error-state {
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

.rating-content .rating-text {
  margin-top: 12px;
  color: #606266;
  font-size: 14px;
}
</style>