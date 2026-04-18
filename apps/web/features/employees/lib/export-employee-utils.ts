import type { EmployeeResponse } from '@workspace/schemas'
import { escapeCsvValue } from '@/components/niko-table/filters/table-export-button'
import { prefixOptions, statusOptions } from './filter-options'

const prefixLabelMap = new Map<string, string>(
  prefixOptions.map((item) => [item.value, item.label])
)

const statusLabelMap = new Map<string, string>(
  statusOptions.map((item) => [item.value, item.label])
)

const courseTypeLabelMap = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
  ['internal', 'ภายใน'],
  ['external', 'ภายนอก'],
])

type ExportTrainingRecord = NonNullable<
  EmployeeResponse['trainingRecords']
>[number]

export const EMPLOYEE_EXPORT_HEADER = [
  'รหัสพนักงาน',
  'ชื่อ-นามสกุล',
  'ระดับงาน',
  'สถานะ',
]

export const EMPLOYEE_COURSE_EXPORT_HEADER = [
  'รหัสพนักงาน',
  'ชื่อ-นามสกุล',
  'ระดับงาน',
  'สถานะ',
  'หัวข้อการอบรม',
  'ประเภท',
  'วันที่จัดอบรม',
  'ระยะเวลา(ชม.)',
]

/**
 * แปลงวันที่จาก ISO string เป็น DD/MM/YYYY (ปี พ.ศ.)
 * เช่น 2026-02-24 → 24/02/2569
 */
function toThaiDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''

  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return dateStr

  const day = String(date.getUTCDate()).padStart(2, '0')
  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const year = date.getUTCFullYear() + 543
  return `${day}/${month}/${year}`
}

function getEmployeeFullName(employee: EmployeeResponse) {
  const prefixLabel = prefixLabelMap.get(employee.prefix) ?? employee.prefix
  return `${prefixLabel} ${employee.firstName} ${employee.lastName}`
}

function getEmployeeStatusLabel(status: string) {
  return statusLabelMap.get(status) ?? status
}

export function buildEmployeeRows(employees: EmployeeResponse[]): string[] {
  const rows: string[] = [EMPLOYEE_EXPORT_HEADER.map(escapeCsvValue).join(',')]

  for (const employee of employees) {
    rows.push(
      [
        escapeCsvValue(employee.employeeNo),
        escapeCsvValue(getEmployeeFullName(employee)),
        escapeCsvValue(employee.jobLevel),
        escapeCsvValue(getEmployeeStatusLabel(employee.status)),
      ].join(',')
    )
  }

  return rows
}

export function buildEmployeeCourseRows(
  employees: EmployeeResponse[]
): string[] {
  const rows: string[] = [
    EMPLOYEE_COURSE_EXPORT_HEADER.map(escapeCsvValue).join(','),
  ]

  for (const employee of employees) {
    const fullName = getEmployeeFullName(employee)
    const statusLabel = getEmployeeStatusLabel(employee.status)
    const records = employee.trainingRecords ?? []

    if (records.length === 0) {
      rows.push(
        [
          escapeCsvValue(employee.employeeNo),
          escapeCsvValue(fullName),
          escapeCsvValue(employee.jobLevel),
          escapeCsvValue(statusLabel),
          '',
          '',
          '',
          '',
        ].join(',')
      )
      continue
    }

    let totalDuration = 0

    for (const [index, record] of (
      records as ExportTrainingRecord[]
    ).entries()) {
      const rawDuration = record.course?.duration ?? ''
      const durationNumber =
        typeof rawDuration === 'number'
          ? rawDuration
          : Number.parseFloat(String(rawDuration))

      if (!Number.isNaN(durationNumber)) {
        totalDuration += durationNumber
      }

      const courseTypeRaw = record.course?.type ?? ''
      const courseTypeLabel =
        courseTypeLabelMap.get(String(courseTypeRaw)) ?? String(courseTypeRaw)

      rows.push(
        [
          index === 0 ? escapeCsvValue(employee.employeeNo) : '',
          index === 0 ? escapeCsvValue(fullName) : '',
          index === 0 ? escapeCsvValue(employee.jobLevel) : '',
          index === 0 ? escapeCsvValue(statusLabel) : '',
          escapeCsvValue(record.course?.title ?? ''),
          escapeCsvValue(courseTypeLabel),
          escapeCsvValue(toThaiDate(record.course?.startDate)),
          escapeCsvValue(rawDuration),
        ].join(',')
      )
    }

    rows.push(
      [
        escapeCsvValue('รวมเวลาเข้าร่วมทั้งหมด'),
        '',
        '',
        '',
        '',
        '',
        '',
        escapeCsvValue(
          Number.isInteger(totalDuration)
            ? totalDuration
            : totalDuration.toFixed(2)
        ),
      ].join(',')
    )
  }

  return rows
}
