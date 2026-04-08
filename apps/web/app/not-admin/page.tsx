'use client'

export default function NotAdminPage() {
  return (
    <div className="flex flex-col items-center justify-center h-screen">
      <h2 className="text-xl font-bold">ขออภัย คุณไม่มีสิทธิ์เข้าถึงหน้านี้</h2>
      <p>เฉพาะผู้ดูแลระบบ (Admin) เท่านั้นที่สามารถดูข้อมูลนี้ได้</p>
      <button
        onClick={() => (window.location.href = '/')}
        className="mt-4 px-4 py-2 bg-blue-500 text-white rounded"
      >
        กลับหน้าหลัก
      </button>
    </div>
  )
}
