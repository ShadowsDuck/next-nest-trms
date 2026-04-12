import { AccreditationStatus, CourseType } from "../../src"
import { prisma } from "../../src/client"

function getTime(hour: number, minute = 0): string {
  return `1970-01-01T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}:00.000Z`
}

function getCourseTime(
  duration: number,
  startDate: Date,
  endDate: Date
): { startTime: string; endTime: string | null } {
  const isMultiDay = startDate.getTime() !== endDate.getTime()
  if (isMultiDay) return { startTime: getTime(8), endTime: null }

  const endHourMap: Record<number, number> = {
    3: 11,
    6: 14,
    12: 16,
  }

  return {
    startTime: getTime(8),
    endTime:
      endHourMap[duration] != null ? getTime(endHourMap[duration]) : null,
  }
}

async function main() {
  // ── Tags ──────────────────────────────────────────────
  const [tagSafety, tagIT, tagManagement, tagHR, tagFinance] =
    await Promise.all([
      prisma.tag.upsert({
        where: { name: "Safety" },
        update: {},
        create: { name: "Safety", colorCode: "#EF4444" },
      }),
      prisma.tag.upsert({
        where: { name: "IT" },
        update: {},
        create: { name: "IT", colorCode: "#3B82F6" },
      }),
      prisma.tag.upsert({
        where: { name: "Management" },
        update: {},
        create: { name: "Management", colorCode: "#8B5CF6" },
      }),
      prisma.tag.upsert({
        where: { name: "HR" },
        update: {},
        create: { name: "HR", colorCode: "#F59E0B" },
      }),
      prisma.tag.upsert({
        where: { name: "Finance" },
        update: {},
        create: { name: "Finance", colorCode: "#10B981" },
      }),
    ])

  // ── Courses ───────────────────────────────────────────
  type CourseInput = {
    id: string
    title: string
    type: CourseType
    tagId: string
    startDate: Date
    endDate: Date
    startTime: Date
    endTime: Date | null
    duration: number
    lecturer: string
    institute: string
    expense: number
    accreditationStatus: AccreditationStatus
  }

  function makeCourse(
    base: Omit<CourseInput, "startTime" | "endTime">
  ): CourseInput {
    return {
      ...base,
      ...getCourseTime(base.duration, base.startDate, base.endDate),
    }
  }

  const coursesData: CourseInput[] = [
    // ── Safety (5) ──
    makeCourse({
      id: "seed-course-001",
      title: "ความปลอดภัยในการทำงานเบื้องต้น",
      type: CourseType.Internal,
      tagId: tagSafety.id,
      startDate: new Date("2025-01-10"),
      endDate: new Date("2025-01-10"),
      duration: 6,
      lecturer: "สมชาย ใจดี",
      institute: "ฝ่ายความปลอดภัย",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-002",
      title: "การใช้อุปกรณ์ป้องกันส่วนบุคคล (PPE)",
      type: CourseType.Internal,
      tagId: tagSafety.id,
      startDate: new Date("2025-02-05"),
      endDate: new Date("2025-02-05"),
      duration: 3,
      lecturer: "วิภา รักษ์ดี",
      institute: "ฝ่ายความปลอดภัย",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-003",
      title: "การดับเพลิงขั้นต้นและการอพยพหนีไฟ",
      type: CourseType.Internal,
      tagId: tagSafety.id,
      startDate: new Date("2025-03-12"),
      endDate: new Date("2025-03-12"),
      duration: 6,
      lecturer: "ธนกร ปลอดภัย",
      institute: "ฝ่ายความปลอดภัย",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-004",
      title: "Safety for Supervisor",
      type: CourseType.External,
      tagId: tagSafety.id,
      startDate: new Date("2025-04-22"),
      endDate: new Date("2025-04-23"),
      duration: 12,
      lecturer: "วิทยากรภายนอก",
      institute: "สมาคมส่งเสริมความปลอดภัย",
      expense: 3500,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-005",
      title: "การประเมินความเสี่ยงในกระบวนการผลิต",
      type: CourseType.External,
      tagId: tagSafety.id,
      startDate: new Date("2025-06-18"),
      endDate: new Date("2025-06-19"),
      duration: 12,
      lecturer: "ดร.ประสิทธิ์ ความปลอดภัย",
      institute: "มหาวิทยาลัยเทคโนโลยีพระจอมเกล้า",
      expense: 6500,
      accreditationStatus: AccreditationStatus.Pending,
    }),

    // ── IT (5) ──
    makeCourse({
      id: "seed-course-006",
      title: "Excel Advanced for Data Analysis",
      type: CourseType.External,
      tagId: tagIT.id,
      startDate: new Date("2025-02-10"),
      endDate: new Date("2025-02-11"),
      duration: 12,
      lecturer: "อาจารย์กิตติ ดิจิทัล",
      institute: "บริษัท Training Pro จำกัด",
      expense: 4500,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-007",
      title: "Power BI Dashboard สำหรับผู้บริหาร",
      type: CourseType.External,
      tagId: tagIT.id,
      startDate: new Date("2025-03-20"),
      endDate: new Date("2025-03-20"),
      duration: 6,
      lecturer: "สุภาพร ข้อมูล",
      institute: "Microsoft Thailand",
      expense: 5900,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-008",
      title: "Cybersecurity Awareness",
      type: CourseType.Internal,
      tagId: tagIT.id,
      startDate: new Date("2025-04-08"),
      endDate: new Date("2025-04-08"),
      duration: 3,
      lecturer: "ฝ่าย IT Security",
      institute: "แผนก IT",
      expense: 0,
      accreditationStatus: AccreditationStatus.Rejected,
    }),
    makeCourse({
      id: "seed-course-009",
      title: "การใช้งาน ERP ระบบใหม่",
      type: CourseType.Internal,
      tagId: tagIT.id,
      startDate: new Date("2025-05-05"),
      endDate: new Date("2025-05-07"),
      duration: 18,
      lecturer: "ทีม IT Implementation",
      institute: "แผนก IT",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-010",
      title: "Python for Business Automation",
      type: CourseType.External,
      tagId: tagIT.id,
      startDate: new Date("2025-07-14"),
      endDate: new Date("2025-07-16"),
      duration: 18,
      lecturer: "วิทยากรภายนอก",
      institute: "DataRockie School",
      expense: 9900,
      accreditationStatus: AccreditationStatus.Pending,
    }),

    // ── Management (5) ──
    makeCourse({
      id: "seed-course-011",
      title: "Leadership & Team Management",
      type: CourseType.External,
      tagId: tagManagement.id,
      startDate: new Date("2025-02-20"),
      endDate: new Date("2025-02-22"),
      duration: 18,
      lecturer: "ดร.สุรชัย พัฒนา",
      institute: "สถาบันพัฒนาผู้นำแห่งประเทศไทย",
      expense: 15000,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-012",
      title: "Coaching & Feedback Skills",
      type: CourseType.External,
      tagId: tagManagement.id,
      startDate: new Date("2025-03-27"),
      endDate: new Date("2025-03-28"),
      duration: 12,
      lecturer: "รศ.ดร.นภา บริหาร",
      institute: "จุฬาลงกรณ์มหาวิทยาลัย",
      expense: 12000,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-013",
      title: "การบริหารโครงการเบื้องต้น (Project Management)",
      type: CourseType.External,
      tagId: tagManagement.id,
      startDate: new Date("2025-05-08"),
      endDate: new Date("2025-05-09"),
      duration: 12,
      lecturer: "วิทยากรภายนอก",
      institute: "PMI Thailand Chapter",
      expense: 8500,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-014",
      title: "Strategic Thinking for Middle Management",
      type: CourseType.External,
      tagId: tagManagement.id,
      startDate: new Date("2025-06-05"),
      endDate: new Date("2025-06-06"),
      duration: 12,
      lecturer: "ดร.พิชัย กลยุทธ์",
      institute: "NIDA",
      expense: 18000,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-015",
      title: "การประชุมและการนำเสนออย่างมีประสิทธิภาพ",
      type: CourseType.Internal,
      tagId: tagManagement.id,
      startDate: new Date("2025-07-10"),
      endDate: new Date("2025-07-10"),
      duration: 6,
      lecturer: "ฝ่ายพัฒนาทรัพยากรบุคคล",
      institute: "แผนก HR",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),

    // ── HR (5) ──
    makeCourse({
      id: "seed-course-016",
      title: "กฎหมายแรงงานที่ HR ต้องรู้",
      type: CourseType.External,
      tagId: tagHR.id,
      startDate: new Date("2025-01-23"),
      endDate: new Date("2025-01-23"),
      duration: 6,
      lecturer: "ทนายความ สมศักดิ์ กฎหมาย",
      institute: "สภาทนายความ",
      expense: 3500,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-017",
      title: "การสรรหาและคัดเลือกพนักงานยุคใหม่",
      type: CourseType.External,
      tagId: tagHR.id,
      startDate: new Date("2025-03-06"),
      endDate: new Date("2025-03-07"),
      duration: 12,
      lecturer: "วิทยากรภายนอก",
      institute: "PMAT Thailand",
      expense: 6000,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-018",
      title: "การประเมินผลการปฏิบัติงาน (KPI & OKR)",
      type: CourseType.Internal,
      tagId: tagHR.id,
      startDate: new Date("2025-04-15"),
      endDate: new Date("2025-04-15"),
      duration: 3,
      lecturer: "ฝ่าย HR",
      institute: "แผนก HR",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-019",
      title: "Employee Engagement & Wellbeing",
      type: CourseType.External,
      tagId: tagHR.id,
      startDate: new Date("2025-05-22"),
      endDate: new Date("2025-05-22"),
      duration: 6,
      lecturer: "ดร.ศิริพร สุขภาพ",
      institute: "มหาวิทยาลัยมหิดล",
      expense: 4500,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-020",
      title: "HR Analytics เบื้องต้น",
      type: CourseType.External,
      tagId: tagHR.id,
      startDate: new Date("2025-08-07"),
      endDate: new Date("2025-08-08"),
      duration: 12,
      lecturer: "วิทยากรภายนอก",
      institute: "HRDI",
      expense: 7500,
      accreditationStatus: AccreditationStatus.Pending,
    }),

    // ── Finance (5) ──
    makeCourse({
      id: "seed-course-021",
      title: "การอ่านงบการเงินสำหรับผู้ที่ไม่ใช่นักบัญชี",
      type: CourseType.External,
      tagId: tagFinance.id,
      startDate: new Date("2025-02-13"),
      endDate: new Date("2025-02-13"),
      duration: 6,
      lecturer: "CPA สมหมาย บัญชี",
      institute: "สภาวิชาชีพบัญชี",
      expense: 3900,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-022",
      title: "การวางแผนภาษีนิติบุคคล",
      type: CourseType.External,
      tagId: tagFinance.id,
      startDate: new Date("2025-03-18"),
      endDate: new Date("2025-03-19"),
      duration: 12,
      lecturer: "ดร.ประภาส ภาษี",
      institute: "กรมสรรพากร",
      expense: 5500,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-023",
      title: "Budgeting & Cost Control",
      type: CourseType.External,
      tagId: tagFinance.id,
      startDate: new Date("2025-05-15"),
      endDate: new Date("2025-05-16"),
      duration: 12,
      lecturer: "วิทยากรภายนอก",
      institute: "FAP Thailand",
      expense: 8000,
      accreditationStatus: AccreditationStatus.Pending,
    }),
    makeCourse({
      id: "seed-course-024",
      title: "ระเบียบการเบิกจ่ายภายในองค์กร",
      type: CourseType.Internal,
      tagId: tagFinance.id,
      startDate: new Date("2025-06-25"),
      endDate: new Date("2025-06-25"),
      duration: 3,
      lecturer: "ฝ่ายการเงิน",
      institute: "แผนกการเงิน",
      expense: 0,
      accreditationStatus: AccreditationStatus.Approved,
    }),
    makeCourse({
      id: "seed-course-025",
      title: "Financial Modeling with Excel",
      type: CourseType.External,
      tagId: tagFinance.id,
      startDate: new Date("2025-09-10"),
      endDate: new Date("2025-09-12"),
      duration: 18,
      lecturer: "CFA วรพล การเงิน",
      institute: "CFA Society Thailand",
      expense: 22000,
      accreditationStatus: AccreditationStatus.Pending,
    }),
  ]

  await Promise.all(
    coursesData.map((course) =>
      prisma.course.upsert({
        where: { id: course.id },
        update: {},
        create: course,
      })
    )
  )

  console.log(`✅ Seeded 5 tags, ${coursesData.length} courses`)

  await Promise.all(
    coursesData.map((course) =>
      prisma.course.upsert({
        where: { id: course.id },
        update: {
          startTime: course.startTime,
          endTime: course.endTime,
        },
        create: course,
      })
    )
  )
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
