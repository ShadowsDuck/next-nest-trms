import type { SummaryReportSnapshot } from '@workspace/schemas'
import {
  buildSummaryReportProjection,
  type SummaryReportCourse,
  type SummaryReportEnrollment,
  type SummaryReportParticipant,
} from './summary-report-projection'

type BreakdownItem = {
  label: string
  count: number
  share: number
  expense?: number
  participants?: number
  expensePerPerson?: number
  category?: string
}

type KpiItem = {
  label: string
  value: number
  helperText: string
}

type ReportAnalytics = {
  title: string
  subtitle: string
  generatedAtLabel: string
  sourceLabel: string
  totalExpense: number
  totalExpensePerParticipant: number
  kpis: KpiItem[]
  topDivisionBreakdown: BreakdownItem[]
  genderBreakdown: BreakdownItem[]
  jobLevelBreakdown: BreakdownItem[]
  courseTypeBreakdown: BreakdownItem[]
  orgBreakdowns: {
    plant: BreakdownItem[]
    businessUnit: BreakdownItem[]
    function: BreakdownItem[]
    division: BreakdownItem[]
    department: BreakdownItem[]
  }
  expenseBreakdown: BreakdownItem[]
  topCourseBreakdown: BreakdownItem[]
}

function normalizeCourseTypeLabel(type: string) {
  if (type === 'Internal' || type === 'internal') return 'ภายใน'
  if (type === 'External' || type === 'external') return 'ภายนอก'
  return type || 'ไม่ระบุ'
}

function sortByPreferredLabels(
  items: BreakdownItem[],
  preferredLabels: string[]
) {
  const labelIndexMap = new Map(
    preferredLabels.map((label, index) => [label, index] as const)
  )

  return [...items].sort((a, b) => {
    const aIndex = labelIndexMap.get(a.label)
    const bIndex = labelIndexMap.get(b.label)

    if (aIndex != null || bIndex != null) {
      if (aIndex == null) return 1
      if (bIndex == null) return -1
      return aIndex - bIndex
    }

    return b.count - a.count || a.label.localeCompare(b.label, 'th')
  })
}

function toPercentage(count: number, total: number) {
  if (total <= 0) return 0
  return Number(((count / total) * 100).toFixed(1))
}

