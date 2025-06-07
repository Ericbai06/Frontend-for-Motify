import { MAINTENANCE_STATUS, REPAIRMAN_TYPE, MATERIAL_TYPE } from './constants'

// 格式化日期时间
export const formatDateTime = (dateTime) => {
  if (!dateTime) return '-'
  const date = new Date(dateTime)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// 格式化日期
export const formatDate = (date) => {
  if (!date) return '-'
  const d = new Date(date)
  return d.toLocaleDateString('zh-CN')
}

// 格式化金额
export const formatCurrency = (amount) => {
  if (amount === null || amount === undefined) return '-'
  return `¥${Number(amount).toFixed(2)}`
}

// 格式化维修状态
export const formatStatus = (status) => {
  return MAINTENANCE_STATUS[status] || status
}

// 格式化维修人员类型
export const formatRepairmanType = (type) => {
  return REPAIRMAN_TYPE[type] || type
}

// 格式化材料类型
export const formatMaterialType = (type) => {
  return MATERIAL_TYPE[type] || type
}

// 格式化进度百分比
export const formatProgress = (progress) => {
  if (progress === null || progress === undefined) return '0%'
  return `${progress}%`
}

// 格式化工时
export const formatWorkHours = (hours) => {
  if (!hours) return '-'
  return `${hours}小时`
}

// 格式化评分
export const formatRating = (score) => {
  if (!score) return '未评分'
  return `${score}分`
}

// 获取相对时间
export const getRelativeTime = (dateTime) => {
  if (!dateTime) return '-'
  
  const now = new Date()
  const date = new Date(dateTime)
  const diff = now - date
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  
  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`
  
  return formatDate(dateTime)
}