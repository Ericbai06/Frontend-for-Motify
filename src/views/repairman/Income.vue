<template>
  <div class="income-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>收入统计</h2>
        <div class="header-actions">
          <el-date-picker
            v-model="yearFilter"
            type="year"
            placeholder="选择年份"
            style="margin-right: 12px;"
            @change="handleYearChange"
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
              <h3>{{ formatCurrency(summaryData.totalIncome || 0) }}</h3>
              <p>总收入</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#409eff"><List /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ summaryData.totalMonths || 0 }}</h3>
              <p>工作月数</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#e6a23c"><Clock /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ (summaryData.totalWorkHours || 0).toFixed(1) }}</h3>
              <p>总工时</p>
            </div>
          </div>
          
          <div class="overview-card">
            <div class="overview-icon">
              <el-icon size="32" color="#f56c6c"><TrendCharts /></el-icon>
            </div>
            <div class="overview-content">
              <h3>{{ formatCurrency(summaryData.averageMonthlyIncome || 0) }}</h3>
              <p>月均收入</p>
            </div>
          </div>
        </div>

        <!-- 个人信息 -->
        <div class="personal-info-section">
          <h3>个人信息</h3>
          <div class="info-grid">
            <div class="info-item">
              <span class="label">姓名：</span>
              <span>{{ yearlyData.repairmanName || authStore.user?.name }}</span>
            </div>
            <div class="info-item">
              <span class="label">工种：</span>
              <el-tag type="info">{{ formatRepairmanType(yearlyData.repairmanType) }}</el-tag>
            </div>
            <div class="info-item">
              <span class="label">时薪：</span>
              <span class="hourly-rate">{{ formatCurrency(yearlyData.hourlyRate || 0) }}/小时</span>
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
            <el-table-column prop="year" label="年份" width="80" />
            <el-table-column prop="month" label="月份" width="80">
              <template #default="{ row }">
                {{ row.month }}月
              </template>
            </el-table-column>
            <el-table-column prop="totalWorkHours" label="工时" width="100">
              <template #default="{ row }">
                {{ row.totalWorkHours.toFixed(1) }}小时
              </template>
            </el-table-column>
            <el-table-column prop="hourlyRate" label="时薪" width="120">
              <template #default="{ row }">
                {{ formatCurrency(row.hourlyRate) }}
              </template>
            </el-table-column>
            <el-table-column prop="totalIncome" label="收入" width="120">
              <template #default="{ row }">
                <span class="income-amount">{{ formatCurrency(row.totalIncome) }}</span>
              </template>
            </el-table-column>
            <el-table-column prop="settlementDate" label="结算日期" width="180">
              <template #default="{ row }">
                {{ formatDateTime(row.settlementDate) }}
              </template>
            </el-table-column>
            <el-table-column label="状态" width="100">
              <template #default>
                <el-tag type="success" size="small">已结算</el-tag>
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
const yearFilter = ref(2024)

// 收入摘要数据
const summaryData = reactive({
  totalIncome: 0,
  totalWorkHours: 0,
  totalMonths: 0,
  averageMonthlyIncome: 0,
  recent3MonthsIncome: 0,
  highestMonth: '',
  highestMonthIncome: 0,
  lowestMonth: '',
  lowestMonthIncome: 0,
  yearlyTrend: {}
})

// 年度数据
const yearlyData = reactive({
  year: new Date().getFullYear(),
  totalIncome: 0,
  totalWorkHours: 0,
  averageMonthlyIncome: 0,
  averageHourlyRate: 0,
  highestMonth: 0,
  highestMonthIncome: 0,
  workingMonths: 0,
  monthlyDetails: [],
  repairmanName: '',
  repairmanType: '',
  hourlyRate: 0
})

const monthlyData = ref([])
const incomeDetails = ref([])

const maxMonthlyIncome = computed(() => {
  if (monthlyData.value.length === 0) return 0
  return Math.max(...monthlyData.value.map(m => m.income))
})

const handleYearChange = (year) => {
  if (year) {
    // 确保yearFilter是整数年份而不是Date对象
    yearFilter.value = year instanceof Date ? year.getFullYear() : year
    loadYearlyStats()
  }
}

const loadSummaryData = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    const response = await api.get(`/api/wages/my/summary?repairmanId=${repairmanId}`)
    if (response.data.code === 200) {
      Object.assign(summaryData, response.data.data)
    }
  } catch (error) {
    console.error('Failed to load summary data:', error)
    ElMessage.error('加载收入摘要失败')
  } finally {
    loading.value = false
  }
}

const loadYearlyStats = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    // 确保year是整数
    const year = yearFilter.value instanceof Date ? yearFilter.value.getFullYear() : yearFilter.value
    const response = await api.get(`/api/wages/my/yearly-stats?repairmanId=${repairmanId}&year=${year}`)
    
    if (response.data.code === 200) {
      const data = response.data.data
      Object.assign(yearlyData, data)
      
      // 处理月度数据用于图表展示
      processMonthlyData()
    }
  } catch (error) {
    console.error('Failed to load yearly stats:', error)
    ElMessage.error('加载年度统计失败')
  } finally {
    loading.value = false
  }
}

const processMonthlyData = () => {
  // 清空原有数据
  monthlyData.value = []
  
  // 如果有月度明细数据
  if (yearlyData.monthlyDetails && yearlyData.monthlyDetails.length > 0) {
    // 转换为图表数据格式
    monthlyData.value = yearlyData.monthlyDetails.map(detail => ({
      month: `${detail.month}月`,
      income: detail.totalIncome
    }))
    
    // 设置收入明细
    incomeDetails.value = yearlyData.monthlyDetails
  }
}

const exportIncomeData = () => {
  // 导出收入报表
  const csvContent = [
    ['年份', '月份', '工时', '时薪', '收入', '结算日期'].join(','),
    ...incomeDetails.value.map(item => [
      item.year,
      `${item.month}月`,
      `${item.totalWorkHours.toFixed(1)}小时`,
      formatCurrency(item.hourlyRate),
      formatCurrency(item.totalIncome),
      formatDateTime(item.settlementDate)
    ].join(','))
  ].join('\n')

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  // 确保使用整数年份
  const year = yearFilter.value instanceof Date ? yearFilter.value.getFullYear() : yearFilter.value
  link.setAttribute('download', `收入报表_${year}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  
  ElMessage.success('收入报表导出成功')
}

onMounted(() => {
  loadSummaryData()
  loadYearlyStats()
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