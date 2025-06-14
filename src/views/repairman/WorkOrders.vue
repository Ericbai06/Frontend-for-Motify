<template>
  <div class="work-orders-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>工单管理</h2>
        <el-select
          v-model="statusFilter"
          placeholder="筛选状态"
          clearable
          style="width: 150px;"
          @change="handleStatusFilterChange"
        >
          <el-option label="全部" value="" />
          <el-option label="待处理" value="PENDING" />
          <el-option label="待分配工种" value="AWAITING_ASSIGNMENT" />
          <el-option label="已接收" value="ACCEPTED" />
          <el-option label="已拒绝" value="CANCELLED" />
          <el-option label="维修中" value="IN_PROGRESS" />
          <el-option label="已完成" value="COMPLETED" />
        </el-select>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="workOrders.length === 0" class="empty-state">
        <el-empty description="暂无工单" />
      </div>

      <div v-else class="work-orders-list">
        <div v-for="order in workOrders" :key="order.itemId" class="work-order-card">
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
              
              <div class="detail-item">
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
            :min="0.1"
            :step="0.1"
            :precision="1"
            placeholder="小时"
          />
          <span style="margin-left: 8px;">小时</span>
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
                  :label="mat.name"
                  :value="mat.materialId"
                />
              </el-select>
              <el-input-number
                v-model="material.quantity"
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

    <el-tabs v-model="activeTab" @tab-click="handleTabChange">
      <el-tab-pane label="已拒绝工单" name="rejected">
        <div v-if="loadingRejected" class="flex-center" style="height: 200px;">
          <el-loading />
        </div>
        
        <div v-else-if="rejectedItems.length === 0" class="empty-state">
          <el-empty description="暂无已拒绝工单" />
        </div>
        
        <div v-else class="work-orders-list">
          <div v-for="order in rejectedItems" :key="order.itemId" class="work-order-card">
            <div class="order-header">
              <div class="order-title">
                <h3>{{ order.name }}</h3>
                <el-tag :type="STATUS_COLORS[order.status]" size="small">
                  {{ formatStatus(order.status) }}
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
                
                <div class="detail-item">
                  <span class="label">拒绝时间：</span>
                  <span>{{ formatDateTime(order.updateTime) }}</span>
                </div>
              </div>
            </div>

            <div class="order-actions">
              <el-button type="primary" @click="viewOrderDetails(order)">
                查看详情
              </el-button>
            </div>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
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
const activeTab = ref('rejected')
const rejectedItems = ref([])
const loadingRejected = ref(false)

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
    { required: true, message: '请输入工作时长', trigger: 'change' }
  ]
}

const loadWorkOrders = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    // 打印当前筛选条件
    console.log('当前筛选条件:', statusFilter.value)

    const response = await api.post(`/api/repairman/maintenance-items/list`, {
      repairmanId: repairmanId
    })
    
    if (response.data.code === 200) {
      // 获取所有工单并打印状态
      const allOrders = response.data.data.sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      )
      
      console.log('所有工单状态:', allOrders.map(o => ({id: o.itemId, name: o.name, status: o.status})))
      
      // 严格筛选状态
      if (statusFilter.value) {
        // 确保精确匹配状态值
        workOrders.value = allOrders.filter(order => {
          const match = order.status === statusFilter.value
          console.log(`工单 ${order.itemId} (${order.name}) 状态: ${order.status}, 匹配: ${match}`)
          return match
        })
      } else {
        workOrders.value = allOrders
      }
      
      console.log('筛选后工单数量:', workOrders.value.length)
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
    quantity: 1
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

// 模拟材料数据
const loadMaterials = () => {
  availableMaterials.value = [
    { materialId: 1, name: '美孚1号机油' },
    { materialId: 2, name: '空气滤芯' },
    { materialId: 3, name: '机油滤芯' },
    { materialId: 4, name: '前刹车片' },
    { materialId: 5, name: '后刹车片' },
    { materialId: 6, name: '米其林轮胎' },
    { materialId: 7, name: '瓦尔塔电池' },
    { materialId: 8, name: '火花塞' }
  ]
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

// 修改handleTabChange函数
const handleTabChange = (tab) => {
  const tabName = tab.props.name
  console.log('切换到标签页:', tabName)
  
  // 只处理已拒绝工单标签页
  if (tabName === 'rejected') {
    fetchRejectedItems()
  }
}

// 修改状态筛选变更处理
const handleStatusFilterChange = () => {
  // 如果选择了特定状态，切换到相应的标签页
  if (statusFilter.value === 'PENDING') {
    activeTab.value = 'rejected'
  } else if (statusFilter.value === 'IN_PROGRESS') {
    activeTab.value = 'rejected'
  } else if (statusFilter.value === 'COMPLETED') {
    activeTab.value = 'rejected'
  } else if (statusFilter.value === 'CANCELLED') {
    // 可能需要添加一个"已取消"标签页
    // 或者在当前标签页中应用筛选
    loadWorkOrders()
  } else {
    // 如果选择"全部"，则加载所有工单
    loadWorkOrders()
  }
}

// 修改获取已拒绝工单的函数，添加加载状态
const fetchRejectedItems = async () => {
  try {
    loadingRejected.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return
    
    const response = await api.post('/api/repairman/rejected-items', {
      repairmanId: repairmanId
    })
    
    if (response.data.code === 200) {
      rejectedItems.value = response.data.data
      console.log('已获取拒绝工单:', rejectedItems.value.length)
    } else {
      ElMessage.error(response.data.message || '获取已拒绝工单失败')
    }
  } catch (error) {
    console.error('获取已拒绝工单失败:', error)
    ElMessage.error('获取已拒绝工单失败')
  } finally {
    loadingRejected.value = false
  }
}

// 添加查看工单详情函数
const viewOrderDetails = (order) => {
  // 这里可以实现查看详情的逻辑，如打开详情对话框
  ElMessage.info(`查看工单详情: ${order.itemId}`)
}

onMounted(() => {
  // 默认加载已拒绝工单数据
  activeTab.value = 'rejected'
  fetchRejectedItems()
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
</style>