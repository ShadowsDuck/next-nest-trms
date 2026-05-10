import { notFound } from 'next/navigation'
import { getEmployeeDetail } from '@/domains/employees'
import { EmployeeDetailPage } from '@/features/employees/detail/components/employee-detail-page'

// ตรวจว่า error ที่ได้มาจาก data fetch เป็นกรณีไม่พบพนักงานหรือไม่ เพื่อส่งต่อไปยัง not-found page
function isEmployeeNotFoundError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false
  }

  return (
    error.message.includes('ไม่พบข้อมูลพนักงานที่ต้องการ') ||
    error.message.includes('404')
  )
}

// โหลดข้อมูลพนักงานตาม employeeNo จาก route และแสดงหน้า detail ด้วยข้อมูลจริง
export default async function EmployeeDetailRoute({
  params,
}: {
  params: Promise<{ employeeNo: string }>
}) {
  const { employeeNo } = await params

  // ดึงข้อมูลพนักงานและจัดการกรณีที่ไม่พบข้อมูล
  const employee = await (async () => {
    try {
      return await getEmployeeDetail(employeeNo)
    } catch (error) {
      if (isEmployeeNotFoundError(error)) {
        notFound()
      }
      throw error
    }
  })()

  return <EmployeeDetailPage employee={employee} />
}
