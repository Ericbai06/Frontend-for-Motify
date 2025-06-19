<template>
  <div class="work-orders-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>工单管理</h2>
        <div class="filters">
          <el-select
            v-model="statusFilter"
            placeholder="筛选状态"
            clearable
            style="width: 180px; margin-right: 12px;"
            @change="handleStatusFilterChange"
          >
            <el-option label="全部" value="" />
            <el-option label="待处理" value="PENDING" />
            <el-option label="已拒绝" value="CANCELLED" />
            <el-option label="维修中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </div>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="workOrders.length === 0" class="empty-state">
        <el-empty description="暂无工单" />
      </div>

      <div v-else class="work-orders-list">
        <div 
          v-for="order in workOrders" 
          :key="order.itemId" 
          class="work-order-card"
          :data-status="order.status"
        >
          <div class="order-header">
            <div class="order-title">
              <h3>{{ order.name }}</h3>
              <el-tag :type="STATUS_COLORS[order.status]" size="small">
                {{ formatStatus(order.status) }} [{{ order.status }}]
              </el-tag>
            </div>
            <div class="order-meta">
              <span class="text-muted">{{ formatDateTime(order.createTime) }}</span>
            </div>
          </div>

          <div class="order-content">
            <p class="description">{{ order.description }}</p>
            
            <div class="order-details">
              <div class="detail-item">
                <span class="label">车辆：</span>
                <span>{{ order.car?.brand }} {{ order.car?.model }} ({{ order.car?.licensePlate }})</span>
              </div>
              
              <!-- 根据工单状态显示不同信息 -->
              <div v-if="order.status === 'CANCELLED'" class="detail-item">
                <span class="label">拒绝时间：</span>
                <span>{{ formatDateTime(order.updateTime || order.createTime) }}</span>
              </div>
              
              <div v-if="order.status === 'CANCELLED' && order.rejectionReason" class="detail-item">
                <span class="label">拒绝原因：</span>
                <span class="rejection-reason">{{ order.rejectionReason }}</span>
              </div>
              
              <div v-if="order.status !== 'CANCELLED'" class="detail-item">
                <span class="label">进度：</span>
                <el-progress :percentage="order.progress" :stroke-width="6" style="width: 200px;" />
              </div>
              
              <div v-if="order.cost > 0" class="detail-item">
                <span class="label">费用：</span>
                <span class="cost">{{ formatCurrency(order.cost) }}</span>
              </div>
              
              <!-- 显示工单所需工种信息 -->
              <div v-if="order.requiredTypes && order.requiredTypes.length > 0" class="detail-item">
                <span class="label">所需工种：</span>
                <div class="required-types">
                  <el-tag 
                    v-for="type in order.requiredTypes" 
                    :key="type.id"
                    type="info"
                    style="margin-right: 8px;"
                  >
                    {{ formatRepairmanType(type.type) }} x {{ type.required }}
                    (已分配 {{ type.assigned }})
                  </el-tag>
                </div>
              </div>
              
              <!-- 显示已分配维修人员 -->
              <div v-if="order.repairmen && order.repairmen.length > 0" class="detail-item">
                <span class="label">协作人员：</span>
                <div class="assigned-repairmen">
                  <el-tag 
                    v-for="repairman in order.repairmen" 
                    :key="repairman.repairmanId"
                    :type="repairmanIsCurrentUser(repairman) ? 'danger' : ''"
                    style="margin-right: 8px;"
                  >
                    {{ repairman.name }} ({{ formatRepairmanType(repairman.type) }})
                  </el-tag>
                </div>
              </div>
            </div>

            <!-- 显示催单信息 -->
            <div v-if="order.reminder" class="reminder-section">
              <div class="reminder-box">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                <span>催单信息：{{ order.reminder }}</span>
              </div>
            </div>
          </div>

          <div class="order-actions">
            <!-- 已拒绝工单的操作 -->
            <div v-if="order.status === 'CANCELLED'" class="rejected-actions">
              <el-button type="info" size="small" disabled>
                已拒绝
              </el-button>
              <span class="text-muted" style="margin-left: 12px; font-size: 12px;">
                工单已被拒绝，无法进行其他操作
              </span>
            </div>
            
            <!-- 其他状态工单的操作 -->
            <div v-else>
              <el-button 
                v-if="order.status === 'PENDING'" 
                type="success" 
                @click="acceptOrder(order)"
              >
                接受工单
              </el-button>
              
              <el-button 
                v-if="order.status === 'PENDING'" 
                type="danger" 
                @click="rejectOrder(order)"
              >
                拒绝工单
              </el-button>
              
              <el-button 
                v-if="order.status === 'ACCEPTED' || order.status === 'IN_PROGRESS'" 
                type="primary" 
                @click="updateProgress(order)"
              >
                更新进度
              </el-button>
              
              <el-button 
                v-if="order.status === 'IN_PROGRESS' && order.progress < 100" 
                type="warning" 
                @click="completeOrder(order)"
              >
                完成工单
              </el-button>
            </div>
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

    <!-- 拒绝工单对话框 -->
    <el-dialog
      v-model="showRejectDialog"
      title="拒绝工单"
      width="400px"
    >
      <el-form
        ref="rejectFormRef"
        :model="rejectForm"
        :rules="rejectRules"
        label-width="100px"
      >
        <el-form-item label="拒绝原因" prop="reason">
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="3"
            placeholder="请输入拒绝原因"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" :loading="rejecting" @click="submitReject">
          确认拒绝
        </el-button>
      </template>
    </el-dialog>

    <!-- 完成工单对话框 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="完成工单"
      width="600px"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        :rules="completeRules"
        label-width="100px"
      >
        <el-form-item label="维修结果" prop="result">
          <el-input
            v-model="completeForm.result"
            type="textarea"
            :rows="3"
            placeholder="请输入维修结果"
          />
        </el-form-item>
        <el-form-item label="工作时长" prop="workingHours">
          <el-input-number
            v-model="completeForm.workingHours"
            :min="1"
            :step="1"
            :precision="0"
            placeholder="分钟"
          />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
        <el-form-item label="使用材料">
          <div class="materials-section">
            <div v-for="(material, index) in completeForm.materials" :key="index" class="material-item">
              <el-select
                v-model="material.materialId"
                placeholder="选择材料"
                style="width: 200px;"
              >
                <el-option
                  v-for="mat in availableMaterials"
                  :key="mat.materialId"
                  :label="`${mat.name} (库存: ${mat.stock})`"
                  :value="mat.materialId"
                />
              </el-select>
              <el-input-number
                v-model="material.amount"
                :min="1"
                placeholder="数量"
                style="width: 120px; margin-left: 8px;"
              />
              <el-button
                type="danger"
                text
                @click="removeMaterial(index)"
                style="margin-left: 8px;"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" text @click="addMaterial">
              + 添加材料
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" :loading="completing" @click="submitComplete">
          完成工单
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency, formatStatus } from '../../utils/format'
import { STATUS_COLORS } from '../../utils/constants'

