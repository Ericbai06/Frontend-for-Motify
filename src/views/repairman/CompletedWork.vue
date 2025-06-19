<template>
  <div class="completed-work-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>已完成工作</h2>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-right: 12px;"
            @change="loadCompletedWork"
          />
          <el-button @click="exportData">
            <el-icon><Download /></el-icon>
            导出数据
          </el-button>
        </div>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="completedWork.length === 0" class="empty-state">
        <el-empty description="暂无已完成的工作" />
      </div>

      <div v-else>
        <!-- 统计信息 -->
        <div class="stats-section">
          <div class="stat-item">
            <span class="stat-label">完成工单：</span>
            <span class="stat-value">{{ completedWork.length }} 个</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总收入：</span>
            <span class="stat-value income">{{ formatCurrency(totalIncome) }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">总工时：</span>
            <span class="stat-value">{{ totalWorkHours }} 小时</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">平均评分：</span>
            <span class="stat-value">
              <el-rate v-model="averageRating" disabled size="small" />
              {{ averageRating.toFixed(1) }}
            </span>
          </div>
        </div>

        <!-- 工作列表 -->
        <div class="work-list">
          <div v-for="work in completedWork" :key="work.itemId" class="work-card">
            <div class="work-header">
              <div class="work-title">
                <h3>{{ work.name }}</h3>
                <el-tag type="success" size="small">已完成</el-tag>
              </div>
              <div class="work-meta">
                <span class="text-muted">完成时间：{{ formatDateTime(work.completeTime) }}</span>
              </div>
            </div>

            <div class="work-content">
              <p class="description">{{ work.description }}</p>
              
              <div class="work-details">
                <div class="detail-item">
                  <span class="label">车辆：</span>
                  <span>{{ work.car?.brand }} {{ work.car?.model }} ({{ work.car?.licensePlate }})</span>
                </div>
                
                <div class="detail-item">
                  <span class="label">维修结果：</span>
                  <span>{{ work.result || '无' }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="label">个人工时费：</span>
                  <span class="income">{{ formatCurrency(work.personalLaborCost || 0) }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="label">工时费：</span>
                  <span class="income">{{ formatCurrency(work.laborCost || 0) }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="label">材料费：</span>
                  <span>{{ formatCurrency(work.materialCost || 0) }}</span>
                </div>
                
                <div class="detail-item">
                  <span class="label">总费用：</span>
                  <span class="total-cost">{{ formatCurrency(work.cost || 0) }}</span>
                </div>
                
                <div v-if="work.score" class="detail-item">
                  <span class="label">用户评分：</span>
                  <div class="rating-display">
                    <el-rate v-model="work.score" disabled size="small" />
                    <span class="rating-text">{{ work.score }}分</span>
                  </div>
                </div>
              </div>

              <div class="work-timeline">
                <div class="timeline-item">
                  <span class="timeline-label">创建时间：</span>
                  <span>{{ formatDateTime(work.createTime) }}</span>
                </div>
                <div v-if="work.updateTime" class="timeline-item">
                  <span class="timeline-label">最后更新：</span>
                  <span>{{ formatDateTime(work.updateTime) }}</span>
                </div>
                <div class="timeline-item">
                  <span class="timeline-label">完成时间：</span>
                  <span>{{ formatDateTime(work.completeTime) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency, formatWorkMinutes } from '../../utils/format'

const authStore = useAuthStore()

const completedWork = ref([])
const loading = ref(false)
const dateRange = ref([])
const hourlyRate = ref(0)

const totalIncome = computed(() => {
  return completedWork.value.reduce((sum, work) => sum + (work.personalLaborCost || 0), 0)
})

const totalWorkMinutes = computed(() => {
  // 如果后端提供工时数据，则使用实际数据计算
  // 这里需要根据实际的工时数据计算，暂时使用模拟数据（假设每个工单平均150分钟）
  return completedWork.value.length * 150 
})

const totalWorkHours = computed(() => {
  if (!hourlyRate.value || hourlyRate.value === 0) return '-'
  return (totalIncome.value / hourlyRate.value).toFixed(2)
})

const averageRating = computed(() => {
  const ratedWork = completedWork.value.filter(work => work.score)
  if (ratedWork.length === 0) return 0
  const totalScore = ratedWork.reduce((sum, work) => sum + work.score, 0)
  return totalScore / ratedWork.length
})

const loadCompletedWork = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    const response = await api.post('/api/repairman/completed-records', { repairmanId })
    
    if (response.data.code === 200) {
      // 确保响应数据存在
      const responseData = response.data.data || []
      console.log('API原始响应数据:', responseData)
      
      // 处理新的数据结构：将item和personalLaborCost合并
      let work = responseData.map(record => {
        if (!record || !record.item) {
          console.warn('记录缺少item字段:', record)
          return null
        }
        
        // 从嵌套的item对象中提取属性并添加personalLaborCost
        return {
          ...record.item,
          personalLaborCost: record.personalLaborCost || 0
        }
      }).filter(item => item !== null) // 过滤掉无效数据
      
      // 根据日期范围筛选
      if (dateRange.value && dateRange.value.length === 2) {
        const [startDate, endDate] = dateRange.value
        work = work.filter(item => {
          const completeTime = new Date(item.completeTime || item.createTime)
          return completeTime >= startDate && completeTime <= endDate
        })
      }
      
      // 确保所有工单对象都有必要的字段，防止undefined或null值导致显示问题
      completedWork.value = work.map(item => ({
        ...item,
        // 设置默认值，避免undefined
        personalLaborCost: item.personalLaborCost || 0,
        laborCost: item.laborCost || 0,
        materialCost: item.materialCost || 0,
        cost: item.cost || 0,
        score: item.score || 0,
        result: item.result || '无',
        completeTime: item.completeTime || item.updateTime || item.createTime,
        // 确保car对象存在
        car: item.car || { brand: '未知', model: '未知', licensePlate: '未知' }
      })).sort((a, b) => 
        new Date(b.completeTime || b.createTime) - new Date(a.completeTime || a.createTime)
      )

      // 调试输出处理后的数据
      console.log('处理后的工单数据:', completedWork.value)
    } else {
      console.error('API响应错误:', response.data)
      ElMessage.error(response.data.message || '获取已完成工作数据失败')
    }
  } catch (error) {
    console.error('Failed to load completed work:', error)
    ElMessage.error('获取已完成工作数据失败')
  } finally {
    loading.value = false
  }
}

const loadHourlyRate = async () => {
  try {
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return
    const response = await api.post('/api/repairman/info', { repairmanId })
    if (response.data.code === 200) {
      hourlyRate.value = response.data.data.hourlyRate || 0
    }
  } catch (error) {
    console.error('Failed to load hourly rate:', error)
  }
}

const exportData = () => {
  // 导出功能的简单实现
  const csvContent = [
    ['工单名称', '车辆', '完成时间', '个人工时费', '工时费', '材料费', '总费用', '用户评分'].join(','),
    ...completedWork.value.map(work => [
      work.name,
      `${work.car?.brand} ${work.car?.model} (${work.car?.licensePlate})`,
      formatDateTime(work.completeTime),
      work.personalLaborCost || 0,
      work.laborCost || 0,
      work.materialCost || 0,
      work.cost || 0,
      work.score || '未评分'
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `已完成工作_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('数据导出成功')
}

onMounted(() => {
  loadCompletedWork()
  loadHourlyRate()
})
</script>

<style scoped>
.completed-work-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
}

.stats-section {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.stat-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.stat-value.income {
  color: #27ae60;
}

.work-list {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.work-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  border-left: 4px solid #67c23a;
  transition: transform 0.3s, box-shadow 0.3s;
}

.work-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.work-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.work-title {
  display: flex;
  align-items: center;
  gap: 12px;
}

.work-title h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.work-meta {
  color: #7f8c8d;
  font-size: 14px;
}

.work-content {
  margin-bottom: 20px;
}

.description {
  color: #606266;
  margin-bottom: 16px;
  line-height: 1.6;
}

.work-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 12px;
  margin-bottom: 20px;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #909399;
  min-width: 80px;
}

.income {
  color: #27ae60;
  font-weight: 600;
}

.total-cost {
  color: #e6a23c;
  font-weight: 600;
  font-size: 16px;
}

.rating-display {
  display: flex;
  align-items: center;
  gap: 8px;
}

.rating-text {
  font-size: 14px;
  color: #606266;
}

.work-timeline {
  background: #f8f9fa;
  border-radius: 6px;
  padding: 16px;
  border-left: 3px solid #67c23a;
}

.timeline-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.timeline-item:last-child {
  margin-bottom: 0;
}

.timeline-label {
  font-weight: 500;
  color: #909399;
  min-width: 80px;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
</style>