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

        <!-- 维修人员信息 -->
        <div v-if="maintenanceDetail.repairmen && maintenanceDetail.repairmen.length > 0" class="info-section">
          <h3>维修人员</h3>
          <div class="repairmen-list">
            <div v-for="repairman in maintenanceDetail.repairmen" :key="repairman.repairmanId" class="repairman-item">
              <el-avatar :size="40" icon="UserFilled" />
              <div class="repairman-info">
                <div class="repairman-name">{{ repairman.name }}</div>
                <div class="repairman-type">{{ formatRepairmanType(repairman.type) }}</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 多工种需求信息 -->
        <div v-if="maintenanceDetail.requiredTypes && maintenanceDetail.requiredTypes.length > 0" class="info-section">
          <h3>多工种协作</h3>
          <div class="required-types">
            <el-tag 
              v-for="type in maintenanceDetail.requiredTypes" 
              :key="type.id"
              type="info"
              style="margin-right: 8px; margin-bottom: 8px;"
            >
              {{ formatRepairmanType(type.type) }}: 需要{{ type.required }}人 (已分配{{ type.assigned }}人)
            </el-tag>
          </div>
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
            v-if="maintenanceDetail.status !== 'COMPLETED' && maintenanceDetail.status !== 'CANCELLED'" 
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
import api, { submitRushOrder as apiSubmitRushOrder, submitRating as apiSubmitRating } from '../../utils/api'
import { formatDateTime, formatCurrency, formatStatus } from '../../utils/format'
import { STATUS_COLORS, RATING_LABELS, REPAIRMAN_TYPE_MAP } from '../../utils/constants'

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

const getRatingText = (score) => {
  if (!score) return ''
  const text = RATING_LABELS[Math.floor(score)] || '未评分'
  return text
}

// 提交催单
const submitRush = async () => {
  if (!rushFormRef.value) return

  await rushFormRef.value.validate(async (valid) => {
    if (!valid) return

    try {
      submittingRush.value = true
      const userId = authStore.user?.userId
      const itemId = route.params.id
      
      const response = await apiSubmitRushOrder(userId, itemId, rushForm.reminderMessage)
      
      if (response.data.code === 200) {
        ElMessage.success('催单提交成功')
        showRushDialog.value = false
        
        // 更新维修详情数据
        maintenanceDetail.value.reminder = rushForm.reminderMessage
        maintenanceDetail.value.updateTime = response.data.data.updateTime
        
        // 重置表单
        rushForm.reminderMessage = ''
      } else {
        ElMessage.error(response.data.message || '催单提交失败')
      }
    } catch (error) {
      console.error('Failed to submit rush order:', error)
      ElMessage.error(error.response?.data?.message || '催单提交失败，请稍后重试')
    } finally {
      submittingRush.value = false
    }
  })
}

// 提交评分
const submitRating = async () => {
  if (ratingForm.score === 0) {
    ElMessage.warning('请选择评分')
    return
  }

  try {
    submittingRating.value = true
    const userId = authStore.user?.userId
    const itemId = route.params.id
    
    const response = await apiSubmitRating(userId, itemId, ratingForm.score)
    
    if (response.data.code === 200) {
      ElMessage.success('评分提交成功')
      showRatingDialog.value = false
      
      // 更新维修详情数据
      maintenanceDetail.value.score = ratingForm.score
      maintenanceDetail.value.updateTime = response.data.data.updateTime
      
      // 重置表单
      ratingForm.score = 0
    } else {
      ElMessage.error(response.data.message || '评分提交失败')
    }
  } catch (error) {
    console.error('Failed to submit rating:', error)
    ElMessage.error(error.response?.data?.message || '评分提交失败，请稍后重试')
  } finally {
    submittingRating.value = false
  }
}

// 格式化维修人员工种
const formatRepairmanType = (type) => {
  return REPAIRMAN_TYPE_MAP[type] || type
}

onMounted(() => {
  loadMaintenanceDetail()
})
</script>

<style scoped>
.maintenance-detail-page {
  padding: 20px;
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.detail-header h2 {
  margin: 0;
  flex-grow: 1;
}

.detail-content {
  padding: 8px;
}

.info-section {
  margin-bottom: 24px;
}

.info-section h3 {
  font-size: 16px;
  margin-bottom: 12px;
  color: #303133;
  border-bottom: 1px solid #ebeef5;
  padding-bottom: 8px;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.info-item {
  margin-bottom: 8px;
}

.info-item .label {
  color: #606266;
  font-weight: 500;
  margin-right: 8px;
}

.progress-container {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-text {
  font-size: 14px;
  color: #606266;
}

.car-info {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
}

.car-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 50px;
  height: 50px;
  background: #e6f1fc;
  border-radius: 50%;
}

.car-details h4 {
  margin: 0 0 4px 0;
  font-size: 16px;
}

.license-plate {
  margin: 0;
  font-size: 14px;
  color: #606266;
}

.description, .result {
  line-height: 1.6;
  color: #303133;
}

.reminder-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background-color: #fdf6ec;
  border-radius: 4px;
  color: #e6a23c;
}

.cost-breakdown {
  background-color: #f5f7fa;
  padding: 16px;
  border-radius: 8px;
}

.cost-item {
  margin-bottom: 8px;
  display: flex;
  justify-content: space-between;
}

.cost-item.total {
  border-top: 1px solid #ebeef5;
  padding-top: 8px;
  margin-top: 8px;
  font-weight: bold;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 12px;
}

.rating-text {
  font-size: 16px;
  color: #606266;
}

.action-section {
  margin-top: 32px;
  display: flex;
  gap: 16px;
}

.rating-content {
  text-align: center;
  padding: 16px 0;
}

.rating-section {
  margin: 16px 0;
}

.error-state {
  padding: 32px 0;
}

/* 维修人员列表样式 */
.repairmen-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.repairman-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background-color: #f5f7fa;
  border-radius: 8px;
  min-width: 180px;
}

.repairman-info {
  display: flex;
  flex-direction: column;
}

.repairman-name {
  font-weight: 500;
  color: #303133;
}

.repairman-type {
  font-size: 12px;
  color: #606266;
}

/* 工种标签样式 */
.required-types {
  display: flex;
  flex-wrap: wrap;
}
</style>