const authStore = useAuthStore()

const workOrders = ref([])
const availableMaterials = ref([])
const loading = ref(false)
const statusFilter = ref('')
const showProgressDialog = ref(false)
const showRejectDialog = ref(false)
const showCompleteDialog = ref(false)
const updatingProgress = ref(false)
const rejecting = ref(false)
const completing = ref(false)
const selectedOrder = ref(null)

const progressFormRef = ref()
const rejectFormRef = ref()
const completeFormRef = ref()

const progressForm = reactive({
  progress: 0,
  description: ''
})

const rejectForm = reactive({
  reason: ''
})

const completeForm = reactive({
  result: '',
  workingHours: 0,
  materials: []
})

const progressRules = {
  progress: [
    { required: true, message: '请设置进度', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入进度说明', trigger: 'blur' }
  ]
}

const rejectRules = {
  reason: [
    { required: true, message: '请输入拒绝原因', trigger: 'blur' }
  ]
}

const completeRules = {
  result: [
    { required: true, message: '请输入维修结果', trigger: 'blur' }
  ],
  workingHours: [
    { required: true, message: '请输入工作时长', trigger: 'change' },
    { type: 'number', min: 1, message: '工作时长至少为1分钟', trigger: 'change' }
  ]
}

const loadWorkOrders = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    let response
    if (statusFilter.value === 'CANCELLED') {
      // 查询已拒绝工单
      response = await api.post(`/api/repairman/rejected-items`, {
        repairmanId: repairmanId
      })
    } else {
      // 查询其它状态工单
      response = await api.post(`/api/repairman/maintenance-items/list`, {
        repairmanId: repairmanId
      })
    }
    
    if (response.data.code === 200) {
      // 获取工单并按创建时间排序
      const allOrders = response.data.data.sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      )
      // 处理：如果repairmenAcceptance中当前维修工为false，覆盖status为CANCELLED
      const myId = authStore.user?.repairmanId
      allOrders.forEach(order => {
        if (order.repairmenAcceptance) {
          // repairmenAcceptance的key可能是字符串，需遍历查找包含当前id的key
          for (const key in order.repairmenAcceptance) {
            if (key.includes(`repairmanId=${myId}`) && order.repairmenAcceptance[key] === false) {
              order.status = 'CANCELLED'
              break
            }
          }
        }
      })
      if (statusFilter.value && statusFilter.value !== 'CANCELLED') {
        workOrders.value = allOrders.filter(order => order.status === statusFilter.value)
      } else {
        workOrders.value = allOrders
      }
    } else {
      ElMessage.error(response.data.message || '获取工单列表失败')
    }
  } catch (error) {
    console.error('Failed to load work orders:', error)
    ElMessage.error('获取工单列表失败')
  } finally {
    loading.value = false
  }
}

