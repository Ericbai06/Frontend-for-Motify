<template>
  <div class="layout-container">
    <el-container>
      <!-- 侧边栏 -->
      <el-aside width="250px" class="sidebar">
        <div class="logo">
          <h2>Motify</h2>
          <p>维修人员</p>
        </div>
        
        <el-menu
          :default-active="$route.path"
          router
          class="sidebar-menu"
          background-color="#27ae60"
          text-color="#ecf0f1"
          active-text-color="#f1c40f"
        >
          <el-menu-item index="/repairman/dashboard">
            <el-icon><Odometer /></el-icon>
            <span>仪表板</span>
          </el-menu-item>
          <el-menu-item index="/repairman/work-orders">
            <el-icon><List /></el-icon>
            <span>工单管理</span>
          </el-menu-item>
          <el-menu-item index="/repairman/current-work">
            <el-icon><Clock /></el-icon>
            <span>当前工作</span>
          </el-menu-item>
          <el-menu-item index="/repairman/completed-work">
            <el-icon><CircleCheck /></el-icon>
            <span>已完成工作</span>
          </el-menu-item>
          <el-menu-item index="/repairman/income">
            <el-icon><Money /></el-icon>
            <span>收入统计</span>
          </el-menu-item>
          <el-menu-item index="/repairman/profile">
            <el-icon><User /></el-icon>
            <span>个人资料</span>
          </el-menu-item>
        </el-menu>
      </el-aside>

      <!-- 主内容区 -->
      <el-container>
        <!-- 顶部导航 -->
        <el-header class="header">
          <div class="header-left">
            <h3>{{ getPageTitle() }}</h3>
          </div>
          <div class="header-right">
            <el-dropdown @command="handleCommand">
              <span class="user-info">
                <el-icon><User /></el-icon>
                {{ authStore.user?.name || authStore.user?.username }}
                <el-icon class="el-icon--right"><arrow-down /></el-icon>
              </span>
              <template #dropdown>
                <el-dropdown-menu>
                  <el-dropdown-item command="profile">个人资料</el-dropdown-item>
                  <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
                </el-dropdown-menu>
              </template>
            </el-dropdown>
          </div>
        </el-header>

        <!-- 主要内容 -->
        <el-main class="main-content">
          <router-view />
        </el-main>
      </el-container>
    </el-container>
  </div>
</template>

<script setup>
import { useRouter, useRoute } from 'vue-router'
import { ElMessageBox } from 'element-plus'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const getPageTitle = () => {
  const titles = {
    '/repairman/dashboard': '仪表板',
    '/repairman/work-orders': '工单管理',
    '/repairman/current-work': '当前工作',
    '/repairman/completed-work': '已完成工作',
    '/repairman/income': '收入统计',
    '/repairman/profile': '个人资料'
  }
  return titles[route.path] || '维修人员中心'
}

const handleCommand = async (command) => {
  if (command === 'profile') {
    router.push('/repairman/profile')
  } else if (command === 'logout') {
    try {
      await ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      
      authStore.logout()
      router.push('/login')
    } catch {
      // 用户取消
    }
  }
}
</script>

<style scoped>
.layout-container {
  height: 100vh;
}

.sidebar {
  background-color: #27ae60;
  color: #ecf0f1;
}

.logo {
  padding: 20px;
  text-align: center;
  border-bottom: 1px solid #2ecc71;
}

.logo h2 {
  margin: 0;
  font-size: 24px;
  font-weight: 700;
  color: #f1c40f;
}

.logo p {
  margin: 5px 0 0 0;
  font-size: 14px;
  color: #d5dbdb;
}

.sidebar-menu {
  border: none;
}

.header {
  background: white;
  border-bottom: 1px solid #e4e7ed;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
}

.header-left h3 {
  margin: 0;
  color: #2c3e50;
  font-weight: 600;
}

.user-info {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  padding: 8px 12px;
  border-radius: 6px;
  transition: background-color 0.3s;
}

.user-info:hover {
  background-color: #f5f7fa;
}

.main-content {
  background-color: #f5f7fa;
  padding: 24px;
}

:deep(.el-menu-item) {
  border-radius: 6px;
  margin: 4px 8px;
}

:deep(.el-menu-item:hover) {
  background-color: #2ecc71 !important;
}

:deep(.el-menu-item.is-active) {
  background-color: #f1c40f !important;
  color: #2c3e50 !important;
}
</style>