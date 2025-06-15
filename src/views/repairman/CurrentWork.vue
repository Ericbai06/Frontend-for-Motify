<template>
  <div class="current-work-page">
    <div class="card-container">
      <h2>当前工作</h2>

      <div v-if="loading" class="flex-center" style="height: 200px;">
        <el-loading />
      </div>

      <div v-else-if="currentWork.length === 0" class="empty-state">
        <el-empty description="暂无进行中的工作">
          <el-button type="primary" @click="$router.push('/repairman/work-orders')">
            查看所有工单
          </el-button>
        </el-empty>
      </div>

      <div v-else class="work-list">
        <div v-for="work in currentWork" :key="work.itemId" class="work-card">
          <div class="work-header">
            <div class="work-title">
              <h3>{{ work.name }}</h3>
              <el-tag :type="STATUS_COLORS[work.status]" size="small">
                {{ formatStatus(work.status) }}
              </el-tag>
            </div>
            <div class="work-meta">
              <span class="text-muted">开始时间：{{ formatDateTime(work.createTime) }}</span>
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
                <span class="label">当前进度：</span>
                <div class="progress-container">
                  <el-progress :percentage="work.progress" :stroke-width="8" />
                  <span class="progress-text">{{ work.progress }}%</span>
                </div>
              </div>
              
              <div v-if="work.updateTime" class="detail-item">
                <span class="label">最后更新：</span>
                <span>{{ formatDateTime(work.updateTime) }}</span>
              </div>
              
              <!-- 显示工单所需工种信息 -->
              <div v-if="work.requiredTypes && work.requiredTypes.length > 0" class="detail-item">
                <span class="label">所需工种：</span>
                <div class="required-types">
                  <el-tag 
                    v-for="type in work.requiredTypes" 
                    :key="type.id"
                    type="info"
                    style="margin-right: 8px;"
                  >
                    {{ formatRepairmanType(type.type) }} x {{ type.required }}
                    (已分配 {{ type.assigned }})
                  </el-tag>
                </div>
              </div>
              
              <!-- 显示协作维修人员 -->
              <div v-if="work.repairmen && work.repairmen.length > 1" class="detail-item">
                <span class="label">协作人员：</span>
                <div class="assigned-repairmen">
                  <el-tag 
                    v-for="repairman in work.repairmen.filter(r => r.repairmanId !== authStore.user?.repairmanId)" 
                    :key="repairman.repairmanId"
                    type="success"
                    style="margin-right: 8px;"
                  >
                    {{ repairman.name }} ({{ formatRepairmanType(repairman.type) }})
                  </el-tag>
                </div>
              </div>
            </div>

            <div v-if="work.reminder" class="reminder-section">
              <div class="reminder-box">
                <el-icon color="#e6a23c"><Warning /></el-icon>
                <span>催单信息：{{ work.reminder }}</span>
              </div>
            </div>
          </div>

          <div class="work-actions">
            <el-button type="primary" @click="updateProgress(work)">
              <el-icon><Edit /></el-icon>
              更新进度
            </el-button>
            
            <el-button 
              v-if="work.progress < 100" 
              type="success" 
              @click="completeWork(work)"
            >
              <el-icon><CircleCheck /></el-icon>
              完成工作
            </el-button>
            
            <el-button type="info" @click="addRecord(work)">
              <el-icon><Plus /></el-icon>
              添加记录
            </el-button>
          </div>
        </div>
      </div>
    </div>

    <!-- 更新进度对话框 -->
    <el-dialog
      v-model="showProgressDialog"
      title="更新工作进度"
      width="500px"
    >
      <el-form
        ref="progressFormRef"
        :model="progressForm"
        :rules="progressRules"
        label-width="100px"
      >
        <el-form-item label="当前进度" prop="progress">
          <el-slider
            v-model="progressForm.progress"
            :min="0"
            :max="100"
            show-input
            :format-tooltip="(val) => `${val}%`"
          />
        </el-form-item>
        <el-form-item label="进度说明" prop="description">
          <el-input
            v-model="progressForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入进度说明"
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showProgressDialog = false">取消</el-button>
        <el-button type="primary" :loading="updatingProgress" @click="submitProgress">
          更新
        </el-button>
      </template>
    </el-dialog>

    <!-- 完成工作对话框 -->
    <el-dialog
      v-model="showCompleteDialog"
      title="完成工作"
      width="600px"
    >
      <el-form
        ref="completeFormRef"
        :model="completeForm"
        :rules="completeRules"
        label-width="100px"
      >
        <el-form-item label="维修结果" prop="result">
          <el-input
            v-model="completeForm.result"
            type="textarea"
            :rows="3"
            placeholder="请输入维修结果"
          />
        </el-form-item>
        <el-form-item label="工作时长" prop="workingHours">
          <el-input-number
            v-model="completeForm.workingHours"
            :min="0.1"
            :step="0.1"
            :precision="1"
            placeholder="小时"
          />
          <span style="margin-left: 8px;">小时</span>
        </el-form-item>
        <el-form-item label="使用材料">
          <div class="materials-section">
            <div v-for="(material, index) in completeForm.materials" :key="index" class="material-item">
              <el-select
                v-model="material.materialId"
                placeholder="选择材料"
                style="width: 200px;"
              >
                <el-option
                  v-for="mat in availableMaterials"
                  :key="mat.materialId"
                  :label="`${mat.name} (库存: ${mat.stock})`"
                  :value="mat.materialId"
                />
              </el-select>
              <el-input-number
                v-model="material.amount"
                :min="1"
                placeholder="数量"
                style="width: 120px; margin-left: 8px;"
              />
              <el-button
                type="danger"
                text
                @click="removeMaterial(index)"
                style="margin-left: 8px;"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" text @click="addMaterial">
              + 添加材料
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showCompleteDialog = false">取消</el-button>
        <el-button type="primary" :loading="completing" @click="submitComplete">
          完成工作
        </el-button>
      </template>
    </el-dialog>

    <!-- 添加维修记录对话框 -->
    <el-dialog
      v-model="showRecordDialog"
      title="添加维修记录"
      width="500px"
    >
      <el-form
        ref="recordFormRef"
        :model="recordForm"
        :rules="recordRules"
        label-width="100px"
      >
        <el-form-item label="记录名称" prop="name">
          <el-input
            v-model="recordForm.name"
            placeholder="请输入记录名称"
          />
        </el-form-item>
        <el-form-item label="工作内容" prop="description">
          <el-input
            v-model="recordForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入工作内容"
          />
        </el-form-item>
        <el-form-item label="工作时长" prop="workHours">
          <el-input-number
            v-model="recordForm.workHours"
            :min="1"
            :step="1"
            :precision="0"
            placeholder="分钟"
          />
          <span style="margin-left: 8px;">分钟</span>
        </el-form-item>
        <el-form-item label="开始时间" prop="startTime">
          <el-date-picker
            v-model="recordForm.startTime"
            type="datetime"
            placeholder="选择开始时间"
            style="width: 100%;"
          />
        </el-form-item>
        
        <!-- 使用材料 -->
        <el-form-item label="使用材料">
          <div class="materials-section">
            <div v-for="(material, index) in recordForm.materials" :key="index" class="material-item">
              <el-select
                v-model="material.materialId"
                placeholder="选择材料"
                style="width: 200px;"
              >
                <el-option
                  v-for="mat in availableMaterials"
                  :key="mat.materialId"
                  :label="`${mat.name} (库存: ${mat.stock})`"
                  :value="mat.materialId"
                />
              </el-select>
              <el-input-number
                v-model="material.amount"
                :min="1"
                :max="999"
                style="width: 100px; margin-left: 8px;"
                placeholder="数量"
              />
              <el-button
                type="danger"
                size="small"
                text
                @click="removeRecordMaterial(index)"
                style="margin-left: 8px;"
              >
                删除
              </el-button>
            </div>
            <el-button type="primary" text @click="addRecordMaterial">
              + 添加材料
            </el-button>
          </div>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRecordDialog = false">取消</el-button>
        <el-button type="primary" :loading="addingRecord" @click="submitRecord">
          添加记录
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useAuthStore } from '../../stores/auth'
import api from '../../utils/api'
import { formatDateTime, formatStatus } from '../../utils/format'
import { STATUS_COLORS, REPAIRMAN_TYPE_MAP } from '../../utils/constants'

