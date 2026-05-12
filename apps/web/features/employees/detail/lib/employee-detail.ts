import type {
  EmployeeResponse,
  TrainingRecordResponse,
} from '@workspace/schemas'
import { formatDate } from '@/shared/components/niko-table/lib/format'

export type EmployeeDetailStats = {
  totalTrainings: number
  totalHours: number
  certificateCount: number
  latestTrainingDate: string | null
}

// สรุปตัวเลขภาพรวมจากประวัติการอบรมจริงของพนักงานเพื่อใช้ในการ์ดด้านบนของหน้า
export function buildEmployeeDetailStats(
  employee: EmployeeResponse
): EmployeeDetailStats {
  const trainingRecords = employee.trainingRecords ?? []
  const latestTrainingDate = trainingRecords.reduce<string | null>(
    (latest, trainingRecord) => {
      const endDate = trainingRecord.course?.endDate ?? null
      if (!endDate) {
        return latest
      }

      if (!latest) {
        return endDate
      }

      return new Date(endDate) > new Date(latest) ? endDate : latest
    },
    null
  )

  return {
    totalTrainings: trainingRecords.length,
    totalHours: trainingRecords.reduce(
      (sum, trainingRecord) =>
        sum + Number(trainingRecord.course?.duration ?? 0),
      0
    ),
    certificateCount: trainingRecords.filter(
      (trainingRecord) => trainingRecord.certFilePath != null
    ).length,
    latestTrainingDate,
  }
}

// สร้าง URL ปลายทางของไฟล์ใบรับรองให้ browser ใช้เปิดหรือดาวน์โหลดได้ทั้งแบบ relative และ absolute
export function buildCertificateFileUrl(
  certFilePath: string | null | undefined,
  apiBaseUrl: string
): string | null {
  if (!certFilePath) {
    return null
  }

  if (/^https?:\/\//i.test(certFilePath)) {
    return certFilePath
  }

  return new URL(certFilePath, apiBaseUrl).toString()
}

// แปลงวันที่ ISO ให้เป็นข้อความภาษาไทยแบบสั้นเพื่อใช้ในหน้า detail
export function formatThaiDate(value: string | null | undefined): string {
  if (!value) {
    return '-'
  }

  return formatDate(value, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

// แปลงช่วงวันที่ของหลักสูตรให้อ่านง่ายในตารางประวัติการอบรม
export function formatCourseDateRange(
  trainingRecord: TrainingRecordResponse
): string {
  const startDate = trainingRecord.course?.startDate
  const endDate = trainingRecord.course?.endDate

  if (!startDate || !endDate) {
    return '-'
  }

  return `${formatThaiDate(startDate)} - ${formatThaiDate(endDate)}`
}

// สร้างสี badge ของหมวดหมู่หลักสูตรจาก colorCode จริง และ fallback เมื่อไม่มีค่า
export function getTrainingCategoryBadgeStyle(colorCode?: string | null) {
  if (!colorCode) {
    return {
      backgroundColor: '#EEF2FF',
      color: '#4F46E5',
    }
  }

  return {
    backgroundColor: `${colorCode}1A`,
    color: colorCode,
  }
}

const prefixLabelByValue = new Map<string, string>([
  ['Mr', 'นาย'],
  ['Mrs', 'นาง'],
  ['Miss', 'นางสาว'],
])

const statusLabelByValue = new Map<string, string>([
  ['Active', 'ทำงาน'],
  ['Resigned', 'ลาออก'],
])

const courseTypeLabelByValue = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
])

// แปลงคำนำหน้าให้เป็นภาษาไทย
export function getPrefixLabel(prefix: string | null | undefined): string {
  if (!prefix) return '-'
  return prefixLabelByValue.get(prefix) ?? prefix
}

// แปลงสถานะพนักงานให้เป็นภาษาไทย
export function getStatusLabel(status: string | null | undefined): string {
  if (!status) return '-'
  return statusLabelByValue.get(status) ?? status
}

// แปลงประเภทหลักสูตรให้เป็นภาษาไทย
export function getCourseTypeLabel(type: string | null | undefined): string {
  if (!type) return '-'
  return courseTypeLabelByValue.get(type) ?? type
}
