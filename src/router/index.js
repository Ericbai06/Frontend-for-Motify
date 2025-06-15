import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const routes = [
  {
    path: '/',
    redirect: '/login'
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { requiresGuest: true }
  },
  {
    path: '/user',
    component: () => import('../layouts/UserLayout.vue'),
    meta: { requiresAuth: true, role: 'user' },
    children: [
      {
        path: 'dashboard',
        name: 'UserDashboard',
        component: () => import('../views/user/Dashboard.vue')
      },
      {
        path: 'cars',
        name: 'UserCars',
        component: () => import('../views/user/Cars.vue')
      },
      {
        path: 'maintenance',
        name: 'UserMaintenance',
        component: () => import('../views/user/Maintenance.vue')
      },
      {
        path: 'maintenance/:id',
        name: 'MaintenanceDetail',
        component: () => import('../views/user/MaintenanceDetail.vue')
      },
      {
        path: 'batch-submit',
        name: 'UserBatchSubmit',
        component: () => import('../views/user/BatchSubmit.vue'),
        meta: {
          title: '批量提交工单'
        }
      },
      {
        path: 'profile',
        name: 'UserProfile',
        component: () => import('../views/user/Profile.vue')
      }
    ]
  },
  {
    path: '/repairman',
    component: () => import('../layouts/RepairmanLayout.vue'),
    meta: { requiresAuth: true, role: 'repairman' },
    children: [
      {
        path: 'dashboard',
        name: 'RepairmanDashboard',
        component: () => import('../views/repairman/Dashboard.vue')
      },
      {
        path: 'work-orders',
        name: 'WorkOrders',
        component: () => import('../views/repairman/WorkOrders.vue')
      },
      {
        path: 'current-work',
        name: 'CurrentWork',
        component: () => import('../views/repairman/CurrentWork.vue')
      },
      {
        path: 'completed-work',
        name: 'CompletedWork',
        component: () => import('../views/repairman/CompletedWork.vue')
      },
      {
        path: 'income',
        name: 'Income',
        component: () => import('../views/repairman/Income.vue')
      },
      {
        path: 'profile',
        name: 'RepairmanProfile',
        component: () => import('../views/repairman/Profile.vue')
      }
    ]
  },
  {
    path: '/admin',
    component: () => import('../layouts/AdminLayout.vue'),
    meta: { requiresAuth: true, role: 'admin' },
    children: [
      {
        path: 'dashboard',
        name: 'AdminDashboard',
        component: () => import('../views/admin/Dashboard.vue')
      },
      {
        path: 'users',
        name: 'AdminUsers',
        component: () => import('../views/admin/Users.vue')
      },
      {
        path: 'repairmen',
        name: 'AdminRepairmen',
        component: () => import('../views/admin/Repairmen.vue')
      },
      {
        path: 'cars',
        name: 'AdminCars',
        component: () => import('../views/admin/Cars.vue')
      },
      {
        path: 'maintenance-items',
        name: 'AdminMaintenanceItems',
        component: () => import('../views/admin/MaintenanceItems.vue')
      },
      {
        path: 'maintenance-records',
        name: 'AdminMaintenanceRecords',
        component: () => import('../views/admin/MaintenanceRecords.vue')
      },
      {
        path: 'wages',
        name: 'AdminWages',
        component: () => import('../views/admin/Wages.vue')
      },
      {
        path: 'statistics',
        name: 'AdminStatistics',
        component: () => import('../views/admin/Statistics.vue')
      },
      {
        path: 'materials',
        name: 'AdminMaterials',
        component: () => import('../views/admin/Materials.vue')
      },
      {
        path: 'maintenance-type-assignment',
        name: 'AdminMaintenanceTypeAssignment',
        component: () => import('../views/admin/MaintenanceTypeAssignment.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '工单工种分配'
        }
      },
      {
        path: 'batch-submit',
        name: 'AdminBatchSubmit',
        component: () => import('../views/admin/BatchSubmit.vue'),
        meta: {
          requiresAuth: true,
          requiresAdmin: true,
          title: '批量提交工单'
        }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  
  if (to.meta.requiresAuth && !authStore.isAuthenticated) {
    next('/login')
  } else if (to.meta.requiresGuest && authStore.isAuthenticated) {
    // 根据用户角色重定向到对应的仪表板
    if (authStore.userRole === 'user') {
      next('/user/dashboard')
    } else if (authStore.userRole === 'repairman') {
      next('/repairman/dashboard')
    } else if (authStore.userRole === 'admin') {
      next('/admin/dashboard')
    } else {
      next('/login')
    }
  } else if (to.meta.role && authStore.userRole !== to.meta.role) {
    // 角色不匹配，重定向到对应角色的仪表板
    if (authStore.userRole === 'user') {
      next('/user/dashboard')
    } else if (authStore.userRole === 'repairman') {
      next('/repairman/dashboard')
    } else if (authStore.userRole === 'admin') {
      next('/admin/dashboard')
    } else {
      next('/login')
    }
  } else {
    next()
  }
})

export default router