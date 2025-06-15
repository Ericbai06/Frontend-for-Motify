<template>
  <div class="batch-submit-container">
    <div class="page-header">
      <h1>批量提交工单</h1>
      <p>一次性为您的车辆提交多个维修工单请求</p>
    </div>

    <!-- 工单列表 -->
    <div class="orders-section">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>工单列表</span>
            <div class="header-actions">
              <el-button type="primary" @click="addOrder">
                <el-icon><Plus /></el-icon>
                添加工单
              </el-button>
              <el-button 
                type="success" 
                :disabled="orders.length === 0 || isSubmitting"
                @click="submitBatchOrders"
                :loading="isSubmitting"
              >
                <el-icon><Check /></el-icon>
                批量提交 ({{ orders.length }})
              </el-button>
            </div>
          </div>
        </template>

        <div v-if="orders.length === 0" class="empty-state">
          <el-empty description="暂无工单，点击上方按钮添加工单" />
        </div>

        <div v-else class="orders-list">
          <el-card 
            v-for="(order, index) in orders" 
            :key="index" 
            class="order-card"
            shadow="hover"
          >
            <template #header>
              <div class="order-header">
                <span>工单 #{{ index + 1 }}</span>
                <el-button 
                  type="danger" 
                  size="small" 
                  @click="removeOrder(index)"
                  :icon="Delete"
                >
                  删除
                </el-button>
              </div>
            </template>            <el-form :model="order" label-width="120px" class="order-form">
              <el-form-item label="选择车辆" required>
                <el-select 
                  v-model="order.carId" 
                  placeholder="选择您的车辆"
                  style="width: 100%"
                >
                  <el-option
                    v-for="car in userCars"
                    :key="car.carId"
                    :label="`${car.brand} ${car.model} (${car.licensePlate})`"
                    :value="car.carId"
                  />
                </el-select>
              </el-form-item>

              <el-form-item label="工单名称" required>
                <el-input v-model="order.name" placeholder="请输入工单名称" />
              </el-form-item>

              <el-form-item label="问题描述" required>
                <el-input 
                  v-model="order.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="请详细描述需要维修的问题"
                />
              </el-form-item>

              <el-form-item label="需要的工种">
                <div class="required-types">
                  <el-row :gutter="20">
                    <el-col 
                      v-for="type in repairmanTypes" 
                      :key="type.value" 
                      :span="8"
                    >
                      <div class="type-item">
                        <span class="type-label">{{ type.label }}：</span>
                        <el-input-number 
                          v-model="order.requiredTypes[type.value]"
                          :min="0"
                          :max="5"
                          size="small"
                          style="width: 80px"
                        />
                      </div>
                    </el-col>
                  </el-row>
                  <div class="type-hint">
                    <el-text type="info" size="small">
                      <el-icon><InfoFilled /></el-icon>
                      请根据维修需求选择相应的工种数量，如不确定可留空，系统会自动分配
                    </el-text>
                  </div>
                </div>
              </el-form-item>
            </el-form>
          </el-card>
        </div>
      </el-card>
    </div>

    <!-- 提交结果展示 -->
    <el-dialog
      v-model="showResultDialog"
      title="批量提交结果"
      width="80%"
      :close-on-click-modal="false"
    >
      <div v-if="submitResult">
        <el-alert
          :title="`成功提交 ${submitResult.length} 个工单`"
          type="success"
          show-icon
          :closable="false"
          style="margin-bottom: 20px"
        />
        
        <el-table :data="submitResult" border>
          <el-table-column prop="itemId" label="工单ID" width="80" />
          <el-table-column prop="name" label="工单名称" />
          <el-table-column prop="status" label="状态" width="100">
            <template #default="scope">
              <el-tag :type="getStatusType(scope.row.status)">
                {{ getStatusLabel(scope.row.status) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="车辆信息" width="200">
            <template #default="scope">
              {{ scope.row.car.brand }} {{ scope.row.car.model }}<br>
              <small>{{ scope.row.car.licensePlate }}</small>
            </template>
          </el-table-column>
          <el-table-column prop="createTime" label="创建时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.createTime) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="scope">
              <el-button 
                type="primary" 
                size="small"
                @click="viewOrderDetail(scope.row.itemId)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </div>
      
      <template #footer>
        <el-button @click="showResultDialog = false">关闭</el-button>
        <el-button type="primary" @click="resetForm">继续添加</el-button>
        <el-button type="success" @click="goToMaintenanceList">查看我的工单</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Check, InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { userBatchSubmitRepairOrders, getUserCars as fetchUserCars } from '../../utils/api'
import { REPAIRMAN_TYPES, ORDER_STATUS_MAP } from '../../utils/constants'
import { formatDateTime } from '../../utils/format'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const orders = ref([])
const userCars = ref([])
const isSubmitting = ref(false)
const showResultDialog = ref(false)
const submitResult = ref(null)

// 常量
const repairmanTypes = REPAIRMAN_TYPES

// 初始化空工单
const createEmptyOrder = () => ({
  carId: null,
  name: '',
  description: '',
  requiredTypes: {
    MECHANIC: 0,
    ELECTRICIAN: 0,
    PAINTER: 0,
    WELDER: 0,
    SHEET_METAL: 0,
    APPRENTICE: 0,
    INSPECTOR: 0,
    DIAGNOSER: 0
  }
})

// 添加工单
const addOrder = () => {
  orders.value.push(createEmptyOrder())
}

// 删除工单
const removeOrder = (index) => {
  orders.value.splice(index, 1)
}

// 获取用户车辆
const fetchUserCarList = async () => {
  try {
    const userId = authStore.user?.userId
    if (!userId) {
      ElMessage.error('用户信息获取失败，请重新登录')
      return
    }

    const response = await fetchUserCars(userId)
    if (response.data.code === 200) {
      userCars.value = response.data.data
    } else {
      ElMessage.error('获取车辆列表失败')
    }
  } catch (error) {
    console.error('获取车辆列表失败:', error)
    ElMessage.error('获取车辆列表失败')
  }
}

// 验证工单数据
const validateOrders = () => {
  const userId = authStore.user?.userId
  if (!userId) {
    ElMessage.error('用户信息获取失败，请重新登录')
    return false
  }

  for (let i = 0; i < orders.value.length; i++) {
    const order = orders.value[i]
    if (!order.carId) {
      ElMessage.error(`工单 #${i + 1}: 请选择车辆`)
      return false
    }
    if (!order.name.trim()) {
      ElMessage.error(`工单 #${i + 1}: 请输入工单名称`)
      return false
    }
    if (!order.description.trim()) {
      ElMessage.error(`工单 #${i + 1}: 请输入问题描述`)
      return false
    }
  }
  return true
}

// 批量提交工单
const submitBatchOrders = async () => {
  if (!validateOrders()) return

  try {
    await ElMessageBox.confirm(
      `确定要提交 ${orders.value.length} 个工单吗？`,
      '确认提交',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning',
      }
    )

    isSubmitting.value = true
    const userId = authStore.user?.userId

    // 处理提交数据，过滤掉数量为0的工种，并添加userId
    const submitData = orders.value.map(order => ({
      userId: userId,
      carId: order.carId,
      name: order.name,
      description: order.description,
      requiredTypes: Object.fromEntries(
        Object.entries(order.requiredTypes).filter(([key, value]) => value > 0)
      )
    }))

    const response = await userBatchSubmitRepairOrders(submitData)
    
    if (response.data.code === 200) {
      submitResult.value = response.data.data
      showResultDialog.value = true
      ElMessage.success(`成功提交 ${response.data.data.length} 个工单`)
    } else {
      ElMessage.error(response.data.message || '提交失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败：' + (error.response?.data?.message || error.message))
    }
  } finally {
    isSubmitting.value = false
  }
}

// 重置表单
const resetForm = () => {
  orders.value = []
  showResultDialog.value = false
  submitResult.value = null
  // 默认添加一个空工单
  addOrder()
}

// 查看工单详情
const viewOrderDetail = (itemId) => {
  router.push(`/user/maintenance/${itemId}`)
}

// 跳转到我的工单列表
const goToMaintenanceList = () => {
  router.push('/user/maintenance')
}

// 获取状态标签
const getStatusLabel = (status) => {
  return ORDER_STATUS_MAP[status] || status
}

// 获取状态类型
const getStatusType = (status) => {
  const typeMap = {
    PENDING: 'warning',
    IN_PROGRESS: 'primary',
    COMPLETED: 'success',
    CANCELLED: 'danger'
  }
  return typeMap[status] || 'info'
}

// 组件挂载时获取数据
onMounted(() => {
  fetchUserCarList()
  // 默认添加一个空工单
  addOrder()
})
</script>

<style scoped>
.batch-submit-container {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.page-header {
  margin-bottom: 24px;
  text-align: center;
}

.page-header h1 {
  margin: 0 0 8px 0;
  color: #303133;
  font-size: 28px;
  font-weight: 600;
}

.page-header p {
  margin: 0;
  color: #606266;
  font-size: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-actions {
  display: flex;
  gap: 12px;
}

.empty-state {
  padding: 60px 0;
  text-align: center;
}

.orders-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.order-card {
  border: 1px solid #e4e7ed;
  border-radius: 8px;
  transition: all 0.3s;
}

.order-card:hover {
  border-color: #409eff;
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-weight: 600;
  color: #303133;
}

.order-form {
  margin-top: 16px;
}

.required-types {
  background-color: #f8f9fa;
  padding: 16px;
  border-radius: 6px;
  border: 1px solid #e9ecef;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.type-item:last-child {
  margin-bottom: 0;
}

.type-label {
  font-size: 14px;
  color: #606266;
  min-width: 80px;
}

.type-hint {
  margin-top: 12px;
  padding-top: 12px;
  border-top: 1px solid #e9ecef;
}

:deep(.el-form-item) {
  margin-bottom: 18px;
}

:deep(.el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid #e4e7ed;
  background-color: #fafafa;
}

:deep(.el-card__body) {
  padding: 20px;
}

:deep(.el-table) {
  margin-top: 16px;
}

.orders-section {
  margin-bottom: 24px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .batch-submit-container {
    padding: 12px;
  }
  
  .header-actions {
    flex-direction: column;
    gap: 8px;
  }
  
  .type-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}
</style>
