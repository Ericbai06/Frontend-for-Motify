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
              </el-form-item>              <el-form-item label="问题描述" required>
                <el-input 
                  v-model="order.description" 
                  type="textarea" 
                  :rows="3"
                  placeholder="请详细描述需要维修的问题"
                />
              </el-form-item>
            </el-form>
          </el-card>        </div>
      </el-card>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Delete, Check, InfoFilled } from '@element-plus/icons-vue'
import { useAuthStore } from '../../stores/auth'
import { userSubmitRepairOrder, getUserCars as fetchUserCars } from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

// 响应式数据
const orders = ref([])
const userCars = ref([])
const isSubmitting = ref(false)

// 初始化空工单
const createEmptyOrder = () => ({
  carId: null,
  name: '',
  description: ''
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
    const successResults = []
    const failedResults = []

    // 逐个提交工单
    for (let i = 0; i < orders.value.length; i++) {
      const order = orders.value[i]
      try {
        const submitData = {
          carId: order.carId,
          name: order.name,
          description: order.description
        }

        const response = await userSubmitRepairOrder(userId, submitData)
        
        if (response.data.code === 200) {
          successResults.push({
            ...response.data.data,
            originalOrder: order,
            index: i + 1
          })
        } else {
          failedResults.push({
            order: order,
            index: i + 1,
            error: response.data.message || '提交失败'
          })
        }
      } catch (error) {
        failedResults.push({
          order: order,
          index: i + 1,
          error: error.response?.data?.message || error.message || '提交失败'
        })
      }
    }    // 显示结果
    if (successResults.length > 0) {
      if (failedResults.length === 0) {
        ElMessage.success(`成功提交 ${successResults.length} 个工单！`)
        // 2秒后自动跳转到工单列表
        setTimeout(() => {
          router.push('/user/maintenance')
        }, 2000)
      } else {
        ElMessage.warning(`成功提交 ${successResults.length} 个工单，${failedResults.length} 个工单提交失败`)
        console.error('提交失败的工单:', failedResults)
      }
      
      // 清空表单
      orders.value = []
      addOrder() // 添加一个新的空工单
    } else {
      ElMessage.error('所有工单提交失败')
    }

  } catch (error) {
    if (error !== 'cancel') {
      ElMessage.error('提交失败：' + (error.response?.data?.message || error.message))
    }
  } finally {
    isSubmitting.value = false
  }
}

// 跳转到我的工单列表
const goToMaintenanceList = () => {
  router.push('/user/maintenance')
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
}
</style>
