import { prisma } from "../src/client"
import { seedCourses } from "./seeds/courses-seed"
import { seedEmployees } from "./seeds/employees-seed"
import { seedTrainingRecords } from "./seeds/training-records-seed"

async function main() {
  console.log("🌱 Start full seed...")

  // Clear child table first to avoid FK constraint errors
  await prisma.trainingRecord.deleteMany()

  await seedEmployees()
  await seedCourses()
  await seedTrainingRecords()

  console.log("✅ Full seed completed")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