const authStore = useAuthStore()

const currentWork = ref([])
const availableMaterials = ref([])
const loading = ref(false)
const showProgressDialog = ref(false)
const showCompleteDialog = ref(false)
const showRecordDialog = ref(false)
const updatingProgress = ref(false)
const completing = ref(false)
const addingRecord = ref(false)
const selectedWork = ref(null)

const progressFormRef = ref()
const completeFormRef = ref()
const recordFormRef = ref()

const progressForm = reactive({
  progress: 0,
  description: ''
})

const completeForm = reactive({
  result: '',
  workingHours: 0,
  materials: []
})

const recordForm = reactive({
  name: '',
  description: '',
  workHours: 0,
  startTime: null,
  materials: []
})

const progressRules = {
  progress: [
    { required: true, message: '请设置进度', trigger: 'change' }
  ],
  description: [
    { required: true, message: '请输入进度说明', trigger: 'blur' }
  ]
}

const completeRules = {
  result: [
    { required: true, message: '请输入维修结果', trigger: 'blur' }
  ],
  workingHours: [
    { required: true, message: '请输入工作时长', trigger: 'change' }
  ]
}

const recordRules = {
  description: [
    { required: true, message: '请输入工作内容', trigger: 'blur' }
  ],
  workHours: [
    { required: true, message: '请输入工作时长', trigger: 'change' }
  ],
  startTime: [
    { required: true, message: '请选择开始时间', trigger: 'change' }
  ]
}

