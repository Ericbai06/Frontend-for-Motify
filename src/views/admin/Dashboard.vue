<template>
  <div class="dashboard">
    <!-- 统计卡片 -->
    <div class="stats-grid">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#409eff"><UserFilled /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalUsers }}</h3>
          <p>总用户数</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#67c23a"><Avatar /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalRepairmen }}</h3>
          <p>维修人员</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#e6a23c"><Tools /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ stats.totalMaintenance }}</h3>
          <p>维修工单</p>
        </div>
      </div>
      
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon size="32" color="#f56c6c"><Money /></el-icon>
        </div>
        <div class="stat-content">
          <h3>{{ formatCurrency(stats.totalRevenue) }}</h3>
          <p>总营收</p>
        </div>
      </div>
    </div>

    <!-- 系统概览 -->
    <div class="overview-section">
      <div class="card-container">
        <h2>系统概览</h2>
        <div class="overview-grid">
          <div class="overview-item">
            <div class="overview-label">今日新增用户</div>
            <div class="overview-value">{{ stats.todayNewUsers }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">今日新增工单</div>
            <div class="overview-value">{{ stats.todayNewOrders }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">进行中工单</div>
            <div class="overview-value">{{ stats.inProgressOrders }}</div>
          </div>
          <div class="overview-item">
            <div class="overview-label">待处理工单</div>
            <div class="overview-value">{{ stats.pendingOrders }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 最近活动 -->
    <div class="card-container">
      <h2>最近活动</h2>
      <div class="activity-list">
        <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
          <div class="activity-icon">
            <el-icon :color="activity.color">
              <component :is="activity.icon" />
            </el-icon>
          </div>
          <div class="activity-content">
            <div class="activity-title">{{ activity.title }}</div>
            <div class="activity-time">{{ formatDateTime(activity.time) }}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 工单状态分布 -->
    <div class="card-container">
      <h2>工单状态分布</h2>
      <div class="status-distribution">
        <div v-for="status in statusDistribution" :key="status.name" class="status-item">
          <div class="status-bar">
            <div 
              class="status-fill" 
              :style="{ 
                width: `${(status.count / stats.totalMaintenance) * 100}%`,
                backgroundColor: status.color 
              }"
            ></div>
          </div>
          <div class="status-info">
            <span class="status-name">{{ status.name }}</span>
            <span class="status-count">{{ status.count }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatCurrency } from '../../utils/format'

const authStore = useAuthStore()

const stats = reactive({
  totalUsers: 0,
  totalRepairmen: 0,
  totalMaintenance: 0,
  totalRevenue: 0,
  todayNewUsers: 0,
  todayNewOrders: 0,
  inProgressOrders: 0,
  pendingOrders: 0
})

const recentActivities = ref([])
const statusDistribution = ref([])

const loadDashboardData = async () => {
  try {
    // 这里应该调用实际的API来获取统计数据
    // 由于后端没有提供管理员统计API，这里使用模拟数据
    
    // 模拟统计数据
    stats.totalUsers = 156
    stats.totalRepairmen = 23
    stats.totalMaintenance = 342
    stats.totalRevenue = 125600
    stats.todayNewUsers = 5
    stats.todayNewOrders = 12
    stats.inProgressOrders = 28
    stats.pendingOrders = 15

    // 模拟最近活动
    recentActivities.value = [
      {
        id: 1,
        title: '用户 张三 提交了新的维修请求',
        time: new Date(Date.now() - 10 * 60 * 1000),
        icon: 'Plus',
        color: '#409eff'
      },
      {
        id: 2,
        title: '维修人员 李师傅 完成了工单 #1234',
        time: new Date(Date.now() - 30 * 60 * 1000),
        icon: 'CircleCheck',
        color: '#67c23a'
      },
      {
        id: 3,
        title: '新用户 王五 注册成功',
        time: new Date(Date.now() - 45 * 60 * 1000),
        icon: 'User',
        color: '#e6a23c'
      },
      {
        id: 4,
        title: '维修人员 赵师傅 接受了工单 #1235',
        time: new Date(Date.now() - 60 * 60 * 1000),
        icon: 'Check',
        color: '#409eff'
      },
      {
        id: 5,
        title: '用户 刘六 对服务进行了5星评价',
        time: new Date(Date.now() - 90 * 60 * 1000),
        icon: 'Star',
        color: '#f56c6c'
      }
    ]

    // 模拟工单状态分布
    statusDistribution.value = [
      { name: '待处理', count: 15, color: '#e6a23c' },
      { name: '已接收', count: 8, color: '#409eff' },
      { name: '维修中', count: 28, color: '#909399' },
      { name: '已完成', count: 285, color: '#67c23a' },
      { name: '已取消', count: 6, color: '#f56c6c' }
    ]
  } catch (error) {
    console.error('Failed to load dashboard data:', error)
  }
}

onMounted(() => {
  loadDashboardData()
})
</script>

<style scoped>
.dashboard {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 16px;
  transition: transform 0.3s, box-shadow 0.3s;
}

.stat-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.stat-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-content h3 {
  margin: 0;
  font-size: 28px;
  font-weight: 700;
  color: #2c3e50;
}

.stat-content p {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
}

.overview-section {
  margin-bottom: 24px;
}

.overview-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.overview-item {
  text-align: center;
  padding: 20px;
  background: #f8f9fa;
  border-radius: 8px;
}

.overview-label {
  font-size: 14px;
  color: #909399;
  margin-bottom: 8px;
}

.overview-value {
  font-size: 24px;
  font-weight: 600;
  color: #2c3e50;
}

.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: #f8f9fa;
  border-radius: 8px;
  transition: background-color 0.3s;
}

.activity-item:hover {
  background: #e9ecef;
}

.activity-icon {
  width: 40px;
  height: 40px;
  border-radius: 8px;
  background: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.activity-content {
  flex: 1;
}

.activity-title {
  font-weight: 500;
  color: #2c3e50;
  margin-bottom: 4px;
}

.activity-time {
  font-size: 12px;
  color: #909399;
}

.status-distribution {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.status-item {
  display: flex;
  align-items: center;
  gap: 12px;
}

.status-bar {
  flex: 1;
  height: 20px;
  background: #f0f2f5;
  border-radius: 10px;
  overflow: hidden;
}

.status-fill {
  height: 100%;
  border-radius: 10px;
  transition: width 0.3s ease;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 120px;
}

.status-name {
  font-weight: 500;
  color: #606266;
}

.status-count {
  font-weight: 600;
  color: #2c3e50;
}
</style>