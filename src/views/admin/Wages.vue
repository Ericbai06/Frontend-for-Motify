<template>
  <div class="wages-container">
    <div class="page-header">
      <h1>工资管理</h1>
      <p>查看维修人员工时费发放记录</p>
    </div>

    <!-- 搜索和过滤 -->
    <div class="search-section">
      <el-card>
        <el-row :gutter="20">
          <el-col :span="6">
            <el-input
              v-model="searchKeyword"
              placeholder="搜索维修人员姓名"
              @keyup.enter="handleSearch"
              clearable
            >
              <template #prefix>
                <el-icon><Search /></el-icon>
              </template>
            </el-input>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedYear" placeholder="选择年份" clearable>
              <el-option label="全部年份" value="" />
              <el-option 
                v-for="year in uniqueYears" 
                :key="year" 
                :label="year" 
                :value="year" 
              />
            </el-select>
          </el-col>
          <el-col :span="4">
            <el-select v-model="selectedMonth" placeholder="选择月份" clearable>
              <el-option label="全部月份" value="" />
              <el-option 
                v-for="month in 12" 
                :key="month" 
                :label="`${month}月`" 
                :value="month" 
              />
            </el-select>
          </el-col>
          <el-col :span="6">
            <el-button type="primary" @click="handleSearch" :loading="loading">
              <el-icon><Search /></el-icon>
              搜索
            </el-button>
            <el-button @click="resetSearch">重置</el-button>
          </el-col>
          <el-col :span="4" class="text-right">
            <el-button type="success" @click="exportWages">
              <el-icon><Download /></el-icon>
              导出数据
            </el-button>
          </el-col>
        </el-row>
      </el-card>
    </div>

    <!-- 统计卡片 -->
    <div class="statistics-cards">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon total-icon">
                <el-icon><Money /></el-icon>
              </div>
              <div class="stat-info">
                <h3>¥{{ totalIncome.toFixed(2) }}</h3>
                <p>总收入</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon hours-icon">
                <el-icon><Clock /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ totalWorkHours.toFixed(2) }}</h3>
                <p>总工时（小时）</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon avg-icon">
                <el-icon><TrendCharts /></el-icon>
              </div>
              <div class="stat-info">
                <h3>¥{{ avgHourlyRate.toFixed(2) }}</h3>
                <p>平均时薪</p>
              </div>
            </div>
          </el-card>
        </el-col>
        <el-col :span="6">
          <el-card class="stat-card">
            <div class="stat-content">
              <div class="stat-icon count-icon">
                <el-icon><User /></el-icon>
              </div>
              <div class="stat-info">
                <h3>{{ uniqueRepairmenCount }}</h3>
                <p>维修人员数</p>
              </div>
            </div>
          </el-card>
        </el-col>
      </el-row>
    </div>

    <!-- 工资记录列表 -->
    <div class="wages-table">
      <el-card>
        <template #header>
          <div class="card-header">
            <span>工资发放记录</span>
            <span class="total-count">总计: {{ totalCount }} 条记录</span>
          </div>
        </template>

        <el-table
          :data="filteredWages"
          v-loading="loading"
          style="width: 100%"
          stripe
          border
        >
          <el-table-column prop="id" label="记录ID" width="80" />
          <el-table-column prop="repairmanName" label="维修人员" width="120">
            <template #default="scope">
              <el-tag>{{ scope.row.repairmanName }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="repairmanType" label="工种" width="120">
            <template #default="scope">
              <el-tag :type="getTypeColor(scope.row.repairmanType)">
                {{ getTypeText(scope.row.repairmanType) }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="年月" width="100">
            <template #default="scope">
              {{ scope.row.year }}-{{ String(scope.row.month).padStart(2, '0') }}
            </template>
          </el-table-column>
          <el-table-column prop="totalWorkHours" label="工作时长" width="120">
            <template #default="scope">
              {{ scope.row.totalWorkHours?.toFixed(2) || '0.00' }} 小时
            </template>
          </el-table-column>
          <el-table-column prop="hourlyRate" label="时薪" width="100">
            <template #default="scope">
              ¥{{ scope.row.hourlyRate?.toFixed(2) || '0.00' }}
            </template>
          </el-table-column>
          <el-table-column prop="totalIncome" label="总收入" width="120">
            <template #default="scope">
              <span class="income-amount">
                ¥{{ scope.row.totalIncome?.toFixed(2) || '0.00' }}
              </span>
            </template>
          </el-table-column>
          <el-table-column prop="settlementDate" label="结算时间" width="180">
            <template #default="scope">
              {{ formatDateTime(scope.row.settlementDate) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" width="120" fixed="right">
            <template #default="scope">
              <el-button
                type="primary"
                size="small"
                @click="viewWageDetail(scope.row)"
              >
                查看详情
              </el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-card>
    </div>

    <!-- 工资详情对话框 -->
    <el-dialog
      v-model="wageDetailVisible"
      title="工资详细信息"
      width="600px"
    >
      <div v-if="selectedWage" class="wage-detail">
        <el-descriptions :column="2" border>
          <el-descriptions-item label="记录ID">
            {{ selectedWage.id }}
          </el-descriptions-item>
          <el-descriptions-item label="维修人员ID">
            {{ selectedWage.repairmanId }}
          </el-descriptions-item>
          <el-descriptions-item label="维修人员姓名">
            <el-tag>{{ selectedWage.repairmanName }}</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="工种">
            <el-tag :type="getTypeColor(selectedWage.repairmanType)">
              {{ getTypeText(selectedWage.repairmanType) }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="年份">
            {{ selectedWage.year }}
          </el-descriptions-item>
          <el-descriptions-item label="月份">
            {{ selectedWage.month }}月
          </el-descriptions-item>
          <el-descriptions-item label="工作时长">
            {{ selectedWage.totalWorkHours?.toFixed(2) || '0.00' }} 小时
          </el-descriptions-item>
          <el-descriptions-item label="时薪标准">
            ¥{{ selectedWage.hourlyRate?.toFixed(2) || '0.00' }}
          </el-descriptions-item>
          <el-descriptions-item label="总收入" :span="2">
            <span class="income-highlight">
              ¥{{ selectedWage.totalIncome?.toFixed(2) || '0.00' }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="结算时间" :span="2">
            {{ formatDateTime(selectedWage.settlementDate) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
      <template #footer>
        <el-button @click="wageDetailVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { Search, Download, Money, Clock, TrendCharts, User } from '@element-plus/icons-vue'
import api from '../../utils/api'
import { formatDateTime } from '../../utils/format'

const loading = ref(false)
const wages = ref([])
const searchKeyword = ref('')
const selectedYear = ref('')
const selectedMonth = ref('')
const wageDetailVisible = ref(false)
const selectedWage = ref(null)

const totalCount = computed(() => wages.value.length)

const uniqueYears = computed(() => {
  const years = wages.value.map(wage => wage.year)
  return [...new Set(years)].sort((a, b) => b - a)
})

const filteredWages = computed(() => {
  let filtered = wages.value
  
  // 按关键词搜索
  if (searchKeyword.value) {
    const keyword = searchKeyword.value.toLowerCase()
    filtered = filtered.filter(wage => 
      wage.repairmanName?.toLowerCase().includes(keyword)
    )
  }
  
  // 按年份过滤
  if (selectedYear.value) {
    filtered = filtered.filter(wage => wage.year === selectedYear.value)
  }
  
  // 按月份过滤
  if (selectedMonth.value) {
    filtered = filtered.filter(wage => wage.month === selectedMonth.value)
  }
  
  return filtered
})

const totalIncome = computed(() => {
  return filteredWages.value.reduce((sum, wage) => sum + (wage.totalIncome || 0), 0)
})

const totalWorkHours = computed(() => {
  return filteredWages.value.reduce((sum, wage) => sum + (wage.totalWorkHours || 0), 0)
})

const avgHourlyRate = computed(() => {
  if (filteredWages.value.length === 0) return 0
  const totalRate = filteredWages.value.reduce((sum, wage) => sum + (wage.hourlyRate || 0), 0)
  return totalRate / filteredWages.value.length
})

const uniqueRepairmenCount = computed(() => {
  const repairmenIds = filteredWages.value.map(wage => wage.repairmanId)
  return new Set(repairmenIds).size
})

const getTypeText = (type) => {
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

const getTypeColor = (type) => {
  const colorMap = {
    'MECHANIC': 'primary',
    'ELECTRICIAN': 'warning',
    'BODYWORKER': 'success',
    'PAINTER': 'danger',
    'APPRENTICE': 'info',
    'INSPECTOR': '',
    'DIAGNOSER': 'primary'
  }
  return colorMap[type] || ''
}

const loadWages = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/wages')
    
    if (response.data.success) {
      wages.value = response.data.data
      ElMessage.success(`成功加载 ${response.data.count} 条工资记录`)
    } else {
      ElMessage.error(response.data.message || '加载工资记录失败')
    }
  } catch (error) {
    console.error('加载工资记录失败:', error)
    ElMessage.error('加载工资记录失败')
  } finally {
    loading.value = false
  }
}

const handleSearch = () => {
  ElMessage.success(`找到 ${filteredWages.value.length} 条匹配的记录`)
}

const resetSearch = () => {
  searchKeyword.value = ''
  selectedYear.value = ''
  selectedMonth.value = ''
  ElMessage.info('已重置搜索条件')
}

const viewWageDetail = (wage) => {
  selectedWage.value = wage
  wageDetailVisible.value = true
}

const exportWages = () => {
  const csvContent = generateCSV(filteredWages.value)
  downloadCSV(csvContent, 'wages.csv')
  ElMessage.success('工资记录数据导出成功')
}

const generateCSV = (data) => {
  const headers = ['记录ID', '维修人员', '工种', '年份', '月份', '工作时长', '时薪', '总收入', '结算时间']
  const csvArray = [headers]
  
  data.forEach(wage => {
    csvArray.push([
      wage.id,
      wage.repairmanName,
      getTypeText(wage.repairmanType),
      wage.year,
      wage.month,
      `${wage.totalWorkHours?.toFixed(2) || '0.00'}小时`,
      wage.hourlyRate?.toFixed(2) || '0.00',
      wage.totalIncome?.toFixed(2) || '0.00',
      formatDateTime(wage.settlementDate)
    ])
  })
  
  return csvArray.map(row => 
    row.map(field => `"${field}"`).join(',')
  ).join('\n')
}

const downloadCSV = (content, filename) => {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  const url = URL.createObjectURL(blob)
  link.setAttribute('href', url)
  link.setAttribute('download', filename)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

onMounted(() => {
  loadWages()
})
</script>

<style scoped>
.wages-container {
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

.search-section {
  margin-bottom: 24px;
}

.statistics-cards {
  margin-bottom: 24px;
}

.stat-card {
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-content {
  display: flex;
  align-items: center;
  padding: 8px 0;
}

.stat-icon {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 16px;
  font-size: 20px;
  color: white;
}

.total-icon {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.hours-icon {
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
}

.avg-icon {
  background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
}

.count-icon {
  background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%);
}

.stat-info h3 {
  font-size: 20px;
  font-weight: 700;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-info p {
  color: #7f8c8d;
  font-size: 12px;
}

.wages-table {
  margin-bottom: 24px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.total-count {
  color: #909399;
  font-size: 14px;
}

.text-right {
  text-align: right;
}

.income-amount {
  font-weight: 600;
  color: #67c23a;
}

.income-highlight {
  font-size: 18px;
  font-weight: 700;
  color: #67c23a;
}

.wage-detail {
  padding: 16px 0;
}

:deep(.el-table) {
  border-radius: 8px;
}

:deep(.el-card) {
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.1);
}
</style>
