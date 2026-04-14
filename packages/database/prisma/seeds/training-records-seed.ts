import { UserRole } from "../../src"
import { prisma } from "../../src/client"

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function pickRandomCourses<T>(items: T[], count: number): T[] {
  const pool = [...items]

  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pool[i], pool[j]] = [pool[j], pool[i]]
  }

  return pool.slice(0, count)
}

export async function seedTrainingRecords() {
  console.log("🌱 Seeding training records...")

  const seedUser = await prisma.user.upsert({
    where: { email: "seed.admin@trms.local" },
    update: {
      name: "Seed Admin",
      role: UserRole.Admin,
    },
    create: {
      id: "seed-admin-user",
      name: "Seed Admin",
      email: "seed.admin@trms.local",
      role: UserRole.Admin,
      emailVerified: true,
    },
  })

  const [employees, courses] = await Promise.all([
    prisma.employee.findMany({
      select: { id: true },
      orderBy: { employeeNo: "asc" },
    }),
    prisma.course.findMany({
      select: { id: true },
      orderBy: { startDate: "asc" },
    }),
  ])

  if (employees.length === 0 || courses.length === 0) {
    console.log("⚠️ Skip training records: no employees or courses")
    return
  }

  const maxCoursesPerEmployee = Math.min(5, courses.length)
  let recordIndex = 0

  const records = employees.flatMap((employee) => {
    const enrollCount = randomInt(1, maxCoursesPerEmployee)
    const selectedCourses = pickRandomCourses(courses, enrollCount)

    return selectedCourses.map((course) => {
      const currentIndex = recordIndex++

      return {
        employeeId: employee.id,
        courseId: course.id,
        createdByUserId: seedUser.id,
        updatedByUserId: seedUser.id,
        certFilePath:
          currentIndex % 3 === 0
            ? `/uploads/certificates/${employee.id}-${course.id}.pdf`
            : null,
      }
    })
  })

  await prisma.trainingRecord.createMany({
    data: records,
    skipDuplicates: true,
  })

  console.log(`✅ Seeded ${records.length} training records`)
}

if (require.main === module) {
  seedTrainingRecords()
    .catch((e) => {
      console.error(e)
      process.exit(1)
    })
    .finally(async () => {
      await prisma.$disconnect()
    })
}
