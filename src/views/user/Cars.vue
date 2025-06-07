<template>
  <div class="cars-page">
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>我的车辆</h2>
        <el-button type="primary" @click="showAddCarDialog = true">
          <el-icon><Plus /></el-icon>
          添加车辆
        </el-button>
      </div>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="cars.length === 0" class="empty-state">
        <el-empty description="还没有添加车辆">
          <el-button type="primary" @click="showAddCarDialog = true">
            添加第一辆车
          </el-button>
        </el-empty>
      </div>

      <div v-else class="cars-grid">
        <div v-for="car in cars" :key="car.carId" class="car-card">
          <div class="car-header">
            <div class="car-icon">
              <el-icon size="32" color="#409eff"><Van /></el-icon>
            </div>
            <div class="car-info">
              <h3>{{ car.brand }} {{ car.model }}</h3>
              <p class="license-plate">{{ car.licensePlate }}</p>
            </div>
          </div>
          
          <div class="car-actions">
            <el-button text type="primary" @click="viewMaintenanceHistory(car)">
              <el-icon><List /></el-icon>
              维修记录
            </el-button>
            <el-button text type="success" @click="submitRepairRequest(car)">
              <el-icon><Tools /></el-icon>
              维修申请
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加车辆对话框 -->
    <el-dialog
      v-model="showAddCarDialog"
      title="添加车辆"
      width="500px"
    >
      <el-form
        ref="carFormRef"
        :model="carForm"
        :rules="carRules"
        label-width="100px"
      >
        <el-form-item label="品牌" prop="brand">
          <el-input
            v-model="carForm.brand"
            placeholder="请输入车辆品牌"
          />
        </el-form-item>
        <el-form-item label="型号" prop="model">
          <el-input
            v-model="carForm.model"
            placeholder="请输入车辆型号"
          />
        </el-form-item>
        <el-form-item label="车牌号" prop="licensePlate">
          <el-input
            v-model="carForm.licensePlate"
            placeholder="请输入车牌号"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddCarDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="addCar">
          添加
        </el-button>
      </template>
    </el-dialog>

    <!-- 提交维修请求对话框 -->
    <el-dialog
      v-model="showRepairDialog"
      title="提交维修请求"
      width="500px"
    >
      <el-form
        ref="repairFormRef"
        :model="repairForm"
        :rules="repairRules"
        label-width="100px"
      >
        <el-form-item label="车辆">
          <el-input
            :value="`${selectedCar?.brand} ${selectedCar?.model} (${selectedCar?.licensePlate})`"
            readonly
          />
        </el-form-item>
        <el-form-item label="维修项目" prop="name">
          <el-input
            v-model="repairForm.name"
            placeholder="请输入维修项目名称"
          />
        </el-form-item>
        <el-form-item label="问题描述" prop="description">
          <el-input
            v-model="repairForm.description"
            type="textarea"
            :rows="4"
            placeholder="请详细描述车辆问题"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRepairDialog = false">取消</el-button>
        <el-button type="primary" :loading="submittingRepair" @click="submitRepair">
          提交
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'

const router = useRouter()
const authStore = useAuthStore()

const cars = ref([])
const loading = ref(false)
const showAddCarDialog = ref(false)
const showRepairDialog = ref(false)
const submitting = ref(false)
const submittingRepair = ref(false)
const selectedCar = ref(null)

const carFormRef = ref()
const repairFormRef = ref()

const carForm = reactive({
  brand: '',
  model: '',
  licensePlate: ''
})

const repairForm = reactive({
  name: '',
  description: ''
})

const carRules = {
  brand: [
    { required: true, message: '请输入车辆品牌', trigger: 'blur' }
  ],
  model: [
    { required: true, message: '请输入车辆型号', trigger: 'blur' }
  ],
  licensePlate: [
    { required: true, message: '请输入车牌号', trigger: 'blur' },
    { pattern: /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1}$/, message: '请输入正确的车牌号格式', trigger: 'blur' }
  ]
}

const repairRules = {
  name: [
    { required: true, message: '请输入维修项目名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入问题描述', trigger: 'blur' }
  ]
}

const loadCars = async () => {
  try {
    loading.value = true
    const userId = authStore.user?.userId
    if (!userId) return

    const response = await api.get(`/api/auth/users/${userId}/cars`)
    if (response.data.code === 200) {
      cars.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load cars:', error)
  } finally {
    loading.value = false
  }
}

const addCar = async () => {
  if (!carFormRef.value) return

  try {
    await carFormRef.value.validate()
    submitting.value = true

    const userId = authStore.user?.userId
    const response = await api.post(`/api/auth/users/${userId}/cars`, carForm)

    if (response.data.code === 200) {
      ElMessage.success('车辆添加成功')
      showAddCarDialog.value = false
      carFormRef.value.resetFields()
      loadCars()
    }
  } catch (error) {
    console.error('Failed to add car:', error)
  } finally {
    submitting.value = false
  }
}

const viewMaintenanceHistory = (car) => {
  router.push({
    path: '/user/maintenance',
    query: { carId: car.carId }
  })
}

const submitRepairRequest = (car) => {
  selectedCar.value = car
  showRepairDialog.value = true
}

const submitRepair = async () => {
  if (!repairFormRef.value) return

  try {
    await repairFormRef.value.validate()
    submittingRepair.value = true

    const userId = authStore.user?.userId
    const requestData = {
      carId: selectedCar.value.carId,
      name: repairForm.name,
      description: repairForm.description
    }

    const response = await api.post(`/api/auth/users/${userId}/maintenance-records`, requestData)

    if (response.data.code === 200) {
      ElMessage.success('维修请求提交成功')
      showRepairDialog.value = false
      repairFormRef.value.resetFields()
      selectedCar.value = null
    }
  } catch (error) {
    console.error('Failed to submit repair request:', error)
  } finally {
    submittingRepair.value = false
  }
}

onMounted(() => {
  loadCars()
})
</script>

<style scoped>
.cars-page {
  max-width: 1200px;
  margin: 0 auto;
}

.cars-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
}

.car-card {
  background: white;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  transition: transform 0.3s, box-shadow 0.3s;
}

.car-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
}

.car-header {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 20px;
}

.car-icon {
  width: 60px;
  height: 60px;
  border-radius: 12px;
  background: #f0f9ff;
  display: flex;
  align-items: center;
  justify-content: center;
}

.car-info h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: #2c3e50;
}

.license-plate {
  margin: 4px 0 0 0;
  color: #7f8c8d;
  font-size: 14px;
  font-family: 'Courier New', monospace;
  font-weight: 600;
}

.car-actions {
  display: flex;
  gap: 12px;
}

.car-actions .el-button {
  flex: 1;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}
</style>