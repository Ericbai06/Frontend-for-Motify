// 维修状态常量
export const MAINTENANCE_STATUS = {
  PENDING: '待处理',
  ACCEPTED: '已接收',
  CANCELLED: '已取消',
  IN_PROGRESS: '维修中',
  COMPLETED: '已完成',
  AWAITING_ASSIGNMENT: '待分配工种'
}

// 维修工单状态
export const ORDER_STATUS = {
  PENDING: 'PENDING',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
}

export const ORDER_STATUS_MAP = {
  PENDING: '待处理',
  IN_PROGRESS: '进行中',
  COMPLETED: '已完成',
  CANCELLED: '已取消'
}

// 维修人员工种类型
export const REPAIRMAN_TYPE = {
  MECHANIC: 'MECHANIC',
  ELECTRICIAN: 'ELECTRICIAN',
  PAINTER: 'PAINTER',
  WELDER: 'WELDER',
  SHEET_METAL: 'SHEET_METAL',
  APPRENTICE: 'APPRENTICE',
  INSPECTOR: 'INSPECTOR',
  DIAGNOSER: 'DIAGNOSER'
}

// 工种类型映射
export const REPAIRMAN_TYPE_MAP = {
  MECHANIC: '机修工',
  ELECTRICIAN: '电工',
  PAINTER: '喷漆工',
  WELDER: '焊工',
  SHEET_METAL: '钣金工',
  APPRENTICE: '学徒',
  INSPECTOR: '质检员',
  DIAGNOSER: '故障诊断师'
}

// 工种类型选项
export const REPAIRMAN_TYPES = [
  { value: 'MECHANIC', label: '机修工' },
  { value: 'ELECTRICIAN', label: '电工' },
  { value: 'PAINTER', label: '喷漆工' },
  { value: 'WELDER', label: '焊工' },
  { value: 'SHEET_METAL', label: '钣金工' },
  { value: 'APPRENTICE', label: '学徒' },
  { value: 'INSPECTOR', label: '质检员' },
  { value: 'DIAGNOSER', label: '故障诊断师' }
]

// 材料类型
export const MATERIAL_TYPE = {
  SPARE_PART: 'SPARE_PART',
  CONSUMABLE: 'CONSUMABLE',
  TOOL: 'TOOL',
  OIL: 'OIL',
  FILTER: 'FILTER',
  BRAKE: 'BRAKE',
  TIRE: 'TIRE',
  BATTERY: 'BATTERY',
  ELECTRICAL: 'ELECTRICAL',
  BODY: 'BODY',
  OTHER: 'OTHER'
}

export const MATERIAL_TYPE_MAP = {
  SPARE_PART: '零配件',
  CONSUMABLE: '耗材',
  TOOL: '工具',
  OIL: '机油',
  FILTER: '滤芯',
  BRAKE: '刹车系统',
  TIRE: '轮胎',
  BATTERY: '电池',
  ELECTRICAL: '电气系统',
  BODY: '车身部件',
  OTHER: '其他'
}

// 状态颜色映射
export const STATUS_COLORS = {
  PENDING: 'warning',
  ACCEPTED: 'info',
  CANCELLED: 'danger',
  IN_PROGRESS: 'primary',
  COMPLETED: 'success',
  AWAITING_ASSIGNMENT: 'info'
}

// 评分标签
export const RATING_LABELS = {
  1: '非常差',
  2: '较差',
  3: '一般',
  4: '良好',
  5: '非常好'
}

// 维修记录类型常量
export const MAINTENANCE_TYPES = [
  { value: 'ENGINE', label: '发动机维修' },
  { value: 'BRAKE', label: '刹车系统' },
  { value: 'SUSPENSION', label: '悬挂系统' },
  { value: 'ELECTRICAL', label: '电气系统' },
  { value: 'TRANSMISSION', label: '变速箱' },
  { value: 'BODY', label: '车身维修' },
  { value: 'INTERIOR', label: '内饰维修' },
  { value: 'ROUTINE', label: '常规保养' },
  { value: 'OTHER', label: '其他' }
]