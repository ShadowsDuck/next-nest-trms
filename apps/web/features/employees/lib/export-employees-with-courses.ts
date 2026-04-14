import type { EmployeeQuery, EmployeeResponse } from '@workspace/schemas'
import { escapeCsvValue } from '@/components/niko-table/filters/table-export-button'
import { fetchEmployeesForExport } from '../data'
import { prefixOptions, statusOptions } from './filter-options'

const prefixLabelMap = new Map<string, string>(
  prefixOptions.map((item) => [item.value, item.label])
)
const statusLabelMap = new Map<string, string>(
  statusOptions.map((item) => [item.value, item.label])
)

type ExportTrainingRecord = NonNullable<
  EmployeeResponse['trainingRecords']
>[number]

const courseTypeLabelMap = new Map<string, string>([
  ['Internal', 'ภายใน'],
  ['External', 'ภายนอก'],
  ['internal', 'ภายใน'],
  ['external', 'ภายนอก'],
])

function buildRows(employees: EmployeeResponse[]): string[] {
  const header = [
    'รหัสพนักงาน',
    'ชื่อ-นามสกุล',
    'ระดับงาน',
    'สถานะ',
    'ชื่อการอบรม',
    'ประเภท',
    'วันที่เริ่มจัดอบรม',
    'ระยะเวลา(ชม.)',
  ]

  const rows: string[] = [header.map(escapeCsvValue).join(',')]

  for (const employee of employees) {
    const prefixLabel = prefixLabelMap.get(employee.prefix) ?? employee.prefix
    const fullName = `${prefixLabel} ${employee.firstName} ${employee.lastName}`
    const statusLabel = statusLabelMap.get(employee.status) ?? employee.status
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
          escapeCsvValue(record.course?.startDate ?? ''),
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

function triggerCsvDownload(filename: string, rows: string[]) {
  const csvContent = rows.join('\n')
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.setAttribute('href', url)
  link.setAttribute('download', `${filename}.csv`)
  link.style.visibility = 'hidden'
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export async function exportEmployeesWithCoursesCSV({
  params,
  filename,
  selectedEmployeeNos,
}: {
  params: EmployeeQuery
  filename: string
  selectedEmployeeNos?: string[]
}) {
  const response = await fetchEmployeesForExport(params)
  const selectedSet =
    selectedEmployeeNos && selectedEmployeeNos.length > 0
      ? new Set(selectedEmployeeNos)
      : null

  const employees =
    selectedSet == null
      ? response.data
      : response.data.filter((employee) => selectedSet.has(employee.employeeNo))

  triggerCsvDownload(filename, buildRows(employees))
}
