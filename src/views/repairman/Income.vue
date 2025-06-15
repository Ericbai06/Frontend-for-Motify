<template>
  <div class="income-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>收入统计</h2>
        <div class="header-actions">
          <el-date-picker
            v-model="dateRange"
            type="daterange"
            range-separator="至"
            start-placeholder="开始日期"
            end-placeholder="结束日期"
            style="margin-right: 12px;"
            @change="loadIncomeData"
          />
          <el-button @click="exportIncomeData">
            <el-icon><Download /></el-icon>
            导出报表
          </el-button>
        </div>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else>
        <!-- 收入概览 -->
        <div class="income-overview">
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#27ae60"><Money /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ formatCurrency(incomeData.totalIncome || 0) }}</h3>
              <p>总收入</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#409eff"><List /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ incomeData.totalWorkOrders || 0 }}</h3>
              <p>完成工单</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#e6a23c"><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ (incomeData.totalWorkHours || 0).toFixed(1) }}</h3>
              <p>总工时</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#f56c6c"><TrendCharts /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ formatCurrency(averageIncome) }}</h3>
              <p>平均收入</p>
            </div>
          </div>
        </div>

        <!-- 个人信息 -->
        <div class="personal-info-section">
          <h3>个人信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">姓名：</span>
              <span>{{ incomeData.repairmanName || authStore.user?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">工种：</span>
              <el-tag type="info">{{ formatRepairmanType(incomeData.repairmanType) }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">时薪：</span>
              <span class="hourly-rate">{{ formatCurrency(incomeData.hourlyRate || 0) }}/小时</span>
            </div>
          </div>
        </div>

        <!-- 月度收入趋势 -->
        <div class="trend-section">
          <h3>月度收入趋势</h3>
          <div class="trend-chart">
            <div v-if="monthlyData.length === 0" class="no-data">
              <el-empty description="暂无数据" />
            </div>
            <div v-else class="chart-container">
              <!-- 这里可以集成图表库，如 ECharts -->
              <div class="simple-chart">
                <div v-for="(month, index) in monthlyData" :key="index" class="chart-bar">
                  <div 
                    class="bar" 
                    :style="{ height: `${(month.income / maxMonthlyIncome) * 100}%` }"
                  ></div>
                  <div class="bar-label">{{ month.month }}</div>
                  <div class="bar-value">{{ formatCurrency(month.income) }}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 收入明细 -->
        <div class="income-details">
          <h3>收入明细</h3>
          <el-table :data="incomeDetails" style="width: 100%">
            <el-table-column prop="date" label="日期" width="120">
              <template #default="{ row }">
                {{ formatDate(row.date) }}
              </template>
            </el-table-column>
            <el-table-column prop="workOrder" label="工单" />
            <el-table-column prop="workHours" label="工时" width="100">
              <template #default="{ row }">
                {{ formatWorkTime(row.workHours) }}
              </template>
            </el-table-column>
            <el-table-column prop="hourlyRate" label="时薪" width="120">
              <template #default="{ row }">
                {{ formatCurrency(row.hourlyRate) }}
              </template>
            </el-table-column>
            <el-table-column prop="income" label="收入" width="120">
              <template #default="{ row }">
                <span class="income-amount">{{ formatCurrency(row.income) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="status" label="状态" width="100">
              <template #default="{ row }">
                <el-tag :type="row.status === 'paid' ? 'success' : 'warning'" size="small">
                  {{ row.status === 'paid' ? '已结算' : '待结算' }}
                </el-tag>
              </template>
            </el-table-column>
          </el-table>
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
import { formatDateTime, formatDate, formatCurrency, formatRepairmanType } from '../../utils/format'

const authStore = useAuthStore()

const loading = ref(false)
const dateRange = ref([])

const incomeData = reactive({
  totalIncome: 0,
  totalWorkOrders: 0,
  totalWorkHours: 0,
  repairmanName: '',
  repairmanType: '',
  hourlyRate: 0
})

const monthlyData = ref([])
const incomeDetails = ref([])

const averageIncome = computed(() => {
  if (incomeData.totalWorkOrders === 0) return 0
  return incomeData.totalIncome / incomeData.totalWorkOrders
})

const maxMonthlyIncome = computed(() => {
  if (monthlyData.value.length === 0) return 0
  return Math.max(...monthlyData.value.map(m => m.income))
})

const loadIncomeData = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    // 构建查询参数
    let queryParams = ''
    if (dateRange.value && dateRange.value.length === 2) {
      const [startDate, endDate] = dateRange.value
      queryParams = `?startDate=${startDate.toISOString().split('T')[0]}&endDate=${endDate.toISOString().split('T')[0]}`
    }

    const response = await api.get(`/api/repairman/${repairmanId}/income${queryParams}`)
    if (response.data.code === 200) {
      const data = response.data.data
      Object.assign(incomeData, data)
      
      // 计算总工时（这里使用模拟数据，实际应该从API获取）
      incomeData.totalWorkHours = incomeData.totalWorkOrders * 2.5
    }

    // 加载月度数据（模拟数据）
    loadMonthlyData()
    
    // 加载收入明细（模拟数据）
    loadIncomeDetails()
  } catch (error) {
    console.error('Failed to load income data:', error)
  } finally {
    loading.value = false
  }
}

const loadMonthlyData = () => {
  // 模拟月度收入数据
  const months = ['1月', '2月', '3月', '4月', '5月', '6月']
  monthlyData.value = months.map(month => ({
    month,
    income: Math.random() * 5000 + 2000 // 随机生成2000-7000的收入
  }))
}

const loadIncomeDetails = () => {
  // 模拟收入明细数据
  incomeDetails.value = [
    {
      date: new Date('2024-06-01'),
      workOrder: '发动机维修',
      workHours: 3.5,
      hourlyRate: incomeData.hourlyRate || 80,
      income: 280,
      status: 'paid'
    },
    {
      date: new Date('2024-06-02'),
      workOrder: '刹车片更换',
      workHours: 2.0,
      hourlyRate: incomeData.hourlyRate || 80,
      income: 160,
      status: 'paid'
    },
    {
      date: new Date('2024-06-03'),
      workOrder: '轮胎更换',
      workHours: 1.5,
      hourlyRate: incomeData.hourlyRate || 80,
      income: 120,
      status: 'pending'
    }
  ]
}

const exportIncomeData = () => {
  // 导出收入报表
  const csvContent = [
    ['日期', '工单', '工时', '时薪', '收入', '状态'].join(','),
    ...incomeDetails.value.map(item => [
      formatDate(item.date),
      item.workOrder,
      `${item.workHours}小时`,
      formatCurrency(item.hourlyRate),
      formatCurrency(item.income),
      item.status === 'paid' ? '已结算' : '待结算'
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', `收入报表_${new Date().toISOString().split('T')[0]}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('收入报表导出成功')
}

const formatCurrency = (amount) => {
  return `¥${(amount || 0).toFixed(2)}`
}

// 格式化工时显示（分钟转换为小时分钟）
const formatWorkTime = (minutes) => {
  if (!minutes) return '0分钟'
  
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60)
    const remainingMinutes = minutes % 60
    return remainingMinutes > 0 ? `${hours}小时${remainingMinutes}分钟` : `${hours}小时`
  }
  
  return `${minutes}分钟`
}

onMounted(() => {
  loadIncomeData()
})
</script>

<style scoped>
.income-page {
  max-width: 1200px;
  margin: 0 auto;
}

.header-actions {
  display: flex;
  align-items: center;
}

.income-overview {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.overview-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.overview-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.overview-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.overview-content h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #2c3e50;
}

.overview-content p {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.personal-info-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.personal-info-section h3 {
  margin: 0 0 16px 0;
  color: #2c3e50;
  font-weight: 600;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 16px;
}

.info-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-weight: 500;
  color: #909399;
  min-width: 60px;
}

.hourly-rate {
  color: #27ae60;
  font-weight: 600;
}

.trend-section {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  margin-bottom: 24px;
}

.trend-section h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-weight: 600;
}

.chart-container {
  height: 300px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.simple-chart {
  display: flex;
  align-items: end;
  gap: 20px;
  height: 200px;
  width: 100%;
  justify-content: center;
}

.chart-bar {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 60px;
}

.bar {
  width: 40px;
  background: linear-gradient(to top, #27ae60, #2ecc71);
  border-radius: 4px 4px 0 0;
  min-height: 10px;
  margin-bottom: 8px;
}

.bar-label {
  font-size: 12px;
  color: #909399;
  margin-bottom: 4px;
}

.bar-value {
  font-size: 12px;
  font-weight: 600;
  color: #27ae60;
}

.income-details {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
}

.income-details h3 {
  margin: 0 0 20px 0;
  color: #2c3e50;
  font-weight: 600;
}

.income-amount {
  color: #27ae60;
  font-weight: 600;
}

.no-data {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}

:deep(.el-table) {
  border-radius: 8px;
  overflow: hidden;
}

:deep(.el-table th) {
  background-color: #fafafa;
  font-weight: 600;
}
</style>