const loadCurrentWork = async () => {
  try {
    loading.value = true
    const repairmanId = authStore.user?.repairmanId
    if (!repairmanId) return

    const response = await api.post('/api/repairman/current-records', { repairmanId })
    if (response.data.code === 200) {
      currentWork.value = response.data.data.sort((a, b) => 
        new Date(b.createTime) - new Date(a.createTime)
      )
    }
  } catch (error) {
    console.error('Failed to load current work:', error)
  } finally {
    loading.value = false
  }
}

const updateProgress = (work) => {
  selectedWork.value = work
  progressForm.progress = work.progress
  progressForm.description = ''
  showProgressDialog.value = true
}

const submitProgress = async () => {
  if (!progressFormRef.value) return

  try {
    await progressFormRef.value.validate()
    updatingProgress.value = true

    const repairmanId = authStore.user?.repairmanId
    const response = await api.put(
      `/api/repairman/${repairmanId}/maintenance-items/${selectedWork.value.itemId}/progress`,
      progressForm
    )

    if (response.data.code === 200) {
      ElMessage.success('进度更新成功')
      showProgressDialog.value = false
      loadCurrentWork()
    }
  } catch (error) {
    console.error('Failed to update progress:', error)
  } finally {
    updatingProgress.value = false
  }
}

const completeWork = (work) => {
  selectedWork.value = work
  completeForm.result = ''
  completeForm.workingHours = 0
  completeForm.materials = []
  showCompleteDialog.value = true
}

const addMaterial = () => {
  completeForm.materials.push({
    materialId: '',
    amount: 1
  })
}

const removeMaterial = (index) => {
  completeForm.materials.splice(index, 1)
}

const submitComplete = async () => {
  if (!completeFormRef.value) return

  try {
    await completeFormRef.value.validate()
    completing.value = true

    const repairmanId = authStore.user?.repairmanId
    const response = await api.post(
      `/api/repairman/${repairmanId}/maintenance-items/${selectedWork.value.itemId}/complete`,
      completeForm
    )

    if (response.data.code === 200) {
      ElMessage.success('工作完成成功')
      showCompleteDialog.value = false
      loadCurrentWork()
    }
  } catch (error) {
    console.error('Failed to complete work:', error)
  } finally {
    completing.value = false
  }
}

const addRecord = (work) => {
  selectedWork.value = work
  recordForm.name = ''
  recordForm.description = ''
  recordForm.workHours = 0
  recordForm.startTime = new Date()
  recordForm.materials = []
  showRecordDialog.value = true
}

const addRecordMaterial = () => {
  recordForm.materials.push({
    materialId: '',
    amount: 1
  })
}

const removeRecordMaterial = (index) => {
  recordForm.materials.splice(index, 1)
}

const submitRecord = async () => {
  if (!recordFormRef.value) return

  try {
    await recordFormRef.value.validate()
    addingRecord.value = true

    const repairmanId = authStore.user?.repairmanId
    const requestData = {
      maintenanceItemId: selectedWork.value.itemId,
      description: recordForm.description,
      repairmanId: repairmanId,
      workHours: recordForm.workHours,
      startTime: recordForm.startTime.toISOString(),
      name: recordForm.name,
      materials: recordForm.materials.map(material => ({
        materialId: material.materialId,
        amount: material.amount
      }))
    }

    const response = await api.post('/api/repairman/maintenance-records/add', requestData)

    if (response.data.code === 200) {
      ElMessage.success('维修记录添加成功')
      showRecordDialog.value = false
      loadCurrentWork()
    }
  } catch (error) {
    console.error('Failed to add record:', error)
  } finally {
    addingRecord.value = false
  }
}

// 获取材料列表
const loadMaterials = async () => {
  try {
    const response = await api.get('/api/admin/materials')
    if (response.data.success) {
      availableMaterials.value = response.data.data
    }
  } catch (error) {
    console.error('Failed to load materials:', error)
  }
}

// 格式化维修人员工种
const formatRepairmanType = (type) => {
  return REPAIRMAN_TYPE_MAP[type] || type
}

onMounted(() => {
  loadCurrentWork()
  loadMaterials()
})
</script>

<style scoped>
.current-work-page {
  max-width: 1200px;
  margin: 0 auto;
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
  border-left: 4px solid #27ae60;
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
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
  margin-bottom: 16px;
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

.progress-container {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.progress-text {
  font-weight: 500;
  color: #606266;
  min-width: 40px;
}

.reminder-section {
  margin-top: 16px;
}

.reminder-box {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: #fef7e6;
  border: 1px solid #f4d03f;
  border-radius: 8px;
  color: #e6a23c;
}

.work-actions {
  display: flex;
  gap: 12px;
  padding-top: 16px;
  border-top: 1px solid #f0f2f5;
}

.empty-state {
  text-align: center;
  padding: 60px 20px;
}

.materials-section {
  width: 100%;
}

.material-item {
  display: flex;
  align-items: center;
  margin-bottom: 12px;
}
</style>