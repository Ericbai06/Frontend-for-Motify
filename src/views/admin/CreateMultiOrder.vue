<template>
  <div class="create-multi-order-page">
    <div class="card-container">
      <h2>创建多工种维修工单</h2>
      
      <el-form
        ref="formRef"
        :model="form"
        :rules="rules"
        label-width="100px"
        class="order-form"
      >
        <el-form-item label="用户" prop="userId">
          <el-select
            v-model="form.userId"
            placeholder="选择用户"
            filterable
            clearable
            @change="loadUserCars"
          >
            <el-option
              v-for="user in users"
              :key="user.userId"
              :label="user.username"
              :value="user.userId"
            >
              <div style="display: flex; justify-content: space-between; align-items: center">
                <span>{{ user.username }}</span>
                <span class="text-muted">{{ user.phone }}</span>
              </div>
            </el-option>
          </el-select>
        </el-form-item>
        
        <el-form-item label="车辆" prop="carId">
          <el-select
            v-model="form.carId"
            placeholder="选择车辆"
            filterable
            clearable
            :disabled="!form.userId || userCars.length === 0"
          >
            <el-option
              v-for="car in userCars"
              :key="car.carId"
              :label="`${car.brand} ${car.model} (${car.licensePlate})`"
              :value="car.carId"
            />
          </el-select>
        </el-form-item>
        
        <el-form-item label="工单名称" prop="name">
          <el-input v-model="form.name" placeholder="请输入工单名称" />
        </el-form-item>
        
        <el-form-item label="工单描述" prop="description">
          <el-input
            v-model="form.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工单描述"
          />
        </el-form-item>
        
        <el-form-item label="所需工种">
          <div class="required-types">
            <div v-for="(type, index) in repairmanTypes" :key="type.value" class="type-item">
              <el-checkbox v-model="form.requiredTypes[type.value].required" :label="type.label" />
              <el-input-number
                v-if="form.requiredTypes[type.value].required"
                v-model="form.requiredTypes[type.value].count"
                :min="1"
                :max="10"
                controls-position="right"
                style="width: 120px; margin-left: 8px;"
              />
            </div>
          </div>
        </el-form-item>
        
        <el-form-item>
          <el-button type="primary" :loading="submitting" @click="submitForm">创建工单</el-button>
          <el-button @click="resetForm">重置</el-button>
        </el-form-item>
      </el-form>
    </div>
    
    <div v-if="createdOrder" class="card-container">
      <h3>工单创建成功</h3>
      <div class="order-result">
        <p><strong>工单ID:</strong> {{ createdOrder.itemId }}</p>
        <p><strong>工单名称:</strong> {{ createdOrder.name }}</p>
        <p><strong>状态:</strong> {{ formatStatus(createdOrder.status) }}</p>
        
        <div class="assigned-repairmen">
          <h4>已分配维修人员:</h4>
          <el-table :data="createdOrder.repairmen" stripe>
            <el-table-column prop="repairmanId" label="ID" width="80" />
            <el-table-column prop="name" label="姓名" />
            <el-table-column prop="type" label="工种">
              <template #default="scope">
                {{ formatRepairmanType(scope.row.type) }}
              </template>
            </el-table-column>
            <el-table-column prop="hourlyRate" label="时薪" />
            <el-table-column label="状态">
              <template #default="scope">
                <el-tag type="warning">待确认</el-tag>
              </template>
            </el-table-column>
          </el-table>
        </div>
        
        <div class="action-buttons">
          <el-button type="primary" @click="$router.push('/admin/maintenance')">查看所有工单</el-button>
          <el-button @click="resetForm">创建新工单</el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import api from '../../utils/api'
import { formatStatus } from '../../utils/format'

const formRef = ref(null)
const users = ref([])
const userCars = ref([])
const submitting = ref(false)
const createdOrder = ref(null)

