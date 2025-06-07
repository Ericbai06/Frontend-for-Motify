// 维修状态常量
export const MAINTENANCE_STATUS = {
  PENDING: '待处理',
  ACCEPTED: '已接收',
  CANCELLED: '已取消',
  IN_PROGRESS: '维修中',
  COMPLETED: '已完成'
}

// 维修人员类型常量
export const REPAIRMAN_TYPE = {
  MECHANIC: '机修工',
  ELECTRICIAN: '电工',
  BODYWORKER: '钣金工',
  PAINTER: '喷漆工',
  APPRENTICE: '学徒工',
  INSPECTOR: '质检员',
  DIAGNOSER: '故障诊断师'
}

// 材料类型常量
export const MATERIAL_TYPE = {
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
  COMPLETED: 'success'
}

// 评分星级
export const RATING_LABELS = {
  1: '非常不满意',
  2: '不满意',
  3: '一般',
  4: '满意',
  5: '非常满意'
}