const acceptOrder = async (order) => {
  try {
    const repairmanId = authStore.user?.repairmanId
    const response = await api.post(`/api/repairman/${repairmanId}/maintenance-items/${order.itemId}/accept`)

    if (response.data.code === 200) {
      ElMessage.success('工单接受成功')
      loadWorkOrders()
    }
  } catch (error) {
    console.error('Failed to accept order:', error)
  }
}

const rejectOrder = (order) => {
  selectedOrder.value = order
  rejectForm.reason = ''
  showRejectDialog.value = true
}

const submitReject = async () => {
  if (!rejectFormRef.value) return

  try {
    await rejectFormRef.value.validate()
    rejecting.value = true

    const repairmanId = authStore.user?.repairmanId
    const response = await api.post(
      `/api/repairman/${repairmanId}/maintenance-items/${selectedOrder.value.itemId}/reject`,
      rejectForm
    )

    if (response.data.code === 200) {
      ElMessage.success('工单拒绝成功')
      showRejectDialog.value = false
      loadWorkOrders()
    }
  } catch (error) {
    console.error('Failed to reject order:', error)
  } finally {
    rejecting.value = false
  }
}

const updateProgress = (order) => {
  selectedOrder.value = order
  progressForm.progress = order.progress
  progressForm.description = ''
  showProgressDialog.value = true
}

const submitProgress = async () => {
  if (!progressFormRef.value) return

  try {
    await progressFormRef.value.validate()
    updatingProgress.value = true

    const repairmanId = authStore.user?.repairmanId
    const response = await api.put(
      `/api/repairman/${repairmanId}/maintenance-items/${selectedOrder.value.itemId}/progress`,
      progressForm
    )

    if (response.data.code === 200) {
      ElMessage.success('进度更新成功')
      showProgressDialog.value = false
      loadWorkOrders()
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
  } finally {
    updatingProgress.value = false
  }
}

const completeOrder = (order) => {
  selectedOrder.value = order
  completeForm.result = ''
  completeForm.workingHours = 0
  completeForm.materials = []
  showCompleteDialog.value = true
}

const addMaterial = () => {
  completeForm.materials.push({
    materialId: '',
    amount: 1
  })
}

const removeMaterial = (index) => {
  completeForm.materials.splice(index, 1)
}

const submitComplete = async () => {
  if (!completeFormRef.value) return

  try {
    await completeFormRef.value.validate()
    completing.value = true

    const repairmanId = authStore.user?.repairmanId
    const response = await api.post(
      `/api/repairman/${repairmanId}/maintenance-items/${selectedOrder.value.itemId}/complete`,
      completeForm
    )

    if (response.data.code === 200) {
      ElMessage.success('工单完成成功')
      showCompleteDialog.value = false
      loadWorkOrders()
    }
  } catch (error) {
    console.error('Failed to complete order:', error)
  } finally {
    completing.value = false
  }
}

// 获取材料列表
const loadMaterials = async () => {
  try {
    const response = await api.get('/api/admin/materials')
    if (response.data.success) {
      availableMaterials.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load materials:', error)
  }
}

// 格式化维修人员工种
const formatRepairmanType = (type) => {
  const typeMap = {
    'MECHANIC': '机械师',
    'ELECTRICIAN': '电工',
    'SHEET_METAL': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒'
  }
  return typeMap[type] || type
}

// 检查维修人员是否为当前用户
const repairmanIsCurrentUser = (repairman) => {
  return repairman.repairmanId === authStore.user?.repairmanId
}

// 状态筛选变更处理
const handleStatusFilterChange = () => {
  console.log('状态筛选变更:', statusFilter.value)
  loadWorkOrders()
}

onMounted(() => {
  // 加载工单数据
  loadWorkOrders()
  // 加载材料数据
  loadMaterials()
})
</script>

<style scoped>
.work-orders-page {
  max-width: 1200px;
  margin: 0 auto;
}

.work-orders-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.work-order-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.work-order-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.order-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.order-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.order-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.order-meta {
  color: #7f8c8d;
  font-size: 14px;
}

.order-content {
  margin-bottom: 20px;
}

.description {
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.6;
}

.order-details {
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

.order-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.materials-section {
  width: 100%;
}

.material-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.reminder-section {
  margin-top: 16px;
}

.reminder-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px;
  background-color: #f0f2f5;
  border-radius: 4px;
}

.rejection-reason {
  color: #f56c6c;
  font-weight: 500;
}

.rejected-actions {
  display: flex;
  align-items: center;
}

.filters {
  display: flex;
  align-items: center;
}

/* 已拒绝工单的特殊样式 */
.work-order-card[data-status="CANCELLED"] {
  border-left: 4px solid #f56c6c;
  background-color: #fef0f0;
}

.work-order-card[data-status="CANCELLED"] .order-title h3 {
  color: #909399;
}
</style>