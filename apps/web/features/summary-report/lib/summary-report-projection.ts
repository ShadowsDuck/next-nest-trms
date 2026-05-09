import type { SummaryReportSnapshot } from '@workspace/schemas'

export type SummaryReportParticipant = {
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

export type SummaryReportCourse = {
  id: string
  title: string
  type: string
  expense: number
  category: string
}

export type SummaryReportEnrollment = SummaryReportCourse & {
  participantKey: string
}

export type SummaryReportProjection = {
  participants: SummaryReportParticipant[]
  uniqueCourses: SummaryReportCourse[]
  enrollments: SummaryReportEnrollment[]
}

// แปลงค่า expense ให้เป็นตัวเลขที่พร้อมใช้คำนวณโดยคงพฤติกรรม fallback เดิม
export function normalizeSummaryReportExpense(
  value: number | string | null | undefined
): number {
  if (typeof value === 'number') {
    return value
  }

  if (value == null) {
    return 0
  }

  const parsed = Number.parseFloat(String(value))
  return Number.isNaN(parsed) ? 0 : parsed
}

// สร้าง projection กลางจาก snapshot เพื่อให้ analytics หลายตัวใช้ข้อมูล normalize ชุดเดียวกัน
export function buildSummaryReportProjection(
  context: SummaryReportSnapshot
): SummaryReportProjection {
  const participantMap = new Map<string, SummaryReportParticipant>()
  const enrollmentCourses: SummaryReportEnrollment[] = []
  const uniqueCourseMap = new Map<string, SummaryReportCourse>()

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
          expense: normalizeSummaryReportExpense(trainingRecord.course.expense),
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
        expense: normalizeSummaryReportExpense(course.expense),
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

  return {
    participants: [...participantMap.values()],
    uniqueCourses: [...uniqueCourseMap.values()],
    enrollments: enrollmentCourses,
  }
}
