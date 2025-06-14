<template>
  <div class="materials-page">
    <!-- 头部统计卡片 -->
    <div class="stats-container">
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#409EFF"><Box /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.totalMaterials }}</div>
          <div class="stat-label">总材料数</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#E6A23C"><Warning /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.lowStockCount }}</div>
          <div class="stat-label">低库存材料</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#67C23A"><CircleCheck /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ formatCurrency(stats.totalValue) }}</div>
          <div class="stat-label">库存总价值</div>
        </div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">
          <el-icon color="#F56C6C"><CircleClose /></el-icon>
        </div>
        <div class="stat-content">
          <div class="stat-value">{{ stats.outOfStockCount }}</div>
          <div class="stat-label">缺货材料</div>
        </div>
      </div>
    </div>

    <!-- 主要内容区 -->
    <div class="card-container">
      <div class="flex-between mb-4">
        <h2>材料库存管理</h2>
        <div class="action-buttons">
          <el-button 
            :type="showingLowStock ? 'primary' : 'default'" 
            @click="toggleLowStockView"
          >
            {{ showingLowStock ? '显示全部库存' : '查看低库存' }}
          </el-button>
          <el-button type="primary" @click="showAddDialog = true">
            <el-icon><Plus /></el-icon>
            添加材料
          </el-button>
        </div>
      </div>

      <!-- 筛选表单 -->
      <el-form :inline="true" class="filter-form mb-4">
        <el-form-item label="材料类型">
          <el-select v-model="filters.type" placeholder="选择类型" clearable @change="loadMaterials">
            <el-option
              v-for="(label, key) in MATERIAL_TYPE_MAP"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存范围">
          <el-input-number
            v-model="filters.minStock"
            :min="0"
            placeholder="最小库存"
            style="width: 120px;"
          />
          <span style="margin: 0 8px;">-</span>
          <el-input-number
            v-model="filters.maxStock"
            :min="0"
            placeholder="最大库存"
            style="width: 120px;"
          />
        </el-form-item>
        <el-form-item label="材料名称">
          <el-input v-model="filters.name" placeholder="搜索材料名称" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="applyFilters">查询</el-button>
          <el-button @click="resetFilters">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- 材料列表 -->
      <el-table 
        :data="displayMaterials" 
        style="width: 100%" 
        v-loading="loading"
        :row-class-name="getRowClassName"
      >
        <el-table-column prop="materialId" label="ID" width="80" />
        <el-table-column prop="name" label="材料名称" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="120">
          <template #default="{ row }">
            <el-tag :type="getTypeTagType(row.type)">
              {{ MATERIAL_TYPE_MAP[row.type] || row.type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="stock" label="库存数量" width="100" sortable>
          <template #default="{ row }">
            <span :class="{ 'low-stock': row.stock <= 10, 'out-of-stock': row.stock === 0 }">
              {{ row.stock }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="price" label="单价" width="100">
          <template #default="{ row }">
            {{ formatCurrency(row.price) }}
          </template>
        </el-table-column>
        <el-table-column label="库存状态" width="100">
          <template #default="{ row }">
            <el-tag v-if="row.stock === 0" type="danger">缺货</el-tag>
            <el-tag v-else-if="row.stock <= 10" type="warning">库存不足</el-tag>
            <el-tag v-else type="success">充足</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="总价值" width="120">
          <template #default="{ row }">
            {{ formatCurrency(row.stock * row.price) }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button type="primary" text @click="editMaterial(row)">编辑</el-button>
            <el-button type="info" text @click="viewMaterial(row)">详情</el-button>
            <el-button type="danger" text @click="deleteMaterial(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-container">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :page-sizes="[10, 20, 50, 100]"
          :total="total"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadMaterials"
          @current-change="loadMaterials"
        />
      </div>
    </div>

    <!-- 添加/编辑材料对话框 -->
    <el-dialog
      :title="editingMaterial ? '编辑材料' : '添加材料'"
      v-model="showAddDialog"
      width="600px"
    >
      <el-form
        ref="materialFormRef"
        :model="materialForm"
        :rules="materialRules"
        label-width="100px"
      >
        <el-form-item label="材料名称" prop="name">
          <el-input v-model="materialForm.name" placeholder="请输入材料名称" />
        </el-form-item>
        <el-form-item label="材料描述" prop="description">
          <el-input
            v-model="materialForm.description"
            type="textarea"
            :rows="3"
            placeholder="请输入材料描述"
          />
        </el-form-item>
        <el-form-item label="材料类型" prop="type">
          <el-select v-model="materialForm.type" placeholder="选择材料类型">
            <el-option
              v-for="(label, key) in MATERIAL_TYPE_MAP"
              :key="key"
              :label="label"
              :value="key"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="库存数量" prop="stock">
          <el-input-number
            v-model="materialForm.stock"
            :min="0"
            :max="99999"
            controls-position="right"
            style="width: 200px;"
          />
        </el-form-item>
        <el-form-item label="单价" prop="price">
          <el-input-number
            v-model="materialForm.price"
            :min="0"
            :precision="2"
            controls-position="right"
            style="width: 200px;"
          />
          <span style="margin-left: 8px;">元</span>
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showAddDialog = false">取消</el-button>
        <el-button type="primary" :loading="submitting" @click="submitMaterial">
          {{ editingMaterial ? '更新' : '添加' }}
        </el-button>
      </template>
    </el-dialog>

    <!-- 材料详情对话框 -->
    <el-dialog
      title="材料详情"
      v-model="showDetailDialog"
      width="500px"
    >
      <div v-if="selectedMaterial" class="material-detail">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="材料ID">
            {{ selectedMaterial.materialId }}
          </el-descriptions-item>
          <el-descriptions-item label="材料名称">
            {{ selectedMaterial.name }}
          </el-descriptions-item>
          <el-descriptions-item label="材料描述">
            {{ selectedMaterial.description }}
          </el-descriptions-item>
          <el-descriptions-item label="材料类型">
            <el-tag :type="getTypeTagType(selectedMaterial.type)">
              {{ MATERIAL_TYPE_MAP[selectedMaterial.type] || selectedMaterial.type }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="库存数量">
            <span :class="{ 'low-stock': selectedMaterial.stock <= 10, 'out-of-stock': selectedMaterial.stock === 0 }">
              {{ selectedMaterial.stock }}
            </span>
          </el-descriptions-item>
          <el-descriptions-item label="单价">
            {{ formatCurrency(selectedMaterial.price) }}
          </el-descriptions-item>
          <el-descriptions-item label="库存状态">
            <el-tag v-if="selectedMaterial.stock === 0" type="danger">缺货</el-tag>
            <el-tag v-else-if="selectedMaterial.stock <= 10" type="warning">库存不足</el-tag>
            <el-tag v-else type="success">充足</el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="总价值">
            {{ formatCurrency(selectedMaterial.stock * selectedMaterial.price) }}
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted, computed } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import api from '../../utils/api'
import { formatCurrency } from '../../utils/format'
import { MATERIAL_TYPE_MAP } from '../../utils/constants'

const materials = ref([])
const loading = ref(false)
const total = ref(0)
const pageSize = ref(20)
const currentPage = ref(1)
const showAddDialog = ref(false)
const showDetailDialog = ref(false)
const submitting = ref(false)
const editingMaterial = ref(null)
const selectedMaterial = ref(null)
const showingLowStock = ref(false)

const materialFormRef = ref()

const filters = reactive({
  type: '',
  minStock: null,
  maxStock: null,
  name: ''
})

const materialForm = reactive({
  name: '',
  description: '',
  type: '',
  stock: 0,
  price: 0
})

const materialRules = {
  name: [
    { required: true, message: '请输入材料名称', trigger: 'blur' }
  ],
  description: [
    { required: true, message: '请输入材料描述', trigger: 'blur' }
  ],
  type: [
    { required: true, message: '请选择材料类型', trigger: 'change' }
  ],
  stock: [
    { required: true, message: '请输入库存数量', trigger: 'blur' }
  ],
  price: [
    { required: true, message: '请输入单价', trigger: 'blur' }
  ]
}

// 统计信息
const stats = computed(() => {
  const totalMaterials = materials.value.length
  const lowStockCount = materials.value.filter(m => m.stock <= 10 && m.stock > 0).length
  const outOfStockCount = materials.value.filter(m => m.stock === 0).length
  const totalValue = materials.value.reduce((sum, m) => sum + (m.stock * m.price), 0)

  return {
    totalMaterials,
    lowStockCount,
    outOfStockCount,
    totalValue
  }
})

// 根据当前状态显示不同的材料列表
const displayMaterials = computed(() => {
  return showingLowStock.value ? lowStockMaterials.value : materials.value
})

const lowStockMaterials = ref([])

const loadMaterials = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/materials')
    
    if (response.data.success) {
      materials.value = response.data.data
      total.value = response.data.count || response.data.data.length
    }
  } catch (error) {
    console.error('Failed to load materials:', error)
    ElMessage.error('获取材料列表失败')
  } finally {
    loading.value = false
  }
}

const loadMaterialsByType = async (type) => {
  try {
    loading.value = true
    const response = await api.get(`/api/admin/materials/by-type?type=${type}`)
    
    if (response.data.success) {
      materials.value = response.data.data
      total.value = response.data.count || response.data.data.length
    }
  } catch (error) {
    console.error('Failed to load materials by type:', error)
    ElMessage.error('获取指定类型材料失败')
  } finally {
    loading.value = false
  }
}

const loadMaterialsByStockRange = async (minStock, maxStock) => {
  try {
    loading.value = true
    const response = await api.get(`/api/admin/materials/by-stock-range?minStock=${minStock}&maxStock=${maxStock}`)
    
    if (response.data.success) {
      materials.value = response.data.data
      total.value = response.data.count || response.data.data.length
    }
  } catch (error) {
    console.error('Failed to load materials by stock range:', error)
    ElMessage.error('获取指定库存范围材料失败')
  } finally {
    loading.value = false
  }
}

const loadLowStockMaterials = async () => {
  try {
    loading.value = true
    const response = await api.get('/api/admin/materials/low-stock')
    
    if (response.data.success) {
      lowStockMaterials.value = response.data.data
      total.value = response.data.count || response.data.data.length
      ElMessage.success(`找到 ${lowStockMaterials.value.length} 个低库存材料`)
    }
  } catch (error) {
    console.error('Failed to load low stock materials:', error)
    ElMessage.error('获取低库存材料失败')
  } finally {
    loading.value = false
  }
}

const applyFilters = () => {
  if (filters.type) {
    loadMaterialsByType(filters.type)
  } else if (filters.minStock !== null && filters.maxStock !== null) {
    loadMaterialsByStockRange(filters.minStock, filters.maxStock)
  } else if (filters.name) {
    // 按名称筛选（前端筛选）
    const filteredMaterials = materials.value.filter(material =>
      material.name.toLowerCase().includes(filters.name.toLowerCase())
    )
    materials.value = filteredMaterials
  } else {
    loadMaterials()
  }
}

const resetFilters = () => {
  filters.type = ''
  filters.minStock = null
  filters.maxStock = null
  filters.name = ''
  loadMaterials()
}

const editMaterial = (material) => {
  editingMaterial.value = material
  materialForm.name = material.name
  materialForm.description = material.description
  materialForm.type = material.type
  materialForm.stock = material.stock
  materialForm.price = material.price
  showAddDialog.value = true
}

const viewMaterial = (material) => {
  selectedMaterial.value = material
  showDetailDialog.value = true
}

const deleteMaterial = async (material) => {
  try {
    await ElMessageBox.confirm(`确定要删除材料"${material.name}"吗？`, '确认删除', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    // 这里应该调用删除API，但根据提供的API文档没有删除接口
    // 所以只是模拟删除操作
    ElMessage.success('删除功能待后端API支持')
  } catch {
    // 用户取消
  }
}

const submitMaterial = async () => {
  if (!materialFormRef.value) return

  try {
    await materialFormRef.value.validate()
    submitting.value = true

    // 这里应该调用添加/更新API，但根据提供的API文档没有相关接口
    // 所以只是模拟操作
    if (editingMaterial.value) {
      ElMessage.success('更新功能待后端API支持')
    } else {
      ElMessage.success('添加功能待后端API支持')
    }

    showAddDialog.value = false
    loadMaterials()
  } catch (error) {
    console.error('Failed to submit material:', error)
  } finally {
    submitting.value = false
  }
}

const getRowClassName = ({ row }) => {
  if (row.stock === 0) return 'out-of-stock-row'
  if (row.stock <= 10) return 'low-stock-row'
  return ''
}

const getTypeTagType = (type) => {
  const typeColors = {
    OIL: 'warning',
    FILTER: 'info',
    BRAKE: 'danger',
    TIRE: 'success',
    BATTERY: 'primary',
    ELECTRICAL: 'warning',
    BODY: 'info',
    OTHER: ''
  }
  return typeColors[type] || ''
}

// 切换显示模式
const toggleLowStockView = () => {
  showingLowStock.value = !showingLowStock.value
  
  // 如果切换到低库存模式且还没有获取过低库存数据
  if (showingLowStock.value && lowStockMaterials.value.length === 0) {
    loadLowStockMaterials()
  }
}

onMounted(() => {
  loadMaterials()
})
</script>

<style scoped>
.materials-page {
  padding: 20px;
}

.stats-container {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 20px;
  margin-bottom: 24px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s;
}

.stat-card:hover {
  transform: translateY(-2px);
}

.stat-icon {
  font-size: 24px;
  margin-right: 16px;
}

.stat-content {
  flex: 1;
}

.stat-value {
  font-size: 24px;
  font-weight: bold;
  color: #2c3e50;
  margin-bottom: 4px;
}

.stat-label {
  font-size: 14px;
  color: #7f8c8d;
}

.filter-form {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.pagination-container {
  display: flex;
  justify-content: center;
  margin-top: 20px;
}

.material-detail {
  padding: 16px;
}

.low-stock {
  color: #E6A23C;
  font-weight: bold;
}

.out-of-stock {
  color: #F56C6C;
  font-weight: bold;
}

:deep(.low-stock-row) {
  background-color: #fdf6ec;
}

:deep(.out-of-stock-row) {
  background-color: #fef0f0;
}

:deep(.el-table .warning-row) {
  background: #fdf6ec;
}

:deep(.el-table .danger-row) {
  background: #fef0f0;
}
</style>