const repairmanTypes = [
  { label: '机械师', value: 'MECHANIC' },
  { label: '电工', value: 'ELECTRICIAN' },
  { label: '钣金工', value: 'SHEET_METAL' },
  { label: '喷漆工', value: 'PAINTER' },
  { label: '学徒', value: 'APPRENTICE' }
]

const form = reactive({
  userId: '',
  carId: '',
  name: '',
  description: '',
  requiredTypes: {
    MECHANIC: { required: false, count: 1 },
    ELECTRICIAN: { required: false, count: 1 },
    SHEET_METAL: { required: false, count: 1 },
    PAINTER: { required: false, count: 1 },
    APPRENTICE: { required: false, count: 1 }
  }
})

const rules = {
  userId: [
    { required: true, message: '请选择用户', trigger: 'change' }
  ],
  carId: [
    { required: true, message: '请选择车辆', trigger: 'change' }
  ],
  name: [
    { required: true, message: '请输入工单名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入工单描述', trigger: 'blur' }
  ]
}

const loadUsers = async () => {
  try {
    const response = await api.get('/api/admin/users')
    if (response.data.code === 200) {
      users.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load users:', error)
    ElMessage.error('加载用户列表失败')
  }
}

const loadUserCars = async () => {
  if (!form.userId) {
    userCars.value = []
    form.carId = ''
    return
  }
  
  try {
    const response = await api.get(`/api/auth/users/${form.userId}/cars`)
    if (response.data.code === 200) {
      userCars.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load user cars:', error)
    ElMessage.error('加载用户车辆失败')
    userCars.value = []
  }
}

const formatRepairmanType = (type) => {
  const typeMap = {
    'MECHANIC': '机械师',
    'ELECTRICIAN': '电工',
    'SHEET_METAL': '钣金工',
    'PAINTER': '喷漆工',
    'APPRENTICE': '学徒'
  }
  return typeMap[type] || type
}

const submitForm = async () => {
  if (!formRef.value) return
  
  await formRef.value.validate(async (valid) => {
    if (!valid) return
    
    // 检查是否至少选择了一个工种
    const hasSelectedType = Object.values(form.requiredTypes).some(type => type.required)
    if (!hasSelectedType) {
      ElMessage.warning('请至少选择一个工种')
      return
    }
    
    // 准备请求数据
    const requiredTypesObj = {}
    for (const [type, value] of Object.entries(form.requiredTypes)) {
      if (value.required) {
        requiredTypesObj[type] = value.count
      }
    }
    
    const requestData = {
      userId: form.userId,
      carId: form.carId,
      name: form.name,
      description: form.description,
      requiredTypes: requiredTypesObj
    }
    
    try {
      submitting.value = true
      const response = await api.post('/api/repair/submit', requestData)
      
      if (response.data.code === 200) {
        ElMessage.success('工单创建成功')
        createdOrder.value = response.data.data
      } else {
        ElMessage.error(response.data.message || '工单创建失败')
      }
    } catch (error) {
      console.error('Failed to create order:', error)
      ElMessage.error('工单创建失败，请稍后重试')
    } finally {
      submitting.value = false
    }
  })
}

const resetForm = () => {
  if (formRef.value) {
    formRef.value.resetFields()
  }
  
  // 重置工种选择
  for (const type in form.requiredTypes) {
    form.requiredTypes[type].required = false
    form.requiredTypes[type].count = 1
  }
  
  createdOrder.value = null
}

onMounted(() => {
  loadUsers()
})
</script>

<style scoped>
.create-multi-order-page {
  padding: 20px;
}

.order-form {
  max-width: 800px;
  margin-top: 20px;
}

.required-types {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.type-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}

.order-result {
  margin-top: 16px;
  padding: 16px;
  background-color: #f8f9fa;
  border-radius: 8px;
}

.assigned-repairmen {
  margin-top: 20px;
  margin-bottom: 20px;
}

.action-buttons {
  margin-top: 24px;
  display: flex;
  gap: 12px;
}
</style> 