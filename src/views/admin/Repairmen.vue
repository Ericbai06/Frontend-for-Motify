<template>
  <div class="repairmen-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>维修人员管理</h2>
        <el-button type="primary" @click="showAddRepairmanDialog = true">
          <el-icon><Plus /></el-icon>
          添加维修人员
        </el-button>
      </div>

      <el-table :data="repairmen" style="width: 100%" v-loading="loading">
        <el-table-column prop="repairmanId" label="ID" width="80" />
        <el-table-column prop="username" label="用户名" />
        <el-table-column prop="name" label="姓名" />
        <el-table-column prop="type" label="工种">
          <template #default="{ row }">
            {{ formatRepairmanType(row.type) }}
          </template>
        </el-table-column>
        <el-table-column prop="phone" label="手机号" />
        <el-table-column prop="hourlyRate" label="时薪(元/小时)" />
        <el-table-column label="当前工单" width="100">
          <template #default="{ row }">
            <el-tag type="info">{{ row.currentOrders || 0 }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="200">
          <template #default="{ row }">
            <el-button text type="primary" @click="editRepairman(row)">编辑</el-button>
            <el-button text type="danger" @click="confirmDeleteRepairman(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 添加/编辑维修人员对话框 -->
    <el-dialog
      v-model="showRepairmanDialog"
      :title="isEditing ? '编辑维修人员' : '添加维修人员'"
      width="500px"
    >
      <el-form
        ref="repairmanFormRef"
        :model="repairmanForm"
        :rules="repairmanRules"
        label-width="100px"
      >
        <el-form-item label="用户名" prop="username">
          <el-input v-model="repairmanForm.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="姓名" prop="name">
          <el-input v-model="repairmanForm.name" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item label="工种" prop="type">
          <el-select v-model="repairmanForm.type" placeholder="请选择工种">
            <el-option
              v-for="type in repairmanTypes"
              :key="type.value"
              :label="type.label"
              :value="type.value"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input v-model="repairmanForm.phone" placeholder="请输入手机号" />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input v-model="repairmanForm.email" placeholder="请输入邮箱" />
        </el-form-item>
        <el-form-item label="时薪(元/小时)" prop="hourlyRate">
          <el-input-number 
            v-model="repairmanForm.hourlyRate" 
            :min="0" 
            :precision="2"
            :step="10" 
            style="width: 180px;" 
          />
        </el-form-item>
        <el-form-item v-if="!isEditing" label="密码" prop="password">
          <el-input
            v-model="repairmanForm.password"
            type="password"
            placeholder="请输入密码"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRepairmanDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitRepairmanForm">
          确认
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'
import { REPAIRMAN_TYPES, REPAIRMAN_TYPE_MAP } from '../../utils/constants'

const repairmen = ref([])
const loading = ref(false)
const showRepairmanDialog = ref(false)
const isEditing = ref(false)
const submitting = ref(false)
const repairmanFormRef = ref()
const repairmanTypes = REPAIRMAN_TYPES

const repairmanForm = reactive({
  repairmanId: null,
  username: '',
  name: '',
  type: '',
  phone: '',
  email: '',
  hourlyRate: 50,
  password: ''
})

const repairmanRules = {
  username: [
    { required: true, message: '请输入用户名', trigger: 'blur' }
  ],
  name: [
    { required: true, message: '请输入姓名', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择工种', trigger: 'change' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' }
  ],
  hourlyRate: [
    { required: true, message: '请输入时薪', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' }
  ]
}

const loadRepairmen = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/repairmen')
    if (response.data.code === 200) {
      repairmen.value = response.data.data || []
    } else {
      ElMessage.error(response.data.message || '获取维修人员列表失败')
    }
  } catch (error) {
    console.error('Failed to load repairmen:', error)
    ElMessage.error('获取维修人员列表失败')
  } finally {
    loading.value = false
  }
}

const formatRepairmanType = (type) => {
  return REPAIRMAN_TYPE_MAP[type] || type
}

const editRepairman = (repairman) => {
  isEditing.value = true
  repairmanForm.repairmanId = repairman.repairmanId
  repairmanForm.username = repairman.username
  repairmanForm.name = repairman.name || ''
  repairmanForm.type = repairman.type || ''
  repairmanForm.phone = repairman.phone || ''
  repairmanForm.email = repairman.email || ''
  repairmanForm.hourlyRate = repairman.hourlyRate || 50
  repairmanForm.password = '' // 清空密码
  showRepairmanDialog.value = true
}

const addRepairman = () => {
  isEditing.value = false
  repairmanForm.repairmanId = null
  repairmanForm.username = ''
  repairmanForm.name = ''
  repairmanForm.type = ''
  repairmanForm.phone = ''
  repairmanForm.email = ''
  repairmanForm.hourlyRate = 50
  repairmanForm.password = ''
  showRepairmanDialog.value = true
}

const submitRepairmanForm = async () => {
  if (!repairmanFormRef.value) return
  
  await repairmanFormRef.value.validate(async (valid) => {
    if (!valid) return
    
    try {
      submitting.value = true
      let response
      
      if (isEditing.value) {
        response = await api.put(`/api/admin/repairmen/${repairmanForm.repairmanId}`, repairmanForm)
      } else {
        response = await api.post('/api/repairman/register', repairmanForm)
      }
      
      if (response.data.code === 200) {
        ElMessage.success(isEditing.value ? '维修人员更新成功' : '维修人员添加成功')
        showRepairmanDialog.value = false
        loadRepairmen()
      } else {
        ElMessage.error(response.data.message || (isEditing.value ? '维修人员更新失败' : '维修人员添加失败'))
      }
    } catch (error) {
      console.error('Failed to submit repairman form:', error)
      ElMessage.error(isEditing.value ? '维修人员更新失败' : '维修人员添加失败')
    } finally {
      submitting.value = false
    }
  })
}

const confirmDeleteRepairman = (repairman) => {
  ElMessageBox.confirm(
    `确定要删除维修人员 ${repairman.name} 吗？此操作不可逆`,
    '警告',
    {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    }
  ).then(() => {
    deleteRepairman(repairman.repairmanId)
  }).catch(() => {
    // 用户取消删除
  })
}

const deleteRepairman = async (repairmanId) => {
  try {
    const response = await api.delete(`/api/admin/repairmen/${repairmanId}`)
    if (response.data.code === 200) {
      ElMessage.success('维修人员删除成功')
      loadRepairmen()
    } else {
      ElMessage.error(response.data.message || '维修人员删除失败')
    }
  } catch (error) {
    console.error('Failed to delete repairman:', error)
    ElMessage.error('维修人员删除失败')
  }
}

onMounted(() => {
  loadRepairmen()
})

defineExpose({
  showAddRepairmanDialog: addRepairman
})
</script>

<style scoped>
.repairmen-page {
  max-width: 1200px;
  margin: 0 auto;
}
</style> 