<template>
  <div class="statistics-container">
    <div class="page-header">
      <h1>数据统计分析</h1>
      <p>系统运营数据分析和统计报表</p>
    </div>

    <!-- 统计类型选择 -->
    <div class="stats-tabs">
      <el-card>
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="车型维修统计" name="car-model-repairs" />
          <el-tab-pane label="故障类型统计" name="car-model-faults" />
          <el-tab-pane label="费用构成分析" name="cost-analysis" />
          <el-tab-pane label="负面反馈分析" name="negative-feedback" />
          <el-tab-pane label="工种任务统计" name="repairman-tasks" />
          <el-tab-pane label="未完成任务" name="uncompleted-tasks" />
        </el-tabs>
      </el-card>
    </div>

    <!-- 车型维修统计 -->
    <div v-if="activeTab === 'car-model-repairs'" class="stats-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>车型维修统计</span>
            <el-button type="primary" @click="loadCarModelRepairs" :loading="loading">
              <el-icon><Refresh /></el-icon>
              刷新数据
            </el-button>
          </div>
        </template>
        
        <el-table :data="carModelRepairs" v-loading="loading" style="width: 100%">
          <el-table-column prop="brand" label="品牌" width="120" />
          <el-table-column prop="model" label="型号" width="150" />
          <el-table-column prop="repairCount" label="维修次数" width="120" />
          <el-table-column prop="avgCost" label="平均费用" width="120">
            <template #default="scope">
              ¥{{ scope.row.avgCost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalCost" label="总费用" width="120">
            <template #default="scope">
              ¥{{ scope.row.totalCost?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>    <!-- 故障类型统计 -->
    <div v-if="activeTab === 'car-model-faults'" class="stats-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>故障类型统计</span>            <div class="filter-controls">
              <el-input 
                v-model="selectedBrand" 
                placeholder="请输入品牌" 
                style="width: 150px; margin-right: 10px;"
                clearable
                @keyup.enter="loadCarModelFaults"
              />
              <el-input 
                v-model="selectedModel" 
                placeholder="请输入型号" 
                style="width: 150px; margin-right: 10px;"
                clearable
                @keyup.enter="loadCarModelFaults"
              />
              <el-button type="primary" @click="loadCarModelFaults" :loading="loading">
                查询故障统计
              </el-button>
            </div>
          </div>
        </template>
        
        <div v-if="carModelFaults.length > 0">
          <div class="fault-summary">
            <h3>{{ selectedBrand }} {{ selectedModel }} 故障统计</h3>
          </div>
          <el-table :data="carModelFaults" style="width: 100%">
            <el-table-column prop="faultType" label="故障类型" />
            <el-table-column prop="occurrenceCount" label="出现次数" width="120" />
            <el-table-column prop="avgRepairCost" label="平均维修成本" width="150">
              <template #default="scope">
                ¥{{ scope.row.avgRepairCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-state">
          <el-empty description="请输入品牌和型号查看故障统计" />
        </div>
      </el-card>
    </div>

    <!-- 费用构成分析 -->
    <div v-if="activeTab === 'cost-analysis'" class="stats-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>费用构成分析</span>
            <div class="filter-controls">
              <el-date-picker
                v-model="dateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="margin-right: 10px;"
              />
              <el-radio-group v-model="analysisType" style="margin-right: 10px;">
                <el-radio-button label="monthly">按月统计</el-radio-button>
                <el-radio-button label="quarterly">按季度统计</el-radio-button>
              </el-radio-group>
              <el-button type="primary" @click="loadCostAnalysis" :loading="loading">
                分析费用构成
              </el-button>
            </div>
          </div>
        </template>
        
        <div v-if="costAnalysis.length > 0">
          <el-table :data="costAnalysis" style="width: 100%">
            <el-table-column prop="year" label="年份" width="80" />
            <el-table-column label="周期" width="100">
              <template #default="scope">
                <span v-if="analysisType === 'monthly'">{{ scope.row.month }}月</span>
                <span v-else>第{{ scope.row.quarter }}季度</span>
              </template>
            </el-table-column>
            <el-table-column prop="totalRecords" label="记录数" width="100" />
            <el-table-column prop="totalCost" label="总费用" width="120">
              <template #default="scope">
                ¥{{ scope.row.totalCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="totalMaterialCost" label="材料费" width="120">
              <template #default="scope">
                ¥{{ scope.row.totalMaterialCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="totalLaborCost" label="工时费" width="120">
              <template #default="scope">
                ¥{{ scope.row.totalLaborCost?.toFixed(2) || '0.00' }}
              </template>
            </el-table-column>
            <el-table-column prop="materialCostPercentage" label="材料费占比" width="120">
              <template #default="scope">
                {{ scope.row.materialCostPercentage?.toFixed(2) || '0.00' }}%
              </template>
            </el-table-column>
            <el-table-column prop="laborCostPercentage" label="工时费占比" width="120">
              <template #default="scope">
                {{ scope.row.laborCostPercentage?.toFixed(2) || '0.00' }}%
              </template>
            </el-table-column>
          </el-table>
        </div>
        <div v-else class="empty-state">
          <el-empty description="请选择日期范围和分析类型" />
        </div>
      </el-card>
    </div>

    <!-- 负面反馈分析 -->
    <div v-if="activeTab === 'negative-feedback'" class="stats-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>负面反馈分析</span>
            <div class="filter-controls">
              <el-input-number
                v-model="maxScore"
                :min="1"
                :max="5"
                :step="1"
                style="width: 120px; margin-right: 10px;"
              />
              <span style="margin-right: 10px;">分以下</span>
              <el-button type="primary" @click="loadNegativeFeedback" :loading="loading">
                查询负面反馈
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="negativeFeedback" v-loading="loading" style="width: 100%">
          <el-table-column prop="itemId" label="工单ID" width="80" />
          <el-table-column prop="itemName" label="维修项目" />
          <el-table-column prop="score" label="评分" width="100">
            <template #default="scope">
              <el-rate :model-value="scope.row.score" disabled size="small" />
            </template>
          </el-table-column>
          <el-table-column prop="carBrand" label="车辆品牌" width="100" />
          <el-table-column prop="carModel" label="车辆型号" width="120" />
          <el-table-column prop="licensePlate" label="车牌号" width="120" />
          <el-table-column prop="repairmanName" label="维修人员" width="100" />
          <el-table-column prop="repairmanType" label="工种" width="100">
            <template #default="scope">
              <el-tag>{{ getRepairmanTypeText(scope.row.repairmanType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="result" label="维修结果" min-width="200">
            <template #default="scope">
              <span :title="scope.row.result">
                {{ truncateText(scope.row.result, 50) }}
              </span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 工种任务统计 -->
    <div v-if="activeTab === 'repairman-tasks'" class="stats-content">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>工种任务统计</span>
            <div class="filter-controls">
              <el-date-picker
                v-model="taskDateRange"
                type="daterange"
                range-separator="至"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                format="YYYY-MM-DD"
                value-format="YYYY-MM-DD"
                style="margin-right: 10px;"
              />
              <el-button type="primary" @click="loadRepairmanTasks" :loading="loading">
                查询任务统计
              </el-button>
            </div>
          </div>
        </template>
        
        <el-table :data="repairmanTasks" v-loading="loading" style="width: 100%">
          <el-table-column prop="repairmanType" label="工种" width="120">
            <template #default="scope">
              <el-tag>{{ getRepairmanTypeText(scope.row.repairmanType) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="acceptedTasks" label="接受任务数" width="120" />
          <el-table-column prop="completedTasks" label="完成任务数" width="120" />
          <el-table-column prop="acceptedPercentage" label="接受任务占比" width="150">
            <template #default="scope">
              {{ scope.row.acceptedPercentage?.toFixed(2) || '0.00' }}%
            </template>
          </el-table-column>
          <el-table-column prop="completedPercentage" label="完成任务占比" width="150">
            <template #default="scope">
              {{ scope.row.completedPercentage?.toFixed(2) || '0.00' }}%
            </template>
          </el-table-column>
          <el-table-column label="完成率" width="120">
            <template #default="scope">
              <span v-if="scope.row.acceptedTasks > 0">
                {{ ((scope.row.completedTasks / scope.row.acceptedTasks) * 100).toFixed(2) }}%
              </span>
              <span v-else>0%</span>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 未完成任务统计 -->
    <div v-if="activeTab === 'uncompleted-tasks'" class="stats-content">
      <el-row :gutter="20">
        <!-- 总体概览 -->
        <el-col :span="24">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>未完成任务概览</span>
                <el-button type="primary" @click="loadUncompletedTasksOverview" :loading="loading">
                  <el-icon><Refresh /></el-icon>
                  刷新数据
                </el-button>
              </div>
            </template>
            
            <el-table :data="uncompletedOverview" style="width: 100%">
              <el-table-column prop="status" label="状态" width="120">
                <template #default="scope">
                  <el-tag :type="getStatusType(scope.row.status)">
                    {{ getStatusText(scope.row.status) }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="taskCount" label="任务数量" width="120" />
              <el-table-column prop="avgDaysPending" label="平均等待天数" width="150" />
            </el-table>
          </el-card>
        </el-col>

        <!-- 按工种统计 -->
        <el-col :span="12" style="margin-top: 20px;">
          <el-card>
            <template #header>
              <span>按工种统计未完成任务</span>
            </template>
            
            <el-table :data="uncompletedByType" style="width: 100%">
              <el-table-column prop="repairmanType" label="工种">
                <template #default="scope">
                  <el-tag>{{ getRepairmanTypeText(scope.row.repairmanType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="uncompletedTasks" label="未完成数" width="100" />
              <el-table-column prop="avgDaysPending" label="平均天数" width="100" />
            </el-table>
          </el-card>
        </el-col>

        <!-- 按维修人员统计 -->
        <el-col :span="12" style="margin-top: 20px;">
          <el-card>
            <template #header>
              <span>按维修人员统计未完成任务</span>
            </template>
            
            <el-table :data="uncompletedByRepairman" style="width: 100%" max-height="300">
              <el-table-column prop="repairmanName" label="姓名" width="80" />
              <el-table-column prop="repairmanType" label="工种" width="80">
                <template #default="scope">
                  <el-tag size="small">{{ getRepairmanTypeText(scope.row.repairmanType) }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="uncompletedTasks" label="未完成" width="80" />
              <el-table-column prop="avgDaysPending" label="平均天数" width="80" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Refresh } from '@element-plus/icons-vue'
import api from '../../utils/api'

const loading = ref(false)
const activeTab = ref('car-model-repairs')

// 车型维修统计
const carModelRepairs = ref([])

// 故障类型统计
const carModelFaults = ref([])
const selectedBrand = ref('')
const selectedModel = ref('')

// 费用构成分析
const costAnalysis = ref([])
const dateRange = ref([])
const analysisType = ref('monthly')

// 负面反馈分析
const negativeFeedback = ref([])
const maxScore = ref(3)

// 工种任务统计
const repairmanTasks = ref([])
const taskDateRange = ref([])

// 未完成任务统计
const uncompletedOverview = ref([])
const uncompletedByType = ref([])
const uncompletedByRepairman = ref([])

const getStatusType = (status) => {
  const statusMap = {
    'PENDING': 'warning',
    'IN_PROGRESS': 'primary'
  }
  return statusMap[status] || 'info'
}

const getStatusText = (status) => {
  const statusMap = {
    'PENDING': '待接受',
    'IN_PROGRESS': '进行中'
  }
  return statusMap[status] || status
}

const getRepairmanTypeText = (type) => {
  const typeMap = {
    'MECHANIC': '机修工',
    'ELECTRICIAN': '电工',
    'BODYWORKER': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒工',
    'INSPECTOR': '质检员',
    'DIAGNOSER': '故障诊断师'
  }
  return typeMap[type] || type
}

const truncateText = (text, maxLength) => {
  if (!text) return ''
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

const handleTabChange = (tabName) => {
  // 根据标签页切换加载相应数据
  switch (tabName) {
    case 'car-model-repairs':
      loadCarModelRepairs()
      break
    case 'uncompleted-tasks':
      loadUncompletedTasksOverview()
      loadUncompletedTasksByType()
      loadUncompletedTasksByRepairman()
      break
  }
}

const loadCarModelRepairs = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/statistics/car-model-repairs')
    
    if (response.data.success) {
      carModelRepairs.value = response.data.data
      ElMessage.success('车型维修统计加载成功')
    } else {
      ElMessage.error(response.data.message || '加载车型维修统计失败')
    }
  } catch (error) {
    console.error('加载车型维修统计失败:', error)
    ElMessage.error('加载车型维修统计失败')
  } finally {
    loading.value = false
  }
}

const loadCarModelFaults = async () => {
  if (!selectedBrand.value || !selectedModel.value) {
    ElMessage.warning('请输入品牌和型号')
    return
  }
  
  // 简单的输入验证
  if (selectedBrand.value.trim().length < 1 || selectedModel.value.trim().length < 1) {
    ElMessage.warning('品牌和型号不能为空')
    return
  }

  try {
    loading.value = true
    const response = await api.get(`/api/admin/statistics/car-model-faults?brand=${encodeURIComponent(selectedBrand.value.trim())}&model=${encodeURIComponent(selectedModel.value.trim())}`)
    
    if (response.data.success) {
      carModelFaults.value = response.data.data
      ElMessage.success('故障类型统计加载成功')
    } else {
      ElMessage.error(response.data.message || '加载故障类型统计失败')
    }
  } catch (error) {
    console.error('加载故障类型统计失败:', error)
    ElMessage.error('加载故障类型统计失败')
  } finally {
    loading.value = false
  }
}

const loadCostAnalysis = async () => {
  if (!dateRange.value || dateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  try {
    loading.value = true
    const endpoint = analysisType.value === 'monthly' 
      ? '/api/admin/statistics/monthly-cost-analysis'
      : '/api/admin/statistics/quarterly-cost-analysis'
    
    const response = await api.get(`${endpoint}?startDate=${dateRange.value[0]}&endDate=${dateRange.value[1]}`)
    
    if (response.data.success) {
      costAnalysis.value = response.data.data
      ElMessage.success('费用构成分析加载成功')
    } else {
      ElMessage.error(response.data.message || '加载费用构成分析失败')
    }
  } catch (error) {
    console.error('加载费用构成分析失败:', error)
    ElMessage.error('加载费用构成分析失败')
  } finally {
    loading.value = false
  }
}

const loadNegativeFeedback = async () => {
  try {
    loading.value = true
    const response = await api.get(`/api/admin/statistics/negative-feedback?maxScore=${maxScore.value}`)
    
    if (response.data.success) {
      negativeFeedback.value = response.data.data
      ElMessage.success('负面反馈分析加载成功')
    } else {
      ElMessage.error(response.data.message || '加载负面反馈分析失败')
    }
  } catch (error) {
    console.error('加载负面反馈分析失败:', error)
    ElMessage.error('加载负面反馈分析失败')
  } finally {
    loading.value = false
  }
}

const loadRepairmanTasks = async () => {
  if (!taskDateRange.value || taskDateRange.value.length !== 2) {
    ElMessage.warning('请选择日期范围')
    return
  }

  try {
    loading.value = true
    const response = await api.get(`/api/admin/statistics/repairman-type-tasks?startDate=${taskDateRange.value[0]}&endDate=${taskDateRange.value[1]}`)
    
    if (response.data.success) {
      repairmanTasks.value = response.data.data
      ElMessage.success('工种任务统计加载成功')
    } else {
      ElMessage.error(response.data.message || '加载工种任务统计失败')
    }
  } catch (error) {
    console.error('加载工种任务统计失败:', error)
    ElMessage.error('加载工种任务统计失败')
  } finally {
    loading.value = false
  }
}

const loadUncompletedTasksOverview = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/statistics/uncompleted-tasks-overview')
    
    if (response.data.success) {
      uncompletedOverview.value = response.data.data
    }
  } catch (error) {
    console.error('加载未完成任务概览失败:', error)
  } finally {
    loading.value = false
  }
}

const loadUncompletedTasksByType = async () => {
  try {
    const response = await api.get('/api/admin/statistics/uncompleted-tasks-by-type')
    
    if (response.data.success) {
      uncompletedByType.value = response.data.data
    }
  } catch (error) {
    console.error('加载工种未完成任务统计失败:', error)
  }
}

const loadUncompletedTasksByRepairman = async () => {
  try {
    const response = await api.get('/api/admin/statistics/uncompleted-tasks-by-repairman')
    
    if (response.data.success) {
      uncompletedByRepairman.value = response.data.data
    }
  } catch (error) {
    console.error('加载维修人员未完成任务统计失败:', error)
  }
}

onMounted(() => {
  loadCarModelRepairs()
})
</script>

<style scoped>
.statistics-container {
  padding: 24px;
  background-color: #f5f7fa;
  min-height: 100vh;
}

.page-header {
  margin-bottom: 24px;
}

.page-header h1 {
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 8px;
}

.page-header p {
  color: #7f8c8d;
  font-size: 14px;
}

.stats-tabs {
  margin-bottom: 24px;
}

.stats-content {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.filter-controls {
  display: flex;
  align-items: center;
}

.fault-summary {
  margin-bottom: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 4px;
}

.fault-summary h3 {
  color: #2c3e50;
  margin: 0;
}

.empty-state {
  padding: 40px;
  text-align: center;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}

:deep(.el-tabs__content) {
  padding: 0;
}
</style>
