<template>
  <div class="maintenance-detail-page">
    <div class="card-container">
      <div class="detail-header">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h2>工单详情</h2>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="maintenanceDetail" class="detail-content">
        <!-- 基本信息 -->
        <div class="info-section">
          <h3>基本信息</h3>
          <div class="info-grid">
            <el-descriptions :column="2" border>
              <el-descriptions-item label="工单ID">{{ maintenanceDetail.itemId }}</el-descriptions-item>
              <el-descriptions-item label="工单名称">{{ maintenanceDetail.name }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="getStatusType(maintenanceDetail.status)">
                  {{ formatStatus(maintenanceDetail.status) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="优先级">
                <el-tag :type="getPriorityType(maintenanceDetail.priority)">
                  {{ formatPriority(maintenanceDetail.priority) }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="进度">
                <el-progress :percentage="maintenanceDetail.progress" :stroke-width="8" />
              </el-descriptions-item>
              <el-descriptions-item label="费用">
                <span class="cost-text">¥{{ maintenanceDetail.cost || 0 }}</span>
              </el-descriptions-item>
              <el-descriptions-item label="创建时间">{{ formatDateTime(maintenanceDetail.createTime) }}</el-descriptions-item>
              <el-descriptions-item label="预期完成时间">{{ formatDateTime(maintenanceDetail.expectedCompletionTime) || '未设置' }}</el-descriptions-item>
            </el-descriptions>
          </div>
        </div>

        <!-- 车辆和用户信息 -->
        <div class="info-section">
          <h3>车辆和用户信息</h3>
          <el-descriptions :column="2" border>
            <el-descriptions-item label="用户">{{ maintenanceDetail.car?.user?.username }}</el-descriptions-item>
            <el-descriptions-item label="联系方式">{{ maintenanceDetail.car?.user?.phone }}</el-descriptions-item>
            <el-descriptions-item label="车辆品牌">{{ maintenanceDetail.car?.brand }}</el-descriptions-item>
            <el-descriptions-item label="车辆型号">{{ maintenanceDetail.car?.model }}</el-descriptions-item>
            <el-descriptions-item label="车牌号" :span="2">
              <el-tag type="primary">{{ maintenanceDetail.car?.licensePlate }}</el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 工单描述 -->
        <div class="info-section">
          <h3>工单描述</h3>
          <div class="description-content">
            <p>{{ maintenanceDetail.description }}</p>
          </div>
        </div>

        <!-- 工种需求信息 -->
        <div v-if="maintenanceDetail.requiredTypes && maintenanceDetail.requiredTypes.length > 0" class="info-section">
          <h3>工种需求与分配情况</h3>
          <div class="types-overview">
            <el-row :gutter="16">
              <el-col v-for="reqType in maintenanceDetail.requiredTypes" :key="reqType.id" :span="6">
                <div class="type-card">
                  <div class="type-header">
                    <span class="type-name">{{ formatRepairmanType(reqType.type) }}</span>
                    <el-tag 
                      :type="reqType.assigned >= reqType.required ? 'success' : 'warning'"
                      size="small"
                    >
                      {{ reqType.assigned }}/{{ reqType.required }}
                    </el-tag>
                  </div>
                  <div class="assignment-progress">
                    <el-progress 
                      :percentage="Math.round((reqType.assigned / reqType.required) * 100)"
                      :status="reqType.assigned >= reqType.required ? 'success' : undefined"
                      :stroke-width="6"
                    />
                  </div>
                </div>
              </el-col>
            </el-row>
          </div>
        </div>

        <!-- 分配的维修人员 -->
        <div v-if="maintenanceDetail.repairmen && maintenanceDetail.repairmen.length > 0" class="info-section">
          <h3>分配的维修人员</h3>
          <el-table :data="maintenanceDetail.repairmen" stripe border>
            <el-table-column prop="repairmanId" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" width="120" />
            <el-table-column prop="type" label="工种" width="120">
              <template #default="scope">
                <el-tag type="info">{{ formatRepairmanType(scope.row.type) }}</el-tag>
              </template>
            </el-table-column>
            <el-table-column prop="hourlyRate" label="时薪" width="100">
              <template #default="scope">
                ¥{{ scope.row.hourlyRate }}/小时
              </template>
            </el-table-column>
            <el-table-column prop="phone" label="联系方式" />
            <el-table-column label="接受状态" width="120">
              <template #default="scope">
                <el-tag 
                  :type="getAcceptanceStatus(scope.row) === 'accepted' ? 'success' : 
                        getAcceptanceStatus(scope.row) === 'rejected' ? 'danger' : 'warning'"
                >
                  {{ getAcceptanceStatusText(scope.row) }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>

        <!-- 调试信息 -->
        <div class="info-section" style="background-color: #f0f9ff; border: 1px solid #0ea5e9;">
          <h3>调试信息</h3>
          <p>维修记录数组长度: {{ maintenanceRecords.length }}</p>
          <p>维修记录数据: {{ JSON.stringify(maintenanceRecords, null, 2) }}</p>
          <p>工单详情状态: {{ maintenanceDetail ? '已加载' : '未加载' }}</p>
        </div>

        <!-- 维修记录 -->
        <div class="info-section">
          <h3>维修记录 {{ maintenanceRecords && maintenanceRecords.length > 0 ? `(${maintenanceRecords.length}条)` : '(暂无记录)' }}</h3>
          
          <!-- 强制显示表格，用于调试 -->
          <div>
            <el-table :data="maintenanceRecords || []" stripe border v-loading="loading">
              <el-table-column prop="recordId" label="记录ID" width="80">
                <template #default="scope">
                  {{ scope.row.recordId || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="name" label="记录名称" min-width="150">
                <template #default="scope">
                  {{ scope.row.name || '-' }}
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" min-width="200">
                <template #default="scope">
                  <el-tooltip :content="scope.row.description || '无描述'" placement="top">
                    <span>{{ truncateText(scope.row.description || '无描述', 50) }}</span>
                  </el-tooltip>
                </template>
              </el-table-column>
              <el-table-column prop="cost" label="费用" width="100">
                <template #default="scope">
                  ¥{{ scope.row.cost?.toFixed(2) || '0.00' }}
                </template>
              </el-table-column>
              <el-table-column prop="workHours" label="工时" width="100">
                <template #default="scope">
                  {{ formatWorkHours(scope.row.workHours) }}
                </template>
              </el-table-column>
              <el-table-column prop="startTime" label="开始时间" width="180">
                <template #default="scope">
                  {{ formatDateTime(scope.row.startTime) }}
                </template>
              </el-table-column>
              <el-table-column prop="repairManId" label="维修人员" width="100">
                <template #default="scope">
                  {{ getRepairmanName(scope.row.repairManId) }}
                </template>
              </el-table-column>
            </el-table>
            
            <div v-if="!maintenanceRecords || maintenanceRecords.length === 0" class="empty-records">
              <el-empty description="暂无维修记录" :image-size="60" />
            </div>
          </div>
        </div>

        <!-- 维修结果 -->
        <div v-if="maintenanceDetail.result" class="info-section">
          <h3>维修结果</h3>
          <div class="result-content">
            <p>{{ maintenanceDetail.result }}</p>
          </div>
        </div>

        <!-- 催单信息 -->
        <div v-if="maintenanceDetail.reminder" class="info-section">
          <h3>催单信息</h3>
          <div class="reminder-content">
            <el-alert
              :title="maintenanceDetail.reminder"
              type="warning"
              :closable="false"
              show-icon
            />
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-section">
          <el-button type="primary" @click="$router.push('/admin/maintenance')">
            <el-icon><List /></el-icon>
            返回工单列表
          </el-button>
          <el-button 
            v-if="maintenanceDetail.status === 'PENDING'" 
            type="warning" 
            @click="editMaintenance"
          >
            <el-icon><Edit /></el-icon>
            编辑工单
          </el-button>
          <el-button 
            v-if="maintenanceDetail.status === 'PENDING'" 
            type="danger" 
            @click="cancelMaintenance"
          >
            <el-icon><Delete /></el-icon>
            取消工单
          </el-button>
        </div>
      </div>

      <div v-else class="error-state">
        <el-empty description="工单不存在或已被删除" />
        <el-button type="primary" @click="$router.push('/admin/maintenance')">
          返回工单列表
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, List, Edit, Delete } from '@element-plus/icons-vue'
import api from '../../utils/api'

const route = useRoute()
const router = useRouter()
const loading = ref(false)
const maintenanceDetail = ref(null)
const maintenanceRecords = ref([])

const formatStatus = (status) => {
  const statusMap = {
    'PENDING': '待处理',
    'ACCEPTED': '已接受',
    'IN_PROGRESS': '进行中',
    'COMPLETED': '已完成',
    'CANCELLED': '已取消'
  }
  return statusMap[status] || status
}

const formatPriority = (priority) => {
  const priorityMap = {
    'LOW': '低',
    'NORMAL': '普通',
    'HIGH': '高',
    'URGENT': '紧急'
  }
  return priorityMap[priority] || priority
}

const formatRepairmanType = (type) => {
  const typeMap = {
    'MECHANIC': '机械师',
    'ELECTRICIAN': '电工',
    'SHEET_METAL': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒',
    'BODYWORKER': '车身工',
    'INSPECTOR': '检验员',
    'DIAGNOSER': '诊断师'
  }
  return typeMap[type] || type
}

const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  return new Date(dateTime).toLocaleString('zh-CN')
}

const getStatusType = (status) => {
  const statusTypeMap = {
    'PENDING': '',
    'ACCEPTED': 'warning',
    'IN_PROGRESS': 'primary',
    'COMPLETED': 'success',
    'CANCELLED': 'danger'
  }
  return statusTypeMap[status] || ''
}

const getPriorityType = (priority) => {
  const priorityTypeMap = {
    'LOW': 'info',
    'NORMAL': '',
    'HIGH': 'warning',
    'URGENT': 'danger'
  }
  return priorityTypeMap[priority] || ''
}

const getAcceptanceStatus = (repairman) => {
  if (!maintenanceDetail.value) return 'pending'
  
  const repairmanId = repairman.repairmanId
  
  // 检查是否在已接受列表中
  if (maintenanceDetail.value.acceptedRepairmen?.some(r => r.repairmanId === repairmanId)) {
    return 'accepted'
  }
  
  // 检查是否在拒绝列表中
  if (maintenanceDetail.value.rejectedRepairmen?.some(r => r.repairmanId === repairmanId)) {
    return 'rejected'
  }
  
  // 默认为待确认
  return 'pending'
}

const getAcceptanceStatusText = (repairman) => {
  const status = getAcceptanceStatus(repairman)
  const statusMap = {
    'accepted': '已接受',
    'rejected': '已拒绝',
    'pending': '待确认'
  }
  return statusMap[status] || '待确认'
}

// 工具函数
const truncateText = (text, maxLength) => {
  if (!text) return ''
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text
}

const formatWorkHours = (hours) => {
  if (!hours) return '0小时'
  return `${hours}小时`
}

const getRepairmanName = (repairmanId) => {
  if (!maintenanceDetail.value?.repairmen) return '未知'
  const repairman = maintenanceDetail.value.repairmen.find(r => r.repairmanId === repairmanId)
  return repairman ? repairman.name : '未知'
}

const loadMaintenanceDetail = async () => {
  try {
    loading.value = true
    const itemId = route.params.id
    
    console.log('Loading maintenance detail for itemId:', itemId)
    
    // 使用新的API获取工单及其维修记录
    const response = await api.get(`/api/admin/maintenance-item-records/${itemId}`)
    
    console.log('完整API响应:', response)
    console.log('响应数据:', response.data)
    
    // 直接使用响应数据，不管是否有code字段
    if (response.data) {
      // 检查是否有标准的响应格式
      if (response.data.item && response.data.records !== undefined) {
        // 标准格式：{item: ..., records: [...]}
        maintenanceDetail.value = response.data.item
        maintenanceRecords.value = response.data.records || []
        console.log('使用标准格式，工单详情:', maintenanceDetail.value)
        console.log('维修记录:', maintenanceRecords.value)
      } else if (response.data.data && response.data.data.item) {
        // 包装格式：{code: 200, data: {item: ..., records: [...]}}
        maintenanceDetail.value = response.data.data.item
        maintenanceRecords.value = response.data.data.records || []
        console.log('使用包装格式，工单详情:', maintenanceDetail.value)
        console.log('维修记录:', maintenanceRecords.value)
      } else {
        console.error('响应数据格式不正确:', response.data)
        ElMessage.error('获取工单详情失败：数据格式错误')
      }
    } else {
      console.error('没有响应数据')
      ElMessage.error('工单不存在或获取失败')
    }
  } catch (error) {
    console.error('API调用失败:', error)
    console.error('错误详情:', error.response?.data)
    ElMessage.error('加载工单详情失败')
  } finally {
    loading.value = false
  }
}

const editMaintenance = () => {
  ElMessage.info('编辑功能待实现')
}

const cancelMaintenance = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要取消工单 "${maintenanceDetail.value.name}" 吗？此操作不可逆`,
      '警告',
      {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )

    const response = await api.delete(`/api/admin/maintenance-items/${maintenanceDetail.value.itemId}`)
    
    if (response.data.code === 200) {
      ElMessage.success('工单取消成功')
      router.push('/admin/maintenance')
    } else {
      ElMessage.error(response.data.message || '取消工单失败')
    }
  } catch (error) {
    if (error !== 'cancel') {
      console.error('Failed to cancel maintenance:', error)
      ElMessage.error('取消工单失败')
    }
  }
}

onMounted(() => {
  loadMaintenanceDetail()
})
</script>

<style scoped>
.maintenance-detail-page {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

.card-container {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.detail-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 24px;
  padding-bottom: 16px;
  border-bottom: 1px solid #ebeef5;
}

.detail-header h2 {
  margin: 0;
  color: #303133;
}

.flex-center {
  display: flex;
  justify-content: center;
  align-items: center;
}

.detail-content {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.info-section {
  padding: 20px;
  border: 1px solid #ebeef5;
  border-radius: 8px;
  background-color: #fafbfc;
}

.info-section h3 {
  margin: 0 0 16px 0;
  color: #303133;
  font-size: 16px;
  font-weight: 600;
}

.info-grid {
  margin-top: 16px;
}

.description-content {
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.description-content p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.cost-text {
  font-size: 16px;
  font-weight: 600;
  color: #f56c6c;
}

.types-overview {
  margin-top: 16px;
}

.type-card {
  padding: 16px;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  background-color: #fff;
  text-align: center;
}

.type-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.type-name {
  font-weight: 500;
  color: #303133;
}

.assignment-progress {
  margin-top: 8px;
}

.action-section {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #ebeef5;
}

.error-state {
  text-align: center;
  padding: 40px 20px;
}

.result-content {
  padding: 16px;
  background-color: #fff;
  border-radius: 6px;
  border: 1px solid #dcdfe6;
}

.result-content p {
  margin: 0;
  line-height: 1.6;
  color: #606266;
}

.reminder-content {
  margin-top: 8px;
}

.empty-records {
  text-align: center;
  padding: 20px;
}

/* 响应式设计 */
@media (max-width: 768px) {
  .maintenance-detail-page {
    padding: 16px;
  }
  
  .action-section {
    flex-direction: column;
  }
  
  .action-section .el-button {
    width: 100%;
  }
  
  .types-overview .el-col {
    margin-bottom: 16px;
  }
}
</style>
