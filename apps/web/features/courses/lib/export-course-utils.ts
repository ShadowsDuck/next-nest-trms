import type { CourseParticipant, CourseResponse } from '@workspace/schemas'
import { escapeCsvValue } from '@/components/niko-table/filters/table-export-button'
import {
  accreditationStatusOptions,
  courseTypeOptions,
} from '@/features/courses/lib/filter-options'
import {
  prefixOptions,
  statusOptions,
} from '@/features/employees/lib/filter-options'

const courseTypeLabelMap = new Map<string, string>(
  courseTypeOptions.map((option) => [option.value, option.label] as const)
)

const accreditationStatusLabelMap = new Map<string, string>(
  accreditationStatusOptions.map(
    (option) => [option.value, option.label] as const
  )
)

const prefixLabelMap = new Map<string, string>(
  prefixOptions.map((option) => [option.value, option.label] as const)
)

const employeeStatusLabelMap = new Map<string, string>(
  statusOptions.map((option) => [option.value, option.label] as const)
)

function toThaiDate(isoDate: string | null | undefined) {
  if (!isoDate) return ''

  const [year, month, day] = isoDate.split('-')
  if (!year || !month || !day) {
    return isoDate
  }

  return `${day}/${month}/${String(Number(year) + 543)}`
}

function formatNumber(value: number | null | undefined) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    return ''
  }

  return new Intl.NumberFormat('th-TH').format(value)
}

function formatDateRange(startDate: string, endDate: string) {
  const start = toThaiDate(startDate)
  if (startDate === endDate) {
    return start
  }

  return `${start} - ${toThaiDate(endDate)}`
}

function getOrgUnitNameByLevel(
  participant: CourseParticipant,
  targetLevel: 'Division' | 'Department'
) {
  const match = participant.orgPath?.find(
    (orgUnit) => orgUnit.level === targetLevel
  )
  return match?.name ?? ''
}

function getParticipantFullName(participant: CourseParticipant) {
  const prefix = prefixLabelMap.get(participant.prefix) ?? participant.prefix
  return `${prefix} ${participant.firstName} ${participant.lastName}`.trim()
}

function getEmployeeStatusLabel(status: string) {
  return employeeStatusLabelMap.get(status) ?? status
}

export function buildCourseSummaryRow(course: CourseResponse) {
  return [
    escapeCsvValue(course.title),
    escapeCsvValue(courseTypeLabelMap.get(course.type) ?? course.type),
    escapeCsvValue(course.tag?.name ?? ''),
    escapeCsvValue(course.lecturer ?? ''),
    escapeCsvValue(course.institute ?? ''),
    escapeCsvValue(formatNumber(course.expense)),
    escapeCsvValue(formatDateRange(course.startDate, course.endDate)),
    escapeCsvValue(course.duration),
    escapeCsvValue(
      accreditationStatusLabelMap.get(course.accreditationStatus) ??
        course.accreditationStatus
    ),
  ].join(',')
}

export function buildParticipantRows(course: CourseResponse) {
  return (course.participants ?? []).map((participant) =>
    [
      escapeCsvValue(participant.employeeNo),
      escapeCsvValue(getParticipantFullName(participant)),
      escapeCsvValue(participant.jobLevel),
      escapeCsvValue(getOrgUnitNameByLevel(participant, 'Division')),
      escapeCsvValue(getOrgUnitNameByLevel(participant, 'Department')),
      escapeCsvValue(getEmployeeStatusLabel(participant.status)),
    ].join(',')
  )
}

export const COURSE_EXPORT_HEADER = [
  'ชื่อหลักสูตร',
  'ประเภท',
  'หมวดหมู่',
  'วิทยากร',
  'สถาบัน',
  'ค่าใช้จ่าย',
  'ช่วงวันที่อบรม',
  'รวมเวลา(ชม.)',
  'สถานะการรับรอง',
]

export const COURSE_PARTICIPANT_HEADER = [
  'รหัสพนักงาน',
  'ชื่อ - นามสกุล',
  'ระดับงาน',
  'ฝ่าย',
  'ส่วนงาน',
  'สถานะ',
]
