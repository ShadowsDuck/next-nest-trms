import {
  Prefix,
  JobLevel,
  EmployeeStatus,
  OrgUnitLevel,
} from "../../src/generated/prisma/client"
import { prisma } from "../../src/client"

const thaiFirstNames: Record<Prefix, string[]> = {
  Mr: [
    "สมชาย",
    "วิชัย",
    "ประสิทธิ์",
    "อนุชา",
    "กิตติ",
    "ธนกร",
    "พงศ์ธร",
    "ชัยวัฒน์",
    "ณัฐพล",
    "วรวิทย์",
    "ภานุวัฒน์",
    "ศุภชัย",
    "รัฐพล",
    "นันทวัฒน์",
    "ธีรภัทร",
    "จักรพันธ์",
    "ปริญญา",
    "กฤษณะ",
    "วิทวัส",
    "ชนินทร์",
    "สรายุทธ",
    "อภิสิทธิ์",
    "ธนภัทร",
    "วัชรพล",
    "ณัฐวุฒิ",
    "พีรพัฒน์",
    "สิทธิพร",
    "กิตติพงษ์",
    "เอกชัย",
    "บุญมา",
  ],
  Mrs: [
    "สมหญิง",
    "วิไลวรรณ",
    "นภาพร",
    "กนกวรรณ",
    "สุภาพร",
    "อรุณี",
    "ลัดดาวัลย์",
    "พรทิพย์",
    "นิตยา",
    "ชลธิชา",
    "ปิยะนุช",
    "อัมพร",
    "รัตนา",
    "ศิริพร",
    "มณีรัตน์",
  ],
  Miss: [
    "ณัฐธิดา",
    "ปณิตา",
    "ภัทรียา",
    "ชนิดา",
    "วรรณวิสา",
    "พิมพ์ชนก",
    "ธัญวรัตน์",
    "สิริมา",
    "อารียา",
    "นภัสสร",
    "ชุติมา",
    "กุลนาถ",
    "พิชามญชุ์",
    "วริศรา",
    "ปาริฉัตร",
    "ธิดารัตน์",
    "สุภัทรา",
    "กัญญาณัฐ",
    "พรพิมล",
    "ณิชากร",
  ],
}

const thaiLastNames = [
  "ใจดี",
  "สุขสวัสดิ์",
  "มีสุข",
  "รักดี",
  "วงศ์สวัสดิ์",
  "ทองคำ",
  "แสงทอง",
  "ศรีสวัสดิ์",
  "พรหมมา",
  "วิเศษศิลป์",
  "บุญรอด",
  "ชัยมงคล",
  "อินทร์แก้ว",
  "สมบูรณ์",
  "เจริญสุข",
  "ธรรมวิทย์",
  "พันธุ์ดี",
  "คงมั่น",
  "ศิริวัฒน์",
  "ดวงแก้ว",
  "นามสกุล",
  "เพชรดี",
  "สว่างศรี",
  "รุ่งเรือง",
  "มงคลชัย",
  "พิพัฒน์",
  "สุริยา",
  "จันทร์งาม",
  "บุญประเสริฐ",
  "วรรณศิริ",
  "ลิ้มสุวรรณ",
  "ทับทิม",
  "ดาราพงษ์",
  "ชโลธร",
  "วีระพันธ์",
]

function randomFrom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateIdCardNo(index: number): string {
  // dummy 13-digit starting with 1-8, padded with index for uniqueness
  const prefix = String(randomInt(1, 8))
  const middle = String(index).padStart(5, "0")
  const filler = String(randomInt(1000000, 9999999)).slice(0, 7)
  const raw = (prefix + middle + filler).slice(0, 12)
  // simple checksum digit (not real Thai ID algo, just deterministic)
  const checkDigit = (index % 10).toString()
  return raw + checkDigit
}

function randomHireDate(): Date {
  const start = new Date("2024-01-01").getTime()
  const end = new Date("2026-04-01").getTime()
  return new Date(start + Math.random() * (end - start))
}

const prefixes: Prefix[] = ["Mr", "Mr", "Mr", "Mrs", "Miss", "Miss"] // weight: more Mr
const jobLevels: JobLevel[] = ["S1", "S1", "S2", "S2", "M1", "M2"] // weight: more S-level

export async function seedEmployees() {
  console.log("🌱 Seeding employees...")

  // Clear existing data
  await prisma.employee.deleteMany()

  const departments = await prisma.organizationUnit.findMany({
    where: { level: OrgUnitLevel.Department },
    select: { id: true },
    orderBy: { name: "asc" },
  })

  if (departments.length === 0) {
    throw new Error("No Department organization units found. Seed organization units first.")
  }

  const employees = Array.from({ length: 100 }, (_, i) => {
    const index = i + 1
    const prefix = prefixes[index % prefixes.length]
    const firstName = randomFrom(thaiFirstNames[prefix])
    const lastName = randomFrom(thaiLastNames)
    const jobLevel = jobLevels[index % jobLevels.length]

    // ~85% Active, ~15% Resigned
    const status: EmployeeStatus = index % 7 === 0 ? "Resigned" : "Active"

    return {
      employeeNo: `EMP${String(index).padStart(3, "0")}`,
      prefix,
      firstName,
      lastName,
      idCardNo: generateIdCardNo(index),
      hireDate: randomHireDate(),
      jobLevel,
      status,
      orgUnitId: randomFrom(departments).id,
    }
  })

  await prisma.employee.createMany({ data: employees })

  console.log(`✅ Seeded ${employees.length} employees`)
}

if (require.main === module) {
  seedEmployees()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
}
