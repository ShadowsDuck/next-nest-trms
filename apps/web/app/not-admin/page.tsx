'use client'

export default function NotAdminPage() {
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <h2 className="text-xl font-bold">ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p>เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดูข้อมูลนี้ได้</p>
      <button
        onClick={() => (window.location.href = '/')}
        className="bg-primary text-primary-foreground mt-4 rounded-md px-4 py-2"
      >
        กลับหน้าหลัก
      </button>
    </div>
  )
}
