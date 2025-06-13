<template>
  <div class="maintenance-type-assignment">
    <el-card class="page-header">
      <div class="header-content">
        <h2>工单工种分配</h2>
        <el-button type="primary" @click="fetchAwaitingItems">刷新列表</el-button>
      </div>
    </el-card>

    <el-card v-if="awaitingItems.length === 0 && !loading" class="empty-state">
      <el-empty description="暂无待分配工种的维修工单"></el-empty>
    </el-card>

    <el-card v-else class="item-list">
      <el-table
        v-loading="loading"
        :data="awaitingItems"
        border
        style="width: 100%"
      >
        <el-table-column prop="itemId" label="工单ID" width="80" />
        <el-table-column prop="name" label="工单名称" />
        <el-table-column prop="description" label="描述" show-overflow-tooltip />
        <el-table-column prop="car.licensePlate" label="车牌号" width="120" />
        <el-table-column prop="car.brand" label="品牌" width="100" />
        <el-table-column prop="car.model" label="型号" width="100" />
        <el-table-column prop="createTime" label="创建时间" width="180">
          <template #default="scope">
            {{ formatDate(scope.row.createTime) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120" fixed="right">
          <template #default="scope">
            <el-button
              type="primary"
              size="small"
              @click="openAssignDialog(scope.row)"
            >
              分配工种
            </el-button>
          </template>
        </el-table-column>
      </el-table>
    </el-card>

    <!-- 工种分配对话框 -->
    <el-dialog
      v-model="assignDialogVisible"
      title="分配维修工种"
      width="600px"
      destroy-on-close
    >
      <div v-if="currentItem" class="assign-dialog-content">
        <div class="item-info">
          <h3>{{ currentItem.name }}</h3>
          <p>{{ currentItem.description }}</p>
          <div class="car-info">
            <span>车辆：{{ currentItem.car?.brand }} {{ currentItem.car?.model }}</span>
            <span>车牌号：{{ currentItem.car?.licensePlate }}</span>
          </div>
        </div>

        <el-divider>需要的工种及数量</el-divider>
        
        <div class="repair-types-container">
          <el-tag
            v-for="(type, key) in repairmanTypes"
            :key="key"
            :class="['repair-type-tag', { 'active': assignForm[key] > 0 }]"
            @click="toggleRepairType(key)"
            closable
            :disable-transitions="false"
            :type="assignForm[key] > 0 ? 'primary' : 'info'"
            @close="assignForm[key] = 0"
          >
            {{ type }} × {{ assignForm[key] }} (已分配 {{ getAssignedCount(key) }})
          </el-tag>
        </div>
        
        <div v-if="selectedType" class="type-selector">
          <div class="selected-type-name">{{ repairmanTypes[selectedType] }}</div>
          <el-input-number 
            v-model="assignForm[selectedType]" 
            :min="0" 
            :max="10"
            @change="() => checkSelectedType()"
          />
        </div>
      </div>

      <template #footer>
        <span class="dialog-footer">
          <el-button @click="assignDialogVisible = false">取消</el-button>
          <el-button type="primary" @click="submitAssignment" :loading="submitting">
            确认分配
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue'
import { ElMessage } from 'element-plus'
import axios from 'axios'

const loading = ref(false)
const submitting = ref(false)
const awaitingItems = ref([])
const assignDialogVisible = ref(false)
const currentItem = ref(null)
const selectedType = ref(null)
const assignForm = ref({
  MECHANIC: 0,
  ELECTRICIAN: 0,
  BODYWORKER: 0,
  PAINTER: 0,
  APPRENTICE: 0,
  INSPECTOR: 0,
  DIAGNOSER: 0
})

// 工种名称映射
const repairmanTypes = {
  MECHANIC: '机械维修师',
  ELECTRICIAN: '电工',
  BODYWORKER: '车身维修工',
  PAINTER: '喷漆师',
  APPRENTICE: '学徒',
  INSPECTOR: '质检员',
  DIAGNOSER: '故障诊断师'
}

onMounted(() => {
  fetchAwaitingItems()
})

const fetchAwaitingItems = async () => {
  loading.value = true
  try {
    const response = await axios.get('/api/admin/maintenance-items/awaiting-assignment')
    if (response.data.success) {
      awaitingItems.value = response.data.data
    } else {
      ElMessage.error(response.data.message || '获取待分配工单失败')
    }
  } catch (error) {
    console.error('获取待分配工单失败:', error)
    ElMessage.error('获取待分配工单失败')
  } finally {
    loading.value = false
  }
}

const openAssignDialog = (item) => {
  currentItem.value = item
  // 重置表单
  assignForm.value = {
    MECHANIC: 0,
    ELECTRICIAN: 0,
    BODYWORKER: 0,
    PAINTER: 0,
    APPRENTICE: 0,
    INSPECTOR: 0,
    DIAGNOSER: 0
  }
  assignDialogVisible.value = true
}

const submitAssignment = async () => {
  // 检查是否至少选择了一个工种
  const hasSelectedType = Object.values(assignForm.value).some(value => value > 0)
  if (!hasSelectedType) {
    ElMessage.warning('请至少选择一个工种并指定数量')
    return
  }

  submitting.value = true
  try {
    const response = await axios.post(
      `/api/admin/maintenance-items/${currentItem.value.itemId}/assign-types`,
      assignForm.value
    )
    
    if (response.data.success) {
      ElMessage.success('工种分配成功')
      assignDialogVisible.value = false
      fetchAwaitingItems() // 刷新列表
    } else {
      ElMessage.error(response.data.message || '工种分配失败')
    }
  } catch (error) {
    console.error('工种分配失败:', error)
    ElMessage.error(error.response?.data?.message || '工种分配失败')
  } finally {
    submitting.value = false
  }
}

const formatDate = (dateString) => {
  if (!dateString) return ''
  const date = new Date(dateString)
  return date.toLocaleString()
}

// 切换选中的工种
const toggleRepairType = (type) => {
  selectedType.value = type
}

// 检查是否还需要保持选中状态
const checkSelectedType = () => {
  if (selectedType.value && assignForm.value[selectedType.value] === 0) {
    selectedType.value = null
  }
}

// 获取已分配的工种数量
const getAssignedCount = (type) => {
  if (!currentItem.value || !currentItem.value.requiredTypes) return 0
  
  const typeCount = currentItem.value.requiredTypes[type]
  return typeCount ? typeCount : 0
}
</script>

<style scoped>
.maintenance-type-assignment {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.page-header .header-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.page-header h2 {
  margin: 0;
}

.empty-state {
  padding: 40px 0;
}

.assign-dialog-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.item-info {
  background-color: #f8f9fa;
  padding: 15px;
  border-radius: 8px;
}

.item-info h3 {
  margin-top: 0;
  margin-bottom: 10px;
  color: #303133;
}

.item-info p {
  margin: 0 0 15px 0;
  color: #606266;
}

.car-info {
  display: flex;
  gap: 20px;
  color: #909399;
  font-size: 14px;
}

.repair-types-container {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.repair-type-tag {
  cursor: pointer;
  padding: 8px 12px;
  font-size: 14px;
}

.repair-type-tag.active {
  font-weight: bold;
}

.type-selector {
  display: flex;
  align-items: center;
  gap: 15px;
  background-color: #f0f9ff;
  padding: 15px;
  border-radius: 8px;
  margin-top: 10px;
}

.selected-type-name {
  font-weight: bold;
  min-width: 100px;
}
</style>