function formatGeneratedAt(isoDate: string) {
  const date = new Date(isoDate)
  return date.toLocaleString('th-TH', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

function deriveGenderFromPrefix(prefix: string) {
  if (prefix === 'Mr') return 'ชาย'
  if (prefix === 'Mrs' || prefix === 'Miss') return 'หญิง'
  return 'ไม่ระบุ'
}

function deriveTenureBucket(hireDate?: string | null) {
  if (!hireDate) return 'ไม่ระบุ'

  const hire = new Date(hireDate)
  if (Number.isNaN(hire.getTime())) return 'ไม่ระบุ'

  const now = new Date()
  const years =
    (now.getTime() - hire.getTime()) / (1000 * 60 * 60 * 24 * 365.25)

  if (years < 1) return '< 1 ปี'
  if (years < 3) return '1-3 ปี'
  if (years < 5) return '3-5 ปี'
  return '5+ ปี'
}

function buildBreakdown(
  items: string[],
  total: number,
  expenseByLabel?: Map<string, number>
): BreakdownItem[] {
  const countByLabel = new Map<string, number>()

  for (const item of items) {
    countByLabel.set(item, (countByLabel.get(item) ?? 0) + 1)
  }

  return [...countByLabel.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: toPercentage(count, total),
      expense: expenseByLabel?.get(label),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'))
}

function buildExpenseBreakdown({
  courses,
  enrollments,
}: {
  courses: SummaryReportCourse[]
  enrollments: SummaryReportEnrollment[]
}): BreakdownItem[] {
  const expenseByType = new Map<string, number>()
  const countByType = new Map<string, number>()
  const participantCountByType = new Map<string, number>()
  const totalCourses = courses.length

  for (const course of courses) {
    const typeLabel = normalizeCourseTypeLabel(course.type)
    expenseByType.set(
      typeLabel,
      (expenseByType.get(typeLabel) ?? 0) + course.expense
    )
    countByType.set(typeLabel, (countByType.get(typeLabel) ?? 0) + 1)
  }

  for (const enrollment of enrollments) {
    const typeLabel = normalizeCourseTypeLabel(enrollment.type)
    participantCountByType.set(
      typeLabel,
      (participantCountByType.get(typeLabel) ?? 0) + 1
    )
  }

  return [...expenseByType.entries()]
    .map(([label, expense]) => ({
      label,
      count: countByType.get(label) ?? 0,
      share: toPercentage(countByType.get(label) ?? 0, totalCourses),
      expense,
      participants: participantCountByType.get(label) ?? 0,
      expensePerPerson:
        (participantCountByType.get(label) ?? 0) > 0
          ? expense / (participantCountByType.get(label) ?? 0)
          : 0,
    }))
    .sort((a, b) => (b.expense ?? 0) - (a.expense ?? 0))
}

function buildTopCourseCategoryBreakdown(
  enrollments: Array<{ category?: string }>
): BreakdownItem[] {
  const countByCategory = new Map<string, number>()

  for (const enrollment of enrollments) {
    const label = enrollment.category || 'ไม่ระบุ'
    countByCategory.set(label, (countByCategory.get(label) ?? 0) + 1)
  }

  return [...countByCategory.entries()]
    .map(([label, count]) => ({
      label,
      count,
      share: toPercentage(count, enrollments.length),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'))
    .slice(0, 5)
}

function buildCourseTypeBreakdown({
  uniqueCourses,
  totalCourses,
}: {
  uniqueCourses: SummaryReportCourse[]
  totalCourses: number
}) {
  return sortByPreferredLabels(
    buildBreakdown(
      uniqueCourses.map((item) => normalizeCourseTypeLabel(item.type)),
      totalCourses
    ),
    ['ภายใน', 'ภายนอก', 'ไม่ระบุ']
  )
}

export function buildSummaryReportAnalytics(
  context: SummaryReportSnapshot
): ReportAnalytics {
  const { participants, uniqueCourses, enrollments } =
    buildSummaryReportProjection(context)
  const totalParticipants = participants.length
  const totalCourses = uniqueCourses.length
  const totalEnrollments = enrollments.length
  const totalExpense = uniqueCourses.reduce(
    (sum, course) => sum + course.expense,
    0
  )
  const averageExpensePerCourse =
    totalCourses > 0 ? totalExpense / totalCourses : 0
  const totalExpensePerParticipant =
    totalEnrollments > 0 ? totalExpense / totalEnrollments : 0

  return {
    title:
      context.source === 'employees'
        ? 'รายงานสรุปจากรายการพนักงาน'
        : 'รายงานสรุปจากรายการหลักสูตร',
    subtitle:
      context.source === 'employees'
        ? 'สรุปภาพรวมการฝึกอบรมจากพนักงานที่เลือก'
        : 'สรุปภาพรวมการฝึกอบรมจากหลักสูตรที่เลือก',
    generatedAtLabel: formatGeneratedAt(context.generatedAt),
    sourceLabel:
      context.source === 'employees' ? 'ชุดข้อมูลพนักงาน' : 'ชุดข้อมูลหลักสูตร',
    totalExpense,
    totalExpensePerParticipant,
    kpis: [
      {
        label: 'ผู้เข้าฝึกอบรม',
        value: totalParticipants,
        helperText: 'นับแบบคนไม่ซ้ำในรายงานนี้',
      },
      {
        label: 'หลักสูตรในรายงาน',
        value: totalCourses,
        helperText: 'นับแบบหลักสูตรไม่ซ้ำ',
      },
      {
        label: 'จำนวนการเข้าอบรม',
        value: totalEnrollments,
        helperText: 'นับตามรายการเข้าอบรม',
      },
      {
        label: 'ค่าใช้จ่ายรวม',
        value: totalExpense,
        helperText: `เฉลี่ยต่อหลักสูตร ${averageExpensePerCourse.toLocaleString(
          'th-TH',
          {
            maximumFractionDigits: 0,
          }
        )} บาท`,
      },
    ],
    topDivisionBreakdown: buildBreakdown(
      participants.map((item) => item.divisionName || 'ไม่ระบุ'),
      totalParticipants
    ).slice(0, 6),
    genderBreakdown: sortByPreferredLabels(
      buildBreakdown(
        participants.map((item) => deriveGenderFromPrefix(item.prefix)),
        totalParticipants
      ),
      ['ชาย', 'หญิง', 'ไม่ระบุ']
    ),
    jobLevelBreakdown: buildBreakdown(
      participants.map((item) => item.jobLevel || 'ไม่ระบุ'),
      totalParticipants
    ),
    courseTypeBreakdown: buildCourseTypeBreakdown({
      uniqueCourses,
      totalCourses,
    }),
    orgBreakdowns: {
      plant: buildBreakdown(
        participants.map((item) => item.plantName || 'ไม่ระบุ'),
        totalParticipants
      ),
      businessUnit: buildBreakdown(
        participants.map((item) => item.buName || 'ไม่ระบุ'),
        totalParticipants
      ),
      function: buildBreakdown(
        participants.map((item) => item.functionName || 'ไม่ระบุ'),
        totalParticipants
      ),
      division: buildBreakdown(
        participants.map((item) => item.divisionName || 'ไม่ระบุ'),
        totalParticipants
      ),
      department: buildBreakdown(
        participants.map((item) => item.departmentName || 'ไม่ระบุ'),
        totalParticipants
      ),
    },
    expenseBreakdown: buildExpenseBreakdown({
      courses: uniqueCourses,
      enrollments,
    }),
    topCourseBreakdown: buildTopCourseCategoryBreakdown(
      enrollments.map((item) => ({
        category: item.category,
      }))
    ),
  }
}

export function buildPeopleProfileRows(context: SummaryReportSnapshot) {
  const { participants } = buildSummaryReportProjection(context)

  return buildBreakdown(
    participants.map((item: SummaryReportParticipant) =>
      deriveTenureBucket(item.hireDate)
    ),
    participants.length
  )
}
