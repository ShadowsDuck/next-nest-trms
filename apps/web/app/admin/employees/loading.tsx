import { Loader2 } from 'lucide-react'

export default function EmployeesLoading() {
  return (
    <div className="flex flex-col w-full p-4 h-[calc(100dvh-130px)]">
      {/* ส่วน Header เลียนแบบหน้าจริง */}
      <div className="flex justify-between items-center mb-4 shrink-0">
        <div>
          <h2 className="text-xl font-bold">ข้อมูลพนักงาน (Employees)</h2>
          <p className="text-sm text-muted-foreground">
            จัดการข้อมูลพนักงานในระบบ TRMS
          </p>
        </div>
      </div>

      {/* ส่วน Loading Spinner ตรงกลางตาราง */}
      <div className="w-full flex-1 min-h-0 shadow-sm border rounded-lg flex items-center justify-center bg-card">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p>กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    </div>
  )
}
