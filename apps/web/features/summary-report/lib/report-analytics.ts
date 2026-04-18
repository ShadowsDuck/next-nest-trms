import type { SummaryReportSnapshot } from '@workspace/schemas'

type BreakdownItem = {
  label: string
  count: number
  share: number
  expense?: number
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

type ParticipantRecord = {
  employeeNo: string
  prefix: string
  jobLevel: string
  status: string
  plantName: string
  buName: string
  functionName: string
  divisionName: string
  departmentName: string
  hireDate?: string | null
}

type CourseRecord = {
  id: string
  title: string
  type: string
  expense: number
  category: string
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

function normalizeExpense(value: number | string | null | undefined) {
  if (typeof value === 'number') {
    return value
  }

  if (value == null) {
    return 0
  }

  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
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

function buildExpenseBreakdown(courses: CourseRecord[]): BreakdownItem[] {
  const expenseByType = new Map<string, number>()
  const countByType = new Map<string, number>()
  const totalCourses = courses.length

  for (const course of courses) {
    const typeLabel = normalizeCourseTypeLabel(course.type)
    expenseByType.set(
      typeLabel,
      (expenseByType.get(typeLabel) ?? 0) + course.expense
    )
    countByType.set(typeLabel, (countByType.get(typeLabel) ?? 0) + 1)
  }

  return [...expenseByType.entries()]
    .map(([label, expense]) => ({
      label,
      count: countByType.get(label) ?? 0,
      share: toPercentage(countByType.get(label) ?? 0, totalCourses),
      expense,
    }))
    .sort((a, b) => (b.expense ?? 0) - (a.expense ?? 0))
}

function buildTopCourseBreakdown(
  enrollments: Array<{ title: string; category?: string }>
): BreakdownItem[] {
  const countByCourse = new Map<
    string,
    { label: string; count: number; category: string }
  >()

  for (const enrollment of enrollments) {
    const label = enrollment.title || 'ไม่ระบุ'
    const current = countByCourse.get(label)

    countByCourse.set(label, {
      label,
      count: (current?.count ?? 0) + 1,
      category: enrollment.category || current?.category || 'ไม่ระบุ',
    })
  }

  return [...countByCourse.values()]
    .map((item) => ({
      label: item.label,
      category: item.category,
      count: item.count,
      share: toPercentage(item.count, enrollments.length),
    }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, 'th'))
    .slice(0, 5)
}

function buildCourseTypeBreakdown({
  uniqueCourses,
  totalCourses,
}: {
  uniqueCourses: CourseRecord[]
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
  const participantMap = new Map<string, ParticipantRecord>()
  const enrollmentCourses: Array<CourseRecord & { participantKey: string }> = []
  const uniqueCourseMap = new Map<string, CourseRecord>()

  if (context.source === 'employees') {
    for (const employee of context.employees) {
      participantMap.set(employee.employeeNo, {
        employeeNo: employee.employeeNo,
        prefix: employee.prefix,
        jobLevel: employee.jobLevel,
        status: employee.status,
        plantName: employee.plantName,
        buName: employee.buName,
        functionName: employee.functionName,
        divisionName: employee.divisionName,
        departmentName: employee.departmentName,
        hireDate: employee.hireDate,
      })

      for (const trainingRecord of employee.trainingRecords ?? []) {
        if (!trainingRecord.course) {
          continue
        }

        const course = {
          id: trainingRecord.course.id,
          title: trainingRecord.course.title,
          type: trainingRecord.course.type,
          expense: normalizeExpense(trainingRecord.course.expense),
          category: trainingRecord.course.tag?.name ?? 'ไม่ระบุ',
        }

        enrollmentCourses.push({
          ...course,
          participantKey: employee.employeeNo,
        })

        if (!uniqueCourseMap.has(course.id)) {
          uniqueCourseMap.set(course.id, course)
        }
      }
    }
  } else {
    for (const course of context.courses) {
      const normalizedCourse = {
        id: course.id,
        title: course.title,
        type: course.type,
        expense: normalizeExpense(course.expense),
        category: course.tag?.name ?? 'ไม่ระบุ',
      }

      uniqueCourseMap.set(course.id, normalizedCourse)

      for (const participant of course.participants ?? []) {
        if (!participantMap.has(participant.employeeNo)) {
          participantMap.set(participant.employeeNo, {
            employeeNo: participant.employeeNo,
            prefix: participant.prefix,
            jobLevel: participant.jobLevel,
            status: participant.status,
            plantName: participant.plantName,
            buName: participant.buName,
            functionName: participant.functionName,
            divisionName: participant.divisionName,
            departmentName: participant.departmentName,
            hireDate: participant.hireDate,
          })
        }

        enrollmentCourses.push({
          ...normalizedCourse,
          participantKey: participant.employeeNo,
        })
      }
    }
  }

  const participants = [...participantMap.values()]
  const uniqueCourses = [...uniqueCourseMap.values()]
  const totalParticipants = participants.length
  const totalCourses = uniqueCourses.length
  const totalEnrollments = enrollmentCourses.length
  const totalExpense = uniqueCourses.reduce(
    (sum, course) => sum + course.expense,
    0
  )
  const averageExpensePerCourse =
    totalCourses > 0 ? totalExpense / totalCourses : 0

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
    expenseBreakdown: buildExpenseBreakdown(uniqueCourses),
    topCourseBreakdown: buildTopCourseBreakdown(
      enrollmentCourses.map((item) => ({
        title: item.title,
        category: item.category,
      }))
    ),
  }
}

export function buildPeopleProfileRows(context: SummaryReportSnapshot) {
  const participantMap = new Map<string, ParticipantRecord>()

  if (context.source === 'employees') {
    for (const employee of context.employees) {
      participantMap.set(employee.employeeNo, {
        employeeNo: employee.employeeNo,
        prefix: employee.prefix,
        jobLevel: employee.jobLevel,
        status: employee.status,
        plantName: employee.plantName,
        buName: employee.buName,
        functionName: employee.functionName,
        divisionName: employee.divisionName,
        departmentName: employee.departmentName,
        hireDate: employee.hireDate,
      })
    }
  } else {
    for (const course of context.courses) {
      for (const participant of course.participants ?? []) {
        if (!participantMap.has(participant.employeeNo)) {
          participantMap.set(participant.employeeNo, {
            employeeNo: participant.employeeNo,
            prefix: participant.prefix,
            jobLevel: participant.jobLevel,
            status: participant.status,
            plantName: participant.plantName,
            buName: participant.buName,
            functionName: participant.functionName,
            divisionName: participant.divisionName,
            departmentName: participant.departmentName,
            hireDate: participant.hireDate,
          })
        }
      }
    }
  }

  return buildBreakdown(
    [...participantMap.values()].map((item) =>
      deriveTenureBucket(item.hireDate)
    ),
    participantMap.size
  )
}
